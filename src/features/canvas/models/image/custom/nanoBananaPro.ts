import type { ImageModelDefinition } from '../../types';
import { createMultiplierPricing } from '@/features/canvas/pricing';

export const CUSTOM_NANO_BANANA_PRO_MODEL_ID = 'custom/nano-banana-pro';
export const CUSTOM_NANO_BANANA_PRO_API_NAME = 'nano-banana-pro';

const CUSTOM_NANO_BANANA_PRO_ASPECT_RATIOS = [
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
  id: CUSTOM_NANO_BANANA_PRO_MODEL_ID,
  mediaType: 'image',
  displayName: 'Nano Banana Pro',
  providerId: 'custom',
  description: 'ai.comfly · Nano Banana Pro 图像生成与编辑',
  eta: '1min',
  expectedDurationMs: 60000,
  defaultAspectRatio: '1:1',
  defaultResolution: '1K',
  aspectRatios: CUSTOM_NANO_BANANA_PRO_ASPECT_RATIOS.map((value) => ({ value, label: value })),
  resolutions: [
    { value: '0.5K', label: '0.5K' },
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ],
  pricing: createMultiplierPricing({
    currency: 'USD',
    baseAmount: 0.15,
    resolutionMultipliers: {
      '0.5K': 1,
      '1K': 1,
      '2K': 1,
      '4K': 2,
    },
    resolveExtraCharges: ({ extraParams }) => (extraParams?.enable_web_search === true ? 0.015 : 0),
  }),
  resolveRequest: ({ referenceImageCount }) => ({
    requestModel: CUSTOM_NANO_BANANA_PRO_API_NAME,
    modeLabel: referenceImageCount > 0 ? '编辑模式' : '生成模式',
  }),
};
