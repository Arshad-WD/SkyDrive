"use client";

import { useUIStore } from "@/store/uiStore";
import { formatBytes } from "@/lib/utils";
import { CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function UploadQueue() {
  const { uploadQueue, clearUploadQueue } = useUIStore();
  const [collapsed, setCollapsed] = useState(false);

  if (uploadQueue.length === 0) return null;

  const activeUploads = uploadQueue.filter((item) => item.status === "uploading").length;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/35 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              {activeUploads > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeUploads > 0 ? "bg-primary" : "bg-emerald-500"}`}></span>
            </span>
            <span className="font-bold text-sm text-foreground">
              {activeUploads > 0 ? `Uploading ${activeUploads} files` : "Uploads complete"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={clearUploadQueue}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive cursor-pointer"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Queue Items */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="max-h-72 overflow-y-auto divide-y divide-border/50"
            >
              {uploadQueue.map((item) => (
                <div key={item.id} className="p-4 flex items-start gap-3.5">
                  {/* Status Icon */}
                  <div className="shrink-0 mt-0.5">
                    {item.status === "uploading" ? (
                      <RefreshCw className="w-4.5 h-4.5 text-primary animate-spin" />
                    ) : item.status === "success" ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <AlertCircle className="w-4.5 h-4.5 text-destructive fill-destructive/10" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[170px]" title={item.name}>
                        {item.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {item.progress}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mt-1">
                      <span>{formatBytes(item.size)}</span>
                      {item.status === "uploading" && item.speed && <span>{item.speed}</span>}
                    </div>

                    {/* Progress Bar */}
                    {item.status === "uploading" && (
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-2 border border-border/10">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
