"use client";

import { useUIStore } from "@/store/uiStore";
import { FileService } from "@/services/file.service";
import { useMutation } from "@tanstack/react-query";
import {
  Share2, X, Copy, Check, RefreshCw,
  Lock, Globe, Save, Link2, Users, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type Tab = "link" | "access";

export default function ShareDialog() {
  const { isShareOpen, setShareOpen, activeFileId, activeFileName } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [allowedEmails, setAllowedEmails] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("link");

  const shareMutation = useMutation({
    mutationFn: (fileId: number) => FileService.shareLink(fileId),
    onSuccess: (data: any) => {
      setShareUrl(data.url);
      setIsPublic(data.isPublic);
      setAllowedEmails(data.allowedEmails || "");
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: { isPublic: boolean; allowedEmails: string }) =>
      FileService.updateShareSettings(activeFileId!, settings),
    onSuccess: (data: any) => {
      setShareUrl(data.url);
      setIsPublic(data.isPublic);
      setAllowedEmails(data.allowedEmails || "");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  const { mutate: mutateShare } = shareMutation;

  useEffect(() => {
    if (isShareOpen && activeFileId) {
      setShareUrl("");
      setAllowedEmails("");
      setIsPublic(true);
      setActiveTab("link");
      mutateShare(activeFileId);
    }
  }, [isShareOpen, activeFileId, mutateShare]);

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
    setSaveSuccess(false);
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({ isPublic, allowedEmails });
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
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.38, bounce: 0.14 }}
            className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden bg-card border border-border/40 dark:border-border/60 shadow-2xl shadow-black/20 dark:shadow-black/50"
          >
            {/* Thin top accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#0b57d0]/60 via-[#0b57d0] to-[#0b57d0]/60 dark:from-[#8ab4f8]/40 dark:via-[#8ab4f8] dark:to-[#8ab4f8]/40" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e8f0fe] dark:bg-[#004a77]/40 border border-[#d2e3fc] dark:border-[#004a77]">
                  <Share2 className="w-4 h-4 text-[#0b57d0] dark:text-[#8ab4f8]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-none">Share</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
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

            {/* Tab bar */}
            <div className="px-5 pb-0">
              <div className="flex border-b border-border/40">
                {(["link", "access"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                      activeTab === tab
                        ? "text-[#0b57d0] dark:text-[#8ab4f8]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "link" ? <Link2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    {tab === "link" ? "Share link" : "Access"}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="share-tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#0b57d0] dark:bg-[#8ab4f8]"
                        transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 min-h-[220px]">
              {shareMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#0b57d0] dark:text-[#8ab4f8]" />
                  <span className="text-xs font-medium">Generating link…</span>
                </div>
              ) : shareMutation.isError ? (
                <div className="rounded-xl p-4 bg-destructive/5 border border-destructive/20 text-destructive text-xs font-medium text-center">
                  Failed to generate sharing link. Please try again.
                </div>
              ) : (
                <AnimatePresence mode="wait">

                  {/* ── Share Link Tab ── */}
                  {activeTab === "link" && (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {/* URL row */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                          Sharing URL
                        </label>
                        <div className="flex items-center gap-2 p-1 rounded-xl border border-border/50 bg-secondary/20 dark:bg-secondary/10 focus-within:border-[#0b57d0]/40 dark:focus-within:border-[#8ab4f8]/40 transition-colors">
                          <input
                            readOnly
                            value={shareUrl}
                            placeholder="Loading…"
                            className="flex-1 px-3 py-1.5 bg-transparent text-xs font-mono focus:outline-none text-foreground/80 select-all"
                          />
                          <button
                            onClick={handleCopy}
                            disabled={!shareUrl}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-40 ${
                              copied
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                                : "bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] dark:hover:bg-[#a8c7fb] border border-transparent"
                            }`}
                          >
                            {copied
                              ? <><Check className="w-3.5 h-3.5" />Copied</>
                              : <><Copy className="w-3.5 h-3.5" />Copy</>
                            }
                          </button>
                        </div>
                      </div>

                      {/* Status pill */}
                      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                        isPublic
                          ? "bg-emerald-500/6 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/6 border border-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}>
                        {isPublic
                          ? <Globe className="w-3.5 h-3.5 shrink-0" />
                          : <Lock className="w-3.5 h-3.5 shrink-0" />
                        }
                        <span>
                          {isPublic
                            ? "Anyone with this link can view and download."
                            : "Only authorized users can access this file."
                          }
                        </span>
                      </div>

                      {/* Go to access settings */}
                      <button
                        onClick={() => setActiveTab("access")}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-border/30 hover:border-border/60 transition-all duration-150 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          Manage access permissions
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}

                  {/* ── Access Tab ── */}
                  {activeTab === "access" && (
                    <motion.div
                      key="access"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {/* Access type selector */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                          Who can access
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { label: "Public link", desc: "Anyone with the link", icon: Globe, value: true },
                            { label: "Restricted", desc: "Specific people only", icon: Lock, value: false },
                          ].map(({ label, desc, icon: Icon, value }) => {
                            const active = isPublic === value;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setIsPublic(value)}
                                className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                                  active
                                    ? "bg-[#e8f0fe] dark:bg-[#004a77]/30 border-[#0b57d0]/30 dark:border-[#8ab4f8]/30"
                                    : "bg-secondary/15 dark:bg-secondary/10 border-border/40 hover:bg-secondary/30 dark:hover:bg-secondary/20"
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg ${active ? "bg-[#0b57d0]/10 dark:bg-[#8ab4f8]/10" : "bg-secondary/50"}`}>
                                  <Icon className={`w-3.5 h-3.5 ${active ? "text-[#0b57d0] dark:text-[#8ab4f8]" : "text-muted-foreground"}`} />
                                </div>
                                <div>
                                  <p className={`text-xs font-semibold leading-none ${active ? "text-[#0b57d0] dark:text-[#8ab4f8]" : "text-foreground"}`}>
                                    {label}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Email list */}
                      <AnimatePresence>
                        {!isPublic && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                              Authorized emails
                            </label>
                            <textarea
                              rows={2}
                              value={allowedEmails}
                              onChange={(e) => setAllowedEmails(e.target.value)}
                              placeholder="john@example.com, friend@example.com"
                              className="w-full px-3 py-2.5 rounded-xl text-xs bg-secondary/20 dark:bg-secondary/10 border border-border/40 focus:border-[#0b57d0]/40 dark:focus:border-[#8ab4f8]/40 focus:outline-none text-foreground placeholder:text-muted-foreground resize-none transition-colors"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              Only logged-in users with these emails can access this file.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Save row */}
                      <div className="flex items-center justify-between pt-1">
                        <AnimatePresence>
                          {saveSuccess && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Saved!
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <div className="ml-auto">
                          <button
                            type="button"
                            onClick={handleSaveSettings}
                            disabled={updateSettingsMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0b57d0] dark:bg-[#8ab4f8] text-white dark:text-[#0f0f11] hover:bg-[#0a4ab5] dark:hover:bg-[#a8c7fb] transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                          >
                            {updateSettingsMutation.isPending
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <Save className="w-3.5 h-3.5" />
                            }
                            Apply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-5 py-3.5 border-t border-border/30 bg-secondary/10 dark:bg-secondary/5">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150 cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
