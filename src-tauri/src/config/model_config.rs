//! 模型配置加载模块
//! 从统一的 model-config.json 读取模型配置

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct ModelConfig {
    pub version: String,
    pub providers: Vec<ProviderConfig>,
    #[serde(rename = "defaultModelId")]
    pub default_model_id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub label: String,
    #[serde(rename = "defaultEndpoint")]
    pub default_endpoint: String,
    pub models: Vec<ModelConfigItem>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ModelConfigItem {
    pub id: String,
    #[serde(rename = "apiName")]
    pub api_name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub description: String,
    #[serde(rename = "defaultAspectRatio")]
    pub default_aspect_ratio: String,
    #[serde(rename = "defaultResolution")]
    pub default_resolution: String,
    #[serde(rename = "aspectRatios")]
    pub aspect_ratios: Vec<String>,
    pub resolutions: Vec<ResolutionOption>,
    #[serde(rename = "expectedDurationMs")]
    pub expected_duration_ms: Option<u64>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ResolutionOption {
    pub value: String,
    pub label: String,
}

/// 加载模型配置
/// 使用 include_str! 将 JSON 嵌入到二进制中
pub fn load_model_config() -> ModelConfig {
    let config_json = include_str!("../../resources/model-config.json");
    serde_json::from_str(config_json)
        .expect("Failed to parse model-config.json")
}

/// 根据模型 ID 获取 API 名称
pub fn resolve_api_name(config: &ModelConfig, model_id: &str) -> Option<String> {
    for provider in &config.providers {
        for model in &provider.models {
            if model.id == model_id {
                return Some(model.api_name.clone());
            }
        }
    }
    None
}

/// 获取模型配置项
pub fn get_model_config<'a>(config: &'a ModelConfig, model_id: &str) -> Option<&'a ModelConfigItem> {
    for provider in &config.providers {
        for model in &provider.models {
            if model.id == model_id {
                return Some(model);
            }
        }
    }
    None
}

/// 获取供应商配置
pub fn get_provider_config<'a>(config: &'a ModelConfig, provider_id: &str) -> Option<&'a ProviderConfig> {
    config.providers.iter().find(|p| p.id == provider_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_config() {
        let config = load_model_config();
        assert_eq!(config.providers.len(), 1);
        assert_eq!(config.providers[0].models.len(), 2);
    }

    #[test]
    fn test_resolve_api_name() {
        let config = load_model_config();
        assert_eq!(
            resolve_api_name(&config, "custom/nano-banana-2"),
            Some("nano-banana".to_string())
        );
        assert_eq!(
            resolve_api_name(&config, "custom/nano-banana-pro"),
            Some("nano-banana-pro".to_string())
        );
    }
}
