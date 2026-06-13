"use client";

import FileCard from "./FileCard";
import { FileResponse } from "@/services/file.service";
import { Inbox, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";

interface FileGridProps {
  items: (FileResponse & { isFolder?: boolean })[];
  onUploadTrigger: () => void;
}

export default function FileGrid({ items, onUploadTrigger }: FileGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border/80 rounded-2xl bg-secondary/10 mt-6">
        <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-base font-bold text-foreground mb-1">No files or folders here</h3>
        <p className="text-xs text-muted-foreground/80 max-w-xs mb-4">
          This directory is empty. Drag and drop files onto the page or click below to start uploading.
        </p>
        <button
          onClick={onUploadTrigger}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-xl bg-primary hover:bg-primary/95 transition-all-custom cursor-pointer shadow-md shadow-primary/10 hover:shadow-primary/25"
        >
          <UploadCloud className="w-4 h-4" />
          Upload File
        </button>
      </div>
    );
  }

  // Separate folders and files to keep folders grouped first
  const folders = items.filter((item) => item.isFolder);
  const files = items.filter((item) => !item.isFolder);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Folders ({folders.length})
          </h3>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {folders.map((folder) => (
              <motion.div key={`folder-${folder.id}`} variants={itemAnim}>
                <FileCard item={folder} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Files ({files.length})
          </h3>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {files.map((file) => (
              <motion.div key={`file-${file.id}`} variants={itemAnim}>
                <FileCard item={file} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
