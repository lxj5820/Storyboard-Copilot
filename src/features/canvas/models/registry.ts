import type {
  ImageModelDefinition,
  ImageModelRuntimeContext,
  ModelProviderDefinition,
  ResolutionOption,
} from './types';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadDefaultImageModels, DEFAULT_IMAGE_MODEL_ID } from './defaultModelsLoader';

const providerModules = import.meta.glob<{ provider: ModelProviderDefinition }>(
  './providers/*.ts',
  { eager: true }
);

const providers: ModelProviderDefinition[] = Object.values(providerModules)
  .map((module) => module.provider)
  .filter((provider): provider is ModelProviderDefinition => Boolean(provider))
  .sort((a, b) => a.id.localeCompare(b.id));

const imageModels: ImageModelDefinition[] = loadDefaultImageModels();

const providerMap = new Map<string, ModelProviderDefinition>(
  providers.map((provider) => [provider.id, provider])
);
const imageModelMap = new Map<string, ImageModelDefinition>(
  imageModels.map((model) => [model.id, model])
);

const imageModelAliasMap = new Map<string, string>([]);

// 将自定义模型配置转换为 ImageModelDefinition
function convertCustomModelToImageModel(
  customModel: ReturnType<typeof useSettingsStore.getState>['customModels'][number]
): ImageModelDefinition {
  return {
    id: customModel.id,
    mediaType: 'image',
    providerId: 'custom',
    displayName: customModel.displayName || customModel.apiName,
    description: customModel.description || '',
    eta: '~60s',
    defaultAspectRatio: '1:1',
    defaultResolution: '1K',
    aspectRatios: [
      { value: '21:9', label: '21:9' },
      { value: '16:9', label: '16:9' },
      { value: '3:2', label: '3:2' },
      { value: '4:3', label: '4:3' },
      { value: '5:4', label: '5:4' },
      { value: '1:1', label: '1:1' },
      { value: '4:5', label: '4:5' },
      { value: '3:4', label: '3:4' },
      { value: '2:3', label: '2:3' },
      { value: '9:16', label: '9:16' }
    ],
    resolutions: [
      { value: '0.5K', label: '0.5K' },
      { value: '1K', label: '1K' },
      { value: '2K', label: '2K' },
      { value: '4K', label: '4K' }
    ],
    expectedDurationMs: 60000,
    resolveRequest: () => ({
      requestModel: customModel.apiName,
      modeLabel: 'generate',
    }),
  };
}

export function listImageModels(): ImageModelDefinition[] {
  const { customModels } = useSettingsStore.getState();

  // 返回默认模型 + 自定义模型
  const allModels = [...imageModels];

  // 添加自定义模型
  customModels.forEach((customModel) => {
    // 检查是否已存在同名模型
    if (!allModels.some(m => m.id === customModel.id)) {
      allModels.push(convertCustomModelToImageModel(customModel));
    }
  });

  return allModels;
}

export function listModelProviders(): ModelProviderDefinition[] {
  return providers;
}

export function getImageModel(modelId: string): ImageModelDefinition {
  const resolvedModelId = imageModelAliasMap.get(modelId) ?? modelId;
  return imageModelMap.get(resolvedModelId) ?? imageModelMap.get(DEFAULT_IMAGE_MODEL_ID)!;
}

export function resolveImageModelResolutions(
  model: ImageModelDefinition,
  context: ImageModelRuntimeContext = {}
): ResolutionOption[] {
  const resolvedOptions = model.resolveResolutions?.(context);
  return resolvedOptions && resolvedOptions.length > 0 ? resolvedOptions : model.resolutions;
}

export function resolveImageModelResolution(
  model: ImageModelDefinition,
  requestedResolution: string | undefined,
  context: ImageModelRuntimeContext = {}
): ResolutionOption {
  const resolutionOptions = resolveImageModelResolutions(model, context);

  return (
    (requestedResolution
      ? resolutionOptions.find((item) => item.value === requestedResolution)
      : undefined) ??
    resolutionOptions.find((item) => item.value === model.defaultResolution) ??
    resolutionOptions[0] ??
    model.resolutions[0]
  );
}

export function getModelProvider(providerId: string): ModelProviderDefinition {
  return (
    providerMap.get(providerId) ?? {
      id: 'unknown',
      name: 'Unknown Provider',
      label: 'Unknown',
    }
  );
}
