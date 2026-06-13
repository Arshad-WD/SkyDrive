"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useQuery } from "@tanstack/react-query";
import StorageService from "@/services/storage.service";
import { useAuthStore } from "@/store/authStore";
import { formatBytes } from "@/lib/utils";
import { Settings, User as UserIcon, HardDrive, Shield, LogOut, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  // Fetch storage info
  const { data: storage, isLoading } = useQuery({
    queryKey: ["storageUsage"],
    queryFn: () => StorageService.getUsage(),
  });

  const usedBytes = storage?.usedBytes ?? 0;
  const limitBytes = storage?.limitBytes ?? 1073741824;
  const percentage = storage?.usedPercentage ?? (usedBytes / limitBytes) * 100;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-grow p-4 sm:p-6 pb-24 md:pb-6 space-y-8 max-w-3xl w-full mx-auto animate-fade-in">
          {/* Header */}
          <div className="border-b border-border/60 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              Manage your personal settings, view storage allocation, and sign out of your session.
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <UserIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Personal Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Display Name
                  </span>
                  <p className="text-sm font-semibold text-foreground bg-secondary/35 border border-border/40 rounded-xl px-4 py-2.5">
                    {user?.name || "SkyDrive User"}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Email Address
                  </span>
                  <p className="text-sm font-semibold text-foreground bg-secondary/35 border border-border/40 rounded-xl px-4 py-2.5">
                    {user?.email || "No email linked"}
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Quota Section */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <HardDrive className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Storage Plan & Quota</h3>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading storage statistics...</span>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Usage Capacity</span>
                    <span className="text-foreground">{percentage.toFixed(1)}% Used</span>
                  </div>
                  
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-xs font-semibold text-muted-foreground bg-secondary/20 rounded-2xl p-4 border border-border/40">
                    <div className="space-y-1">
                      <span className="block text-[10px] text-muted-foreground/75 uppercase tracking-wider">Used</span>
                      <span className="block font-bold text-foreground text-sm">{formatBytes(usedBytes)}</span>
                    </div>
                    <div className="space-y-1 border-x border-border/60">
                      <span className="block text-[10px] text-muted-foreground/75 uppercase tracking-wider">Remaining</span>
                      <span className="block font-bold text-foreground text-sm">{formatBytes(limitBytes - usedBytes)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] text-muted-foreground/75 uppercase tracking-wider">Plan Limit</span>
                      <span className="block font-bold text-foreground text-sm">{formatBytes(limitBytes)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Security & Session</h3>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground/80 mb-4 font-semibold">
                  Sign out of your active session on this device. This will clear the JWT token and cache databases from this browser.
                </p>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-destructive/35 hover:bg-destructive/10 text-destructive text-sm font-semibold transition-all-custom cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
