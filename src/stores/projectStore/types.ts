import type { Viewport } from '@xyflow/react';
import type { CanvasEdge, CanvasHistoryState, CanvasNode } from '../canvasStore';

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
}

export interface Project extends ProjectSummary {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;
  history: CanvasHistoryState;
}

export type PersistedProject = Project & {
  imagePool?: string[];
};

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

export interface ProjectSummaryRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
}

export interface PersistProjectOptions {
  immediate?: boolean;
  debounceMs?: number;
}

export interface PersistViewportOptions {
  immediate?: boolean;
  debounceMs?: number;
}

export interface FlushProjectUpsertOptions {
  bypassIdle?: boolean;
}

export interface ProjectState {
  projects: ProjectSummary[];
  currentProjectId: string | null;
  currentProject: Project | null;
  isHydrated: boolean;
  isOpeningProject: boolean;

  hydrate: () => Promise<void>;
  createProject: (name: string) => string;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  openProject: (id: string) => void;
  closeProject: () => void;
  getCurrentProject: () => Project | null;
  saveCurrentProject: (
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    viewport?: Viewport,
    history?: CanvasHistoryState
  ) => void;
  saveCurrentProjectViewport: (viewport: Viewport) => void;
  cancelPendingViewportPersist: () => void;
}
