import type { ImageModelDefinition, ExtraParamType } from './types';
import defaultModelsConfig from './defaultModelsConfig.json';
import { createMultiplierPricing, isHighThinkingEnabled } from '@/features/canvas/pricing';
import type { PriceCurrency } from '@/features/canvas/pricing/types';

interface DefaultModelConfig {
  models: Array<{
    id: string;
    mediaType: 'image';
    displayName: string;
    providerId: string;
    description: string;
    eta: string;
    expectedDurationMs: number;
    defaultAspectRatio: string;
    defaultResolution: string;
    aspectRatios: string[];
    resolutions: Array<{ value: string; label: string }>;
    extraParamsSchema?: Array<{
      key: string;
      label: string;
      labelKey?: string;
      type: ExtraParamType;
      defaultValue?: boolean | number | string;
      options?: Array<{ value: string; label: string; labelKey?: string }>;
    }>;
    defaultExtraParams?: Record<string, unknown>;
    pricing?: {
      currency: PriceCurrency;
      baseAmount: number;
      resolutionMultipliers: Record<string, number>;
    };
    endpoints: {
      generate: string;
      edit: string;
    };
    apiName: string;
  }>;
  defaultModelId: string;
}

const config = defaultModelsConfig as DefaultModelConfig;

export const DEFAULT_IMAGE_MODEL_ID = config.defaultModelId;

function createModelFromConfig(configModel: DefaultModelConfig['models'][0]): ImageModelDefinition {
  return {
    id: configModel.id,
    mediaType: configModel.mediaType,
    displayName: configModel.displayName,
    providerId: configModel.providerId,
    description: configModel.description,
    eta: configModel.eta,
    expectedDurationMs: configModel.expectedDurationMs,
    defaultAspectRatio: configModel.defaultAspectRatio,
    defaultResolution: configModel.defaultResolution,
    aspectRatios: configModel.aspectRatios.map((value) => ({ value, label: value })),
    resolutions: configModel.resolutions,
    extraParamsSchema: configModel.extraParamsSchema,
    defaultExtraParams: configModel.defaultExtraParams,
    pricing: configModel.pricing ? createMultiplierPricing({
      currency: configModel.pricing.currency,
      baseAmount: configModel.pricing.baseAmount,
      resolutionMultipliers: configModel.pricing.resolutionMultipliers,
      resolveExtraCharges: ({ extraParams }) =>
        (extraParams?.enable_web_search === true ? 0.015 : 0) +
        (isHighThinkingEnabled(extraParams) ? 0.002 : 0),
    }) : undefined,
    resolveRequest: ({ referenceImageCount }) => ({
      requestModel: configModel.apiName,
      modeLabel: referenceImageCount > 0 ? 'Nano-banana (图生图)' : 'Nano-banana (文生图)',
      endpoint: referenceImageCount > 0 
        ? 'https://ai.comfly.chat/v1/images/edits' 
        : 'https://ai.comfly.chat/v1/images/generations'
    }),
  };
}

export function loadDefaultImageModels(): ImageModelDefinition[] {
  return config.models.map(createModelFromConfig);
}

export function getDefaultModelConfig(): DefaultModelConfig {
  return config;
}