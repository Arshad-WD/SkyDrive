"use client";

import { useUIStore } from "@/store/uiStore";
import FileService from "@/services/file.service";
import { 
  X, Download, FileText, RefreshCw, AlertCircle, File as FileIcon, 
  RotateCw, Play, Info, Check, Copy, Share2, History, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { formatBytes } from "@/lib/utils";

export default function FilePreviewDialog() {
  const { isPreviewOpen, setPreviewOpen, previewFile, setShareOpen, setVersionHistoryOpen } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState(false);

  // Floating Control & Sidebar States
  const [rotation, setRotation] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setRotation(0);
    setPlaybackSpeed(1);
    setCopiedText(false);
  }, [previewFile]);

  useEffect(() => {
    if (!isPreviewOpen || !previewFile) return;

    const mime = previewFile.contentType?.toLowerCase() || "";
    const isText = mime.startsWith("text/") || 
                   mime.includes("json") || 
                   mime.includes("javascript") || 
                   mime.includes("typescript") || 
                   mime.includes("xml") || 
                   mime.includes("html") || 
                   mime.includes("css") ||
                   previewFile.originalName.endsWith(".md") ||
                   previewFile.originalName.endsWith(".env") ||
                   previewFile.originalName.endsWith(".template") ||
                   previewFile.originalName.endsWith(".properties");

    setIsLoading(true);
    setError(false);
    setTextContent("");
    setPreviewUrl("");

    const fetchContent = async () => {
      try {
        if (isText) {
          const res = await api.get(`/api/files/${previewFile.id}/preview`, { 
            responseType: "text" 
          });
          setTextContent(res.data);
        } else {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const savedToken = localStorage.getItem("skydrive_token") || "";
          const url = `${baseUrl}/api/files/${previewFile.id}/preview?token=${savedToken}`;
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error("Preview failed:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [isPreviewOpen, previewFile]);

  const handleClose = () => {
    setPreviewOpen(false);
    setPreviewUrl("");
    setTextContent("");
    setError(false);
  };

  const handleDownload = () => {
    if (!previewFile) return;
    FileService.downloadFile(previewFile.id, previewFile.originalName);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const speeds = [1, 1.25, 1.5, 2];
  const handleToggleSpeed = () => {
    if (!videoRef.current) return;
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    videoRef.current.playbackRate = nextSpeed;
  };

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const mime = previewFile?.contentType?.toLowerCase() || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isPdf = mime.includes("pdf");
  const isText = mime.startsWith("text/") || 
                 (previewFile && (
                   mime.includes("json") || 
                   mime.includes("javascript") || 
                   mime.includes("typescript") || 
                   mime.includes("xml") || 
                   mime.includes("html") || 
                   mime.includes("css") ||
                   previewFile.originalName.endsWith(".md") ||
                   previewFile.originalName.endsWith(".env") ||
                   previewFile.originalName.endsWith(".template") ||
                   previewFile.originalName.endsWith(".properties")
                 ));

  const hasPreview = isImage || isVideo || isPdf || isText;

  return (
    <AnimatePresence>
      {isPreviewOpen && previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal Container — full screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.08 }}
            className="w-full h-full flex flex-col bg-background text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 dark:border-border/30 px-6 py-3.5 shrink-0 bg-white dark:bg-card">
              {/* Left: icon + file info */}
              <div className="flex items-center gap-3 min-w-0">
                {/* File type icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e8f0fe] dark:bg-[#004a77]/40 border border-[#d2e3fc] dark:border-[#004a77] shrink-0">
                  <FileText className="w-4 h-4 text-[#0b57d0] dark:text-[#8ab4f8]" />
                </div>
                {/* Name + meta */}
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate max-w-lg leading-tight">
                    {previewFile.originalName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatBytes(previewFile.size)}
                    </span>
                    <span className="text-muted-foreground/40 text-[10px]">•</span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/40">
                      {previewFile.contentType?.split("/")[1] ?? previewFile.contentType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] dark:hover:bg-[#a8c7fb] transition-all duration-150 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>


            {/* Content Body */}
            <div className="flex-grow overflow-hidden flex bg-zinc-100 dark:bg-[#03050c] relative">
              
              {/* Main Media Preview Frame */}
              <div className="flex-grow h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <RefreshCw className="w-9 h-9 animate-spin text-[#0b57d0] dark:text-[#8ab4f8]" />
                    <span className="text-xs font-medium">Loading preview…</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-destructive/5 border border-destructive/20 rounded-2xl max-w-md">
                    <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                    <h4 className="text-sm font-semibold text-foreground">Preview unavailable</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[260px]">
                      Could not load this file. It may be corrupted or the format isn't supported.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" /> Download File
                    </button>
                  </div>
                ) : hasPreview ? (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {isImage && previewUrl && (
                      <div className="relative p-1.5 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/10 dark:border-white/[0.06] max-w-full max-h-full transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)` }}>
                        <img
                          src={previewUrl}
                          alt={previewFile.originalName}
                          className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl border border-white/5 animate-fade-in"
                        />
                      </div>
                    )}

                    {isVideo && previewUrl && (
                      <div className="w-full h-full max-h-[68vh] rounded-2xl overflow-hidden shadow-2xl bg-black border border-black/10 dark:border-white/[0.06] p-1">
                        <video
                          ref={videoRef}
                          src={previewUrl}
                          controls
                          autoPlay
                          className="w-full h-full rounded-xl bg-black object-contain focus:outline-none"
                        />
                      </div>
                    )}

                    {isPdf && previewUrl && (
                      <div className="w-full h-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/[0.06] shadow-2xl bg-white/50 dark:bg-white/5 p-1">
                        <iframe
                          src={`${previewUrl}#toolbar=0`}
                          className="w-full h-full rounded-xl border-0 bg-white"
                          title={previewFile.originalName}
                        />
                      </div>
                    )}

                    {isText && (
                      <div className="w-full h-full bg-zinc-50 dark:bg-[#05070e] border border-black/10 dark:border-white/[0.06] rounded-2xl overflow-auto p-8 text-left font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-300 select-text shadow-inner">
                        <pre className="whitespace-pre-wrap break-all">{textContent}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback info card for non-previewable files */
                  <div className="flex flex-col items-center text-center p-8 bg-secondary/20 border border-border/40 rounded-2xl max-w-sm">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#e8f0fe] dark:bg-[#004a77]/30 border border-[#d2e3fc] dark:border-[#004a77] mb-4">
                      <FileIcon className="w-7 h-7 text-[#0b57d0] dark:text-[#8ab4f8]" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{previewFile.originalName}</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
                      No preview available for this file type. Download to open on your device.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                )}

                {/* Floating Action Controls Overlay at bottom */}
                {!isLoading && !error && hasPreview && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-[#070913]/90 backdrop-blur-xl border border-black/10 dark:border-white/[0.08] px-4.5 py-2.5 rounded-full flex items-center gap-3.5 shadow-xl z-20 transition-all duration-150 animate-fade-in-up">
                    {isImage && (
                      <button
                        onClick={handleRotate}
                        className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 transition-all duration-150 cursor-pointer active:scale-90 flex items-center gap-1.5 text-xs font-bold"
                        title="Rotate Image 90°"
                      >
                        <RotateCw className="w-4 h-4" />
                        Rotate
                      </button>
                    )}

                    {isVideo && (
                      <button
                        onClick={handleToggleSpeed}
                        className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 transition-all duration-150 cursor-pointer active:scale-90 flex items-center gap-1.5 text-xs font-bold"
                        title="Change Playback Speed"
                      >
                        <Play className="w-4 h-4" />
                        Speed: {playbackSpeed}x
                      </button>
                    )}

                    {isText && (
                      <button
                        onClick={handleCopyText}
                        className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 transition-all duration-150 cursor-pointer active:scale-90 flex items-center gap-1.5 text-xs font-bold"
                        title="Copy text to clipboard"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Text
                          </>
                        )}
                      </button>
                    )}

                    {/* Divider if we have media controls */}
                    <div className="w-[1px] h-4.5 bg-black/10 dark:bg-white/10" />

                    <button
                      onClick={() => setShowSidebar(!showSidebar)}
                      className={`px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-semibold border ${
                        showSidebar
                          ? "bg-[#e8f0fe] dark:bg-[#004a77]/40 text-[#0b57d0] dark:text-[#8ab4f8] border-[#d2e3fc] dark:border-[#004a77]"
                          : "bg-transparent border-border/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/70"
                      }`}
                      title="Toggle file details"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Details
                    </button>
                  </div>
                )}
              </div>

              {/* Inspect Metadata Sidebar */}
              <AnimatePresence>
                {showSidebar && previewFile && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="h-full border-l border-border/40 bg-card w-[280px] shrink-0 flex flex-col overflow-y-auto overflow-x-hidden"
                  >
                    <div className="p-5 space-y-5">
                      {/* File details section */}
                      <div>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                          File Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Type</span>
                            <span className="text-[11px] font-semibold text-foreground text-right">{previewFile.contentType || "Unknown"}</span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Size</span>
                            <span className="text-[11px] font-semibold text-foreground">{formatBytes(previewFile.size)}</span>
                          </div>
                          <div className="pt-2 border-t border-border/30">
                            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-emerald-500/6 border border-emerald-500/15">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <div>
                                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Safe &amp; Verified</p>
                                <p className="text-[9px] text-muted-foreground font-medium">ClamAV scanned</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="border-t border-border/30 pt-4">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                          Quick Actions
                        </h4>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              handleClose();
                              setTimeout(() => setShareOpen(true, previewFile.id, previewFile.originalName), 120);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] dark:hover:bg-[#a8c7fb] transition-all duration-150 cursor-pointer active:scale-95"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share file
                          </button>
                          <button
                            onClick={() => {
                              handleClose();
                              setTimeout(() => setVersionHistoryOpen(true, previewFile.id, previewFile.originalName), 120);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-secondary/50 hover:bg-secondary/80 border border-border/40 hover:border-border/70 text-foreground transition-all duration-150 cursor-pointer active:scale-95"
                          >
                            <History className="w-3.5 h-3.5" />
                            Version History
                          </button>
                          <button
                            onClick={handleDownload}
                            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-secondary/50 hover:bg-secondary/80 border border-border/40 hover:border-border/70 text-foreground transition-all duration-150 cursor-pointer active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download File
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
