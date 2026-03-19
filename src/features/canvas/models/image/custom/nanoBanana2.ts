import type { ImageModelDefinition } from '../../types';
import { createMultiplierPricing, isHighThinkingEnabled } from '@/features/canvas/pricing';

export const CUSTOM_NANO_BANANA_2_MODEL_ID = 'custom/nano-banana-2';
export const CUSTOM_NANO_BANANA_2_API_NAME = 'nano-banana';

const CUSTOM_NANO_BANANA_2_ASPECT_RATIOS = [
  '21:9',
  '16:9',
  '3:2',
  '4:3',
  '5:4',
  '1:1',
  '4:5',
  '3:4',
  '2:3',
  '9:16',
] as const;

export const imageModel: ImageModelDefinition = {
  id: CUSTOM_NANO_BANANA_2_MODEL_ID,
  mediaType: 'image',
  displayName: 'Nano Banana 2',
  providerId: 'custom',
  description: 'ai.comfly · Nano Banana 2 图像生成与编辑',
  eta: '1min',
  expectedDurationMs: 60000,
  defaultAspectRatio: '1:1',
  defaultResolution: '1K',
  aspectRatios: CUSTOM_NANO_BANANA_2_ASPECT_RATIOS.map((value) => ({ value, label: value })),
  resolutions: [
    { value: '0.5K', label: '0.5K' },
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ],
  extraParamsSchema: [
    {
      key: 'thinking_level',
      label: 'Thinking level',
      labelKey: 'modelParams.thinkingLevel',
      type: 'enum',
      defaultValue: 'off',
      options: [
        { value: 'off', label: 'Off', labelKey: 'modelParams.thinkingDisabled' },
        { value: 'minimal', label: 'Minimal', labelKey: 'modelParams.thinkingMinimal' },
        { value: 'high', label: 'High', labelKey: 'modelParams.thinkingHigh' },
      ],
    },
  ],
  defaultExtraParams: {
    thinking_level: 'off',
  },
  pricing: createMultiplierPricing({
    currency: 'USD',
    baseAmount: 0.08,
    resolutionMultipliers: {
      '0.5K': 0.75,
      '1K': 1,
      '2K': 1.5,
      '4K': 2,
    },
    resolveExtraCharges: ({ extraParams }) =>
      (extraParams?.enable_web_search === true ? 0.015 : 0) +
      (isHighThinkingEnabled(extraParams) ? 0.002 : 0),
  }),
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: CUSTOM_NANO_BANANA_2_API_NAME,
    modeLabel: referenceImageCount > 0 ? 'Nano-banana (图生图)' : 'Nano-banana (文生图)',
    endpoint: referenceImageCount > 0 
      ? 'https://ai.comfly.chat/v1/images/edits' 
      : 'https://ai.comfly.chat/v1/images/generations'
  }),
};
