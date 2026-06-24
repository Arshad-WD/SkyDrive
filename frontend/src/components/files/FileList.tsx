"use client";

import { useState, useRef, useEffect } from "react";
import { useUIStore, BreadcrumbItem } from "@/store/uiStore";
import { FileService, FileResponse } from "@/services/file.service";
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
  Trash2,
  Inbox,
  Users,
  Eye
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { motion } from "framer-motion";

interface FileListProps {
  items: (FileResponse & { isFolder?: boolean })[];
}

export default function FileList({ items }: FileListProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { 
    currentFolderId, 
    breadcrumbs, 
    setCurrentFolder, 
    setShareOpen, 
    setVersionHistoryOpen, 
    setMoveFileOpen,
    setPreviewOpen
  } = useUIStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => FileService.moveToTrash(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      setActiveMenuId(null);
    },
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/10 mt-6">
        <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-base font-bold text-foreground">No files or folders here</h3>
        <p className="text-xs text-muted-foreground/80 mt-1">This directory is empty.</p>
      </div>
    );
  }

  const handleFolderClick = (folder: FileResponse) => {
    const newBreadcrumbs: BreadcrumbItem[] = [
      ...breadcrumbs,
      { id: folder.id, name: folder.originalName },
    ];
    setCurrentFolder(folder.id, newBreadcrumbs);
  };

  // Helper to get file icon and color
  const getFileIcon = (item: FileResponse & { isFolder?: boolean }) => {
    if (item.isFolder) {
      return (
        <div className="p-1.5 rounded-lg bg-card/45 dark:bg-card/25 text-[#444746] dark:text-foreground/80 shrink-0">
          <Folder className="w-4 h-4 fill-current" />
        </div>
      );
    }

    const mime = item.contentType?.toLowerCase() || "";
    if (mime.includes("pdf")) {
      return (
        <div className="bg-[#fce8e6] text-[#c5221f] px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-[#fbd3d0] select-none uppercase shrink-0">
          PDF
        </div>
      );
    }
    if (mime.includes("word") || mime.includes("document") || mime.includes("text") || mime.includes("xml")) {
      return (
        <div className="bg-[#e8f0fe] text-[#1a73e8] px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-[#d2e3fc] select-none uppercase shrink-0">
          DOC
        </div>
      );
    }
    if (mime.startsWith("image/")) {
      return (
        <div className="bg-[#e6f4ea] text-[#137333] px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-[#ceead6] select-none uppercase shrink-0">
          IMG
        </div>
      );
    }
    if (mime.startsWith("video/")) {
      return (
        <div className="bg-[#f3e8fd] text-[#7627e2] px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-[#ebd3fd] select-none uppercase shrink-0">
          VID
        </div>
      );
    }
    return (
      <div className="bg-[#f1f3f4] text-[#5f6368] px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-[#dadce0] select-none uppercase shrink-0">
        FILE
      </div>
    );
  };

  const getCleanType = (item: FileResponse & { isFolder?: boolean }) => {
    if (item.isFolder) return "Folder";
    const mime = item.contentType?.toLowerCase() || "";
    if (mime.startsWith("image/")) return "Image";
    if (mime.startsWith("video/")) return "Video";
    if (mime.includes("pdf")) return "PDF Document";
    if (mime.includes("zip") || mime.includes("tar")) return "Archive";
    return "File";
  };

  return (
    <div className="w-full mt-6 overflow-hidden border border-border/60 rounded-2xl bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs font-semibold text-muted-foreground">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/25">
              <th className="py-3.5 px-5 text-foreground/80 font-bold">Name</th>
              <th className="py-3.5 px-5 text-foreground/80 font-bold hidden sm:table-cell">Type</th>
              <th className="py-3.5 px-5 text-foreground/80 font-bold hidden sm:table-cell">Size</th>
              <th className="py-3.5 px-5 text-right text-foreground/80 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground/90">
            {items.map((item) => (
              <tr
                key={`${item.isFolder ? "folder" : "file"}-${item.id}`}
                onClick={item.isFolder ? () => handleFolderClick(item) : () => setPreviewOpen(true, item)}
                className="hover:bg-secondary/45 transition-colors group cursor-pointer"
              >
                {/* Name */}
                <td className="py-2.5 px-5 max-w-xs truncate">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{getFileIcon(item)}</span>
                    <span className="truncate text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.originalName}
                    </span>
                    {(item.isFolder || item.id % 2 === 0) && (
                      <span title="Shared">
                        <Users className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 ml-1" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Type */}
                <td className="py-3.5 px-5 text-muted-foreground/85 font-medium hidden sm:table-cell">
                  {getCleanType(item)}
                </td>

                {/* Size */}
                <td className="py-3.5 px-5 text-muted-foreground/85 font-medium hidden sm:table-cell">
                  {item.isFolder ? "—" : formatBytes(item.size)}
                </td>

                {/* Actions Dropdown */}
                <td className="py-3.5 px-5 text-right relative">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {activeMenuId === item.id && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-5 mt-1 w-44 bg-card border border-border/80 rounded-xl shadow-xl z-20 py-1 text-xs font-semibold overflow-hidden text-left"
                    >
                      {!item.isFolder && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewOpen(true, item);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
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
                              setActiveMenuId(null);
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
                              setActiveMenuId(null);
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
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                          >
                            <History className="w-3.5 h-3.5" />
                            Version History
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isFolder) {
                            setActiveMenuId(null);
                          } else {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        disabled={item.isFolder}
                        className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-destructive transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Move to Trash
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
  );
}
