"use client";

import { useUIStore } from "@/store/uiStore";
import { FileService, FileVersionResponse } from "@/services/file.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, X, Download, RotateCcw, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatBytes, formatDate } from "@/lib/utils";
import { useRef, useState } from "react";

export default function VersionHistoryDialog() {
  const { isVersionHistoryOpen, setVersionHistoryOpen, activeFileId, activeFileName } = useUIStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  // Fetch file versions
  const { data: versions, isLoading, isError, refetch } = useQuery({
    queryKey: ["versions", activeFileId],
    queryFn: () => FileService.getVersions(activeFileId!),
    enabled: isVersionHistoryOpen && !!activeFileId,
  });

  // Upload new version mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => FileService.uploadVersion(activeFileId!, file),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      setUploadError("");
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.message || "Failed to upload new version.");
    },
  });

  // Restore version mutation
  const restoreMutation = useMutation({
    mutationFn: (versionId: number) => FileService.restoreVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setVersionHistoryOpen(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = async (versionId: number, versionNumber: number) => {
    if (!activeFileName) return;
    const nameParts = activeFileName.split(".");
    const ext = nameParts.pop();
    const baseName = nameParts.join(".");
    const versionedName = `${baseName}-v${versionNumber}.${ext}`;
    
    try {
      await FileService.downloadVersion(versionId, versionedName);
    } catch (err) {
      console.error("Failed to download version", err);
    }
  };

  const handleClose = () => {
    setVersionHistoryOpen(false);
    setUploadError("");
  };

  return (
    <AnimatePresence>
      {isVersionHistoryOpen && (
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
            className="w-full max-w-lg rounded-[22px] overflow-hidden shadow-2xl relative z-10 glass-panel border border-border/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/10">
                  <History className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-extrabold text-base text-foreground tracking-tight">Version History</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-secondary/70 border border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[55vh] overflow-y-auto space-y-5 scrollbar-thin">
              {/* File Info & Upload Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/15 rounded-2xl p-4 border border-border/40">
                <div className="min-w-0">
                  <span className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">
                    File Name
                  </span>
                  <p className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                    {activeFileName || "Loading..."}
                  </p>
                </div>
                <div className="shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={triggerUpload}
                    disabled={uploadMutation.isPending}
                    className="flex items-center gap-2 px-4.5 py-2 text-xs font-bold text-white rounded-xl bg-primary hover:bg-primary/95 transition-all duration-150 cursor-pointer shadow-md shadow-primary/15 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-primary/20"
                  >
                    {uploadMutation.isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload New Version
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-xl p-3.5 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Version History List */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
                  <span className="text-xs font-semibold">Loading versions...</span>
                </div>
              ) : isError ? (
                <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-xl p-3.5 text-xs font-semibold text-center">
                  Failed to fetch versions. Please try again.
                </div>
              ) : !versions || versions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-2xl bg-secondary/5">
                  <p className="text-xs font-bold text-muted-foreground">No version history available.</p>
                  <p className="text-[10px] text-muted-foreground/75 mt-1 font-medium">New versions will appear once you upload files of the same name.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/30">
                  {versions.map((ver, idx) => (
                    <div key={ver.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-card z-10 ${
                        idx === 0 ? "bg-primary glow-primary ring-2 ring-primary/25" : "bg-muted-foreground/40"
                      }`} />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              Version {ver.versionNumber}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                            Uploaded {formatDate(ver.createdAt)}
                          </p>
                          <span className="inline-block text-[10px] font-bold text-muted-foreground/85 bg-secondary/35 rounded-full px-2.5 py-0.5 mt-2 border border-border/30">
                            {formatBytes(ver.size)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => handleDownload(ver.id, ver.versionNumber)}
                            className="p-2 rounded-lg hover:bg-secondary/70 border border-transparent hover:border-border/35 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
                            title="Download this version"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {idx > 0 && (
                            <button
                              onClick={() => restoreMutation.mutate(ver.id)}
                              disabled={restoreMutation.isPending}
                              className="p-2 rounded-lg hover:bg-secondary/70 border border-transparent hover:border-border/35 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-95"
                              title="Restore to this version"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4.5 border-t border-border/40">
              <button
                onClick={handleClose}
                className="px-4.5 py-2 text-xs font-bold rounded-xl bg-secondary/70 hover:bg-secondary border border-border/60 hover:border-border transition-all duration-150 cursor-pointer active:scale-95"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
