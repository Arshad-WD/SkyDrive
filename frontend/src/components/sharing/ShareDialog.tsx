"use client";

import { useUIStore } from "@/store/uiStore";
import { FileService } from "@/services/file.service";
import { useMutation } from "@tanstack/react-query";
import { Share2, X, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function ShareDialog() {
  const { isShareOpen, setShareOpen, activeFileId, activeFileName } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const shareMutation = useMutation({
    mutationFn: (fileId: number) => FileService.shareLink(fileId),
    onSuccess: (data) => {
      // In production, the backend might return 'http://localhost:8080/share/token'
      // If we want it to work on the client domain, we can replace the backend port with our frontend port
      // but keeping it as-is is cleaner, or we can format it.
      setShareUrl(data.url);
    },
  });

  // Fetch share link when modal opens
  useEffect(() => {
    if (isShareOpen && activeFileId) {
      setShareUrl("");
      shareMutation.mutate(activeFileId);
    }
  }, [isShareOpen, activeFileId]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareOpen(false);
    setShareUrl("");
    setCopied(false);
  };

  return (
    <AnimatePresence>
      {isShareOpen && (
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
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-extrabold text-base text-foreground tracking-tight">Share File</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-secondary/70 border border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <span className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                  File Name
                </span>
                <p className="text-sm font-bold text-foreground truncate max-w-full bg-secondary/15 px-4 py-2.5 rounded-xl border border-border/30">
                  {activeFileName || "Loading..."}
                </p>
              </div>

              {shareMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
                  <span className="text-xs font-semibold">Generating share link...</span>
                </div>
              ) : shareMutation.isError ? (
                <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-xl p-3.5 text-xs font-semibold text-center">
                  Failed to generate sharing link. Please check your network connection.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                      Public Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="w-full px-4 py-2.5 rounded-xl bg-secondary/35 border border-border/50 text-xs font-semibold focus:outline-none select-all"
                      />
                      <button
                        onClick={handleCopy}
                        disabled={!shareUrl}
                        className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-primary/15 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground/90 flex items-center gap-2 bg-secondary/15 rounded-xl p-3 border border-border/40 font-semibold">
                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                    <span>Anyone with this link can download the file.</span>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 border-t border-border/40 pt-4">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-primary hover:bg-primary/95 transition-all duration-150 cursor-pointer shadow-md active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
