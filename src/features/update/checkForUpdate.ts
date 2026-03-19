const VERSION_SUPPRESSION_STORAGE_KEY = 'infinite-canvas:update-check:version-suppressions';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
  error?: 'network' | 'unknown';
}
type VersionSuppressionMode = 'today' | 'forever';

interface VersionSuppressionRecord {
  mode: VersionSuppressionMode;
  dayKey?: string;
}

type VersionSuppressionMap = Record<string, VersionSuppressionRecord>;

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '');
}

function getLocalDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readVersionSuppressions(): VersionSuppressionMap {
  try {
    const raw = localStorage.getItem(VERSION_SUPPRESSION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.entries(parsed as Record<string, unknown>).reduce<VersionSuppressionMap>(
      (acc, [version, value]) => {
        if (!version || typeof value !== 'object' || value === null) {
          return acc;
        }
        const mode = (value as { mode?: unknown }).mode;
        if (mode !== 'today' && mode !== 'forever') {
          return acc;
        }
        const dayKey = (value as { dayKey?: unknown }).dayKey;
        acc[version] = {
          mode,
          dayKey: typeof dayKey === 'string' ? dayKey : undefined,
        };
        return acc;
      },
      {}
    );
  } catch {
    return {};
  }
}

function writeVersionSuppressions(map: VersionSuppressionMap): void {
  try {
    localStorage.setItem(VERSION_SUPPRESSION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage failures
  }
}

export function suppressUpdateVersion(version: string, mode: VersionSuppressionMode): void {
  const normalized = normalizeVersion(version);
  if (!normalized) {
    return;
  }

  const map = readVersionSuppressions();
  map[normalized] =
    mode === 'today'
      ? {
          mode: 'today',
          dayKey: getLocalDateKey(new Date()),
        }
      : { mode: 'forever' };

  writeVersionSuppressions(map);
}

export function isUpdateVersionSuppressed(version: string): boolean {
  const normalized = normalizeVersion(version);
  if (!normalized) {
    return false;
  }

  const map = readVersionSuppressions();
  const record = map[normalized];
  if (!record) {
    return false;
  }

  if (record.mode === 'forever') {
    return true;
  }

  const today = getLocalDateKey(new Date());
  return record.dayKey === today;
}



export async function checkForUpdate(): Promise<UpdateCheckResult> {
  // 移除更新检测，直接返回无更新
  return { hasUpdate: false };
}
