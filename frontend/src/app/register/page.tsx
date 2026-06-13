"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const registerSchema = zod
  .object({
    name: zod.string().min(1, "Name is required").max(50, "Name too long"),
    email: zod.string().email("Please enter a valid email address"),
    password: zod.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: zod.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = zod.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, "confirmPassword">) =>
      AuthService.register(data),
    onSuccess: () => {
      setSuccessMsg("Registration successful! Redirecting to login...");
      setErrorMsg("");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message || "Registration failed. Email might already be taken."
      );
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setErrorMsg("");
    mutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Brand Hero Pane (Left) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-radial from-slate-900 to-black p-12 relative overflow-hidden border-r border-border/20">
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
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
            Get started with your free cloud storage.
          </h1>
          <p className="text-base text-muted-foreground/80 leading-relaxed font-semibold">
            Create an account to automatically receive 1 GB of free MinIO object storage, set up your default workspace directories, and safeguard your files.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground/50 relative z-10 font-semibold">
          &copy; {new Date().getFullYear()} SkyDrive Inc. All rights reserved.
        </div>
      </div>

      {/* Register Form Pane (Right) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 relative bg-radial from-secondary/5 to-background">
        <div className="absolute top-4 right-4 lg:hidden">
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
              Create your account
            </h2>
            <p className="text-sm font-semibold text-muted-foreground/85">
              Sign up today and get 1 GB free storage space
            </p>
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive rounded-2xl p-4 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-2xl p-4 text-xs font-bold">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-muted-foreground/90 uppercase tracking-wider">
                  Full Name
                </label>
                <div className={`relative group rounded-xl border bg-secondary/25 transition-all duration-200 focus-within:bg-card focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 ${
                  errors.name ? "border-destructive" : "border-border/40"
                }`}>
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    {...register("name")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-foreground focus:outline-none placeholder-foreground/30 transition-all duration-200"
                  />
                </div>
                {errors.name && (
                  <span className="text-xs text-destructive mt-1 block font-semibold">
                    {errors.name.message}
                  </span>
                )}
              </div>

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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-foreground focus:outline-none placeholder-foreground/30 transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-destructive mt-1 block font-semibold">
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-muted-foreground/90 uppercase tracking-wider">
                  Password
                </label>
                <div className={`relative group rounded-xl border bg-secondary/25 transition-all duration-200 focus-within:bg-card focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 ${
                  errors.password ? "border-destructive" : "border-border/40"
                }`}>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-foreground focus:outline-none placeholder-foreground/30 transition-all duration-200"
                  />
                </div>
                {errors.password && (
                  <span className="text-xs text-destructive mt-1 block font-semibold">
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-muted-foreground/90 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className={`relative group rounded-xl border bg-secondary/25 transition-all duration-200 focus-within:bg-card focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 ${
                  errors.confirmPassword ? "border-destructive" : "border-border/40"
                }`}>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-foreground focus:outline-none placeholder-foreground/30 transition-all duration-200"
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-xs text-destructive mt-1 block font-semibold">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
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
                  Creating account...
                </>
              ) : (
                <>
                  Register
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirect */}
          <div className="text-center text-xs text-muted-foreground font-semibold">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline hover:text-primary/90"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
