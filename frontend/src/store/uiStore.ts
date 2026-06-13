import { create } from "zustand";

export interface BreadcrumbItem {
  id: number | null;
  name: string;
}

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "success" | "error";
  speed?: string;
}

interface UIState {
  viewMode: "grid" | "list";
  currentFolderId: number | null;
  breadcrumbs: BreadcrumbItem[];
  uploadQueue: UploadItem[];
  theme: "light" | "dark";
  
  uploadTrigger: number;
  triggerUpload: () => void;
  
  // Modals state
  isCreateFolderOpen: boolean;
  isShareOpen: boolean;
  isVersionHistoryOpen: boolean;
  isMoveFileOpen: boolean;
  activeFileId: number | null;
  activeFileName: string | null;

  toggleViewMode: () => void;
  setCurrentFolder: (folderId: number | null, breadcrumbs?: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  popBreadcrumb: (folderId: number | null) => void;
  
  // Upload actions
  addToUploadQueue: (item: Omit<UploadItem, "progress" | "status">) => void;
  updateUploadProgress: (id: string, progress: number) => void;
  setUploadStatus: (id: string, status: UploadItem["status"]) => void;
  clearUploadQueue: () => void;
  
  // Theme action
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  
  // Modal Actions
  setCreateFolderOpen: (open: boolean) => void;
  setShareOpen: (open: boolean, fileId?: number | null, fileName?: string | null) => void;
  setVersionHistoryOpen: (open: boolean, fileId?: number | null, fileName?: string | null) => void;
  setMoveFileOpen: (open: boolean, fileId?: number | null, fileName?: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  viewMode: "grid",
  currentFolderId: null,
  breadcrumbs: [{ id: null, name: "Home" }],
  uploadQueue: [],
  theme: "light", // default Google Drive theme
  uploadTrigger: 0,
  triggerUpload: () => set((state) => ({ uploadTrigger: state.uploadTrigger + 1 })),

  isCreateFolderOpen: false,
  isShareOpen: false,
  isVersionHistoryOpen: false,
  isMoveFileOpen: false,
  activeFileId: null,
  activeFileName: null,

  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === "grid" ? "list" : "grid" })),
  
  setCurrentFolder: (folderId, breadcrumbs) => set((state) => {
    if (breadcrumbs) {
      return { currentFolderId: folderId, breadcrumbs };
    }
    // Fallback: If no breadcrumbs are provided and folderId is null, reset to Home
    if (folderId === null) {
      return { currentFolderId: null, breadcrumbs: [{ id: null, name: "Home" }] };
    }
    return { currentFolderId: folderId };
  }),

  addBreadcrumb: (item) => set((state) => {
    // Avoid duplicates
    if (state.breadcrumbs.some((b) => b.id === item.id)) return {};
    return { breadcrumbs: [...state.breadcrumbs, item] };
  }),

  popBreadcrumb: (folderId) => set((state) => {
    const index = state.breadcrumbs.findIndex((b) => b.id === folderId);
    if (index === -1) return {};
    return { breadcrumbs: state.breadcrumbs.slice(0, index + 1) };
  }),

  addToUploadQueue: (item) => set((state) => ({
    uploadQueue: [
      { ...item, progress: 0, status: "uploading" },
      ...state.uploadQueue,
    ],
  })),

  updateUploadProgress: (id, progress) => set((state) => ({
    uploadQueue: state.uploadQueue.map((item) =>
      item.id === id ? { ...item, progress } : item
    ),
  })),

  setUploadStatus: (id, status) => set((state) => ({
    uploadQueue: state.uploadQueue.map((item) =>
      item.id === id ? { ...item, status } : item
    ),
  })),

  clearUploadQueue: () => set({ uploadQueue: [] }),

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      localStorage.setItem("skydrive_theme", theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === "light" ? "dark" : "light";
    get().setTheme(nextTheme);
  },

  setCreateFolderOpen: (open) => set({ isCreateFolderOpen: open }),
  
  setShareOpen: (open, fileId = null, fileName = null) => set({
    isShareOpen: open,
    activeFileId: fileId,
    activeFileName: fileName
  }),
  
  setVersionHistoryOpen: (open, fileId = null, fileName = null) => set({
    isVersionHistoryOpen: open,
    activeFileId: fileId,
    activeFileName: fileName
  }),

  setMoveFileOpen: (open, fileId = null, fileName = null) => set({
    isMoveFileOpen: open,
    activeFileId: fileId,
    activeFileName: fileName
  }),
}));
