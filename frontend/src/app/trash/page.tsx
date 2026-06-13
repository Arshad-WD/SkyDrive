"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FileService from "@/services/file.service";
import { formatBytes } from "@/lib/utils";
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  Inbox, 
  RefreshCw,
  AlertTriangle 
} from "lucide-react";
import { useState } from "react";

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Fetch trash files
  const { data: trashFiles, isLoading, isError } = useQuery({
    queryKey: ["trashFiles"],
    queryFn: () => FileService.getTrashFiles(),
  });

  // Restore file mutation
  const restoreMutation = useMutation({
    mutationFn: (fileId: number) => FileService.restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashFiles"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  // Permanent delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => FileService.permanentlyDelete(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashFiles"] });
      setConfirmDeleteId(null);
    },
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-grow p-4 sm:p-6 pb-24 md:pb-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-rose-500" />
                Trash Bin
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5">
                Manage your deleted files. Items here still count towards your storage limit until permanently cleared.
              </p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3 text-xs text-rose-500 items-start">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold">Permanent deletion warning</span>
              <p className="text-rose-500/80 leading-normal font-semibold">
                Permanently deleting a file removes it from both the SkyDrive databases and the MinIO Object Storage bucket. This action is irreversible.
              </p>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-xs">Loading trash...</span>
            </div>
          ) : isError ? (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-xl p-4 text-xs text-center">
              Failed to load deleted files. Please try again.
            </div>
          ) : !trashFiles || trashFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/15">
              <Inbox className="w-12 h-12 text-muted-foreground/45 mb-4" />
              <h3 className="text-base font-bold text-foreground">Trash is empty</h3>
              <p className="text-xs text-muted-foreground/80 mt-1">Files you delete will appear here until restored or deleted permanently.</p>
            </div>
          ) : (
            <div className="w-full overflow-hidden border border-border/60 rounded-2xl bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-semibold text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/25">
                      <th className="py-3.5 px-5 text-foreground/80 font-bold">File Name</th>
                      <th className="py-3.5 px-5 text-foreground/80 font-bold">Mime Type</th>
                      <th className="py-3.5 px-5 text-foreground/80 font-bold">Size</th>
                      <th className="py-3.5 px-5 text-right text-foreground/80 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-foreground/90">
                    {trashFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-secondary/45 transition-colors">
                        <td className="py-3.5 px-5 max-w-xs truncate text-sm font-semibold text-foreground">
                          {file.originalName}
                        </td>
                        <td className="py-3.5 px-5 text-muted-foreground/85 font-medium">
                          {file.contentType}
                        </td>
                        <td className="py-3.5 px-5 text-muted-foreground/85 font-medium">
                          {formatBytes(file.size)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {confirmDeleteId === file.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[10px] text-rose-500 font-bold mr-1">Confirm delete?</span>
                              <button
                                onClick={() => deleteMutation.mutate(file.id)}
                                disabled={deleteMutation.isPending}
                                className="px-2 py-1 rounded bg-rose-500 text-white font-bold text-[10px] hover:bg-rose-600 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded bg-secondary text-foreground font-bold text-[10px] border border-border/80 hover:bg-secondary/80 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => restoreMutation.mutate(file.id)}
                                disabled={restoreMutation.isPending}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all-custom cursor-pointer flex items-center gap-1 text-[11px]"
                                title="Restore file"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(file.id)}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-rose-500 transition-all-custom cursor-pointer flex items-center gap-1 text-[11px]"
                                title="Permanently delete"
                              >
                                <Trash className="w-3.5 h-3.5" />
                                <span>Delete Forever</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
