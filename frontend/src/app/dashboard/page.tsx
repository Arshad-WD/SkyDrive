"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FileService from "@/services/file.service";
import FolderService from "@/services/folder.service";
import StorageService from "@/services/storage.service";
import ActivityService, { ActivityType } from "@/services/activity.service";
import { useUIStore } from "@/store/uiStore";
import { formatBytes, formatDate } from "@/lib/utils";
import { 
  UploadCloud, 
  FolderPlus, 
  Trash2, 
  History,
  HardDrive,
  CheckCircle2, 
  AlertTriangle,
  Download,
  Share2,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Folder,
  Move,
  List as ListIcon,
  Grid as GridIcon,
  Eye,
  Check,
  Users,
  Info,
  X,
  FileImage,
  FileVideo,
  FileText,
  FileCode,
  FileArchive,
  File as FileIcon,
  FileUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import VersionHistoryDialog from "@/components/versioning/VersionHistoryDialog";
import MoveFileDialog from "@/components/folders/MoveFileDialog";
import UploadQueue from "@/components/upload/UploadQueue";
import { motion, AnimatePresence } from "framer-motion";

const getFileIconMeta = (contentType: string) => {
  const mime = contentType?.toLowerCase() || "";
  if (mime.startsWith("image/")) {
    return { icon: FileImage, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (mime.startsWith("video/")) {
    return { icon: FileVideo, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
  }
  if (mime.includes("pdf")) {
    return { icon: FileText, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
  }
  if (
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("html") ||
    mime.includes("css") ||
    mime.includes("json") ||
    mime.includes("xml")
  ) {
    return { icon: FileCode, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" };
  }
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar") || mime.includes("gzip")) {
    return { icon: FileArchive, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
  }
  return { icon: FileIcon, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" };
};

const renderMimeBadge = (contentType: string) => {
  const mime = contentType?.toLowerCase() || "";
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

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    setCreateFolderOpen, 
    addToUploadQueue, 
    updateUploadProgress, 
    setUploadStatus, 
    uploadTrigger,
    setCurrentFolder,
    setShareOpen,
    setVersionHistoryOpen,
    setMoveFileOpen
  } = useUIStore();

  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"suggested" | "activity">("suggested");
  const [dashboardViewMode, setDashboardViewMode] = useState<"list" | "grid">("list");
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<number | null>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<number | null>(null);
  
  const [showAiBanner, setShowAiBanner] = useState(true);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [filesExpanded, setFilesExpanded] = useState(true);

  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const fileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setActiveFolderMenuId(null);
      }
      if (fileDropdownRef.current && !fileDropdownRef.current.contains(event.target as Node)) {
        setActiveFileMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const { data: files } = useQuery({
    queryKey: ["files", "recent"],
    queryFn: () => FileService.getMyFiles(),
  });

  const { data: storage } = useQuery({
    queryKey: ["storageUsage"],
    queryFn: () => StorageService.getUsage(),
    refetchInterval: 30000,
  });

  const usedBytes = storage?.usedBytes ?? 0;
  const limitBytes = storage?.limitBytes ?? 1073741824;
  const percentage = storage?.usedPercentage ?? (usedBytes / limitBytes) * 100;

  const { data: folders } = useQuery({
    queryKey: ["folderTree"],
    queryFn: () => FolderService.getFolderTree(),
  });

  const { data: activities } = useQuery({
    queryKey: ["activities", "recent"],
    queryFn: () => ActivityService.getActivities(),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId: number }) => {
      const uploadId = Math.random().toString(36).substring(7);
      addToUploadQueue({ id: uploadId, name: file.name, size: file.size });
      
      return FileService.uploadFile(file, folderId, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        updateUploadProgress(uploadId, percent);
      }).then((res) => {
        setUploadStatus(uploadId, "success");
        return res;
      }).catch((err) => {
        setUploadStatus(uploadId, "error");
        throw err;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      setErrorMessage("");
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || "File upload failed.");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => FileService.moveToTrash(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["storageUsage"] });
      setActiveFileMenuId(null);
    },
  });

  // Listen to global upload trigger from Sidebar
  useEffect(() => {
    if (uploadTrigger > 0) {
      fileInputRef.current?.click();
    }
  }, [uploadTrigger]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (folders && folders.length > 0) {
      uploadMutation.mutate({ file, folderId: folders[0].id });
    } else {
      setErrorMessage("No destination folder found. Please create a folder first.");
    }
  };

  const handleFolderClick = (folderId: number, folderName: string) => {
    setCurrentFolder(folderId, [{ id: null, name: "Home" }, { id: folderId, name: folderName }]);
    router.push("/files");
  };

  const getFileSuggestionReason = (fileId: number, originalName: string) => {
    if (activities && activities.length > 0) {
      const match = activities.find((act: any) =>
        act.description.toLowerCase().includes(originalName.toLowerCase())
      );
      if (match) {
        let action = "opened";
        if (match.activityType === "UPLOAD" || match.activityType === "VERSION_UPLOAD") {
          action = "uploaded";
        } else if (match.activityType === "DOWNLOAD") {
          action = "downloaded";
        } else if (match.activityType === "SHARE") {
          action = "shared";
        } else if (match.activityType === "DELETE") {
          action = "deleted";
        }
        const date = new Date(match.createdAt);
        const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `You ${action} • ${formattedDate}`;
      }
    }
    return "You opened recently";
  };

  const recentActivities = activities?.slice(0, 8) ?? [];

  // Folders list: real user folders only
  const rootFolders = folders ?? [];
  const displayFolders = rootFolders.slice(0, 4);

  // Files list: real user files only
  const userFiles = files ?? [];
  const displayFiles = userFiles.slice(0, 4);

  // Helper to render activity icon
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "UPLOAD":
      case "VERSION_UPLOAD":
        return <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />;
      case "DOWNLOAD":
        return <Download className="w-3.5 h-3.5 text-blue-500" />;
      case "DELETE":
      case "PERMANET_DELETE":
        return <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
      case "RESTORE":
      case "VERSION_RESTORE":
        return <History className="w-3.5 h-3.5 text-indigo-500" />;
      case "SHARE":
        return <Share2 className="w-3.5 h-3.5 text-purple-500" />;
      case "VIRUS_BLOCKED":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground relative overflow-hidden select-none">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        
        {/* Google Inset Content Window */}
        <div className="flex-grow p-3 sm:p-4 pb-24 md:pb-6 overflow-y-auto">
          <main className="min-h-full bg-card rounded-[16px] sm:rounded-[24px] border border-border/40 p-4 sm:p-6 flex flex-col space-y-4 sm:space-y-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />



            {/* Welcome Dashboard Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Workspace greeting */}
              <div className="lg:col-span-2 bg-gradient-to-br from-primary/5 via-secondary/10 to-card border border-border/30 rounded-3xl p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                {/* Glow effects */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-3.5 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vault Protected
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                    Welcome back to Drive
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground/90 font-medium max-w-xl leading-relaxed">
                    Access and manage all your documents, historical file versions, public download links, and nested directories from a secure, clean panel.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-foreground/80 mt-4 relative z-10">
                  <div className="bg-card/60 border border-border/30 px-3 py-1.5 rounded-xl">
                    Folders: <span className="text-primary">{folders?.length || 0}</span>
                  </div>
                  <div className="bg-card/60 border border-border/30 px-3 py-1.5 rounded-xl">
                    Files: <span className="text-primary">{files?.length || 0}</span>
                  </div>
                  <div className="bg-card/60 border border-border/30 px-3 py-1.5 rounded-xl hidden sm:block">
                    Antivirus: <span className="text-emerald-500">Active</span>
                  </div>
                </div>
              </div>

              {/* Storage breakdown gauge */}
              <div className="bg-gradient-to-br from-card to-secondary/10 border border-border/30 rounded-3xl p-5 sm:p-6 flex flex-col justify-between min-h-[180px] shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-muted-foreground/85 uppercase tracking-wider">Storage Usage</span>
                    <Link href="/settings" className="text-xs font-extrabold text-primary hover:underline">
                      Manage
                    </Link>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {formatBytes(usedBytes)} <span className="text-xs text-muted-foreground font-normal">of {formatBytes(limitBytes)}</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground/95 font-bold">
                    <span>{percentage.toFixed(1)}% Used</span>
                    <span>{formatBytes(limitBytes - usedBytes)} Free</span>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-2xl p-4 text-xs font-semibold">
                {errorMessage}
              </div>
            )}


            {/* Tab Swapping Header */}
            <div className="flex border-b border-border/40 mt-2">
              <button
                onClick={() => setActiveTab("suggested")}
                className={`px-5 py-2.5 text-sm font-semibold transition-all relative cursor-pointer ${
                  activeTab === "suggested"
                    ? "text-[#0b57d0] dark:text-[#8ab4f8] font-bold border-b-2 border-[#0b57d0] dark:border-[#8ab4f8]"
                    : "text-[#444746] dark:text-foreground/75 hover:text-foreground"
                }`}
              >
                Suggested
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-5 py-2.5 text-sm font-semibold transition-all relative cursor-pointer ${
                  activeTab === "activity"
                    ? "text-[#0b57d0] dark:text-[#8ab4f8] font-bold border-b-2 border-[#0b57d0] dark:border-[#8ab4f8]"
                    : "text-[#444746] dark:text-foreground/75 hover:text-foreground"
                }`}
              >
                Activity
              </button>
            </div>

            {/* Display tab contents */}
            {activeTab === "suggested" ? (
              <div className="space-y-6">
                
                {/* 1. Collapsible Suggested folders */}
                <div className="space-y-3">
                  <div 
                    onClick={() => setFoldersExpanded(!foldersExpanded)}
                    className="flex items-center gap-1.5 cursor-pointer text-[#444746] dark:text-foreground/90 hover:text-foreground select-none max-w-max"
                  >
                    {foldersExpanded ? (
                      <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-150" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform duration-150" />
                    )}
                    <h2 className="text-sm font-bold tracking-wide">Suggested folders</h2>
                  </div>

                  <AnimatePresence>
                    {foldersExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {displayFolders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/60">
                            <Folder className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-xs font-semibold">No folders yet</p>
                            <p className="text-[11px] mt-1">Create a folder using the + New button</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {displayFolders.map((folder) => {
                              const location = "location" in folder ? (folder as any).location : "in My Drive";
                              return (
                                <div
                                  key={folder.id}
                                  onClick={() => handleFolderClick(folder.id, folder.name)}
                                  className="group relative flex items-center justify-between bg-[#f0f4f9] dark:bg-[#242426] hover:bg-[#e2e8f0] dark:hover:bg-[#2d2d30] border-0 rounded-2xl p-4.5 transition-all duration-200 cursor-pointer select-none hover-card-shift"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="p-2 rounded-lg bg-card/45 dark:bg-card/25 text-[#444746] dark:text-foreground/85 shrink-0">
                                      <Folder className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-foreground truncate pr-2" title={folder.name}>
                                        {folder.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                                        {location}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => setActiveFolderMenuId(activeFolderMenuId === folder.id ? null : folder.id)}
                                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#444746] dark:text-foreground/70 cursor-pointer"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {activeFolderMenuId === folder.id && (
                                      <div
                                        ref={folderDropdownRef}
                                        className="absolute right-0 mt-1 w-44 bg-card border border-border/80 rounded-xl shadow-xl z-20 py-1.5 text-xs font-semibold overflow-hidden glass text-left"
                                      >
                                        <button
                                          onClick={() => { setActiveFolderMenuId(null); handleFolderClick(folder.id, folder.name); }}
                                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          Open Folder
                                        </button>
                                        <button
                                          disabled={true}
                                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-destructive transition-colors cursor-not-allowed text-left opacity-40"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Move to Trash
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Collapsible Suggested files section header & switcher */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => setFilesExpanded(!filesExpanded)}
                      className="flex items-center gap-1.5 cursor-pointer text-[#444746] dark:text-foreground/90 hover:text-foreground select-none max-w-max"
                    >
                      {filesExpanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-150" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 transition-transform duration-150" />
                      )}
                      <h2 className="text-sm font-bold tracking-wide">Suggested files</h2>
                    </div>

                    {/* Google style capsule pill switcher with checkmark indicators */}
                    <div className="border border-border/60 dark:border-border/40 p-0.5 rounded-full flex items-center bg-card shadow-sm select-none">
                      <button
                        onClick={() => setDashboardViewMode("list")}
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                          dashboardViewMode === "list"
                            ? "bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] shadow-sm"
                            : "text-[#444746] dark:text-foreground/60 hover:bg-secondary/40"
                        }`}
                        title="List view"
                      >
                        {dashboardViewMode === "list" && <Check className="w-3 h-3 shrink-0 text-[#001d35] dark:text-[#c2e7ff]" />}
                        <ListIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDashboardViewMode("grid")}
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                          dashboardViewMode === "grid"
                            ? "bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] shadow-sm"
                            : "text-[#444746] dark:text-foreground/60 hover:bg-secondary/40"
                        }`}
                        title="Grid view"
                      >
                        {dashboardViewMode === "grid" && <Check className="w-3 h-3 shrink-0 text-[#001d35] dark:text-[#c2e7ff]" />}
                        <GridIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Suggested files list table / grid */}
                  <AnimatePresence>
                    {filesExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {dashboardViewMode === "list" ? (
                          <div className="overflow-x-auto border-0 border-b border-border/40 bg-card rounded-2xl">
                            <table className="w-full border-collapse text-left text-xs font-semibold text-[#444746] dark:text-foreground/70">
                              <thead>
                                <tr className="border-b border-border/40 bg-card text-[11px]">
                                  <th className="py-2.5 px-5 font-bold">Name</th>
                                  <th className="py-2.5 px-5 font-bold hidden md:table-cell">Reason suggested</th>
                                  <th className="py-2.5 px-5 font-bold hidden sm:table-cell">Location</th>
                                  <th className="py-2.5 px-5 text-right font-bold w-12"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 text-foreground/90">
                                {displayFiles.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-10 text-center">
                                      <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                                        <FileUp className="w-8 h-8 opacity-40" />
                                        <p className="text-xs font-semibold">No files yet</p>
                                        <p className="text-[11px]">Upload a file using the + New button</p>
                                      </div>
                                    </td>
                                  </tr>
                                ) : displayFiles.map((file) => {
                                  const reason = getFileSuggestionReason(file.id, file.originalName);
                                  const location = "location" in file ? (file as any).location : "My Drive";
                                  const isShared = "isShared" in file ? (file as any).isShared : false;

                                  return (
                                    <tr
                                      key={file.id}
                                      className="hover:bg-[#f0f4f9] dark:hover:bg-secondary/40 transition-colors group border-b border-border/30"
                                    >
                                      {/* Name */}
                                      <td className="py-3 px-5 max-w-xs truncate">
                                        <div className="flex items-center gap-3">
                                          {renderMimeBadge(file.contentType)}
                                          <span className="truncate text-[13px] font-semibold text-foreground">
                                            {file.originalName}
                                          </span>
                                          {isShared && (
                                            <span title="Shared file">
                                              <Users className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 ml-1.5" />
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Reason */}
                                      <td className="py-3 px-5 text-muted-foreground/85 font-medium text-[13px] hidden md:table-cell">
                                        {reason}
                                      </td>

                                      {/* Location */}
                                      <td className="py-3 px-5 text-muted-foreground/85 font-medium text-[13px] hidden sm:table-cell">
                                        <div className="flex items-center gap-1.5">
                                          {location.toLowerCase().includes("shared") ? (
                                            <Users className="w-3.5 h-3.5 text-[#5f6368] dark:text-foreground/60 shrink-0" />
                                          ) : (
                                            <HardDrive className="w-3.5 h-3.5 text-[#5f6368] dark:text-foreground/60 shrink-0" />
                                          )}
                                          <span className="font-semibold text-xs text-[#5f6368] dark:text-foreground/80">{location}</span>
                                        </div>
                                      </td>

                                      {/* Actions */}
                                      <td className="py-3 px-5 text-right relative w-12">
                                        <div className="flex items-center justify-end">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveFileMenuId(activeFileMenuId === file.id ? null : file.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#444746] dark:text-foreground/70 cursor-pointer"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                        </div>

                                        {activeFileMenuId === file.id && (
                                          <div
                                            ref={fileDropdownRef}
                                            className="absolute right-5 mt-1 w-44 bg-card border border-border/80 rounded-xl shadow-xl z-20 py-1 text-xs font-semibold overflow-hidden text-left glass"
                                          >
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFileMenuId(null);
                                                FileService.downloadFile(file.id, file.originalName);
                                              }}
                                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              Download
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShareOpen(true, file.id, file.originalName);
                                                setActiveFileMenuId(null);
                                              }}
                                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                            >
                                              <Share2 className="w-3.5 h-3.5" />
                                              Share
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setMoveFileOpen(true, file.id, file.originalName);
                                                setActiveFileMenuId(null);
                                              }}
                                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                            >
                                              <Move className="w-3.5 h-3.5" />
                                              Move file
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setVersionHistoryOpen(true, file.id, file.originalName);
                                                setActiveFileMenuId(null);
                                              }}
                                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                            >
                                              <History className="w-3.5 h-3.5" />
                                              Version History
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMutation.mutate(file.id);
                                              }}
                                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-destructive transition-colors cursor-pointer text-left"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                              Move to Trash
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {displayFiles.length === 0 ? (
                              <div className="col-span-full flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60">
                                <FileUp className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-xs font-semibold">No files yet</p>
                                <p className="text-[11px] mt-1">Upload a file using the + New button</p>
                              </div>
                            ) : displayFiles.map((file) => {
                              const fileMeta = getFileIconMeta(file.contentType);
                              const FileIconComponent = fileMeta.icon;
                              const reason = getFileSuggestionReason(file.id, file.originalName);
                              const location = "location" in file ? (file as any).location : "My Drive";

                              return (
                                <div
                                  key={file.id}
                                  className="group bg-gradient-to-br from-card to-secondary/10 hover:bg-secondary/25 border border-border/40 hover:border-primary/25 rounded-[16px] transition-all duration-150 flex flex-col h-44 overflow-hidden relative hover-card-shift shadow-sm"
                                >
                                  {/* File Preview Container */}
                                  <div className="flex-grow bg-card/50 border-b border-border/30 flex items-center justify-center relative p-5 bg-radial from-card to-secondary/15">
                                    <FileIconComponent className={`w-11 h-11 transition-transform duration-250 group-hover:scale-105 ${fileMeta.color.split(' ')[0]}`} />
                                  </div>

                                  {/* File Information Info */}
                                  <div className="flex items-center justify-between p-3.5 select-none bg-card/30">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {renderMimeBadge(file.contentType)}
                                      <div className="min-w-0 flex-1 ml-1.5">
                                        <h4 className="font-bold text-xs text-foreground/90 truncate leading-snug" title={file.originalName}>
                                          {file.originalName}
                                        </h4>
                                        <p className="text-[9px] text-muted-foreground/80 mt-0.5 truncate font-semibold">
                                          {reason} • {location}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Dropdown Menu Container */}
                                    <div className="relative shrink-0 ml-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveFileMenuId(activeFileMenuId === file.id ? null : file.id);
                                        }}
                                        className="p-1 rounded-lg hover:bg-secondary/70 border border-transparent text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>

                                      {activeFileMenuId === file.id && (
                                        <div
                                          ref={fileDropdownRef}
                                          className="absolute right-0 bottom-8 w-44 bg-card border border-border/80 rounded-xl shadow-xl z-20 py-1.5 text-xs font-semibold overflow-hidden text-left glass"
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveFileMenuId(null);
                                              FileService.downloadFile(file.id, file.originalName);
                                            }}
                                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShareOpen(true, file.id, file.originalName);
                                              setActiveFileMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                          >
                                            <Share2 className="w-3.5 h-3.5" />
                                            Share
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setMoveFileOpen(true, file.id, file.originalName);
                                              setActiveFileMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                          >
                                            <Move className="w-3.5 h-3.5" />
                                            Move file
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setVersionHistoryOpen(true, file.id, file.originalName);
                                              setActiveFileMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
                                          >
                                            <History className="w-3.5 h-3.5" />
                                            Version History
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteMutation.mutate(file.id);
                                            }}
                                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-secondary text-foreground/80 hover:text-destructive transition-colors cursor-pointer text-left"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Move to Trash
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/25 pb-2">
                  <h3 className="text-xs font-bold text-[#444746] dark:text-foreground/80 tracking-wider uppercase">Recent Activity</h3>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border/60 rounded-[20px] bg-secondary/10 text-muted-foreground">
                    <p className="text-xs font-semibold">No recent activity.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/30">
                    {recentActivities.map((act: any, idx: number) => (
                      <div key={idx} className="relative flex items-start gap-4 text-xs">
                        <span className="absolute -left-[24px] top-1 p-1 rounded-full bg-card border border-border/80 shadow-sm text-foreground">
                          {getActivityIcon(act.activityType)}
                        </span>
                        <div className="flex-1 min-w-0 bg-secondary/5 border border-border/30 rounded-xl p-3">
                          <p className="font-bold text-foreground/80 leading-snug">
                            {act.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                            {formatDate(act.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Global Dialogs */}
      <CreateFolderDialog />
      <ShareDialog />
      <VersionHistoryDialog />
      <MoveFileDialog />
      <UploadQueue />
    </div>
  );
}
