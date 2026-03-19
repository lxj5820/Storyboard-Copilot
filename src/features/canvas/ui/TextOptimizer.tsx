import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { optimizeText, type TextOptimizationResponse } from '../infrastructure/textOptimizerGateway';
import { useSettingsStore } from '@/stores/settingsStore';

interface TextOptimizerProps {
  inputText: string;
  onOptimizedText: (text: string) => void;
  disabled?: boolean;
}

export function TextOptimizer({ inputText, onOptimizedText, disabled = false }: TextOptimizerProps) {
  const { t } = useTranslation();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TextOptimizationResponse | null>(null);

  const { textOptimizerModelUrl, textOptimizerApiKey, textOptimizerModelName } = useSettingsStore();

  const isConfigured = textOptimizerModelUrl && textOptimizerApiKey && textOptimizerModelName;

  const handleOptimize = useCallback(async () => {
    if (!inputText.trim()) {
      setError(t('textOptimizer.emptyInput'));
      return;
    }

    if (!isConfigured) {
      setError(t('textOptimizer.notConfigured'));
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizeText(inputText);
      setLastResult(result);
      if (result.finalPrompt) {
        onOptimizedText(result.finalPrompt);
      } else {
        setError(t('textOptimizer.noResult'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('textOptimizer.unknownError');
      setError(errorMessage);
    } finally {
      setIsOptimizing(false);
    }
  }, [inputText, isConfigured, onOptimizedText, t]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOptimize}
          disabled={disabled || isOptimizing || !isConfigured || !inputText.trim()}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors
            ${disabled || isOptimizing || !isConfigured || !inputText.trim()
              ? 'bg-surface-dark text-text-muted cursor-not-allowed'
              : 'bg-accent/10 text-accent hover:bg-accent/20'}
          `}
          title={!isConfigured ? t('textOptimizer.notConfigured') : ''}
        >
          {isOptimizing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isOptimizing ? t('textOptimizer.optimizing') : t('textOptimizer.optimize')}</span>
        </button>

        {isConfigured && inputText.trim() && !error && lastResult && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {lastResult && !error && (
        <div className="text-xs text-text-muted space-y-1">
          {lastResult.reasoning && (
            <div>
              <span className="font-medium">{t('textOptimizer.reasoning')}:</span>{' '}
              <span className="text-text-muted">{lastResult.reasoning}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
