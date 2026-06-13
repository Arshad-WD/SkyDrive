"use client";

import { useUIStore } from "@/store/uiStore";
import { FolderService, FolderTreeResponse } from "@/services/folder.service";
import { FileService } from "@/services/file.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder, X, Move, ChevronRight, FolderMinus, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function MoveFileDialog() {
  const { isMoveFileOpen, setMoveFileOpen, activeFileId, activeFileName, currentFolderId } = useUIStore();
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  // Fetch folder tree
  const { data: folderTree, isLoading, isError } = useQuery({
    queryKey: ["folderTree"],
    queryFn: () => FolderService.getFolderTree(),
    enabled: isMoveFileOpen,
  });

  const moveMutation = useMutation({
    mutationFn: () => {
      if (activeFileId === null || selectedFolderId === null) {
        return Promise.reject("Invalid parameters");
      }
      return FileService.moveFile(activeFileId, selectedFolderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      setMoveFileOpen(false);
      setSelectedFolderId(null);
    },
  });

  const handleClose = () => {
    setMoveFileOpen(false);
    setSelectedFolderId(null);
  };

  const handleMove = () => {
    if (selectedFolderId !== null) {
      moveMutation.mutate();
    }
  };

  // Helper to render hierarchical folder picker
  const renderFolderNode = (node: FolderTreeResponse, depth = 0) => {
    const isSelected = selectedFolderId === node.id;
    return (
      <div key={node.id} className="space-y-1">
        <button
          onClick={() => setSelectedFolderId(node.id)}
          className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl text-left text-xs font-semibold transition-all-custom cursor-pointer ${
            isSelected
              ? "bg-primary text-white shadow-md shadow-primary/10"
              : "hover:bg-secondary text-foreground/80 hover:text-foreground"
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 20)}px` }}
        >
          <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-primary"}`} />
          <span className="truncate">{node.name}</span>
        </button>
        {node.children &&
          node.children.map((child) => renderFolderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isMoveFileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="w-full max-w-md rounded-[22px] overflow-hidden shadow-2xl relative z-10 glass-panel border border-border/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/10">
                  <Move className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-extrabold text-base text-foreground tracking-tight">Move File</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-secondary/70 border border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <span className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                  File Name
                </span>
                <p className="text-sm font-bold text-foreground truncate max-w-full bg-secondary/15 px-4 py-2.5 rounded-xl border border-border/30">
                  {activeFileName}
                </p>
              </div>

              <div>
                <span className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                  Select Destination Folder
                </span>

                <div className="border border-border/40 rounded-2xl max-h-[35vh] overflow-y-auto p-3.5 bg-secondary/10 space-y-1.5 scrollbar-thin">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary mb-2" />
                      <span className="text-xs font-semibold">Loading folders...</span>
                    </div>
                  ) : isError ? (
                    <div className="text-xs font-semibold text-destructive text-center py-6">
                      Failed to load folders.
                    </div>
                  ) : !folderTree || folderTree.length === 0 ? (
                    <div className="text-xs font-semibold text-muted-foreground text-center py-6">
                      No folders created yet.
                    </div>
                  ) : (
                    folderTree.map((rootNode) => renderFolderNode(rootNode))
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                <button
                  onClick={handleClose}
                  className="px-4.5 py-2 text-xs font-bold rounded-xl bg-secondary/70 hover:bg-secondary border border-border/60 hover:border-border transition-all duration-150 cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMove}
                  disabled={selectedFolderId === null || moveMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-primary hover:bg-primary/95 shadow-md shadow-primary/15 hover:shadow-primary/30 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {moveMutation.isPending ? "Moving..." : "Move Here"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
