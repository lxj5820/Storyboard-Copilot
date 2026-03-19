import { useSettingsStore } from '@/stores/settingsStore';

export interface TextOptimizationRequest {
  text: string;
}

export interface TextOptimizationResponse {
  reasoning: string;
  structure: {
    coreSubject: string;
    sceneAction: string;
    artStyle: string;
    compositionLighting: string;
  };
  finalPrompt: string;
}

export interface TextOptimizationError {
  message: string;
  code?: string;
}

const REQUEST_TIMEOUT_MS = 60000;

async function makeApiRequest<T>(url: string, apiKey: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function optimizeText(inputText: string): Promise<TextOptimizationResponse> {
  const {
    textOptimizerModelUrl,
    textOptimizerApiKey,
    textOptimizerModelName,
    textOptimizerSystemPrompt,
  } = useSettingsStore.getState();

  if (!textOptimizerModelUrl || !textOptimizerApiKey || !textOptimizerModelName) {
    throw new Error('Text optimizer settings not configured. Please configure in Settings > Text Optimization.');
  }

  const chatUrl = textOptimizerModelUrl.endsWith('/')
    ? `${textOptimizerModelUrl}chat/completions`
    : `${textOptimizerModelUrl}/chat/completions`;

  const userMessage = `请根据你的系统提示词优化以下文本：\n\n${inputText}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: textOptimizerSystemPrompt },
    { role: 'user', content: userMessage },
  ];

  const requestBody = {
    model: textOptimizerModelName,
    messages,
    temperature: 0.7,
    max_tokens: 4000,
  };

  const response = await makeApiRequest<ChatCompletionResponse>(chatUrl, textOptimizerApiKey, requestBody);

  if (!response.choices || response.choices.length === 0) {
    throw new Error('No response from AI model');
  }

  const assistantMessage = response.choices[0].message.content;

  return parseOptimizationResponse(assistantMessage);
}

function parseOptimizationResponse(content: string): TextOptimizationResponse {
  const result: TextOptimizationResponse = {
    reasoning: '',
    structure: {
      coreSubject: '',
      sceneAction: '',
      artStyle: '',
      compositionLighting: '',
    },
    finalPrompt: '',
  };

  const reasoningMatch = content.match(/### 🎨 构思与画面解析 \(Reasoning\)[\s\S]*?\*\*(.*?)\*\*/);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim();
  }

  const structureMatch = content.match(/### 📝 结构化拆解 \(Structure\)[\s\S]*?(?=###)/);
  if (structureMatch) {
    const structureText = structureMatch[0];
    const coreSubjectMatch = structureText.match(/\*\*核心主体\*\*：?(.+)/);
    if (coreSubjectMatch) result.structure.coreSubject = coreSubjectMatch[1].trim();

    const sceneActionMatch = structureText.match(/\*\*场景动作\*\*：?(.+)/);
    if (sceneActionMatch) result.structure.sceneAction = sceneActionMatch[1].trim();

    const artStyleMatch = structureText.match(/\*\*艺术风格\*\*：?(.+)/);
    if (artStyleMatch) result.structure.artStyle = artStyleMatch[1].trim();

    const compositionLightingMatch = structureText.match(/\*\*构图光影\*\*：?(.+)/);
    if (compositionLightingMatch) result.structure.compositionLighting = compositionLightingMatch[1].trim();
  }

  const finalPromptMatch = content.match(/### 🚀 最终提示词 \(Final Prompt\)[\s\S]*?```text[\s\n]*(.+?)```/s);
  if (finalPromptMatch) {
    result.finalPrompt = finalPromptMatch[1].trim();
  } else {
    const codeBlockMatch = content.match(/```text[\s\n]*(.+?)```/s);
    if (codeBlockMatch) {
      result.finalPrompt = codeBlockMatch[1].trim();
    } else {
      result.finalPrompt = content.trim();
    }
  }

  return result;
}
