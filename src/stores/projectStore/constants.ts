import type { Viewport } from '@xyflow/react';

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const IMAGE_REF_PREFIX = '__img_ref__:';

export const UPSERT_DEBOUNCE_MS = 260;
export const VIEWPORT_UPSERT_DEBOUNCE_MS = 280;
export const VIEWPORT_EPSILON = 0.001;
export const IDLE_PERSIST_TIMEOUT_MS = 1200;
export const FALLBACK_IDLE_DELAY_MS = 64;
export const MAX_PERSISTED_HISTORY_STEPS = 12;
export const MAX_HISTORY_RESTORE_JSON_CHARS = 1_500_000;
export const DELETE_RETRY_DELAY_MS = 80;
export const MAX_DELETE_RETRIES = 10;
