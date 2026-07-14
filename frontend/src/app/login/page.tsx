"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuthStore } from "@/store/authStore";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] text-[#0f172a] p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-white border border-[#e2e8f0] shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] p-8 md:p-10 relative overflow-hidden"
        style={{
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.5)"
        }}
      >
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        {/* Technical layout metadata badge */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6">
          <span>vault_access_session</span>
          <span className="flex items-center gap-1 font-bold text-blue-600">
            <ShieldCheck className="w-3.5 h-3.5" /> SECURE
          </span>
        </div>

        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Cloud Node</span>
              <span className="font-extrabold text-lg tracking-tight block mt-0.5">SkyDrive Portal</span>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              Sign in to Workspace
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Enter email credentials to verify vault token ownership.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl p-3.5 text-xs font-bold shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
          {/* Email input block */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Identity ID (Email)
            </label>
            <div className={`relative flex items-center bg-[#fdfdfd] rounded-xl border transition-all duration-300 focus-within:bg-white ${
              errors.email ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="identity@skydrive.com"
                {...register("email")}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-semibold"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-600 font-bold block mt-1">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password input block */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Security Key (Password)
            </label>
            <div className={`relative flex items-center bg-[#fdfdfd] rounded-xl border transition-all duration-300 focus-within:bg-white ${
              errors.password ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-600 font-bold block mt-1">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Session remember checkbox option */}
          <div className="flex items-center">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="w-4 h-4 rounded border-slate-300 bg-white checked:bg-blue-600 text-blue-600 focus:ring-0 focus:ring-offset-0 transition duration-150 cursor-pointer"
              />
              Keep my session token verified
            </label>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(15,23,42,0.15)] active:scale-[0.98] border border-slate-800"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating identity...
              </>
            ) : (
              <>
                Confirm Credentials
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Technical Footer redirect link */}
        <div className="text-center text-xs text-slate-500 font-bold border-t border-slate-100 pt-5 mt-6">
          Need workspace access?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Initialize free account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
