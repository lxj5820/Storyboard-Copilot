import type { Viewport } from '@xyflow/react';
import type { Project, PersistProjectOptions, PersistViewportOptions, FlushProjectUpsertOptions } from './types';
import { 
  UPSERT_DEBOUNCE_MS, 
  VIEWPORT_UPSERT_DEBOUNCE_MS, 
  IDLE_PERSIST_TIMEOUT_MS, 
  FALLBACK_IDLE_DELAY_MS, 
  DELETE_RETRY_DELAY_MS, 
  MAX_DELETE_RETRIES 
} from './constants';
import { toProjectRecord } from './utils';
import { upsertProjectRecord, updateProjectViewportRecord, deleteProjectRecord } from '@/commands/projectState';

// 全局状态管理对象
export const queuedProjectUpserts = new Map<string, Project>();
export const projectUpsertTimers = new Map<string, ReturnType<typeof setTimeout>>();
export const projectUpsertsInFlight = new Set<string>();
export const queuedViewportUpserts = new Map<string, string>();
export const viewportUpsertTimers = new Map<string, ReturnType<typeof setTimeout>>();
export const viewportUpsertsInFlight = new Set<string>();
export const deletingProjectIds = new Set<string>();
export const idleCallbacks = new Map<string, ReturnType<typeof requestIdleCallback>>();

export function scheduleIdlePersist(task: () => void, id?: string): void {
  const idleHost = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof idleHost.requestIdleCallback === 'function') {
    const callbackId = idleHost.requestIdleCallback(() => {
      if (id) {
        idleCallbacks.delete(id);
      }
      task();
    }, { timeout: IDLE_PERSIST_TIMEOUT_MS });
    
    if (id) {
      // 清理之前的回调
      const previousId = idleCallbacks.get(id);
      if (previousId && typeof idleHost.cancelIdleCallback === 'function') {
        idleHost.cancelIdleCallback(previousId);
      }
      idleCallbacks.set(id, callbackId);
    }
    return;
  }

  setTimeout(task, FALLBACK_IDLE_DELAY_MS);
}

export function clearQueuedProjectUpsert(projectId: string): void {
  const timer = projectUpsertTimers.get(projectId);
  if (timer) {
    clearTimeout(timer);
    projectUpsertTimers.delete(projectId);
  }
  
  // 清理idle回调
  const idleHost = globalThis as typeof globalThis & {
    cancelIdleCallback?: (id: number) => void;
  };
  const callbackId = idleCallbacks.get(projectId);
  if (callbackId && typeof idleHost.cancelIdleCallback === 'function') {
    idleHost.cancelIdleCallback(callbackId);
    idleCallbacks.delete(projectId);
  }
  
  queuedProjectUpserts.delete(projectId);
}

export function clearQueuedViewportUpsert(projectId: string): void {
  const timer = viewportUpsertTimers.get(projectId);
  if (timer) {
    clearTimeout(timer);
    viewportUpsertTimers.delete(projectId);
  }
  queuedViewportUpserts.delete(projectId);
}

export function flushProjectUpsert(projectId: string, options?: FlushProjectUpsertOptions): void {
  if (deletingProjectIds.has(projectId) || projectUpsertsInFlight.has(projectId)) {
    return;
  }

  const project = queuedProjectUpserts.get(projectId);
  if (!project) {
    return;
  }

  queuedProjectUpserts.delete(projectId);
  projectUpsertsInFlight.add(projectId);

  const settle = () => {
    projectUpsertsInFlight.delete(projectId);

    if (deletingProjectIds.has(projectId)) {
      return;
    }

    if (queuedProjectUpserts.has(projectId)) {
      flushProjectUpsert(projectId);
    }
  };

  const executePersist = () => {
    if (deletingProjectIds.has(projectId)) {
      settle();
      return;
    }

    const record = toProjectRecord(project);
    void upsertProjectRecord(record)
      .catch((error) => {
        console.error('Failed to persist project record', error);
      })
      .finally(settle);
  };

  if (options?.bypassIdle) {
    executePersist();
    return;
  }

  scheduleIdlePersist(executePersist, projectId);
}

export function queueProjectUpsert(project: Project, options?: PersistProjectOptions): void {
  const projectId = project.id;
  deletingProjectIds.delete(projectId);
  queuedProjectUpserts.set(projectId, project);

  const existingTimer = projectUpsertTimers.get(projectId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    projectUpsertTimers.delete(projectId);
  }

  const debounceMs = options?.immediate ? 0 : (options?.debounceMs ?? UPSERT_DEBOUNCE_MS);
  if (debounceMs <= 0) {
    flushProjectUpsert(projectId, { bypassIdle: true });
    return;
  }

  const timer = setTimeout(() => {
    projectUpsertTimers.delete(projectId);
    flushProjectUpsert(projectId);
  }, debounceMs);
  projectUpsertTimers.set(projectId, timer);
}

export function persistProject(project: Project, options?: PersistProjectOptions): void {
  clearQueuedViewportUpsert(project.id);
  queueProjectUpsert(project, options);
}

export function flushViewportUpsert(projectId: string): void {
  if (deletingProjectIds.has(projectId) || viewportUpsertsInFlight.has(projectId)) {
    return;
  }

  const viewportJson = queuedViewportUpserts.get(projectId);
  if (typeof viewportJson !== 'string') {
    return;
  }

  queuedViewportUpserts.delete(projectId);
  viewportUpsertsInFlight.add(projectId);

  void updateProjectViewportRecord(projectId, viewportJson)
    .catch((error) => {
      console.error('Failed to persist project viewport', error);
    })
    .finally(() => {
      viewportUpsertsInFlight.delete(projectId);

      if (deletingProjectIds.has(projectId)) {
        return;
      }

      if (queuedViewportUpserts.has(projectId)) {
        flushViewportUpsert(projectId);
      }
    });
}

export function queueViewportUpsert(
  projectId: string,
  viewport: Viewport,
  options?: PersistViewportOptions
): void {
  deletingProjectIds.delete(projectId);
  queuedViewportUpserts.set(projectId, JSON.stringify(viewport));

  const existingTimer = viewportUpsertTimers.get(projectId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    viewportUpsertTimers.delete(projectId);
  }

  const debounceMs = options?.immediate ? 0 : (options?.debounceMs ?? VIEWPORT_UPSERT_DEBOUNCE_MS);
  if (debounceMs <= 0) {
    flushViewportUpsert(projectId);
    return;
  }

  const timer = setTimeout(() => {
    viewportUpsertTimers.delete(projectId);
    flushViewportUpsert(projectId);
  }, debounceMs);
  viewportUpsertTimers.set(projectId, timer);
}

export function persistProjectDelete(projectId: string): void {
  deletingProjectIds.add(projectId);
  clearQueuedProjectUpsert(projectId);
  clearQueuedViewportUpsert(projectId);

  const attemptDelete = (retryCount: number): void => {
    if (projectUpsertsInFlight.has(projectId) || viewportUpsertsInFlight.has(projectId)) {
      if (retryCount >= MAX_DELETE_RETRIES) {
        deletingProjectIds.delete(projectId);
        return;
      }

      setTimeout(() => {
        attemptDelete(retryCount + 1);
      }, DELETE_RETRY_DELAY_MS);
      return;
    }

    void deleteProjectRecord(projectId)
      .catch((error) => {
        console.error('Failed to delete project record', error);
      })
      .finally(() => {
        deletingProjectIds.delete(projectId);
        // 确保所有资源都被清理
        clearQueuedProjectUpsert(projectId);
        clearQueuedViewportUpsert(projectId);
      });
  };

  attemptDelete(0);
}
