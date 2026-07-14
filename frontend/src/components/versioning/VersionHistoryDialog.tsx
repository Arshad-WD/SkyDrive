"use client";

import { useUIStore } from "@/store/uiStore";
import { FileService } from "@/services/file.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  History, X, Download, RotateCcw,
  Upload, RefreshCw, AlertCircle, Clock, HardDrive, CloudUpload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatBytes, formatDate } from "@/lib/utils";
import { useRef, useState } from "react";

export default function VersionHistoryDialog() {
  const { isVersionHistoryOpen, setVersionHistoryOpen, activeFileId, activeFileName } = useUIStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const { data: versions, isLoading, isError, refetch } = useQuery({
    queryKey: ["versions", activeFileId],
    queryFn: () => FileService.getVersions(activeFileId!),
    enabled: isVersionHistoryOpen && !!activeFileId,
  });

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

  const restoreMutation = useMutation({
    mutationFn: (versionId: number) => FileService.restoreVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setRestoringId(null);
      setVersionHistoryOpen(false);
    },
    onError: () => setRestoringId(null),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
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

  const handleRestore = (versionId: number) => {
    setRestoringId(versionId);
    restoreMutation.mutate(versionId);
  };

  const handleClose = () => {
    setVersionHistoryOpen(false);
    setUploadError("");
    setRestoringId(null);
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
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.38, bounce: 0.14 }}
            className="relative z-10 w-full max-w-[480px] rounded-2xl overflow-hidden bg-card border border-border/40 dark:border-border/60 shadow-2xl shadow-black/20 dark:shadow-black/50 flex flex-col max-h-[88vh]"
          >
            {/* Top accent */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#0b57d0]/60 via-[#0b57d0] to-[#0b57d0]/60 dark:from-[#8ab4f8]/40 dark:via-[#8ab4f8] dark:to-[#8ab4f8]/40 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e8f0fe] dark:bg-[#004a77]/40 border border-[#d2e3fc] dark:border-[#004a77]">
                  <History className="w-4 h-4 text-[#0b57d0] dark:text-[#8ab4f8]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-none">Version History</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[240px]">
                    {activeFileName || "Loading..."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats + Upload bar */}
            <div className="px-5 pb-4 shrink-0 border-b border-border/30">
              <div className="flex items-center justify-between">
                {/* Mini stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <History className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {versions ? `${versions.length} version${versions.length !== 1 ? "s" : ""}` : "—"}
                    </span>
                  </div>
                  {versions && versions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatBytes(versions.reduce((a, v) => a + v.size, 0))}</span>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] dark:hover:bg-[#a8c7fb] transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {uploadMutation.isPending
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <CloudUpload className="w-3.5 h-3.5" />
                    }
                    Upload version
                  </button>
                </div>
              </div>

              {/* Upload error */}
              {uploadError && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#0b57d0] dark:text-[#8ab4f8]" />
                  <span className="text-xs font-medium">Loading versions…</span>
                </div>
              ) : isError ? (
                <div className="rounded-xl p-4 bg-destructive/5 border border-destructive/20 text-destructive text-xs font-medium text-center">
                  Failed to fetch versions. Please try again.
                </div>
              ) : !versions || versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary/50 border border-border/40">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/80">No version history</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
                      Upload a new version to start tracking revisions for this file.
                    </p>
                  </div>
                </div>
              ) : (
                /* Timeline */
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[17px] top-3 bottom-3 w-px bg-border/50" />

                  <div className="space-y-2">
                    {versions.map((ver, idx) => (
                      <motion.div
                        key={ver.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.25 }}
                        className="relative flex gap-4 group"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-3.5 shrink-0">
                          {idx === 0 ? (
                            <div className="w-[13px] h-[13px] rounded-full bg-[#0b57d0] dark:bg-[#8ab4f8] border-2 border-card shadow-sm shadow-[#0b57d0]/30 dark:shadow-[#8ab4f8]/20" />
                          ) : (
                            <div className="w-[13px] h-[13px] rounded-full bg-card border-2 border-border/60" />
                          )}
                        </div>

                        {/* Card */}
                        <div
                          className={`flex-1 flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 mb-1 ${
                            idx === 0
                              ? "bg-[#e8f0fe]/50 dark:bg-[#004a77]/15 border-[#0b57d0]/15 dark:border-[#8ab4f8]/15"
                              : "bg-secondary/10 dark:bg-secondary/5 border-border/30 hover:bg-secondary/25 dark:hover:bg-secondary/12 hover:border-border/50"
                          }`}
                        >
                          <div className="min-w-0">
                            {/* Version number + badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                Version {ver.versionNumber}
                              </span>
                              {idx === 0 && ver.status === "CLEAN" && (
                                <span className="px-2 py-0.5 rounded-full bg-[#0b57d0]/10 dark:bg-[#8ab4f8]/10 text-[#0b57d0] dark:text-[#8ab4f8] border border-[#0b57d0]/15 dark:border-[#8ab4f8]/15 text-[9px] font-semibold uppercase tracking-wide">
                                  Current
                                </span>
                              )}
                              {ver.status === "PENDING_SCAN" && (
                                <span className="flex items-center gap-1 text-[8px] font-extrabold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/80 uppercase tracking-wide shrink-0">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                  Scanning
                                </span>
                              )}
                              {ver.status === "VIRUS_DETECTED" && (
                                <span className="flex items-center gap-1 text-[8px] font-extrabold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20 uppercase tracking-wide shrink-0">
                                  Blocked
                                </span>
                              )}
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                <Clock className="w-3 h-3" />
                                {formatDate(ver.createdAt)}
                              </span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                <HardDrive className="w-3 h-3" />
                                {formatBytes(ver.size)}
                              </span>
                            </div>
                          </div>

                          {/* Actions — visible on hover */}
                          {(ver.status === "CLEAN" || !ver.status) && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                              <button
                                onClick={() => handleDownload(ver.id, ver.versionNumber)}
                                title="Download this version"
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-90"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {idx > 0 && (
                                <button
                                  onClick={() => handleRestore(ver.id)}
                                  disabled={restoreMutation.isPending}
                                  title="Restore to this version"
                                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-150 cursor-pointer active:scale-90 disabled:opacity-40"
                                >
                                  {restoringId === ver.id
                                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    : <RotateCcw className="w-3.5 h-3.5" />
                                  }
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-5 py-3.5 border-t border-border/30 bg-secondary/10 dark:bg-secondary/5 shrink-0">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150 cursor-pointer"
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
