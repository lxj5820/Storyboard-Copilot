use base64::Engine;
use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

use crate::ai::error::AIError;
use crate::ai::{
    AIProvider, GenerateRequest, ProviderTaskHandle, ProviderTaskPollResult, ProviderTaskSubmission,
};
use crate::config::{load_model_config, resolve_api_name};

/// 从配置加载默认端点
fn get_default_endpoint() -> String {
    let config = load_model_config();
    if let Some(provider) = config.providers.iter().find(|p| p.id == "custom") {
        return provider.default_endpoint.clone();
    }
    "https://ai.comfly.chat/".to_string()
}

#[allow(dead_code)]
const POLL_INTERVAL_MS: u64 = 2000;

#[derive(Debug, Deserialize)]
struct OpenAIImageResponse {
    #[allow(dead_code)]
    created: u64,
    data: Vec<OpenAIImageData>,
}

#[derive(Debug, Deserialize)]
struct OpenAIImageData {
    url: Option<String>,
    b64_json: Option<String>,
}

pub struct CustomProvider {
    client: Client,
    api_key: Arc<RwLock<Option<String>>>,
    endpoint: Arc<RwLock<String>>,
}

impl CustomProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            api_key: Arc::new(RwLock::new(None)),
            endpoint: Arc::new(RwLock::new(get_default_endpoint())),
        }
    }

    pub async fn set_endpoint(&self, endpoint: String) {
        let mut ep = self.endpoint.write().await;
        *ep = endpoint;
    }

    fn sanitize_model(model: &str) -> String {
        model
            .split_once('/')
            .map(|(_, bare)| bare.to_string())
            .unwrap_or_else(|| model.to_string())
    }

    /// 从模型配置中解析 API 名称
    fn resolve_model_id(model: &str) -> String {
        // 尝试从配置中获取 API 名称
        let config = load_model_config();
        if let Some(api_name) = resolve_api_name(&config, model) {
            return api_name;
        }

        // 回退到硬编码的默认值
        let sanitized = Self::sanitize_model(model);
        match sanitized.as_str() {
            "nano-banana-pro" => "nano-banana-pro".to_string(),
            "nano-banana-2" => "nano-banana".to_string(),
            _ => "nano-banana".to_string(),
        }
    }
}

impl Default for CustomProvider {
    fn default() -> Self {
        Self::new()
    }
}

fn extract_image_url_from_markdown(content: &str) -> Result<String, AIError> {
    // 首先尝试匹配 Markdown 图片格式: ![alt](url) - 这个优先级最高
    if let Some(start) = content.find("![") {
        if let Some(paren_start) = content[start..].find('(') {
            if let Some(paren_end) = content[start + paren_start + 1..].find(')') {
                let url = &content[start + paren_start + 1..start + paren_start + paren_end];
                // 清理 URL 中的空白字符
                let cleaned_url = url.trim();
                // 验证是图片 URL
                if cleaned_url.contains(".jpg") || cleaned_url.contains(".jpeg") || cleaned_url.contains(".png") || cleaned_url.contains(".gif") || cleaned_url.contains(".webp") {
                    return Ok(cleaned_url.to_string());
                }
            }
        }
    }
    
    // 尝试直接匹配 http URL（排除下载链接中的URL）
    if let Some(start) = content.find("http") {
        let end = content[start..]
            .find(|c: char| c == ' ' || c == '\n' || c == '\r' || c == '\t' || c == ')' || c == ']')
            .map(|i| start + i)
            .unwrap_or(content.len());
        let url = &content[start..end];
        // 清理 URL 中的空白字符
        let cleaned_url = url.trim();
        // 验证是图片 URL
        if cleaned_url.contains(".jpg") || cleaned_url.contains(".jpeg") || cleaned_url.contains(".png") || cleaned_url.contains(".gif") || cleaned_url.contains(".webp") {
            return Ok(cleaned_url.to_string());
        }
    }
    
    Err(AIError::Provider(format!("No image URL found in markdown: {}", content)))
}

#[async_trait::async_trait]
impl AIProvider for CustomProvider {
    fn name(&self) -> &str {
        "custom"
    }

    fn supports_model(&self, model: &str) -> bool {
        // 从配置中检查是否支持该模型
        let config = load_model_config();
        if let Some(provider) = config.providers.iter().find(|p| p.id == "custom") {
            for model_config in &provider.models {
                if model_config.id == model || model_config.api_name == Self::sanitize_model(model) {
                    return true;
                }
            }
        }

        // 回退到硬编码检查
        let sanitized = Self::sanitize_model(model);
        matches!(
            sanitized.as_str(),
            "nano-banana-2" | "nano-banana-pro" | "nano-banana" | "nano-banana-3.1-flash"
        )
    }

    fn list_models(&self) -> Vec<String> {
        // 从配置中获取模型列表
        let config = load_model_config();
        if let Some(provider) = config.providers.iter().find(|p| p.id == "custom") {
            return provider.models.iter().map(|m| m.id.clone()).collect();
        }

        // 回退到硬编码列表
        vec![
            "custom/nano-banana-2".to_string(),
            "custom/nano-banana-pro".to_string(),
        ]
    }

    async fn set_api_key(&self, api_key: String) -> Result<(), AIError> {
        let mut key = self.api_key.write().await;
        *key = Some(api_key);
        Ok(())
    }

    async fn set_endpoint(&self, endpoint: String) -> Result<(), AIError> {
        let mut ep = self.endpoint.write().await;
        *ep = endpoint;
        Ok(())
    }

    fn supports_task_resume(&self) -> bool {
        false
    }

    async fn submit_task(&self, request: GenerateRequest) -> Result<ProviderTaskSubmission, AIError> {
        let api_key = self
            .api_key
            .read()
            .await
            .clone()
            .ok_or_else(|| AIError::InvalidRequest("API key not set".to_string()))?;

        let base_url = self.endpoint.read().await.clone();
        let model_id = Self::resolve_model_id(&request.model);
        
        let has_reference_images = request
            .reference_images
            .as_ref()
            .map(|images| !images.is_empty())
            .unwrap_or(false);

        info!(
            "[Custom Request] model: {}, resolved: {}, size: {}, aspect_ratio: {}, has_reference: {}",
            request.model,
            model_id,
            request.size,
            request.aspect_ratio,
            has_reference_images
        );

        // 统一使用 /v1/images/generations 端点
        let submit_endpoint = format!("{}v1/images/generations", base_url);
        
        // 准备参考图片
        let mut reference_images: Option<Vec<String>> = None;
        if has_reference_images {
            let images = request.reference_images.as_ref().unwrap();
            let processed_images = images.iter().map(|image_url| {
                // 检测图片格式并处理
                if image_url.starts_with("data:") {
                    // 已经是 base64 data URL，直接使用
                    image_url.clone()
                } else if image_url.starts_with("http://") || image_url.starts_with("https://") {
                    // 远程 URL，直接使用
                    image_url.clone()
                } else if image_url.starts_with("file://") {
                    // file:// URL，提取路径并读取文件
                    let path = image_url.strip_prefix("file://").unwrap();
                    // 尝试读取文件并转为 base64
                    match std::fs::read(path) {
                        Ok(bytes) => {
                            let mime = if path.ends_with(".png") {
                                "image/png"
                            } else if path.ends_with(".gif") {
                                "image/gif"
                            } else {
                                "image/jpeg"
                            };
                            let base64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                            format!("data:{};base64,{}", mime, base64)
                        }
                        Err(e) => {
                            panic!("Failed to read local file: {}", e);
                        }
                    }
                } else if image_url.contains(":\\") || (image_url.len() > 1 && image_url.chars().nth(1) == Some(':')) {
                    // Windows 本地路径
                    match std::fs::read(image_url) {
                        Ok(bytes) => {
                            let mime = if image_url.ends_with(".png") {
                                "image/png"
                            } else if image_url.ends_with(".gif") {
                                "image/gif"
                            } else {
                                "image/jpeg"
                            };
                            let base64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                            format!("data:{};base64,{}", mime, base64)
                        }
                        Err(e) => {
                            panic!("Failed to read local file: {}", e);
                        }
                    }
                } else {
                    // 其他情况，作为远程 URL 处理
                    format!("https://{}", image_url)
                }
            }).collect();
            reference_images = Some(processed_images);
        }
        
        // 构建请求体
        let mut request_body_map = serde_json::Map::new();
        request_body_map.insert("model".to_string(), json!(model_id));
        request_body_map.insert("prompt".to_string(), json!(request.prompt));
        request_body_map.insert("aspect_ratio".to_string(), json!(request.aspect_ratio));
        
        // 添加分辨率参数（根据模型类型使用不同的参数名）
        if !request.size.is_empty() {
            let size_param_name = if model_id.contains("nano-banana-2") || model_id == "nano-banana" {
                "image_size"
            } else {
                "size"
            };
            request_body_map.insert(size_param_name.to_string(), json!(request.size));
        }
        
        // 添加参考图片（如果有）
        if let Some(images) = reference_images {
            request_body_map.insert("image".to_string(), json!(images));
        }
        
        let request_body = json!(request_body_map);

        info!("[Custom Generations] Request body: {}", serde_json::to_string(&request_body).unwrap());

        let response = self
            .client
            .post(&submit_endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(AIError::Provider(format!(
                "Custom generations API failed {}: {}",
                status, error_text
            )));
        }

        // 尝试解析响应
        let response_text = response.text().await.unwrap_or_default();
        info!("[Custom Generations] Raw response: {}", response_text);
        
        // 尝试解析为 OpenAIImageResponse 格式
        match serde_json::from_str::<OpenAIImageResponse>(&response_text) {
            Ok(body) => {
                let image_url = body.data.first()
                    .and_then(|d| d.url.clone().or_else(|| d.b64_json.clone()))
                    .ok_or_else(|| AIError::Provider("No image URL in response".to_string()))?;
                Ok(ProviderTaskSubmission::Succeeded(image_url))
            }
            Err(_) => {
                // 尝试直接从 JSON 中提取 URL
                match serde_json::from_str::<serde_json::Value>(&response_text) {
                    Ok(response_json) => {
                        // 尝试不同的响应格式
                        let image_url = response_json["url"]
                            .as_str()
                            .map(|s| s.to_string())
                            .or_else(|| response_json["b64_json"].as_str().map(|s| format!("data:image/png;base64,{}", s)))
                            .or_else(|| response_json["data"].as_array().and_then(|arr| arr.first()).and_then(|d| d["url"].as_str()).map(|s| s.to_string()))
                            .ok_or_else(|| AIError::Provider(format!("No image URL in response: {}", response_text)))?;
                        Ok(ProviderTaskSubmission::Succeeded(image_url))
                    }
                    Err(_) => {
                        // 尝试从文本中提取图片 URL
                        extract_image_url_from_markdown(&response_text)
                            .map(ProviderTaskSubmission::Succeeded)
                    }
                }
            }
        }
    }

    async fn poll_task(&self, _handle: ProviderTaskHandle) -> Result<ProviderTaskPollResult, AIError> {
        Err(AIError::Provider("Custom provider does not support task polling".to_string()))
    }

    async fn generate(&self, request: GenerateRequest) -> Result<String, AIError> {
        let submitted = self.submit_task(request).await?;
        match submitted {
            ProviderTaskSubmission::Succeeded(result) => Ok(result),
            ProviderTaskSubmission::Queued(_) => Err(AIError::Provider("Unexpected queued task".to_string())),
        }
    }
}
