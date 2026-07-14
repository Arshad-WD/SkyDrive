"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FileService, { FileResponse } from "@/services/file.service";
import FolderService, { FolderTreeResponse } from "@/services/folder.service";
import { useUIStore, BreadcrumbItem } from "@/store/uiStore";
import { 
  ChevronRight, 
  Grid, 
  List, 
  RefreshCw,
  Search
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import FileGrid from "@/components/files/FileGrid";
import FileList from "@/components/files/FileList";
import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import VersionHistoryDialog from "@/components/versioning/VersionHistoryDialog";
import MoveFileDialog from "@/components/folders/MoveFileDialog";
import DragDropOverlay from "@/components/upload/DragDropOverlay";
import UploadQueue from "@/components/upload/UploadQueue";
import FilePreviewDialog from "@/components/files/FilePreviewDialog";
import { useSse } from "@/hooks/useSse";

function FilesPageContent() {
  useSse();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    viewMode, 
    toggleViewMode, 
    currentFolderId, 
    breadcrumbs, 
    setCurrentFolder,
    addToUploadQueue,
    updateUploadProgress,
    setUploadStatus,
    uploadTrigger
  } = useUIStore();

  const searchQuery = searchParams.get("search") || "";

  // 1. Fetch entire folder tree
  const { data: folderTree, isLoading: foldersLoading } = useQuery({
    queryKey: ["folderTree"],
    queryFn: () => FolderService.getFolderTree(),
  });

  // 2. Fetch files in the current folder (ignored if searching)
  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["files", currentFolderId],
    queryFn: () => {
      if (currentFolderId === null) {
        return FileService.getMyFiles();
      } else {
        return FileService.getFilesByFolder(currentFolderId);
      }
    },
    enabled: !searchQuery,
  });

  // 3. Fetch search results (only active if searching)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["filesSearch", searchQuery],
    queryFn: () => FileService.searchFiles(searchQuery),
    enabled: !!searchQuery,
  });

  // 4. File Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId: number }) => {
      const uploadId = Math.random().toString(36).substring(7);
      addToUploadQueue({ id: uploadId, name: file.name, size: file.size });

      return FileService.uploadFile(file, folderId, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        updateUploadProgress(uploadId, percent);
      }).then((res) => {
        setUploadStatus(uploadId, "success");
        return res;
      }).catch((err) => {
        setUploadStatus(uploadId, "error");
        throw err;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
    },
  });

  // Listen to global upload trigger from Sidebar
  useEffect(() => {
    if (uploadTrigger > 0) {
      fileInputRef.current?.click();
    }
  }, [uploadTrigger]);

  // Reconstruct breadcrumbs and current folder state from URL if folder ID changes
  useEffect(() => {
    if (!folderTree || foldersLoading) return;
    
    // If search query is active, we don't display folder specific breadcrumbs
    if (searchQuery) return;

    // Helper to find a node in the tree and return the path leading to it
    const findFolderPath = (
      nodes: FolderTreeResponse[],
      targetId: number,
      currentPath: BreadcrumbItem[] = []
    ): BreadcrumbItem[] | null => {
      for (const node of nodes) {
        const pathWithNode = [...currentPath, { id: node.id, name: node.name }];
        if (node.id === targetId) {
          return pathWithNode;
        }
        if (node.children && node.children.length > 0) {
          const result = findFolderPath(node.children, targetId, pathWithNode);
          if (result) return result;
        }
      }
      return null;
    };

    if (currentFolderId !== null) {
      const path = findFolderPath(folderTree, currentFolderId);
      if (path) {
        setCurrentFolder(currentFolderId, [{ id: null, name: "Home" }, ...path]);
      } else {
        // Fallback: If not found, reset to home
        setCurrentFolder(null, [{ id: null, name: "Home" }]);
      }
    }
  }, [folderTree, foldersLoading, currentFolderId, searchQuery, setCurrentFolder]);

  // Handler for dropped files
  const handleFilesDropped = (droppedFiles: File[]) => {
    let targetFolderId = currentFolderId;
    if (targetFolderId === null && folderTree && folderTree.length > 0) {
      targetFolderId = folderTree[0].id;
    }

    if (targetFolderId !== null) {
      droppedFiles.forEach((file) => {
        uploadMutation.mutate({ file, folderId: targetFolderId! });
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;

    let targetFolderId = currentFolderId;
    if (targetFolderId === null && folderTree && folderTree.length > 0) {
      targetFolderId = folderTree[0].id;
    }

    if (targetFolderId !== null) {
      Array.from(filesList).forEach((file) => {
        uploadMutation.mutate({ file, folderId: targetFolderId! });
      });
    }
  };

  // Compute subfolders inside the current folder
  const getSubfolders = (): (FileResponse & { isFolder: boolean })[] => {
    if (searchQuery) return [];
    if (!folderTree) return [];

    const mapFolderToItem = (f: FolderTreeResponse): FileResponse & { isFolder: boolean } => ({
      id: f.id,
      originalName: f.name,
      contentType: "application/x-folder",
      size: 0,
      isFolder: true,
    });

    if (currentFolderId === null) {
      return folderTree.map(mapFolderToItem);
    }

    const findFolderNode = (nodes: FolderTreeResponse[], id: number): FolderTreeResponse | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children && node.children.length > 0) {
          const res = findFolderNode(node.children, id);
          if (res) return res;
        }
      }
      return null;
    };

    const node = findFolderNode(folderTree, currentFolderId);
    return node?.children?.map(mapFolderToItem) || [];
  };

  const subfolders = getSubfolders();
  const folderFiles = searchQuery ? [] : files || [];
  const displayItems = searchQuery
    ? (searchResults || [])
    : [...subfolders, ...folderFiles];

  const isLoading = foldersLoading || (searchQuery ? searchLoading : filesLoading);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground relative overflow-hidden select-none">
      <DragDropOverlay onFilesDropped={handleFilesDropped} />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        
        {/* Google Inset Content Window */}
        <div className="flex-grow p-3 sm:p-4 pb-24 md:pb-6 overflow-y-auto">
          <main className="min-h-full bg-card rounded-[16px] sm:rounded-[24px] border border-border/40 p-4 sm:p-6 flex flex-col">
            {/* Hidden upload file input triggered from Sidebar */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Header Explorer Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-6">
              <div className="min-w-0">
                <h1 className="text-xl font-medium tracking-tight text-foreground/90">
                  {searchQuery ? "Search Results" : "My Drive"}
                </h1>
                
                {/* Google-Style Breadcrumbs */}
                {!searchQuery && (
                  <div className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground/80 mt-2 overflow-x-auto whitespace-nowrap pb-1">
                    {breadcrumbs.map((crumb, idx) => (
                      <div key={idx} className="flex items-center">
                        {idx > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-foreground/35" />}
                        <button
                          onClick={() => {
                            const index = breadcrumbs.findIndex((b) => b.id === crumb.id);
                            setCurrentFolder(crumb.id, breadcrumbs.slice(0, index + 1));
                          }}
                          className={`px-3 py-1 rounded-full border text-xs font-bold transition-all duration-150 cursor-pointer ${
                            idx === breadcrumbs.length - 1 
                              ? "bg-primary/15 border-primary/25 text-primary" 
                              : "bg-secondary/15 border-border/40 hover:bg-secondary/45 hover:border-border text-foreground/75"
                          }`}
                        >
                          {crumb.name}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
 
              {/* Explorer Toolbar Options */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-secondary/25 border border-border/40 rounded-full p-1 shadow-sm">
                  <button
                    onClick={() => viewMode === "list" && toggleViewMode()}
                    className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
                      viewMode === "grid" 
                        ? "bg-card text-primary shadow-md shadow-primary/5 border border-border/20" 
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                    title="Grid view"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => viewMode === "grid" && toggleViewMode()}
                    className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
                      viewMode === "list" 
                        ? "bg-card text-primary shadow-md shadow-primary/5 border border-border/20" 
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                    title="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Files Listing Content Area */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <RefreshCw className="w-9 h-9 animate-spin text-primary mb-3.5" />
                  <span className="text-xs font-semibold">Loading contents...</span>
                </div>
              ) : searchQuery ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80 mb-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>Found {displayItems.length} results matching &quot;{searchQuery}&quot;</span>
                  </div>
                  {viewMode === "grid" ? (
                    <FileGrid items={displayItems} onUploadTrigger={() => fileInputRef.current?.click()} />
                  ) : (
                    <FileList items={displayItems} />
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <FileGrid items={displayItems} onUploadTrigger={() => fileInputRef.current?.click()} />
              ) : (
                <FileList items={displayItems} />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <CreateFolderDialog />
      <ShareDialog />
      <VersionHistoryDialog />
      <MoveFileDialog />
      <UploadQueue />
      <FilePreviewDialog />
    </div>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-background items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <FilesPageContent />
    </Suspense>
  );
}
