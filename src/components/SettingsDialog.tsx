import { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Eye, EyeOff, FolderOpen, Plus, Trash2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-dialog';
import { useSettingsStore, type CustomModelConfig } from '@/stores/settingsStore';
import { listImageModels } from '@/features/canvas/models';
import { UiCheckbox, UiSelect } from '@/components/ui';
import { UI_CONTENT_OVERLAY_INSET_CLASS, UI_DIALOG_TRANSITION_MS } from '@/components/ui/motion';
import { useDialogTransition } from '@/components/ui/useDialogTransition';
import type { SettingsCategory } from '@/features/settings/settingsEvents';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: SettingsCategory;
  onCheckUpdate?: () => Promise<'has-update' | 'up-to-date' | 'failed'>;
}

// 单个模型配置项组件
interface ModelConfigItemProps {
  model: CustomModelConfig & { isDefault?: boolean };
  index: number;
  isDefault?: boolean;
  revealedApiKeys: Record<string, boolean>;
  onUpdate: (index: number, updates: Partial<CustomModelConfig>) => void;
  onToggle: (modelId: string) => void;
  onDelete?: (modelId: string) => void;
  onToggleReveal: (id: string, revealed: boolean) => void;
  t: (key: string) => string;
}

function ModelConfigItem({
  model,
  index,
  isDefault,
  revealedApiKeys,
  onUpdate,
  onToggle,
  onDelete,
  onToggleReveal,
  t,
}: ModelConfigItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border-dark bg-surface-dark p-3 transition-all duration-200 hover:border-border-strong">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-text-muted hover:text-text-dark transition-transform"
          title={isExpanded ? t('common.collapse') : t('common.expand')}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-dark truncate">
              {model.displayName || t('settings.untitledModel')}
            </span>
            {isDefault && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                {t('settings.defaultModel')}
              </span>
            )}
            {model.enabled && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                {t('settings.enabled')}
              </span>
            )}
          </div>
          <div className="text-xs text-text-muted truncate">
            {model.apiName || t('settings.noApiName')}
          </div>
        </div>

        <UiCheckbox
          checked={model.enabled}
          onCheckedChange={() => onToggle(model.id)}
          title={model.enabled ? t('settings.disableModel') : t('settings.enableModel')}
        />

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(model.id)}
            className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 展开的编辑区域 */}
      {isExpanded && (
        <div className="mt-3 pl-7 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {isDefault ? (
            // 默认模型不显示单独的 API Key，使用统一输入框，但显示价格设置
            <>
              <div className="text-xs text-text-muted mb-2">
                {t('settings.defaultModelUseCommonApiKey') || '使用上方统一的 API Key'}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">{t('settings.modelPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={model.price}
                    onChange={(e) => onUpdate(index, { id: model.id, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="0.00"
                    title={t('settings.modelPriceDesc')}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-text-muted mb-1">{t('settings.modelPriceCurrency')}</label>
                  <select
                    value={model.priceCurrency}
                    onChange={(e) => onUpdate(index, { id: model.id, priceCurrency: e.target.value as 'USD' | 'CNY' })}
                    className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                    title={t('settings.modelPriceCurrencyDesc')}
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            // 自定义模型显示所有字段
            <>
              {/* 显示名称 */}
              <div>
                <label className="block text-xs text-text-muted mb-1">{t('settings.modelDisplayName')}</label>
                <input
                  type="text"
                  value={model.displayName}
                  onChange={(e) => onUpdate(index, { displayName: e.target.value })}
                  className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder={t('settings.modelDisplayNamePlaceholder')}
                  title={t('settings.modelDisplayNameDesc')}
                />
              </div>

              {/* API 名称 */}
              <div>
                <label className="block text-xs text-text-muted mb-1">{t('settings.modelApiName')}</label>
                <input
                  type="text"
                  value={model.apiName}
                  onChange={(e) => onUpdate(index, { apiName: e.target.value })}
                  className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder={t('settings.modelApiNamePlaceholder')}
                  title={t('settings.modelApiNameDesc')}
                />
              </div>

              {/* 接口地址 */}
              <div>
                <label className="block text-xs text-text-muted mb-1">{t('settings.modelEndpoint')}</label>
                <input
                  type="url"
                  value={model.endpoint}
                  onChange={(e) => onUpdate(index, { endpoint: e.target.value })}
                  className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="https://api.example.com/"
                  title={t('settings.modelEndpointDesc')}
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs text-text-muted mb-1">{t('settings.modelApiKey')}</label>
                <div className="relative">
                  <input
                    type={revealedApiKeys[model.id] ? 'text' : 'password'}
                    value={model.apiKey}
                    onChange={(e) => onUpdate(index, { apiKey: e.target.value })}
                    className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 pr-8 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder={t('settings.modelApiKeyPlaceholder')}
                    title={t('settings.modelApiKeyDesc')}
                  />
                  <button
                    type="button"
                    onClick={() => onToggleReveal(model.id, !revealedApiKeys[model.id])}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition-colors"
                    title={revealedApiKeys[model.id] ? t('settings.hideApiKey') : t('settings.showApiKey')}
                  >
                    {revealedApiKeys[model.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 价格 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">{t('settings.modelPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={model.price}
                    onChange={(e) => onUpdate(index, { price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="0.00"
                    title={t('settings.modelPriceDesc')}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-text-muted mb-1">{t('settings.modelPriceCurrency')}</label>
                  <select
                    value={model.priceCurrency}
                    onChange={(e) => onUpdate(index, { priceCurrency: e.target.value as 'USD' | 'CNY' })}
                    className="w-full rounded border border-border-dark bg-bg-dark px-2 py-1.5 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                    title={t('settings.modelPriceCurrencyDesc')}
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsDialog({
  isOpen,
  onClose,
  initialCategory = 'general',
}: SettingsDialogProps) {
  const { t } = useTranslation();
  const {
    apiKeys,
    downloadPresetPaths,
    useUploadFilenameAsNodeTitle,
    storyboardGenKeepStyleConsistent,
    storyboardGenDisableTextInImage,
    storyboardGenAutoInferEmptyFrame,
    ignoreAtTagWhenCopyingAndGenerating,
    enableStoryboardGenGridPreviewShortcut,
    showStoryboardGenAdvancedRatioControls,
    showImageResolutionWatermark,
    showNodePrice,
    priceDisplayCurrencyMode,
    usdToCnyRate,
    preferDiscountedPrice,
    uiRadiusPreset,
    themeTonePreset,
    accentColor,
    canvasEdgeRoutingMode,
    enabledModels,
    customModels,
    modelPrices,
    customProviderEndpoint,
    textOptimizerModelUrl,
    textOptimizerApiKey,
    textOptimizerModelName,
    textOptimizerSystemPrompt,
    setProviderApiKey,
    setDownloadPresetPaths,
    setUseUploadFilenameAsNodeTitle,
    setStoryboardGenKeepStyleConsistent,
    setStoryboardGenDisableTextInImage,
    setStoryboardGenAutoInferEmptyFrame,
    setIgnoreAtTagWhenCopyingAndGenerating,
    setEnableStoryboardGenGridPreviewShortcut,
    setShowStoryboardGenAdvancedRatioControls,
    setShowImageResolutionWatermark,
    setShowNodePrice,
    setPriceDisplayCurrencyMode,
    setUsdToCnyRate,
    setPreferDiscountedPrice,
    setUiRadiusPreset,
    setThemeTonePreset,
    setAccentColor,
    setCanvasEdgeRoutingMode,
    setEnabledModels,
    setModelPrices,
    setCustomModels,
    setCustomProviderEndpoint,
    setTextOptimizerModelUrl,
    setTextOptimizerApiKey,
    setTextOptimizerModelName,
    setTextOptimizerSystemPrompt,
  } = useSettingsStore();

  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCategory);
  const [revealedApiKeys, setRevealedApiKeys] = useState<Record<string, boolean>>({});

  const [localUseUploadFilenameAsNodeTitle, setLocalUseUploadFilenameAsNodeTitle] = useState(useUploadFilenameAsNodeTitle);
  const [localStoryboardGenKeepStyleConsistent, setLocalStoryboardGenKeepStyleConsistent] = useState(storyboardGenKeepStyleConsistent);
  const [localStoryboardGenDisableTextInImage, setLocalStoryboardGenDisableTextInImage] = useState(storyboardGenDisableTextInImage);
  const [localStoryboardGenAutoInferEmptyFrame, setLocalStoryboardGenAutoInferEmptyFrame] = useState(storyboardGenAutoInferEmptyFrame);
  const [localIgnoreAtTagWhenCopyingAndGenerating, setLocalIgnoreAtTagWhenCopyingAndGenerating] = useState(ignoreAtTagWhenCopyingAndGenerating);
  const [localEnableStoryboardGenGridPreviewShortcut, setLocalEnableStoryboardGenGridPreviewShortcut] = useState(enableStoryboardGenGridPreviewShortcut);
  const [localShowStoryboardGenAdvancedRatioControls, setLocalShowStoryboardGenAdvancedRatioControls] = useState(showStoryboardGenAdvancedRatioControls);
  const [localShowImageResolutionWatermark, setLocalShowImageResolutionWatermark] = useState(showImageResolutionWatermark);
  const [localShowNodePrice, setLocalShowNodePrice] = useState(showNodePrice);
  const [localPriceDisplayCurrencyMode, setLocalPriceDisplayCurrencyMode] = useState(priceDisplayCurrencyMode);
  const [localUsdToCnyRate, setLocalUsdToCnyRate] = useState(usdToCnyRate.toString());
  const [localPreferDiscountedPrice, setLocalPreferDiscountedPrice] = useState(false);
  const [localUiRadiusPreset, setLocalUiRadiusPreset] = useState(uiRadiusPreset);
  const [localThemeTonePreset, setLocalThemeTonePreset] = useState(themeTonePreset);
  const [localAccentColor, setLocalAccentColor] = useState(accentColor);
  const [localCanvasEdgeRoutingMode, setLocalCanvasEdgeRoutingMode] = useState(canvasEdgeRoutingMode);
  const [localApiKeys, setLocalApiKeys] = useState(apiKeys);
  const [localDownloadPresetPaths, setLocalDownloadPresetPaths] = useState(downloadPresetPaths);
  const [localDownloadPathInput, setLocalDownloadPathInput] = useState('');

  // 文本优化器相关状态
  const [localTextOptimizerModelUrl, setLocalTextOptimizerModelUrl] = useState(textOptimizerModelUrl);
  const [localTextOptimizerApiKey, setLocalTextOptimizerApiKey] = useState(textOptimizerApiKey);
  const [localTextOptimizerModelName, setLocalTextOptimizerModelName] = useState(textOptimizerModelName);
  const [localTextOptimizerSystemPrompt, setLocalTextOptimizerSystemPrompt] = useState(textOptimizerSystemPrompt);
  const [revealedTextOptimizerApiKey, setRevealedTextOptimizerApiKey] = useState(false);

  // 自定义模型相关状态
  const [localCustomModels, setLocalCustomModels] = useState<CustomModelConfig[]>([]);
  const [localEnabledModels, setLocalEnabledModels] = useState<string[]>([]);
  const [localModelPrices, setLocalModelPrices] = useState<Record<string, number>>({});
  const [localCustomEndpoint, setLocalCustomEndpoint] = useState(customProviderEndpoint);

  // 获取默认模型列表
  const defaultModels = useMemo(() => {
    return listImageModels();
  }, []);

  // 合并默认模型和自定义模型
  const allModels = useMemo(() => {
    const merged: Array<CustomModelConfig & { isDefault: boolean }> = [];

    // 添加默认模型
    defaultModels.forEach((model) => {
      merged.push({
        id: model.id,
        apiName: model.id.split('/')[1] || '',
        displayName: model.displayName,
        description: model.description,
        endpoint: localCustomEndpoint,
        apiKey: localApiKeys[model.providerId] || '',
        price: localModelPrices[model.id] || 0,
        priceCurrency: localPriceDisplayCurrencyMode as 'USD' | 'CNY',
        enabled: !localEnabledModels.includes(model.id),
        isDefault: true,
        providerId: model.providerId,
      });
    });

    // 添加自定义模型
    localCustomModels.forEach((model) => {
      merged.push({
        ...model,
        isDefault: false,
      });
    });

    return merged;
  }, [defaultModels, localCustomEndpoint, localApiKeys, localModelPrices, localEnabledModels, localCustomModels]);

  const { shouldRender, isVisible } = useDialogTransition(isOpen, UI_DIALOG_TRANSITION_MS);

  useEffect(() => {
    if (isOpen) {
      getVersion().then(v => setAppVersion(v)).catch(() => setAppVersion(null));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveCategory(initialCategory);
      setLocalUseUploadFilenameAsNodeTitle(useUploadFilenameAsNodeTitle);
      setLocalStoryboardGenKeepStyleConsistent(storyboardGenKeepStyleConsistent);
      setLocalStoryboardGenDisableTextInImage(storyboardGenDisableTextInImage);
      setLocalStoryboardGenAutoInferEmptyFrame(storyboardGenAutoInferEmptyFrame);
      setLocalIgnoreAtTagWhenCopyingAndGenerating(ignoreAtTagWhenCopyingAndGenerating);
      setLocalEnableStoryboardGenGridPreviewShortcut(enableStoryboardGenGridPreviewShortcut);
      setLocalShowStoryboardGenAdvancedRatioControls(showStoryboardGenAdvancedRatioControls);
      setLocalShowImageResolutionWatermark(showImageResolutionWatermark);
      setLocalShowNodePrice(showNodePrice);
      setLocalPriceDisplayCurrencyMode(priceDisplayCurrencyMode);
      setLocalUsdToCnyRate(usdToCnyRate.toString());
      setLocalPreferDiscountedPrice(preferDiscountedPrice);
      setLocalUiRadiusPreset(uiRadiusPreset);
      setLocalThemeTonePreset(themeTonePreset);
      setLocalAccentColor(accentColor);
      setLocalCanvasEdgeRoutingMode(canvasEdgeRoutingMode);
      setLocalApiKeys(apiKeys);
      setLocalDownloadPresetPaths(downloadPresetPaths);
      setRevealedApiKeys({});

      // 初始化自定义模型数据
      setLocalCustomModels(customModels);
      setLocalEnabledModels(enabledModels);
      setLocalModelPrices(modelPrices);
      setLocalCustomEndpoint(customProviderEndpoint);
    }
  }, [isOpen, initialCategory, useUploadFilenameAsNodeTitle, storyboardGenKeepStyleConsistent, storyboardGenDisableTextInImage, storyboardGenAutoInferEmptyFrame, ignoreAtTagWhenCopyingAndGenerating, enableStoryboardGenGridPreviewShortcut, showStoryboardGenAdvancedRatioControls, showImageResolutionWatermark, showNodePrice, priceDisplayCurrencyMode, usdToCnyRate, uiRadiusPreset, themeTonePreset, accentColor, canvasEdgeRoutingMode, apiKeys, downloadPresetPaths, customModels, enabledModels, modelPrices, customProviderEndpoint]);

  const handleSave = useCallback(() => {
    setUseUploadFilenameAsNodeTitle(localUseUploadFilenameAsNodeTitle);
    setStoryboardGenKeepStyleConsistent(localStoryboardGenKeepStyleConsistent);
    setStoryboardGenDisableTextInImage(localStoryboardGenDisableTextInImage);
    setStoryboardGenAutoInferEmptyFrame(localStoryboardGenAutoInferEmptyFrame);
    setIgnoreAtTagWhenCopyingAndGenerating(localIgnoreAtTagWhenCopyingAndGenerating);
    setEnableStoryboardGenGridPreviewShortcut(localEnableStoryboardGenGridPreviewShortcut);
    setShowStoryboardGenAdvancedRatioControls(localShowStoryboardGenAdvancedRatioControls);
    setShowImageResolutionWatermark(localShowImageResolutionWatermark);
    setShowNodePrice(localShowNodePrice);
    setPriceDisplayCurrencyMode(localPriceDisplayCurrencyMode);
    setUsdToCnyRate(parseFloat(localUsdToCnyRate) || 7.0);
    setUiRadiusPreset(localUiRadiusPreset);
    setThemeTonePreset(localThemeTonePreset);
    setAccentColor(localAccentColor);
    setCanvasEdgeRoutingMode(localCanvasEdgeRoutingMode);

    Object.entries(localApiKeys).forEach(([providerId, apiKey]) => {
      setProviderApiKey(providerId, apiKey);
    });

    setDownloadPresetPaths(localDownloadPresetPaths);

    // 保存自定义模型配置
    setCustomModels(localCustomModels);
    setEnabledModels(localEnabledModels);
    setModelPrices(localModelPrices);
    setCustomProviderEndpoint(localCustomEndpoint);

    onClose();
  }, [
    localUseUploadFilenameAsNodeTitle,
    localStoryboardGenKeepStyleConsistent,
    localStoryboardGenDisableTextInImage,
    localStoryboardGenAutoInferEmptyFrame,
    localIgnoreAtTagWhenCopyingAndGenerating,
    localEnableStoryboardGenGridPreviewShortcut,
    localShowStoryboardGenAdvancedRatioControls,
    localShowNodePrice,
    localPriceDisplayCurrencyMode,
    localUsdToCnyRate,
    localPreferDiscountedPrice,
    localUiRadiusPreset,
    localThemeTonePreset,
    localAccentColor,
    localCanvasEdgeRoutingMode,
    localApiKeys,
    localDownloadPresetPaths,
    setUseUploadFilenameAsNodeTitle,
    setStoryboardGenKeepStyleConsistent,
    setStoryboardGenDisableTextInImage,
    setStoryboardGenAutoInferEmptyFrame,
    setIgnoreAtTagWhenCopyingAndGenerating,
    setEnableStoryboardGenGridPreviewShortcut,
    setShowStoryboardGenAdvancedRatioControls,
    setShowNodePrice,
    setPriceDisplayCurrencyMode,
    setUsdToCnyRate,
    setPreferDiscountedPrice,
    setUiRadiusPreset,
    setThemeTonePreset,
    setAccentColor,
    setCanvasEdgeRoutingMode,
    setProviderApiKey,
    setDownloadPresetPaths,
    localCustomModels,
    localEnabledModels,
    localModelPrices,
    localCustomEndpoint,
    setCustomModels,
    setEnabledModels,
    setModelPrices,
    setCustomProviderEndpoint,
    onClose,
  ]);

  const handlePickDownloadPath = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        setLocalDownloadPresetPaths((previous) => {
          if (previous.includes(selected)) {
            return previous;
          }
          return [...previous, selected].slice(0, 8);
        });
      }
    } catch (error) {
      console.error('Failed to pick download path', error);
    }
  }, []);

  const handleAddDownloadPathFromInput = useCallback(() => {
    const next = localDownloadPathInput.trim();
    if (!next) {
      return;
    }
    setLocalDownloadPresetPaths((previous) => {
      if (previous.includes(next)) {
        return previous;
      }
      return [...previous, next].slice(0, 8);
    });
    setLocalDownloadPathInput('');
  }, [localDownloadPathInput]);

  const handleRemoveDownloadPath = useCallback((path: string) => {
    setLocalDownloadPresetPaths((previous) => previous.filter((value) => value !== path));
  }, []);

  // 自定义模型处理函数
  const handleAddCustomModel = useCallback(() => {
    const newModel: CustomModelConfig = {
      id: `custom/${Date.now()}`,
      apiName: '',
      displayName: '',
      description: '',
      endpoint: localCustomEndpoint,
      apiKey: localApiKeys.custom || '',
      price: 0,
      priceCurrency: 'USD',
      enabled: true,
    };
    setLocalCustomModels((prev) => [...prev, newModel]);
  }, [localCustomEndpoint, localApiKeys]);

  const handleUpdateCustomModel = useCallback((index: number, updates: Partial<CustomModelConfig>) => {
    setLocalCustomModels((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  // 处理自定义模型的启用/禁用切换
  const handleToggleCustomModel = useCallback((modelId: string) => {
    setLocalCustomModels((prev) =>
      prev.map((model) =>
        model.id === modelId ? { ...model, enabled: !model.enabled } : model
      )
    );
  }, []);

  // 处理默认模型的更新（更新价格和 API Key）
  const handleUpdateDefaultModel = useCallback((_index: number, updates: Partial<CustomModelConfig>) => {
    const modelId = updates.id;
    const modelPrice = updates.price;
    const modelApiKey = updates.apiKey;
    const providerId = updates.providerId;
    
    // 更新价格
    if (modelPrice !== undefined && modelId) {
      setLocalModelPrices((prev) => ({
        ...prev,
        [modelId]: modelPrice,
      }));
    }
    
    // 更新 API Key
    if (modelApiKey !== undefined && providerId) {
      setLocalApiKeys((prev) => ({
        ...prev,
        [providerId]: modelApiKey,
      }));
    }
  }, []);

  // 处理默认模型的启用/禁用切换
  const handleToggleDefaultModel = useCallback((modelId: string) => {
    setLocalEnabledModels((prev) => {
      // 如果当前已禁用，则启用（从禁用列表移除）
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      // 如果当前已启用，则禁用（添加到禁用列表）
      return [...prev, modelId];
    });
  }, []);

  const handleDeleteCustomModel = useCallback((modelId: string) => {
    setLocalCustomModels((prev) => prev.filter((m) => m.id !== modelId));
    setLocalEnabledModels((prev) => prev.filter((id) => id !== modelId));
    const newPrices = { ...localModelPrices };
    delete newPrices[modelId];
    setLocalModelPrices(newPrices);
  }, [localModelPrices]);

  // 删除额外的模型
  const removeExtraModel = useCallback(() => {
    // 查找并删除 ID 为 "1" 的模型
    const updatedCustomModels = localCustomModels.filter((m) => m.id !== "1");
    const updatedEnabledModels = localEnabledModels.filter((id) => id !== "1");
    const updatedPrices = { ...localModelPrices };
    delete updatedPrices["1"];
    
    setLocalCustomModels(updatedCustomModels);
    setLocalEnabledModels(updatedEnabledModels);
    setLocalModelPrices(updatedPrices);
    
    // 同时更新到 settingsStore
    setCustomModels(updatedCustomModels);
    setEnabledModels(updatedEnabledModels);
    setModelPrices(updatedPrices);
  }, [localCustomModels, localEnabledModels, localModelPrices, setCustomModels, setEnabledModels, setModelPrices]);

  // 组件加载时删除额外模型
  useEffect(() => {
    if (isOpen) {
      // 检查是否存在 ID 为 "1" 的模型
      const hasExtraModel = localCustomModels.some((m) => m.id === "1");
      if (hasExtraModel) {
        removeExtraModel();
      }
    }
  }, [isOpen, localCustomModels, removeExtraModel]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed ${UI_CONTENT_OVERLAY_INSET_CLASS} z-50 flex items-center justify-center`}>
      <div
        className={`absolute inset-0 bg-black/90 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className="relative w-[min(96vw,1120px)]">
        <div
          className={`relative mx-auto h-[500px] w-[700px] overflow-hidden rounded-lg border border-border-dark bg-surface-dark shadow-xl transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'} flex`}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 hover:bg-bg-dark rounded transition-colors z-10"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>

          <div className="w-[180px] bg-bg-dark border-r border-border-dark flex flex-col">
            <div className="px-4 py-4">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {t('settings.title')}
              </span>
            </div>

            <nav className="flex-1">
              <button
                onClick={() => setActiveCategory('general')}
                className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${activeCategory === 'general'
                    ? 'bg-accent/10 text-text-dark border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-dark hover:text-text-dark'
                  }
              `}
              >
                <span className="text-sm">{t('settings.general')}</span>
              </button>

              <button
                onClick={() => setActiveCategory('model')}
                className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${activeCategory === 'model'
                    ? 'bg-accent/10 text-text-dark border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-dark hover:text-text-dark'
                  }
              `}
              >
                <span className="text-sm">{t('settings.model')}</span>
              </button>

              <button
                onClick={() => setActiveCategory('appearance')}
                className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${activeCategory === 'appearance'
                    ? 'bg-accent/10 text-text-dark border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-dark hover:text-text-dark'
                  }
              `}
              >
                <span className="text-sm">{t('settings.appearance')}</span>
              </button>

              <button
                onClick={() => setActiveCategory('experimental')}
                className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${activeCategory === 'experimental'
                    ? 'bg-accent/10 text-text-dark border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-dark hover:text-text-dark'
                  }
              `}
              >
                <span className="text-sm">{t('settings.experimental')}</span>
              </button>

              <button
                onClick={() => setActiveCategory('textOptimizer')}
                className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${activeCategory === 'textOptimizer'
                    ? 'bg-accent/10 text-text-dark border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-dark hover:text-text-dark'
                  }
              `}
              >
                <span className="text-sm">{t('settings.textOptimizer')}</span>
              </button>

              <button
                onClick={() => setActiveCategory('about')}
                className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${activeCategory === 'about'
                    ? 'bg-accent/10 text-text-dark border-l-2 border-accent'
                    : 'text-text-muted hover:bg-bg-dark hover:text-text-dark'
                  }
              `}
              >
                <span className="text-sm">{t('settings.about')}</span>
              </button>
            </nav>
          </div>

          <div className="flex-1 flex flex-col">
            {activeCategory === 'appearance' && (
              <>
                <div className="px-6 py-5 border-b border-border-dark">
                  <h2 className="text-lg font-semibold text-text-dark">
                    {t('settings.appearance')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('settings.appearanceDesc')}
                  </p>
                </div>

                <div className="ui-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.radiusPreset')}</h3>
                    </div>
                    <UiSelect
                      value={localUiRadiusPreset}
                      onChange={(e) => setLocalUiRadiusPreset(e.target.value as typeof localUiRadiusPreset)}
                    >
                      <option value="default">{t('settings.radiusDefault')}</option>
                      <option value="compact">{t('settings.radiusCompact')}</option>
                      <option value="large">{t('settings.radiusLarge')}</option>
                    </UiSelect>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.themeTone')}</h3>
                    </div>
                    <UiSelect
                      value={localThemeTonePreset}
                      onChange={(e) => setLocalThemeTonePreset(e.target.value as typeof localThemeTonePreset)}
                    >
                      <option value="neutral">{t('settings.toneNeutral')}</option>
                      <option value="warm">{t('settings.toneWarm')}</option>
                      <option value="cool">{t('settings.toneCool')}</option>
                    </UiSelect>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.accentColor')}</h3>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { name: 'blue', value: '#3B82F6' },
                        { name: 'green', value: '#10B981' },
                        { name: 'orange', value: '#F59E0B' },
                        { name: 'pink', value: '#EC4899' },
                        { name: 'purple', value: '#8B5CF6' },
                        { name: 'red', value: '#EF4444' },
                        { name: 'yellow', value: '#EAB308' }
                      ].map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setLocalAccentColor(color.value)}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            localAccentColor === color.value ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.edgeRoutingMode')}</h3>
                    </div>
                    <UiSelect
                      value={localCanvasEdgeRoutingMode}
                      onChange={(e) => setLocalCanvasEdgeRoutingMode(e.target.value as typeof localCanvasEdgeRoutingMode)}
                    >
                      <option value="spline">{t('settings.edgeRoutingSpline')}</option>
                      <option value="orthogonal">{t('settings.edgeRoutingOrthogonal')}</option>
                      <option value="smartOrthogonal">{t('settings.edgeRoutingSmartOrthogonal')}</option>
                    </UiSelect>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-dark flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </>
            )}

            {activeCategory === 'model' && (
              <>
                <div className="px-6 py-5 border-b border-border-dark">
                  <h2 className="text-lg font-semibold text-text-dark">
                    {t('settings.model')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('settings.modelManagementDesc')}
                  </p>
                </div>

                <div className="ui-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  {/* 价格显示设置 */}
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4 transition-all duration-200 hover:border-border-strong">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.showNodePrice')}</h3>
                      <UiCheckbox
                        checked={localShowNodePrice}
                        onCheckedChange={setLocalShowNodePrice}
                        title={t('settings.showNodePriceDesc')}
                      />
                    </div>
                    {localShowNodePrice && (
                      <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-dark">{t('settings.priceDisplayCurrencyMode')}</span>
                          <UiSelect
                            value={localPriceDisplayCurrencyMode}
                            onChange={(e) => setLocalPriceDisplayCurrencyMode(e.target.value as typeof localPriceDisplayCurrencyMode)}
                            className="focus:outline-none focus:ring-1 focus:ring-accent"
                            title={t('settings.priceDisplayCurrencyModeDesc')}
                          >
                            <option value="USD">USD</option>
                            <option value="CNY">CNY</option>
                          </UiSelect>
                        </div>
                        {localPriceDisplayCurrencyMode.toUpperCase() === 'CNY' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text-dark">{t('settings.usdToCnyRate')}</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.01"
                              max="100"
                              value={localUsdToCnyRate}
                              onChange={(e) => setLocalUsdToCnyRate(e.target.value)}
                              className="w-24 rounded border border-border-dark bg-surface-dark px-2 py-1 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                              title={t('settings.usdToCnyRateDesc')}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 模型列表 */}
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.modelList')}</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddCustomModel}
                          className="inline-flex items-center gap-1 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/80"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t('settings.addCustomModel')}
                        </button>
                      </div>
                    </div>

                    {/* 统一的默认模型 API Key 输入区域 */}
                    <div className="mb-4 rounded border border-border-dark bg-surface-dark p-4">
                      <h4 className="text-sm font-medium text-text-dark mb-2">{t('settings.defaultModelApiKey') || '默认模型 API Key'}</h4>
                      <p className="text-xs text-text-muted mb-3">
                        {t('settings.defaultModelApiKeyDesc') || '为所有默认模型设置统一的 API Key'}
                      </p>
                      <div className="relative">
                        <input
                          type={revealedApiKeys['default'] ? 'text' : 'password'}
                          value={localApiKeys['custom'] || ''}
                          onChange={(e) => setLocalApiKeys((prev) => ({ ...prev, custom: e.target.value }))}
                          className="w-full rounded border border-border-dark bg-bg-dark px-3 py-2 pr-10 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                          placeholder={t('settings.modelApiKeyPlaceholder') || '请输入 API Key'}
                        />
                        <button
                          type="button"
                          onClick={() => setRevealedApiKeys((prev) => ({ ...prev, default: !prev['default'] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition-colors"
                        >
                          {revealedApiKeys['default'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 模型分组显示 */}
                    <div className="space-y-4">
                      {/* 默认模型 */}
                      <div>
                        <h4 className="text-xs font-medium text-text-muted mb-2">{t('settings.defaultModels') || '默认模型'}</h4>
                        <div className="space-y-3">
                          {allModels.filter(m => m.isDefault).map((model) => (
                            <ModelConfigItem
                              key={model.id}
                              model={model}
                              index={localCustomModels.findIndex((m) => m.id === model.id)}
                              isDefault={model.isDefault}
                              revealedApiKeys={revealedApiKeys}
                              onUpdate={handleUpdateDefaultModel}
                              onToggle={handleToggleDefaultModel}
                              onDelete={undefined}
                              onToggleReveal={(id, revealed) => setRevealedApiKeys((prev) => ({ ...prev, [id]: revealed }))}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>

                      {/* 自定义模型 */}
                      <div>
                        <h4 className="text-xs font-medium text-text-muted mb-2">{t('settings.customModels') || '自定义模型'}</h4>
                        <div className="space-y-3">
                          {allModels.filter(m => !m.isDefault).map((model) => (
                            <ModelConfigItem
                              key={model.id}
                              model={model}
                              index={localCustomModels.findIndex((m) => m.id === model.id)}
                              isDefault={model.isDefault}
                              revealedApiKeys={revealedApiKeys}
                              onUpdate={handleUpdateCustomModel}
                              onToggle={handleToggleCustomModel}
                              onDelete={handleDeleteCustomModel}
                              onToggleReveal={(id, revealed) => setRevealedApiKeys((prev) => ({ ...prev, [id]: revealed }))}
                              t={t}
                            />
                          ))}
                          {allModels.filter(m => !m.isDefault).length === 0 && (
                            <div className="py-3 text-center text-sm text-text-muted">
                              {t('settings.noCustomModels') || '暂无自定义模型'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-dark flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </>
            )}

            {activeCategory === 'general' && (
              <>
                <div className="px-6 py-5 border-b border-border-dark">
                  <h2 className="text-lg font-semibold text-text-dark">
                    {t('settings.general')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('settings.generalDesc')}
                  </p>
                </div>

                <div className="ui-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localUseUploadFilenameAsNodeTitle}
                        onCheckedChange={setLocalUseUploadFilenameAsNodeTitle}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.useUploadFilenameAsNodeTitle')}</div>
                        <div className="text-xs text-text-muted">{t('settings.useUploadFilenameAsNodeTitleDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-text-dark">{t('settings.downloadPath')}</h3>
                      <p className="text-xs text-text-muted">{t('settings.downloadPathDesc')}</p>
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      <input
                        value={localDownloadPathInput}
                        onChange={(event) => setLocalDownloadPathInput(event.target.value)}
                        placeholder={t('settings.downloadPathPlaceholder')}
                        className="h-9 flex-1 rounded border border-border-dark bg-surface-dark px-3 text-sm text-text-dark outline-none placeholder:text-text-muted"
                      />
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded border border-border-dark bg-surface-dark px-3 text-xs text-text-dark transition-colors hover:bg-bg-dark"
                        onClick={handleAddDownloadPathFromInput}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t('settings.addPath')}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded border border-border-dark bg-surface-dark px-3 text-xs text-text-dark transition-colors hover:bg-bg-dark"
                        onClick={() => {
                          void handlePickDownloadPath();
                        }}
                      >
                        <FolderOpen className="mr-1 h-3.5 w-3.5" />
                        {t('settings.chooseFolder')}
                      </button>
                    </div>

                    <div className="space-y-1">
                      {localDownloadPresetPaths.length > 0 ? (
                        localDownloadPresetPaths.map((path) => (
                          <div
                            key={path}
                            className="flex items-center gap-2 rounded border border-border-dark bg-surface-dark px-2 py-1.5"
                          >
                            <span className="truncate text-xs text-text-dark">{path}</span>
                            <button
                              type="button"
                              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-dark hover:text-text-dark"
                              onClick={() => handleRemoveDownloadPath(path)}
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-text-muted">{t('settings.noDownloadPresetPaths')}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-dark flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </>
            )}

            {activeCategory === 'experimental' && (
              <>
                <div className="px-6 py-5 border-b border-border-dark">
                  <h2 className="text-lg font-semibold text-text-dark">
                    {t('settings.experimental')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('settings.experimentalDesc')}
                  </p>
                </div>

                <div className="ui-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localEnableStoryboardGenGridPreviewShortcut}
                        onCheckedChange={setLocalEnableStoryboardGenGridPreviewShortcut}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.enableStoryboardGenGridPreviewShortcut')}</div>
                        <div className="text-xs text-text-muted">{t('settings.enableStoryboardGenGridPreviewShortcutDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localShowStoryboardGenAdvancedRatioControls}
                        onCheckedChange={setLocalShowStoryboardGenAdvancedRatioControls}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.showStoryboardGenAdvancedRatioControls')}</div>
                        <div className="text-xs text-text-muted">{t('settings.showStoryboardGenAdvancedRatioControlsDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localShowImageResolutionWatermark}
                        onCheckedChange={(checked: boolean) => setLocalShowImageResolutionWatermark(checked)}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.showImageResolutionWatermark')}</div>
                        <div className="text-xs text-text-muted">{t('settings.showImageResolutionWatermarkDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localStoryboardGenKeepStyleConsistent}
                        onCheckedChange={setLocalStoryboardGenKeepStyleConsistent}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.storyboardGenKeepStyleConsistent')}</div>
                        <div className="text-xs text-text-muted">{t('settings.storyboardGenKeepStyleConsistentDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localStoryboardGenDisableTextInImage}
                        onCheckedChange={setLocalStoryboardGenDisableTextInImage}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.storyboardGenDisableTextInImage')}</div>
                        <div className="text-xs text-text-muted">{t('settings.storyboardGenDisableTextInImageDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localStoryboardGenAutoInferEmptyFrame}
                        onCheckedChange={setLocalStoryboardGenAutoInferEmptyFrame}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.storyboardGenAutoInferEmptyFrame')}</div>
                        <div className="text-xs text-text-muted">{t('settings.storyboardGenAutoInferEmptyFrameDesc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-center gap-3">
                      <UiCheckbox
                        checked={localIgnoreAtTagWhenCopyingAndGenerating}
                        onCheckedChange={setLocalIgnoreAtTagWhenCopyingAndGenerating}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-dark">{t('settings.ignoreAtTagWhenCopyingAndGenerating')}</div>
                        <div className="text-xs text-text-muted">{t('settings.ignoreAtTagWhenCopyingAndGeneratingDesc')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-dark flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </>
            )}

            {activeCategory === 'textOptimizer' && (
              <>
                <div className="px-6 py-5 border-b border-border-dark">
                  <h2 className="text-lg font-semibold text-text-dark">
                    {t('settings.textOptimizer')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('settings.textOptimizerDesc')}
                  </p>
                </div>

                <div className="ui-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1.5">
                        {t('settings.textOptimizerModelUrl')}
                      </label>
                      <input
                        type="url"
                        value={localTextOptimizerModelUrl}
                        onChange={(e) => setLocalTextOptimizerModelUrl(e.target.value)}
                        className="w-full rounded border border-border-dark bg-surface-dark px-3 py-2 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="https://api.openai.com/v1"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        {t('settings.textOptimizerModelUrlDesc')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1.5">
                        {t('settings.textOptimizerApiKey')}
                      </label>
                      <div className="relative">
                        <input
                          type={revealedTextOptimizerApiKey ? 'text' : 'password'}
                          value={localTextOptimizerApiKey}
                          onChange={(e) => setLocalTextOptimizerApiKey(e.target.value)}
                          className="w-full rounded border border-border-dark bg-surface-dark px-3 py-2 pr-10 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                          placeholder={t('settings.textOptimizerApiKeyPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setRevealedTextOptimizerApiKey(!revealedTextOptimizerApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition-colors"
                        >
                          {revealedTextOptimizerApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1.5">
                        {t('settings.textOptimizerModelName')}
                      </label>
                      <input
                        type="text"
                        value={localTextOptimizerModelName}
                        onChange={(e) => setLocalTextOptimizerModelName(e.target.value)}
                        className="w-full rounded border border-border-dark bg-surface-dark px-3 py-2 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="gpt-4o-mini"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        {t('settings.textOptimizerModelNameDesc')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1.5">
                        {t('settings.textOptimizerSystemPrompt')}
                      </label>
                      <textarea
                        value={localTextOptimizerSystemPrompt}
                        onChange={(e) => setLocalTextOptimizerSystemPrompt(e.target.value)}
                        rows={12}
                        className="w-full rounded border border-border-dark bg-surface-dark px-3 py-2 text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                        placeholder={t('settings.textOptimizerSystemPromptPlaceholder')}
                      />
                      <p className="text-xs text-text-muted mt-1">
                        {t('settings.textOptimizerSystemPromptDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setTextOptimizerModelUrl(localTextOptimizerModelUrl);
                        setTextOptimizerApiKey(localTextOptimizerApiKey);
                        setTextOptimizerModelName(localTextOptimizerModelName);
                        setTextOptimizerSystemPrompt(localTextOptimizerSystemPrompt);
                      }}
                      className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeCategory === 'about' && (
              <>
                <div className="px-6 py-5 border-b border-border-dark">
                  <h2 className="text-lg font-semibold text-text-dark">
                    {t('settings.about')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('settings.aboutDesc')}
                  </p>
                </div>

                <div className="ui-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src="/app-icon.png"
                        alt={t('settings.aboutAppName')}
                        className="h-14 w-14 rounded-lg border border-border-dark object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-text-dark">
                          {t('settings.aboutAppName')}
                        </div>
                        <p className="mt-1 text-sm text-text-muted">
                          {t('settings.aboutIntro')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-dark bg-bg-dark p-4 space-y-2 text-sm">
                    <p className="text-text-dark">
                      {t('settings.aboutVersionLabel')}: <span className="text-text-muted">{appVersion || t('settings.aboutVersionUnknown')}</span>
                    </p>
                    <p className="text-text-dark">
                      {t('settings.aboutAuthorLabel')}:{' '}
                      <span className="text-text-muted">
                        {t('settings.aboutAuthor')}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-dark flex justify-end">
                  <button
                    onClick={onClose}
                    className="rounded border border-border-dark px-4 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-bg-dark"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
