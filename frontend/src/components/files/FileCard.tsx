"use client";

import { useState, useRef, useEffect } from "react";
import { useUIStore, BreadcrumbItem } from "@/store/uiStore";
import FileService, { FileResponse } from "@/services/file.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Folder, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileCode, 
  FileArchive, 
  File as FileIcon, 
  MoreVertical, 
  Download, 
  Share2, 
  Move, 
  History, 
  Trash2
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FileCardProps {
  item: FileResponse & { isFolder?: boolean };
}

export default function FileCard({ item }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { 
    currentFolderId, 
    breadcrumbs, 
    setCurrentFolder, 
    setShareOpen, 
    setVersionHistoryOpen, 
    setMoveFileOpen 
  } = useUIStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: () => FileService.moveToTrash(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      setMenuOpen(false);
    },
  });

  // Navigate folder
  const handleFolderClick = () => {
    if (!item.isFolder) return;
    const newBreadcrumbs: BreadcrumbItem[] = [
      ...breadcrumbs,
      { id: item.id, name: item.originalName },
    ];
    setCurrentFolder(item.id, newBreadcrumbs);
  };

  // Helper to get file icon and color
  const getFileIcon = (isSmall = false) => {
    if (item.isFolder) {
      return {
        icon: Folder,
        color: "text-amber-500 fill-amber-500/10",
        bg: "bg-amber-500/10",
      };
    }

    const mime = item.contentType?.toLowerCase() || "";
    if (mime.startsWith("image/")) {
      return {
        icon: FileImage,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      };
    }
    if (mime.startsWith("video/")) {
      return {
        icon: FileVideo,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
      };
    }
    if (mime.includes("pdf")) {
      return {
        icon: FileText,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
      };
    }
    if (
      mime.includes("javascript") ||
      mime.includes("typescript") ||
      mime.includes("html") ||
      mime.includes("css") ||
      mime.includes("json") ||
      mime.includes("xml")
    ) {
      return {
        icon: FileCode,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
      };
    }
    if (
      mime.includes("zip") ||
      mime.includes("tar") ||
      mime.includes("rar") ||
      mime.includes("gzip")
    ) {
      return {
        icon: FileArchive,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
      };
    }
    return {
      icon: FileIcon,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    };
  };

  const { icon: Icon, color: iconStyle, bg: iconBg } = getFileIcon();

  // 1. Render Google Drive Folder Card (Horizontal pill shape)
  if (item.isFolder) {
    return (
      <div
        className="group relative flex items-center justify-between bg-[#f0f4f9] dark:bg-[#242426] hover:bg-[#e2e8f0] dark:hover:bg-[#2d2d30] border-0 rounded-2xl px-4.5 py-3.5 transition-all duration-150 cursor-pointer select-none hover-card-shift"
        onClick={handleFolderClick}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-card/45 dark:bg-card/25 text-[#444746] dark:text-foreground/80 shrink-0">
            <Folder className="w-4.5 h-4.5 fill-current" />
          </div>
          <span className="text-sm font-bold text-foreground/90 truncate pr-2 ml-1" title={item.originalName}>
            {item.originalName}
          </span>
        </div>

        {/* Dropdown Menu Trigger */}
        <div className="relative shrink-0" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#444746] dark:text-foreground/70 cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1 w-44 bg-card border border-border/80 rounded-xl shadow-xl z-20 py-1.5 text-xs font-semibold overflow-hidden glass"
              >
                <button
                  onClick={() => {
                    deleteMutation.mutate();
                  }}
                  disabled={true} // Folders aren't deleted in this iteration
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-destructive transition-colors cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Move to Trash
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 2. Render Google Drive File Card (Vertical rectangular shape with preview panel)
  return (
    <div
      className="group bg-gradient-to-br from-card to-secondary/10 hover:bg-secondary/25 border border-border/40 hover:border-primary/25 rounded-[16px] transition-all duration-150 flex flex-col h-44 overflow-hidden relative hover-card-shift shadow-sm"
    >
      {/* File Preview/Thumbnail Container */}
      <div className="flex-grow bg-card/50 border-b border-border/30 flex items-center justify-center relative p-5 bg-radial from-card to-secondary/15">
        <Icon className={`w-11 h-11 transition-transform duration-250 group-hover:scale-105 ${iconStyle}`} />
      </div>

      {/* File Information Footer */}
      <div className="flex items-center justify-between p-3.5 select-none bg-card/30">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`p-1.5 rounded-lg border ${iconBg} ${iconStyle}`}>
            <Icon className="w-4 h-4 shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-foreground/90 truncate leading-snug" title={item.originalName}>
              {item.originalName}
            </h4>
            <p className="text-[10px] text-muted-foreground/85 mt-0.5 font-semibold">
              {formatBytes(item.size)}
            </p>
          </div>
        </div>

        {/* Dropdown Menu Container */}
        <div className="relative shrink-0 ml-1" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-secondary/70 border border-transparent text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 bottom-8 w-44 bg-card border border-border/80 rounded-xl shadow-xl z-20 py-1.5 text-xs font-semibold overflow-hidden glass"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    FileService.downloadFile(item.id, item.originalName);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen(true, item.id, item.originalName);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveFileOpen(true, item.id, item.originalName);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                >
                  <Move className="w-3.5 h-3.5" />
                  Move file
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVersionHistoryOpen(true, item.id, item.originalName);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                >
                  <History className="w-3.5 h-3.5" />
                  Version History
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-destructive transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Move to Trash
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
