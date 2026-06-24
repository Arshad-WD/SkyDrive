"use client";

import { useQuery } from "@tanstack/react-query";
import FileService from "@/services/file.service";
import { Download, FileText, Globe, Lock, ShieldAlert, AlertTriangle, RefreshCw, LogIn, File as FileIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";

export default function ShareLandingPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  
  const [textContent, setTextContent] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  const { data: info, isLoading, isError, refetch } = useQuery({
    queryKey: ["sharedFileInfo", token],
    queryFn: () => FileService.getSharedFileInfo(token),
    retry: false,
  });

  useEffect(() => {
    if (info && info.allowed) {
      const mime = info.contentType?.toLowerCase() || "";
      const isText = mime.startsWith("text/") || 
                     mime.includes("json") || 
                     mime.includes("javascript") || 
                     mime.includes("typescript") || 
                     mime.includes("xml") || 
                     mime.includes("html") || 
                     mime.includes("css") ||
                     info.originalName.endsWith(".md") ||
                     info.originalName.endsWith(".env") ||
                     info.originalName.endsWith(".template") ||
                     info.originalName.endsWith(".properties");

      if (isText) {
        setTextLoading(true);
        api.get(`/share/${token}/download`, { 
          params: { download: false },
          responseType: "text" 
        })
          .then(res => {
            setTextContent(res.data);
            setTextLoading(false);
          })
          .catch(() => {
            setTextContent("Failed to load preview text content.");
            setTextLoading(false);
          });
      }
    }
  }, [info, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Retrieving shared file details...</p>
      </div>
    );
  }

  if (isError || !info) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md glass p-8 rounded-3xl border border-border/40 shadow-xl space-y-5">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-extrabold tracking-tight">Shared Link Invalid</h2>
          <p className="text-xs text-muted-foreground/90 leading-relaxed font-semibold">
            This sharing link is broken, expired, or doesn&apos;t exist. Please verify with the owner of the file.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/95 text-foreground font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Go to SkyDrive Home
          </button>
        </div>
      </div>
    );
  }

  // Case 1: Link is Restricted and user is NOT logged in
  if (info.authRequired) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass p-8 rounded-3xl border border-border/40 shadow-xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">Restricted File</h2>
            <p className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
              {info.originalName}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/90 leading-relaxed font-semibold">
            Access to this file is restricted to authorized users. Please sign in with your email address to verify your access permission.
          </p>
          <Link
            href={`/login?redirect=/share/${token}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-md shadow-primary/15 transition-all duration-200 cursor-pointer active:scale-95 border border-primary/25"
          >
            <LogIn className="w-4.5 h-4.5" />
            Sign In to View File
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: User is logged in, but restricted and NOT allowed
  if (!info.allowed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass p-8 rounded-3xl border border-border/40 shadow-xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/25 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">Access Denied</h2>
            <p className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
              {info.originalName}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/90 leading-relaxed font-semibold">
            Your logged-in account does not have permission to view or download this file. Contact the file owner to grant access.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="flex-1 py-2.5 rounded-xl bg-secondary border border-border hover:bg-secondary/90 text-foreground font-bold text-xs cursor-pointer active:scale-95"
            >
              Switch Account
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs cursor-pointer active:scale-95 shadow-md shadow-primary/10 border border-primary/20"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Access allowed (Public or Authorized user)
  const mime = info.contentType?.toLowerCase() || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isPdf = mime.includes("pdf");
  const isText = mime.startsWith("text/") || 
                 mime.includes("json") || 
                 mime.includes("javascript") || 
                 mime.includes("typescript") || 
                 mime.includes("xml") || 
                 mime.includes("html") || 
                 mime.includes("css") ||
                 info.originalName.endsWith(".md") ||
                 info.originalName.endsWith(".env") ||
                 info.originalName.endsWith(".template") ||
                 info.originalName.endsWith(".properties");

  const hasPreview = isImage || isVideo || isPdf || isText;
  const previewSource = FileService.getSharedFileDownloadUrl(token, false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 bg-radial from-secondary/5 to-background">
      <div className="w-full max-w-4xl h-[90vh] rounded-[24px] overflow-hidden shadow-2xl glass-panel border border-border/40 flex flex-col bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4.5 bg-secondary/15 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-foreground truncate max-w-lg tracking-tight">
                {info.originalName}
              </h3>
              <p className="text-[10px] text-muted-foreground/80 font-bold mt-0.5">
                {formatBytes(info.size)} • Shared by {info.ownerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/35 border border-border/30 text-[10px] font-bold text-muted-foreground">
              {info.isPublic ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>Public Link</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Restricted Access</span>
                </>
              )}
            </div>
            <a
              href={FileService.getSharedFileDownloadUrl(token, true)}
              className="p-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 flex items-center gap-2 shadow-md shadow-primary/15 hover:shadow-primary/30 transition-all duration-150 cursor-pointer active:scale-95 border border-primary/20"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-grow overflow-auto p-6 flex items-center justify-center bg-black/15">
          {textLoading ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="w-10 h-10 animate-spin text-primary mb-3" />
              <span className="text-xs font-bold tracking-wide">Loading preview...</span>
            </div>
          ) : hasPreview ? (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              {isImage && (
                <img
                  src={previewSource}
                  alt={info.originalName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              )}

              {isVideo && (
                <video
                  src={previewSource}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-md bg-black"
                />
              )}

              {isPdf && (
                <iframe
                  src={`${previewSource}#toolbar=0`}
                  className="w-full h-full rounded-lg border border-border/30 shadow-sm"
                  title={info.originalName}
                />
              )}

              {isText && (
                <div className="w-full h-full bg-secondary/10 border border-border/30 rounded-xl overflow-auto p-5 text-left font-mono text-xs leading-relaxed text-foreground/90 select-text">
                  <pre className="whitespace-pre-wrap word-break">{textContent}</pre>
                </div>
              )}
            </div>
          ) : (
            /* Fallback detail view */
            <div className="flex flex-col items-center text-center p-8 bg-secondary/15 border border-border/30 rounded-[20px] max-w-md shadow-sm">
              <div className="p-4 rounded-2xl bg-secondary/35 text-muted-foreground border border-border/40 mb-4">
                <FileIcon className="w-12 h-12" />
              </div>
              <h4 className="text-base font-extrabold text-foreground">{info.originalName}</h4>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed font-semibold">
                Preview is not supported for this file type. You can download and open this file directly.
              </p>
              <a
                href={FileService.getSharedFileDownloadUrl(token, true)}
                className="mt-5 px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-95 flex items-center gap-2 border border-primary/20"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
