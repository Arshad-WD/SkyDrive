"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { 
  Home,
  FolderOpen,
  Clock,
  Star,
  Trash2,
  Cloud,
  LogOut,
  X,
  Menu,
  FolderPlus,
  FileUp,
  FolderUp,
  Search,
  ChevronRight,
  Layers
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StorageService from "@/services/storage.service";
import { formatBytes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

const DriveLogoSvg = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
    <defs>
      <linearGradient id="yellowFace" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffca28" />
        <stop offset="100%" stopColor="#f57c00" />
      </linearGradient>
      <linearGradient id="blueFace" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#29b6f6" />
        <stop offset="100%" stopColor="#0288d1" />
      </linearGradient>
      <linearGradient id="greenFace" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#66bb6a" />
        <stop offset="100%" stopColor="#2e7d32" />
      </linearGradient>
    </defs>
    <path d="M 20,37.3 L 50,54.6 L 50,89.3 L 20,72 Z" fill="url(#blueFace)" stroke="#01579b" strokeWidth="0.5" strokeLinejoin="round" />
    <path d="M 80,37.3 L 50,54.6 L 50,89.3 L 80,72 Z" fill="url(#greenFace)" stroke="#1b5e20" strokeWidth="0.5" strokeLinejoin="round" />
    <path d="M 50,20 L 80,37.3 L 50,54.6 L 20,37.3 Z" fill="url(#yellowFace)" stroke="#b57c00" strokeWidth="0.5" strokeLinejoin="round" />
  </svg>
);

const GooglePlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
    <path fill="#4285F4" d="M 8,14 H 18 V 18 H 14 V 22 H 8 A 4,4 0 0 1 8,14 Z" />
    <path fill="#EA4335" d="M 14,8 A 4,4 0 0 1 22,8 V 18 H 18 V 14 H 14 Z" />
    <path fill="#FBBC05" d="M 22,14 H 28 A 4,4 0 0 1 28,22 H 18 V 18 H 22 Z" />
    <path fill="#34A853" d="M 14,18 H 18 V 22 H 22 V 28 A 4,4 0 0 1 14,28 Z" />
    <path stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinecap="round" d="M 18,14 V 18" />
    <path stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinecap="round" d="M 18,18 H 22" />
    <path stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinecap="round" d="M 18,18 V 22" />
    <path stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinecap="round" d="M 14,18 H 18" />
  </svg>
);

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Drive", href: "/files", icon: FolderOpen },
  { name: "Recent", href: "/activity", icon: Clock },
  { name: "Starred", href: "/files?tab=starred", icon: Star },
  { name: "Bin", href: "/trash", icon: Trash2 },
  { name: "Storage", href: "/settings", icon: Cloud },
];

// Bottom nav items shown on mobile bar
const bottomNavItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Files", href: "/files", icon: FolderOpen },
  { name: "Recent", href: "/activity", icon: Clock },
  { name: "Bin", href: "/trash", icon: Trash2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { triggerUpload, setCreateFolderOpen } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch storage info
  const { data: storage } = useQuery({
    queryKey: ["storageUsage"],
    queryFn: () => StorageService.getUsage(),
    refetchInterval: 30000,
  });

  const usedBytes = storage?.usedBytes ?? 0;
  const limitBytes = storage?.limitBytes ?? 1073741824;
  const percentage = storage?.usedPercentage ?? (usedBytes / limitBytes) * 100;

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearch.trim()) {
      router.push(`/files?search=${encodeURIComponent(mobileSearch.trim())}`);
      setMobileSearch("");
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background py-6 px-3 border-r border-border/10 select-none">
      {/* Google-Style Logo */}
      <div className="flex items-center gap-2.5 px-4.5 mb-6">
        <DriveLogoSvg />
        <span className="font-medium text-[22px] tracking-tight text-[#5f6368] dark:text-foreground/90 font-sans leading-none">
          Drive
        </span>
      </div>

      {/* Floating "+ New" Pill Button */}
      <div className="px-4.5 mb-6 relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3.5 px-6 py-3.5 rounded-full bg-card hover:bg-secondary/45 border border-border/40 hover:border-border/80 dark:border-border/60 text-foreground font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 select-none"
        >
          <GooglePlusIcon />
          <span className="text-[14px] font-medium tracking-wide text-[#3c4043] dark:text-foreground/90">New</span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-4.5 mt-2 w-64 bg-card border border-border/80 rounded-2xl shadow-xl z-30 py-1.5 text-xs font-semibold overflow-hidden glass"
            >
              <button
                onClick={() => { setDropdownOpen(false); setCreateFolderOpen(true); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/70 text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderPlus className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate text-xs font-semibold">New folder</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-semibold whitespace-nowrap shrink-0">Alt+C then F</span>
              </button>

              <button
                onClick={() => { setDropdownOpen(false); triggerUpload(); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/70 text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileUp className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate text-xs font-semibold">File upload</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-semibold whitespace-nowrap shrink-0">Alt+C then U</span>
              </button>

              <button
                onClick={() => { setDropdownOpen(false); triggerUpload(); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/70 text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderUp className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate text-xs font-semibold">Folder upload</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-semibold whitespace-nowrap shrink-0">Alt+C then I</span>
              </button>

              <div className="h-px bg-border/40 my-1" />

              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/70 text-foreground/80 hover:text-foreground transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Layers className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate text-xs font-semibold">New project</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-0.5 px-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3.5 px-6 py-2.5 rounded-full text-[13px] font-semibold transition-colors duration-200 group isolate ${
                isActive
                  ? "text-accent-foreground dark:text-[#c2e7ff] font-bold"
                  : "text-[#444746] dark:text-foreground/75 hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-y-0.5 inset-x-2 bg-[#c2e7ff] dark:bg-[#004a77] rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <item.icon className={`w-[18px] h-[18px] transition-colors duration-200 ${
                isActive ? "text-accent-foreground dark:text-[#c2e7ff]" : "text-[#444746] dark:text-foreground/70 group-hover:text-foreground"
              }`} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Storage quota display at bottom */}
      <div className="mt-auto px-4.5 pt-4 border-t border-border/10">
        <div className="bg-transparent space-y-3">
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[#0b57d0] dark:bg-[#8ab4f8] rounded-full"
            />
          </div>
          <div className="text-[11px] text-[#444746] dark:text-foreground/75 font-medium">
            {formatBytes(usedBytes)} of {formatBytes(limitBytes)} used
          </div>
          <button className="w-full mt-2 py-2 text-xs font-bold text-[#0b57d0] dark:text-[#c2e7ff] hover:bg-[#0b57d0]/5 dark:hover:bg-[#c2e7ff]/5 rounded-full border border-[#747775]/50 transition-all duration-150 cursor-pointer">
            Get more storage
          </button>
        </div>

        {/* User Avatar + Logout Row */}
        <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 select-none shadow-md">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground/90 truncate">{user?.name ?? "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-full border border-[#747775]/50 hover:border-destructive/50 hover:bg-destructive/10 text-[#444746] dark:text-foreground/85 hover:text-destructive dark:hover:text-destructive transition-all duration-150 cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 shrink-0 bg-background select-none">
        {sidebarContent}
      </aside>

      {/* ─── Mobile Top Header ─── */}
      <div className="md:hidden sticky top-0 z-40 w-full bg-background border-b border-border/30 select-none">
        {/* Row 1: Logo + Controls */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <DriveLogoSvg />
            <span className="font-semibold text-[19px] tracking-tight text-[#5f6368] dark:text-foreground/90 font-sans">SkyDrive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 select-none shadow-md cursor-pointer">
              {userInitial}
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-secondary/50 text-foreground cursor-pointer ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleMobileSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search in Drive…"
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-secondary/40 dark:bg-secondary/25 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:bg-card focus:shadow-md border border-transparent focus:border-border/30 transition-all duration-200"
            />
          </form>
        </div>
      </div>

      {/* ─── Mobile FAB ─── */}
      <div className="fixed bottom-[80px] right-5 z-40 md:hidden">
        <motion.button
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => setBottomSheetOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#c2e7ff] dark:bg-[#004a77] shadow-[0_6px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.45)] border border-[#a8d4ff] dark:border-[#005cb2] transition-all duration-150 cursor-pointer"
        >
          <GooglePlusIcon />
        </motion.button>
      </div>

      {/* ─── Mobile Bottom Sheet (Create) ─── */}
      <AnimatePresence>
        {bottomSheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBottomSheetOpen(false)}
              className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative w-full bg-card dark:bg-[#1c1c1e] border-t border-border/30 rounded-t-[28px] z-10 pt-3 pb-10 px-5 flex flex-col"
            >
              {/* Drag handle */}
              <div className="mx-auto w-9 h-1 bg-muted-foreground/25 rounded-full mb-4" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-foreground">Create new</h3>
                <button
                  onClick={() => setBottomSheetOpen(false)}
                  className="p-1.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2×2 Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "New folder",
                    icon: FolderPlus,
                    iconColor: "text-amber-500",
                    bgColor: "bg-amber-500/12 dark:bg-amber-500/15",
                    action: () => { setBottomSheetOpen(false); setCreateFolderOpen(true); }
                  },
                  {
                    label: "File upload",
                    icon: FileUp,
                    iconColor: "text-blue-500",
                    bgColor: "bg-blue-500/12 dark:bg-blue-500/15",
                    action: () => { setBottomSheetOpen(false); triggerUpload(); }
                  },
                  {
                    label: "Folder upload",
                    icon: FolderUp,
                    iconColor: "text-amber-500",
                    bgColor: "bg-amber-500/12 dark:bg-amber-500/15",
                    action: () => { setBottomSheetOpen(false); triggerUpload(); }
                  },
                  {
                    label: "New project",
                    icon: Layers,
                    iconColor: "text-sky-500",
                    bgColor: "bg-sky-500/12 dark:bg-sky-500/15",
                    action: () => setBottomSheetOpen(false)
                  }
                ].map(({ label, icon: Icon, iconColor, bgColor, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-secondary/25 dark:bg-[#242426] hover:bg-secondary/50 border border-border/15 transition-all duration-150 cursor-pointer active:scale-95"
                  >
                    <div className={`p-3 rounded-full ${bgColor}`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <span className="text-xs font-semibold text-foreground/90">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Drawer (Navigation) ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[85vw] h-full z-10 flex flex-col bg-background shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-secondary/60 text-muted-foreground hover:text-foreground z-25 w-9 h-9 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur-md border-t border-border/30 select-none">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 cursor-pointer min-w-[60px] ${
                  isActive
                    ? "text-[#0b57d0] dark:text-[#8ab4f8]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`relative p-1.5 rounded-full transition-all duration-200 ${
                  isActive ? "bg-[#c2e7ff] dark:bg-[#004a77]" : ""
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${isActive ? "font-bold" : ""}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Menu button to open full navigation drawer */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer min-w-[60px]"
          >
            <div className="p-1.5 rounded-full">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
