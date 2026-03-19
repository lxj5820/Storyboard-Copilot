import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useCanvasStore } from '../canvasStore';
import { getProjectRecord, listProjectSummaries, renameProjectRecord } from '@/commands/projectState';

// 导入类型
export * from './types';

// 导入常量
import { DEFAULT_VIEWPORT } from './constants';

// 导入工具函数
import { createEmptyHistory, fromProjectRecord, updateProjectSummary } from './utils';

// 导入持久化函数
import { 
  persistProject, 
  queueViewportUpsert, 
  clearQueuedViewportUpsert, 
  persistProjectDelete 
} from './persistence';

// 导入类型
import type { Project, ProjectState, ProjectSummary } from './types';

let openProjectRequestSeq = 0;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  currentProject: null,
  isHydrated: false,
  isOpeningProject: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    try {
      const records = await listProjectSummaries();
      const projects = records.map((record) => ({
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        nodeCount: record.nodeCount,
      })).sort((a, b) => b.updatedAt - a.updatedAt);
      set({
        projects,
        currentProjectId: null,
        currentProject: null,
        isHydrated: true,
      });
    } catch (error) {
      console.error('Failed to hydrate project summaries from SQLite', error);
      set({
        projects: [],
        currentProjectId: null,
        currentProject: null,
        isHydrated: true,
      });
    }
  },

  createProject: (name) => {
    const id = uuidv4();
    const now = Date.now();
    const project: Project = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      nodeCount: 0,
      nodes: [],
      edges: [],
      viewport: DEFAULT_VIEWPORT,
      history: createEmptyHistory(),
    };

    set((state) => ({
      projects: [{ ...project }, ...state.projects],
      currentProjectId: id,
      currentProject: project,
      isOpeningProject: false,
    }));
    persistProject(project, { immediate: true });
    return id;
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
      isOpeningProject: false,
    }));

    persistProjectDelete(id);
  },

  renameProject: (id, name) => {
    const now = Date.now();

    set((state) => {
      const projects = state.projects.map((summary) =>
        summary.id === id
          ? {
              ...summary,
              name,
              updatedAt: now,
            }
          : summary
      );

      return {
        projects: projects.sort((a, b) => b.updatedAt - a.updatedAt),
        currentProject:
          state.currentProject?.id === id
            ? {
                ...state.currentProject,
                name,
                updatedAt: now,
              }
            : state.currentProject,
      };
    });

    const nextCurrentProject = get().currentProject?.id === id ? get().currentProject : null;
    if (nextCurrentProject) {
      persistProject(nextCurrentProject, { immediate: true });
      return;
    }

    void renameProjectRecord(id, name, now).catch((error) => {
      console.error('Failed to rename project record', error);
    });
  },

  openProject: (id) => {
    const reqSeq = ++openProjectRequestSeq;
    useCanvasStore.getState().closeImageViewer();
    set({ isOpeningProject: true });

    void (async () => {
      try {
        const record = await getProjectRecord(id);
        if (reqSeq !== openProjectRequestSeq) {
          return;
        }
        if (!record) {
          set({ isOpeningProject: false });
          return;
        }

        const project = fromProjectRecord(record);
        set((state) => ({
          currentProjectId: id,
          currentProject: project,
          isOpeningProject: false,
          projects: updateProjectSummary(state.projects, {
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            nodeCount: project.nodeCount,
          }),
        }));
      } catch (error) {
        if (reqSeq !== openProjectRequestSeq) {
          return;
        }
        console.error('Failed to open project', error);
        set({ isOpeningProject: false });
      }
    })();
  },

  closeProject: () => {
    openProjectRequestSeq += 1;
    useCanvasStore.getState().closeImageViewer();
    const { currentProjectId, currentProject } = get();
    let persistedSummary: ProjectSummary | null = null;

    if (currentProjectId && currentProject && currentProject.id === currentProjectId) {
      const canvasState = useCanvasStore.getState();
      const nextProject: Project = {
        ...currentProject,
        nodes: canvasState.nodes,
        edges: canvasState.edges,
        viewport: canvasState.currentViewport ?? currentProject.viewport ?? DEFAULT_VIEWPORT,
        history: canvasState.history ?? currentProject.history ?? createEmptyHistory(),
        nodeCount: canvasState.nodes.length,
        updatedAt: Date.now(),
      };

      persistedSummary = {
        id: nextProject.id,
        name: nextProject.name,
        createdAt: nextProject.createdAt,
        updatedAt: nextProject.updatedAt,
        nodeCount: nextProject.nodeCount,
      };
      persistProject(nextProject, { immediate: true });
    }

    set((state) => ({
      projects: persistedSummary
        ? updateProjectSummary(state.projects, persistedSummary)
        : state.projects,
      currentProjectId: null,
      currentProject: null,
      isOpeningProject: false,
    }));
  },

  getCurrentProject: () => {
    const { currentProjectId, currentProject } = get();
    if (!currentProjectId || !currentProject) {
      return null;
    }
    if (currentProject.id !== currentProjectId) {
      return null;
    }
    return currentProject;
  },

  saveCurrentProject: (nodes, edges, viewport, history) => {
    const { currentProjectId, currentProject } = get();
    if (!currentProjectId || !currentProject || currentProject.id !== currentProjectId) {
      return;
    }

    const nextViewport = viewport ?? currentProject.viewport ?? DEFAULT_VIEWPORT;
    const nextHistory = history ?? currentProject.history ?? createEmptyHistory();
    const nextNodeCount = nodes.length;

    const hasViewportChanged =
      currentProject.viewport.x !== nextViewport.x ||
      currentProject.viewport.y !== nextViewport.y ||
      currentProject.viewport.zoom !== nextViewport.zoom;
    const hasChanged =
      currentProject.nodes !== nodes ||
      currentProject.edges !== edges ||
      currentProject.history !== nextHistory ||
      currentProject.nodeCount !== nextNodeCount ||
      hasViewportChanged;
    if (!hasChanged) {
      return;
    }

    const nextProject: Project = {
      ...currentProject,
      nodes,
      edges,
      viewport: nextViewport,
      history: nextHistory,
      nodeCount: nextNodeCount,
      updatedAt: Date.now(),
    };

    set((state) => ({
      currentProject: nextProject,
      projects: updateProjectSummary(state.projects, {
        id: nextProject.id,
        name: nextProject.name,
        createdAt: nextProject.createdAt,
        updatedAt: nextProject.updatedAt,
        nodeCount: nextProject.nodeCount,
      }),
    }));
    persistProject(nextProject);
  },

  saveCurrentProjectViewport: (viewport) => {
    const { currentProjectId, currentProject } = get();
    if (!currentProjectId || !currentProject || currentProject.id !== currentProjectId) {
      return;
    }

    const nextViewport = {
      x: Number(viewport.x.toFixed(2)),
      y: Number(viewport.y.toFixed(2)),
      zoom: Number(viewport.zoom.toFixed(4)),
    };

    const hasChanged =
      Math.abs(currentProject.viewport.x - nextViewport.x) > 0.001 ||
      Math.abs(currentProject.viewport.y - nextViewport.y) > 0.001 ||
      Math.abs(currentProject.viewport.zoom - nextViewport.zoom) > 0.001;
    if (!hasChanged) {
      return;
    }

    const nextProject: Project = {
      ...currentProject,
      viewport: nextViewport,
    };

    set({ currentProject: nextProject });
    queueViewportUpsert(currentProjectId, nextViewport);
  },

  cancelPendingViewportPersist: () => {
    const currentProjectId = get().currentProjectId;
    if (!currentProjectId) {
      return;
    }
    clearQueuedViewportUpsert(currentProjectId);
  },
}));
