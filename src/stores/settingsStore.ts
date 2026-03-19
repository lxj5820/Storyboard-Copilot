import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_GRSAI_CREDIT_TIER_ID,
  PRICE_DISPLAY_CURRENCY_MODES,
  type GrsaiCreditTierId,
  type PriceDisplayCurrencyMode,
} from '@/features/canvas/pricing/types';

export type UiRadiusPreset = 'compact' | 'default' | 'large';
export type ThemeTonePreset = 'neutral' | 'warm' | 'cool';
export type CanvasEdgeRoutingMode = 'spline' | 'orthogonal' | 'smartOrthogonal';
export type ProviderApiKeys = Record<string, string>;

export interface CustomModelConfig {
  id: string;
  apiName: string;
  displayName: string;
  description: string;
  endpoint: string;
  apiKey: string;
  price: number;
  priceCurrency: 'USD' | 'CNY';
  enabled: boolean;
  providerId?: string;
}

export interface TextOptimizerConfig {
  modelUrl: string;
  apiKey: string;
  modelName: string;
  systemPrompt: string;
}

export const DEFAULT_TEXT_OPTIMIZER_SYSTEM_PROMPT = `# 角色设定
你是一个顶尖的 AI 图像生成与编辑提示词工程师（Prompt Engineer）。你的核心任务是将用户简单、模糊的需求，转化为结构严谨、细节丰富且符合大模型规范的专业级英文图像提示词。

# 核心工作流
接收到用户需求后，你必须严格遵循以下步骤：
1. **需求分类**：判断用户的意图是「从零创建新图像（图像生成）」还是「修改现有图像（图像编辑）」。
2. **结构化填充**：根据分类调取对应框架，将用户信息填入，缺失的细节由你利用专业知识补全。
3. **一致性检查**：对照【质量控制规则】进行内部自检，剔除矛盾点并优化词汇。
4. **规范输出**：严格按照规定的格式输出中文解析及最终英文提示词。

---

# 模块一：图像生成协议（Generation Protocol）
当用户要求画图或生成新场景时调用此协议。
**生成公式**：[主体与特征] + [动作与互动] + [场景环境] + [艺术风格与媒介] + [构图与镜头] + [光影与色彩] + [画面质量细节]

**变量填充与扩展指南**：
- **主体 (Subject)**：是谁/是什么（数量、年龄、材质、形状、服装等）。
- **动作与关系 (Action)**：正在做什么，如何与周围环境/其他人互动。
- **场景 (Setting)**：地点（室内/室外、城市/自然）、时间（清晨/黄昏/夜晚）、天气和环境。
- **风格与媒介 (Style)**：摄影/插画/3D/水彩/像素，写实程度，艺术指导方向。
- **构图与相机 (Composition)**：特写/中景/广角，视角角度，镜头（如35mm, 85mm），景深，主体位置。
- **光影与色彩 (Lighting & Color)**：柔光/硬光，逆光，霓虹，冷暖对比，电影级调色等。
- **质量与细节 (Quality)**：清晰度（8k, masterpiece, highly detailed），纹理质感，要求干净极简的背景等。

---

# 模块二：图像编辑协议（Editing Protocol）
当用户提供原图并要求修改局部、换背景或改风格时调用此协议。
**编辑公式**：[保持原样（不可改变）] + [目标修改内容] + [位置/风格/强度] + [光影一致性]

**变量填充与扩展指南**：
- **保持 (Keep) [必须置于首位]**：明确不可改变的核心元素（如：保持人物面部特征、发型、姿势、服装、原始构图和全图光线方向绝对不变）。
- **改变 (Change)**：
  - *替换/添加/移除*：精确描述位置、大小、材质，必须要求与原始光影和透视相匹配。
  - *改变背景*：说明新环境，重申主体固定。
  - *风格化*：指定目标风格，但限制不能破坏画面结构、比例或引入文字。
- **光影一致性 (Lighting Consistency)**：强制要求新增物体的阴影方向、受光面与全图现有光源完全一致。

---

# 模块三：质量控制规则（Quality Control Rules）
在生成最终输出前，必须绝对遵守以下 8 项原则：
1. **重要细节优先**：主体、动作、场景和风格的描述必须排在提示词的最前面，构图、相机、光影等次要细节排在后面。
2. **具体明确，拒绝模糊**：绝对禁止使用"更好"、"更高级"、"很好看"等模糊词汇，必须转化为具体视觉描述（如："更高级"->"高质量电影调色，细腻的皮肤纹理"）。
3. **避免矛盾**：绝不能在同一提示词中包含冲突要求（例如：不能同时出现"强逆光"和"面部无阴影"）。
4. **善用约束**：默认或根据需求加入约束条件（如无文字、无水印、无多余路人、无变形肢体）。
5. **保持一致性**：如果是连续生成，保持人物外貌、服装、标志性配饰和色板的一致性设计。
6. **编辑时先保持后改变**：修改人像时，优先强调保护面部、表情、肤色、年龄。
7. **短句切分**：将冗长的句子拆分成短句或单词组，用英文逗号 \`,\` 隔开。
8. **英文输出**：最终提供给画图模型的提示词必须是专业的英文单词或短语组合。

---

# 规范输出格式
每次回复必须严格使用以下 Markdown 模板：

### 🎨 构思与画面解析 (Reasoning)
*(简短说明你如何理解用户需求，你补充了哪些画面细节，以及使用了哪种构图/光影来增强表现力。)*

### 📝 结构化拆解 (Structure)
- **核心主体**：[中文描述]
- **场景动作**：[中文描述]
- **艺术风格**：[中文描述]
- **构图光影**：[中文描述]

### 🚀 最终提示词 (Final Prompt)
\`\`\`text
(在此处输出符合模型规范的最终英文提示词，必须以英文逗号分隔，全英文)"`

export const DEFAULT_GRSAI_NANO_BANANA_PRO_MODEL = 'nano-banana-pro';

interface SettingsState {
  isHydrated: boolean;
  apiKeys: ProviderApiKeys;
  customProviderEndpoint: string;
  enabledModels: string[];
  modelPrices: Record<string, number>;
  customModels: CustomModelConfig[];
  showNodePrice: boolean;
  priceDisplayCurrencyMode: PriceDisplayCurrencyMode;
  usdToCnyRate: number;
  preferDiscountedPrice: boolean;
  uiRadiusPreset: UiRadiusPreset;
  themeTonePreset: ThemeTonePreset;
  accentColor: string;
  canvasEdgeRoutingMode: CanvasEdgeRoutingMode;
  autoCheckAppUpdateOnLaunch: boolean;
  enableUpdateDialog: boolean;
  // Fields that were accidentally removed - restored
 grsaiNanoBananaProModel: string;
  hideProviderGuidePopover: boolean;
  downloadPresetPaths: string[];
  useUploadFilenameAsNodeTitle: boolean;
  storyboardGenKeepStyleConsistent: boolean;
  storyboardGenDisableTextInImage: boolean;
  storyboardGenAutoInferEmptyFrame: boolean;
  ignoreAtTagWhenCopyingAndGenerating: boolean;
  enableStoryboardGenGridPreviewShortcut: boolean;
  showStoryboardGenAdvancedRatioControls: boolean;
  showImageResolutionWatermark: boolean;
  setShowImageResolutionWatermark: (enabled: boolean) => void;
grsaiCreditTierId: GrsaiCreditTierId;
  setProviderApiKey: (providerId: string, key: string) => void;
  setGrsaiNanoBananaProModel: (model: string) => void;
  setHideProviderGuidePopover: (hide: boolean) => void;
  setDownloadPresetPaths: (paths: string[]) => void;
  setUseUploadFilenameAsNodeTitle: (enabled: boolean) => void;
  setStoryboardGenKeepStyleConsistent: (enabled: boolean) => void;
  setStoryboardGenDisableTextInImage: (enabled: boolean) => void;
  setStoryboardGenAutoInferEmptyFrame: (enabled: boolean) => void;
  setIgnoreAtTagWhenCopyingAndGenerating: (enabled: boolean) => void;
  setEnableStoryboardGenGridPreviewShortcut: (enabled: boolean) => void;
  setShowStoryboardGenAdvancedRatioControls: (enabled: boolean) => void;
  setShowNodePrice: (enabled: boolean) => void;
  setPriceDisplayCurrencyMode: (mode: PriceDisplayCurrencyMode) => void;
  setUsdToCnyRate: (rate: number) => void;
  setPreferDiscountedPrice: (enabled: boolean) => void;
  setGrsaiCreditTierId: (tierId: GrsaiCreditTierId) => void;
  setUiRadiusPreset: (preset: UiRadiusPreset) => void;
  setThemeTonePreset: (preset: ThemeTonePreset) => void;
  setAccentColor: (color: string) => void;
  setCanvasEdgeRoutingMode: (mode: CanvasEdgeRoutingMode) => void;
  setAutoCheckAppUpdateOnLaunch: (enabled: boolean) => void;
  setEnableUpdateDialog: (enabled: boolean) => void;
  setCustomProviderEndpoint: (endpoint: string) => void;
  setEnabledModels: (models: string[]) => void;
  setModelPrices: (prices: Record<string, number>) => void;
  setCustomModels: (models: CustomModelConfig[]) => void;
  textOptimizerModelUrl: string;
  textOptimizerApiKey: string;
  textOptimizerModelName: string;
  textOptimizerSystemPrompt: string;
  setTextOptimizerModelUrl: (url: string) => void;
  setTextOptimizerApiKey: (key: string) => void;
  setTextOptimizerModelName: (name: string) => void;
  setTextOptimizerSystemPrompt: (prompt: string) => void;
}

const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{6}$/;

function normalizeHexColor(input: string): string {
  const trimmed = input.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    return '#3B82F6';
  }
  return trimmed.startsWith('#') ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
}

function normalizeApiKey(input: string): string {
  return input.trim();
}

function normalizePriceDisplayCurrencyMode(
  input: PriceDisplayCurrencyMode | string | null | undefined
): PriceDisplayCurrencyMode {
  return PRICE_DISPLAY_CURRENCY_MODES.includes(input as PriceDisplayCurrencyMode)
    ? (input as PriceDisplayCurrencyMode)
    : 'auto';
}

function normalizeUsdToCnyRate(input: number | string | null | undefined): number {
  const numeric = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 7.2;
  }

  return Math.min(100, Math.max(0.01, Math.round(numeric * 100) / 100));
}

function normalizeGrsaiCreditTierId(
  input: GrsaiCreditTierId | string | null | undefined
): GrsaiCreditTierId {
  switch (input) {
    case 'tier-10':
    case 'tier-20':
    case 'tier-49':
    case 'tier-99':
    case 'tier-499':
    case 'tier-999':
      return input;
    default:
      return DEFAULT_GRSAI_CREDIT_TIER_ID;
  }
}

function normalizeGrsaiNanoBananaProModel(input: string | null | undefined): string {
  const trimmed = (input ?? '').trim().toLowerCase();
  if (trimmed === DEFAULT_GRSAI_NANO_BANANA_PRO_MODEL || trimmed.startsWith('nano-banana-pro-')) {
    return trimmed;
  }
  return DEFAULT_GRSAI_NANO_BANANA_PRO_MODEL;
}

function normalizeCanvasEdgeRoutingMode(
  input: CanvasEdgeRoutingMode | string | null | undefined
): CanvasEdgeRoutingMode {
  if (input === 'orthogonal' || input === 'smartOrthogonal' || input === 'spline') {
    return input;
  }
  return 'spline';
}

function normalizeApiKeys(input: ProviderApiKeys | null | undefined): ProviderApiKeys {
  if (!input) {
    return {};
  }

  return Object.entries(input).reduce<ProviderApiKeys>((acc, [providerId, key]) => {
    const normalizedProviderId = providerId.trim();
    if (!normalizedProviderId) {
      return acc;
    }

    acc[normalizedProviderId] = normalizeApiKey(key);
    return acc;
  }, {});
}

export function hasConfiguredApiKey(apiKeys: ProviderApiKeys): boolean {
  return getConfiguredApiKeyCount(apiKeys) > 0;
}

export function getConfiguredApiKeyCount(
  apiKeys: ProviderApiKeys,
  providerIds?: readonly string[]
): number {
  const keysToCount = providerIds
    ? providerIds.map((providerId) => apiKeys[providerId] ?? '')
    : Object.values(apiKeys);

  return keysToCount.reduce((count, key) => {
    return normalizeApiKey(key).length > 0 ? count + 1 : count;
  }, 0);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isHydrated: false,
      apiKeys: {},
      enabledModels: [],
      modelPrices: {},
      customModels: [],
      customProviderEndpoint: 'https://ai.comfly.chat/',
      grsaiNanoBananaProModel: DEFAULT_GRSAI_NANO_BANANA_PRO_MODEL,
      hideProviderGuidePopover: false,
      downloadPresetPaths: [],
      useUploadFilenameAsNodeTitle: true,
      storyboardGenKeepStyleConsistent: true,
      storyboardGenDisableTextInImage: true,
      storyboardGenAutoInferEmptyFrame: true,
      ignoreAtTagWhenCopyingAndGenerating: true,
      enableStoryboardGenGridPreviewShortcut: false,
      showStoryboardGenAdvancedRatioControls: false,
      showImageResolutionWatermark: false,
      showNodePrice: true,
      priceDisplayCurrencyMode: 'auto',
      usdToCnyRate: 7.2,
      preferDiscountedPrice: false,
      grsaiCreditTierId: DEFAULT_GRSAI_CREDIT_TIER_ID,
      uiRadiusPreset: 'default',
      themeTonePreset: 'neutral',
      accentColor: '#3B82F6',
      canvasEdgeRoutingMode: 'spline',
      autoCheckAppUpdateOnLaunch: true,
      enableUpdateDialog: true,
      setCustomProviderEndpoint: (endpoint: string) => set({ customProviderEndpoint: endpoint.trim() }),
      setEnabledModels: (models: string[]) => set({ enabledModels: models }),
      setModelPrices: (prices: Record<string, number>) => set({ modelPrices: prices }),
      setCustomModels: (models: CustomModelConfig[]) => set({ customModels: models }),
      setGrsaiNanoBananaProModel: (model) =>
        set({
          grsaiNanoBananaProModel: normalizeGrsaiNanoBananaProModel(model),
        }),
      setHideProviderGuidePopover: (hide) => set({ hideProviderGuidePopover: hide }),
      setDownloadPresetPaths: (paths) => {
        const uniquePaths = Array.from(
          new Set(paths.map((path) => path.trim()).filter((path) => path.length > 0))
        ).slice(0, 8);
        set({ downloadPresetPaths: uniquePaths });
      },
      setUseUploadFilenameAsNodeTitle: (enabled) => set({ useUploadFilenameAsNodeTitle: enabled }),
      setStoryboardGenKeepStyleConsistent: (enabled) =>
        set({ storyboardGenKeepStyleConsistent: enabled }),
      setStoryboardGenDisableTextInImage: (enabled) =>
        set({ storyboardGenDisableTextInImage: enabled }),
      setStoryboardGenAutoInferEmptyFrame: (enabled) =>
        set({ storyboardGenAutoInferEmptyFrame: enabled }),
      setIgnoreAtTagWhenCopyingAndGenerating: (enabled) =>
        set({ ignoreAtTagWhenCopyingAndGenerating: enabled }),
      setEnableStoryboardGenGridPreviewShortcut: (enabled) =>
        set({ enableStoryboardGenGridPreviewShortcut: enabled }),
      setShowStoryboardGenAdvancedRatioControls: (enabled) =>
        set({ showStoryboardGenAdvancedRatioControls: enabled }),
      setShowImageResolutionWatermark: (enabled) => set({ showImageResolutionWatermark: enabled }),
      setShowNodePrice: (enabled) => set({ showNodePrice: enabled }),
      setPriceDisplayCurrencyMode: (priceDisplayCurrencyMode) =>
        set({
          priceDisplayCurrencyMode:
            normalizePriceDisplayCurrencyMode(priceDisplayCurrencyMode),
        }),
      setUsdToCnyRate: (usdToCnyRate) =>
        set({ usdToCnyRate: normalizeUsdToCnyRate(usdToCnyRate) }),
      setPreferDiscountedPrice: (enabled) => set({ preferDiscountedPrice: enabled }),
      setGrsaiCreditTierId: (grsaiCreditTierId) =>
        set({grsaiCreditTierId: normalizeGrsaiCreditTierId(grsaiCreditTierId) }),
      setUiRadiusPreset: (uiRadiusPreset) => set({ uiRadiusPreset }),
      setThemeTonePreset: (themeTonePreset) => set({ themeTonePreset }),
      setAccentColor: (color) => set({ accentColor: normalizeHexColor(color) }),
      setCanvasEdgeRoutingMode: (canvasEdgeRoutingMode) =>
        set({ canvasEdgeRoutingMode: normalizeCanvasEdgeRoutingMode(canvasEdgeRoutingMode) }),
      setAutoCheckAppUpdateOnLaunch: (enabled) => set({ autoCheckAppUpdateOnLaunch: enabled }),
      setEnableUpdateDialog: (enabled) => set({ enableUpdateDialog: enabled }),
      setProviderApiKey: (providerId, key) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [providerId]: normalizeApiKey(key),
          },
        })),
      textOptimizerModelUrl: '',
      textOptimizerApiKey: '',
      textOptimizerModelName: 'gpt-4o-mini',
      textOptimizerSystemPrompt: DEFAULT_TEXT_OPTIMIZER_SYSTEM_PROMPT,
      setTextOptimizerModelUrl: (url: string) => set({ textOptimizerModelUrl: url.trim() }),
      setTextOptimizerApiKey: (key: string) => set({ textOptimizerApiKey: key.trim() }),
      setTextOptimizerModelName: (name: string) => set({ textOptimizerModelName: name.trim() }),
      setTextOptimizerSystemPrompt: (prompt: string) => set({ textOptimizerSystemPrompt: prompt }),
    }),
    {
      name: 'settings-storage',
      version: 11,
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('failed to hydrate settings storage', error);
          }
          useSettingsStore.setState({ isHydrated: true });
        };
      },
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as {
          apiKey?: string;
          apiKeys?: ProviderApiKeys;
          ignoreAtTagWhenCopyingAndGenerating?: boolean;
          grsaiNanoBananaProModel?: string;
          hideProviderGuidePopover?: boolean;
          canvasEdgeRoutingMode?: CanvasEdgeRoutingMode | string;
          autoCheckAppUpdateOnLaunch?: boolean;
          enableUpdateDialog?: boolean;
          enableStoryboardGenGridPreviewShortcut?: boolean;
          showStoryboardGenAdvancedRatioControls?: boolean;
          showImageResolutionWatermark?: boolean;
          storyboardGenAutoInferEmptyFrame?: boolean;
          showNodePrice?: boolean;
          priceDisplayCurrencyMode?: PriceDisplayCurrencyMode | string;
          usdToCnyRate?: number | string;
          preferDiscountedPrice?: boolean;
          grsaiCreditTierId?: GrsaiCreditTierId | string;
        };

        const migratedApiKeys = normalizeApiKeys(state.apiKeys);
        const ignoreAtTagWhenCopyingAndGenerating =
          state.ignoreAtTagWhenCopyingAndGenerating ?? true;
        if (Object.keys(migratedApiKeys).length > 0) {
          return {
            ...(persistedState as object),
            isHydrated: true,
            apiKeys: migratedApiKeys,
            ignoreAtTagWhenCopyingAndGenerating,
            grsaiNanoBananaProModel: normalizeGrsaiNanoBananaProModel(
              state.grsaiNanoBananaProModel
            ),
            hideProviderGuidePopover: state.hideProviderGuidePopover ?? false,
            canvasEdgeRoutingMode: normalizeCanvasEdgeRoutingMode(state.canvasEdgeRoutingMode),
            autoCheckAppUpdateOnLaunch: state.autoCheckAppUpdateOnLaunch ?? true,
            enableUpdateDialog: state.enableUpdateDialog ?? true,
            enableStoryboardGenGridPreviewShortcut:
              state.enableStoryboardGenGridPreviewShortcut ?? false,
            showStoryboardGenAdvancedRatioControls:
              state.showStoryboardGenAdvancedRatioControls ?? false,
            showImageResolutionWatermark: state.showImageResolutionWatermark ?? false,
            storyboardGenAutoInferEmptyFrame: state.storyboardGenAutoInferEmptyFrame ?? true,
            showNodePrice: state.showNodePrice ?? true,
            priceDisplayCurrencyMode: normalizePriceDisplayCurrencyMode(
              state.priceDisplayCurrencyMode
            ),
            usdToCnyRate: normalizeUsdToCnyRate(state.usdToCnyRate),
            preferDiscountedPrice: state.preferDiscountedPrice ?? false,
            grsaiCreditTierId: normalizeGrsaiCreditTierId(state.grsaiCreditTierId),
          };
        }

        return {
          ...(persistedState as object),
          isHydrated: true,
          apiKeys: state.apiKey ? { ppio: normalizeApiKey(state.apiKey) } : {},
          ignoreAtTagWhenCopyingAndGenerating,
          grsaiNanoBananaProModel: normalizeGrsaiNanoBananaProModel(
            state.grsaiNanoBananaProModel
          ),
          hideProviderGuidePopover: state.hideProviderGuidePopover ?? false,
          canvasEdgeRoutingMode: normalizeCanvasEdgeRoutingMode(state.canvasEdgeRoutingMode),
          autoCheckAppUpdateOnLaunch: state.autoCheckAppUpdateOnLaunch ?? true,
          enableUpdateDialog: state.enableUpdateDialog ?? true,
          enableStoryboardGenGridPreviewShortcut:
            state.enableStoryboardGenGridPreviewShortcut ?? false,
          showStoryboardGenAdvancedRatioControls:
            state.showStoryboardGenAdvancedRatioControls ?? false,
          showImageResolutionWatermark: state.showImageResolutionWatermark ?? false,
          storyboardGenAutoInferEmptyFrame: state.storyboardGenAutoInferEmptyFrame ?? true,
          showNodePrice: state.showNodePrice ?? true,
          priceDisplayCurrencyMode: normalizePriceDisplayCurrencyMode(
            state.priceDisplayCurrencyMode
          ),
          usdToCnyRate: normalizeUsdToCnyRate(state.usdToCnyRate),
          preferDiscountedPrice: state.preferDiscountedPrice ?? false,
          grsaiCreditTierId: normalizeGrsaiCreditTierId(state.grsaiCreditTierId),
        };
      },
    }
  )
);
