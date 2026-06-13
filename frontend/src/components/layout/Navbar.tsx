"use client";

import { useAuthStore } from "@/store/authStore";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { 
  Search, 
  User as UserIcon, 
  Settings 
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function NavbarSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");

  // Keep search input in sync with URL parameter
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/files?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      router.push("/files");
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    if (pathname === "/files") {
      router.push("/files");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl hidden sm:block">
      <div className="relative w-full group rounded-full transition-all duration-200">
        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#444746] dark:text-foreground/50 group-focus-within:text-primary transition-colors duration-200" />
        <input
          type="text"
          placeholder="Get answers from Drive"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-12 pr-16 py-3 rounded-full bg-[#e9f0fa] dark:bg-secondary/35 focus:bg-card focus:shadow-md text-sm text-[#444746] dark:text-foreground placeholder-[#444746]/60 dark:placeholder-foreground/40 focus:outline-none transition-all duration-200 border border-transparent focus:border-border/30"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer bg-secondary/60 hover:bg-secondary px-2 py-0.5 rounded-full transition-all duration-150"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default function Navbar() {
  const { user } = useAuthStore();

  return (
    <header className="hidden md:flex h-16 bg-background px-6 items-center justify-between sticky top-0 z-30 w-full select-none border-b border-border/5">
      {/* Left spacer to align search bar in middle */}
      <div className="flex-1 max-w-[200px] hidden lg:block" />

      {/* Centered wide search bar */}
      <div className="flex-grow max-w-2xl mx-auto flex justify-center">
        <Suspense fallback={<div className="w-full max-w-2xl h-11 bg-secondary/20 rounded-full hidden sm:block animate-pulse" />}>
          <NavbarSearch />
        </Suspense>
      </div>

      {/* Right Section Actions */}
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        <ThemeToggle />

        {/* Settings Icon - Links to /settings */}
        <Link
          href="/settings"
          className="p-2 rounded-full hover:bg-secondary/60 text-[#444746] dark:text-foreground/70 hover:text-foreground transition-all duration-200 cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>

        <div className="h-5 w-px bg-border/40 mx-1.5 hidden sm:block" />

        {/* User profile avatar */}
        <div className="flex items-center gap-2 bg-secondary/15 hover:bg-secondary/35 border border-border/30 rounded-full p-0.5 transition-all duration-200 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/10 relative group-hover:scale-105 transition-transform duration-200">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
        </div>
      </div>
    </header>
  );
}
