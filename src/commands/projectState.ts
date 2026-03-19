import { invoke, isTauri } from '@tauri-apps/api/core';

export interface ProjectSummaryRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
  nodesJson: string;
  edgesJson: string;
  viewportJson: string;
  historyJson: string;
}

interface ErrorWithDetails extends Error {
  details?: string;
}

function normalizeInvokeError(error: unknown): { message: string; details?: string } {
  if (error instanceof Error) {
    const detailsText = 'details' in error
      ? typeof (error as { details?: unknown }).details === 'string'
        ? (error as { details?: string }).details
        : undefined
      : undefined;
    return { message: error.message || '操作失败', details: detailsText };
  }

  if (typeof error === 'string') {
    return { message: error || '操作失败', details: error || undefined };
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === 'string' && record.message ||
      typeof record.error === 'string' && record.error ||
      typeof record.msg === 'string' && record.msg ||
      '操作失败';
    let details: string | undefined;
    try {
      details = JSON.stringify(record, null, 2);
    } catch {
      details = String(record);
    }
    return { message, details };
  }

  return { message: '操作失败' };
}



export async function listProjectSummaries(): Promise<ProjectSummaryRecord[]> {
  try {
    if (!isTauri()) {
      throw new Error('当前不是 Tauri 容器环境，请使用 `npm run tauri dev` 启动');
    }
    return await invoke<ProjectSummaryRecord[]>('list_project_summaries');
  } catch (error) {
    console.error('[ProjectState] listProjectSummaries failed', error);
    const normalizedError = normalizeInvokeError(error);
    const commandError: ErrorWithDetails = new Error(normalizedError.message);
    commandError.details = normalizedError.details;
    throw commandError;
  }
}

export async function getProjectRecord(projectId: string): Promise<ProjectRecord | null> {
  try {
    if (!isTauri()) {
      throw new Error('当前不是 Tauri 容器环境，请使用 `npm run tauri dev` 启动');
    }
    return await invoke<ProjectRecord | null>('get_project_record', { projectId });
  } catch (error) {
    console.error('[ProjectState] getProjectRecord failed', { projectId, error });
    const normalizedError = normalizeInvokeError(error);
    const commandError: ErrorWithDetails = new Error(normalizedError.message);
    commandError.details = normalizedError.details;
    throw commandError;
  }
}

export async function upsertProjectRecord(record: ProjectRecord): Promise<void> {
  try {
    if (!isTauri()) {
      throw new Error('当前不是 Tauri 容器环境，请使用 `npm run tauri dev` 启动');
    }
    await invoke('upsert_project_record', { record });
  } catch (error) {
    console.error('[ProjectState] upsertProjectRecord failed', { projectId: record.id, error });
    const normalizedError = normalizeInvokeError(error);
    const commandError: ErrorWithDetails = new Error(normalizedError.message);
    commandError.details = normalizedError.details;
    throw commandError;
  }
}

export async function updateProjectViewportRecord(
  projectId: string,
  viewportJson: string
): Promise<void> {
  try {
    if (!isTauri()) {
      throw new Error('当前不是 Tauri 容器环境，请使用 `npm run tauri dev` 启动');
    }
    await invoke('update_project_viewport_record', { projectId, viewportJson });
  } catch (error) {
    console.error('[ProjectState] updateProjectViewportRecord failed', { projectId, error });
    const normalizedError = normalizeInvokeError(error);
    const commandError: ErrorWithDetails = new Error(normalizedError.message);
    commandError.details = normalizedError.details;
    throw commandError;
  }
}

export async function renameProjectRecord(
  projectId: string,
  name: string,
  updatedAt: number
): Promise<void> {
  try {
    if (!isTauri()) {
      throw new Error('当前不是 Tauri 容器环境，请使用 `npm run tauri dev` 启动');
    }
    await invoke('rename_project_record', { projectId, name, updatedAt });
  } catch (error) {
    console.error('[ProjectState] renameProjectRecord failed', { projectId, name, error });
    const normalizedError = normalizeInvokeError(error);
    const commandError: ErrorWithDetails = new Error(normalizedError.message);
    commandError.details = normalizedError.details;
    throw commandError;
  }
}

export async function deleteProjectRecord(projectId: string): Promise<void> {
  try {
    if (!isTauri()) {
      throw new Error('当前不是 Tauri 容器环境，请使用 `npm run tauri dev` 启动');
    }
    await invoke('delete_project_record', { projectId });
  } catch (error) {
    console.error('[ProjectState] deleteProjectRecord failed', { projectId, error });
    const normalizedError = normalizeInvokeError(error);
    const commandError: ErrorWithDetails = new Error(normalizedError.message);
    commandError.details = normalizedError.details;
    throw commandError;
  }
}
