import type { Viewport } from '@xyflow/react';
import type { CanvasEdge, CanvasHistoryState, CanvasNode, CanvasNodeData } from '../canvasStore';
import type { Project, PersistedProject, ProjectRecord, ProjectSummary, ProjectSummaryRecord } from './types';
import { IMAGE_REF_PREFIX, MAX_PERSISTED_HISTORY_STEPS, MAX_HISTORY_RESTORE_JSON_CHARS, VIEWPORT_EPSILON } from './constants';

export function createEmptyHistory(): CanvasHistoryState {
  return {
    past: [],
    future: [],
  };
}

export function encodeImageReference(
  imageUrl: string | null | undefined,
  imagePool: string[],
  imageIndexMap: Map<string, number>
): string | null | undefined {
  if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
    return imageUrl;
  }

  const existingIndex = imageIndexMap.get(imageUrl);
  if (typeof existingIndex === 'number') {
    return `${IMAGE_REF_PREFIX}${existingIndex}`;
  }

  const nextIndex = imagePool.length;
  imagePool.push(imageUrl);
  imageIndexMap.set(imageUrl, nextIndex);
  return `${IMAGE_REF_PREFIX}${nextIndex}`;
}

export function decodeImageReference(
  imageUrl: string | null | undefined,
  imagePool: string[] | undefined
): string | null | undefined {
  if (typeof imageUrl !== 'string' || !imagePool || !imageUrl.startsWith(IMAGE_REF_PREFIX)) {
    return imageUrl;
  }

  const index = Number.parseInt(imageUrl.slice(IMAGE_REF_PREFIX.length), 10);
  if (!Number.isFinite(index) || index < 0) {
    return imageUrl;
  }

  return imagePool[index] ?? null;
}

export function mapNodeImageReferences(
  nodes: CanvasNode[],
  mapImageUrl: (imageUrl: string | null | undefined) => string | null | undefined
): CanvasNode[] {
  return nodes.map((node) => {
    const nodeData = node.data as Record<string, unknown>;
    const nextData: Record<string, unknown> = { ...nodeData };

    if ('imageUrl' in nextData) {
      nextData.imageUrl = mapImageUrl(nextData.imageUrl as string | null | undefined) ?? null;
    }
    if ('previewImageUrl' in nextData) {
      nextData.previewImageUrl =
        mapImageUrl(nextData.previewImageUrl as string | null | undefined) ?? null;
    }

    if (Array.isArray(nextData.frames)) {
      nextData.frames = nextData.frames.map((frame) => {
        if (!frame || typeof frame !== 'object') {
          return frame;
        }

        const frameRecord = frame as Record<string, unknown>;
        if (!('imageUrl' in frameRecord)) {
          return frame;
        }

        return {
          ...frameRecord,
          imageUrl: mapImageUrl(frameRecord.imageUrl as string | null | undefined) ?? null,
          previewImageUrl:
            mapImageUrl(frameRecord.previewImageUrl as string | null | undefined) ?? null,
        };
      });
    }

    return {
      ...node,
      data: nextData as CanvasNodeData,
    };
  });
}

export function mapHistoryImageReferences(
  history: CanvasHistoryState,
  mapImageUrl: (imageUrl: string | null | undefined) => string | null | undefined
): CanvasHistoryState {
  return {
    past: history.past.map((snapshot) => ({
      ...snapshot,
      nodes: mapNodeImageReferences(snapshot.nodes, mapImageUrl),
    })),
    future: history.future.map((snapshot) => ({
      ...snapshot,
      nodes: mapNodeImageReferences(snapshot.nodes, mapImageUrl),
    })),
  };
}

export function trimHistoryForPersistence(history: CanvasHistoryState): CanvasHistoryState {
  return {
    past: history.past.slice(-MAX_PERSISTED_HISTORY_STEPS),
    future: history.future.slice(-MAX_PERSISTED_HISTORY_STEPS),
  };
}

export function encodeProject(project: Project): PersistedProject {
  const imagePool: string[] = [];
  const imageIndexMap = new Map<string, number>();
  const encode = (imageUrl: string | null | undefined) =>
    encodeImageReference(imageUrl, imagePool, imageIndexMap);

  return {
    ...project,
    nodes: mapNodeImageReferences(project.nodes, encode),
    history: mapHistoryImageReferences(project.history, encode),
    imagePool,
  };
}

export function decodeProject(project: PersistedProject): Project {
  const decode = (imageUrl: string | null | undefined) =>
    decodeImageReference(imageUrl, project.imagePool);

  return {
    ...project,
    nodes: mapNodeImageReferences(project.nodes, decode),
    history: mapHistoryImageReferences(project.history, decode),
  };
}

export function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function extractImagePoolFromHistoryJson(historyJson: string): string[] {
  const imagePoolKey = '"imagePool"';
  const keyIndex = historyJson.indexOf(imagePoolKey);
  if (keyIndex < 0) {
    return [];
  }

  const arrayStart = historyJson.indexOf('[', keyIndex + imagePoolKey.length);
  if (arrayStart < 0) {
    return [];
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let arrayEnd = -1;

  for (let index = arrayStart; index < historyJson.length; index += 1) {
    const char = historyJson[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = index;
        break;
      }
    }
  }

  if (arrayEnd < 0) {
    return [];
  }

  const rawArrayJson = historyJson.slice(arrayStart, arrayEnd + 1);
  const parsed = safeParseJson<unknown>(rawArrayJson, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item): item is string => typeof item === 'string');
}

export function toProjectSummary(record: ProjectSummaryRecord): ProjectSummary {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    nodeCount: record.nodeCount,
  };
}

export function toProjectRecord(project: Project): ProjectRecord {
  const encodedProject = encodeProject(project);
  const persistedNodes = encodedProject.nodes;
  const persistedHistory = trimHistoryForPersistence(encodedProject.history);

  return {
    id: encodedProject.id,
    name: encodedProject.name,
    createdAt: encodedProject.createdAt,
    updatedAt: encodedProject.updatedAt,
    nodeCount: encodedProject.nodeCount,
    nodesJson: JSON.stringify(persistedNodes),
    edgesJson: JSON.stringify(encodedProject.edges),
    viewportJson: JSON.stringify(encodedProject.viewport),
    historyJson: JSON.stringify({
      ...persistedHistory,
      imagePool: encodedProject.imagePool ?? [],
    }),
  };
}

export function fromProjectRecord(record: ProjectRecord): Project {
  const parsedNodes = safeParseJson<CanvasNode[]>(record.nodesJson, []);
  const parsedEdges = safeParseJson<CanvasEdge[]>(record.edgesJson, []);
  const parsedViewport = safeParseJson<Viewport>(record.viewportJson, { x: 0, y: 0, zoom: 1 });
  const shouldRestoreHistory = record.historyJson.length <= MAX_HISTORY_RESTORE_JSON_CHARS;
  const extractedImagePool = extractImagePoolFromHistoryJson(record.historyJson);
  const parsedHistoryPayload = shouldRestoreHistory
    ? safeParseJson<{
        past?: CanvasHistoryState['past'];
        future?: CanvasHistoryState['future'];
        imagePool?: string[];
      }>(record.historyJson, {})
    : {};

  if (!shouldRestoreHistory) {
    console.warn(
      `Skip restoring oversized history payload (${record.historyJson.length} chars) for project ${record.id}`
    );
  }

  const parsedHistory = {
    past: parsedHistoryPayload.past ?? [],
    future: parsedHistoryPayload.future ?? [],
  };

  const persistedProject: PersistedProject = {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    nodeCount: record.nodeCount,
    nodes: parsedNodes,
    edges: parsedEdges,
    viewport: parsedViewport,
    history: parsedHistory,
    imagePool: parsedHistoryPayload.imagePool ?? extractedImagePool,
  };

  const decodedProject = decodeProject(persistedProject);
  return {
    ...decodedProject,
    nodeCount: parsedNodes.length,
    viewport: decodedProject.viewport || { x: 0, y: 0, zoom: 1 },
    history: decodedProject.history || { past: [], future: [] },
  };
}

export function hasViewportMeaningfulDelta(current: Viewport, next: Viewport): boolean {
  return (
    Math.abs(current.x - next.x) > VIEWPORT_EPSILON ||
    Math.abs(current.y - next.y) > VIEWPORT_EPSILON ||
    Math.abs(current.zoom - next.zoom) > VIEWPORT_EPSILON
  );
}

export function normalizeViewport(viewport: Viewport): Viewport {
  return {
    x: Number(viewport.x.toFixed(2)),
    y: Number(viewport.y.toFixed(2)),
    zoom: Number(viewport.zoom.toFixed(4)),
  };
}

export function updateProjectSummary(
  summaries: ProjectSummary[],
  updated: ProjectSummary
): ProjectSummary[] {
  const next = summaries.map((summary) => (summary.id === updated.id ? updated : summary));
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  return next;
}
