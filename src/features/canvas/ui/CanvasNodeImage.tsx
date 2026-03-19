import { memo, useCallback, useState, useEffect, type ImgHTMLAttributes, type MouseEvent } from 'react';

import { useCanvasStore } from '@/stores/canvasStore';
import { useSettingsStore } from '@/stores/settingsStore';

export interface CanvasNodeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  viewerSourceUrl?: string | null;
  viewerImageList?: Array<string | null | undefined>;
  disableViewer?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  resolution?: string;
  aspectRatio?: string;
}

function normalizeViewerList(
  imageList: Array<string | null | undefined> | undefined,
  currentImageUrl: string
): string[] {
  const deduped: string[] = [];
  for (const rawItem of imageList ?? []) {
    const item = typeof rawItem === 'string' ? rawItem.trim() : '';
    if (!item || deduped.includes(item)) {
      continue;
    }
    deduped.push(item);
  }

  if (!deduped.includes(currentImageUrl)) {
    deduped.unshift(currentImageUrl);
  }

  return deduped.length > 0 ? deduped : [currentImageUrl];
}

function resolveSizeToPixels(size: string): number {
  const sizeMap: Record<string, number> = {
    '0.5K': 512,
    '1K': 1024,
    '2K': 2048,
    '4K': 4096,
  };
  return sizeMap[size] ?? 1024;
}

function calculateDimensions(size: string, aspectRatio: string): { width: number; height: number } {
  const maxPixels = resolveSizeToPixels(size);
  const [ratioW = '1', ratioH = '1'] = aspectRatio.split(':');
  const ratioWNum = parseFloat(ratioW);
  const ratioHNum = parseFloat(ratioH);

  let width: number;
  let height: number;

  if (ratioWNum >= ratioHNum) {
    width = maxPixels;
    height = Math.round((maxPixels * ratioHNum) / ratioWNum);
  } else {
    height = maxPixels;
    width = Math.round((maxPixels * ratioWNum) / ratioHNum);
  }

  return { width, height };
}

const ResolutionWatermark = memo(({ width, height }: { width: number; height: number }) => {
  return (
    <span
      className="absolute top-1 right-1 z-10 rounded px-1.5 py-0.5 text-[14px] leading-none font-normal text-white/80 shadow-sm"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      }}
    >
      {width}×{height}
    </span>
  );
});

ResolutionWatermark.displayName = 'ResolutionWatermark';

export const CanvasNodeImage = memo(({
  viewerSourceUrl,
  viewerImageList,
  disableViewer = false,
  onDoubleClick,
  src,
  imageWidth,
  imageHeight,
  resolution,
  aspectRatio,
  ...props
}: CanvasNodeImageProps) => {
  const openImageViewer = useCanvasStore((state) => state.openImageViewer);
  const showImageResolutionWatermark = useSettingsStore((state) => state.showImageResolutionWatermark);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!showImageResolutionWatermark || !src) {
      setNaturalDimensions(null);
      return;
    }

    if (resolution && aspectRatio) {
      const dims = calculateDimensions(resolution, aspectRatio);
      setNaturalDimensions(dims);
      return;
    }

    if (imageWidth && imageHeight) {
      setNaturalDimensions({ width: imageWidth, height: imageHeight });
      return;
    }

    const img = new Image();
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setNaturalDimensions(null);
    };
    img.src = src;
  }, [showImageResolutionWatermark, src, imageWidth, imageHeight, resolution, aspectRatio]);

  const handleDoubleClick = useCallback((event: MouseEvent<HTMLImageElement>) => {
    onDoubleClick?.(event);

    if (event.defaultPrevented || disableViewer) {
      return;
    }

    const fallbackSrc = event.currentTarget.currentSrc || (typeof src === 'string' ? src : '');
    const resolvedSource =
      typeof viewerSourceUrl === 'string' && viewerSourceUrl.trim().length > 0
        ? viewerSourceUrl.trim()
        : fallbackSrc.trim();
    if (!resolvedSource) {
      return;
    }

    event.stopPropagation();
    openImageViewer(resolvedSource, normalizeViewerList(viewerImageList, resolvedSource));
  }, [disableViewer, onDoubleClick, openImageViewer, src, viewerImageList, viewerSourceUrl]);

  const showWatermark = showImageResolutionWatermark && naturalDimensions;

  return (
    <div className="relative inline-block w-full h-full overflow-hidden">
      <img
        {...props}
        src={src}
        data-viewer-src={
          typeof viewerSourceUrl === 'string' && viewerSourceUrl.trim().length > 0
            ? viewerSourceUrl.trim()
            : undefined
        }
        onDoubleClick={handleDoubleClick}
      />
      {showWatermark && (
        <ResolutionWatermark
          width={naturalDimensions.width}
          height={naturalDimensions.height}
        />
      )}
    </div>
  );
});

CanvasNodeImage.displayName = 'CanvasNodeImage';
