"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuthStore } from "@/store/authStore";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const loginSchema = zod.object({
  email: zod.string().email("Please enter a valid email address"),
  password: zod.string().min(1, "Password is required"),
  rememberMe: zod.boolean().optional(),
});

type LoginFormData = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginStore = useAuthStore((state) => state.login);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => AuthService.login(data),
    onSuccess: (response, variables) => {
      loginStore(response.token, variables.email);
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      router.push(redirectPath);
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setErrorMsg("");
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Brand Hero Pane (Left) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-radial from-slate-900 to-black p-12 relative overflow-hidden border-r border-border/20">
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center shadow-lg shadow-primary/25">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">SkyDrive</span>
        </div>

        {/* Hero copy */}
        <div className="my-auto max-w-lg relative z-10 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            Decentralized, premium cloud storage.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-base text-muted-foreground/80 leading-relaxed font-semibold"
          >
            Store your personal files, manage nested directories, share public download links, and manage historical versions, all under a single protected vault.
          </motion.p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground/50 relative z-10 font-semibold">
          &copy; {new Date().getFullYear()} SkyDrive Inc. All rights reserved.
        </div>
      </div>

      {/* Login Form Pane (Right) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 relative bg-radial from-secondary/5 to-background">
        <div className="absolute top-4 right-4 lg:hidden">
          {/* Logo on small screens */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Cloud className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg">SkyDrive</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8 glass p-8 sm:p-10 rounded-3xl shadow-xl border border-border/40"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm font-semibold text-muted-foreground/85">
              Enter your credentials to access your cloud drive
            </p>
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-2xl p-4 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4.5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-muted-foreground/90 uppercase tracking-wider">
                  Email Address
                </label>
                <div className={`relative group rounded-xl border bg-secondary/25 transition-all duration-200 focus-within:bg-card focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 ${
                  errors.email ? "border-destructive" : "border-border/40"
                }`}>
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    {...register("email")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent text-sm text-foreground focus:outline-none placeholder-foreground/30 transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-destructive mt-1.5 block font-semibold">
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-extrabold text-muted-foreground/90 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className={`relative group rounded-xl border bg-secondary/25 transition-all duration-200 focus-within:bg-card focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 ${
                  errors.password ? "border-destructive" : "border-border/40"
                }`}>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent text-sm text-foreground focus:outline-none placeholder-foreground/30 transition-all duration-200"
                  />
                </div>
                {errors.password && (
                  <span className="text-xs text-destructive mt-1.5 block font-semibold">
                    {errors.password.message}
                  </span>
                )}
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-4.5 h-4.5 rounded-lg border-border/60 text-primary focus:ring-primary/20 focus:ring-offset-0 transition duration-150 cursor-pointer"
                />
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm shadow-lg shadow-primary/15 hover:shadow-primary/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-primary/20"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirect */}
          <div className="text-center text-xs text-muted-foreground font-semibold">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline hover:text-primary/90"
            >
              Sign up free
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
