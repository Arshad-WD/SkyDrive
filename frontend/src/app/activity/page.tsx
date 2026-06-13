"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useQuery } from "@tanstack/react-query";
import ActivityService, { ActivityType } from "@/services/activity.service";
import { formatDate } from "@/lib/utils";
import { 
  UploadCloud, 
  Download, 
  Trash, 
  History, 
  Share2, 
  Move, 
  AlertTriangle, 
  CheckCircle2, 
  Inbox, 
  RefreshCw, 
  Compass,
  FileUp,
  RotateCcw
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ActivityPage() {
  const [filterType, setFilterType] = useState<string>("ALL");

  // Fetch activities
  const { data: activities, isLoading, isError } = useQuery({
    queryKey: ["activities"],
    queryFn: () => ActivityService.getActivities(),
  });

  // Helper to render activity icon and color
  const getActivityMeta = (type: ActivityType) => {
    switch (type) {
      case "UPLOAD":
        return {
          icon: UploadCloud,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          title: "File Uploaded",
        };
      case "VERSION_UPLOAD":
        return {
          icon: FileUp,
          color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
          title: "New Version Uploaded",
        };
      case "DOWNLOAD":
        return {
          icon: Download,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          title: "File Downloaded",
        };
      case "DELETE":
        return {
          icon: Trash,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          title: "Moved to Trash",
        };
      case "PERMANET_DELETE":
        return {
          icon: Trash,
          color: "text-red-600 bg-red-600/10 border-red-600/20",
          title: "Permanently Deleted",
        };
      case "RESTORE":
        return {
          icon: RotateCcw,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          title: "File Restored",
        };
      case "VERSION_RESTORE":
        return {
          icon: History,
          color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
          title: "Version Restored",
        };
      case "MOVE":
        return {
          icon: Move,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          title: "Moved File",
        };
      case "SHARE":
        return {
          icon: Share2,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          title: "Link Generated",
        };
      case "VIRUS_BLOCKED":
        return {
          icon: AlertTriangle,
          color: "text-red-500 bg-red-500/10 border-red-500/20 glow-primary",
          title: "Virus Scan Blocked",
        };
      default:
        return {
          icon: CheckCircle2,
          color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
          title: "System Action",
        };
    }
  };

  const filteredLogs = activities
    ? filterType === "ALL"
      ? activities
      : activities.filter((act) => act.activityType === filterType)
    : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-grow p-4 sm:p-6 pb-24 md:pb-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <History className="w-6 h-6 text-primary" />
                Activity Log
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5">
                Audit trail of uploads, downloads, sharing links, and file management changes.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {["ALL", "UPLOAD", "DOWNLOAD", "SHARE", "DELETE", "VIRUS_BLOCKED"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all-custom cursor-pointer ${
                    filterType === type
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                      : "bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {type === "VIRUS_BLOCKED" ? "Blocked" : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Activities list */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-xs">Loading activity logs...</span>
            </div>
          ) : isError ? (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-xl p-4 text-xs text-center">
              Failed to load activity logs. Please reload the page.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border/85 rounded-2xl bg-secondary/15">
              <Inbox className="w-12 h-12 text-muted-foreground/45 mb-4" />
              <h3 className="text-base font-bold text-foreground">No logs found</h3>
              <p className="text-xs text-muted-foreground/80 mt-1">There are no records matching your active filter.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {filteredLogs.map((log, idx) => {
                const { icon: Icon, color: iconStyle, title } = getActivityMeta(log.activityType);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.02 }}
                    className="relative flex gap-4 group"
                  >
                    {/* Circle timeline point */}
                    <span className={`absolute -left-[23px] top-1.5 p-1 rounded-full bg-card border border-border/80 z-10 transition-transform duration-200 group-hover:scale-105 ${iconStyle}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>

                    {/* Log Card */}
                    <div className="flex-1 bg-card hover:bg-card/90 border border-border/60 hover:border-primary/20 rounded-2xl p-4 transition-all duration-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-foreground">{title}</span>
                        <span className="text-[10px] text-muted-foreground/80 font-medium">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/90 mt-2 font-medium">
                        {log.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
