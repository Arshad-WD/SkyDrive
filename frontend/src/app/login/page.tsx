"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuthStore } from "@/store/authStore";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-[#0f172a] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[440px] bg-white border border-[#e2e8f0] shadow-sm rounded-2xl p-8 space-y-6"
      >
        {/* Logo and branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
              Sign in to SkyDrive
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter your credentials to access your files
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3.5 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Input Fields Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Email Address
            </label>
            <div className={`relative flex items-center bg-white rounded-xl border transition-all duration-200 ${
              errors.email ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-medium"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-600 font-semibold block">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <div className={`relative flex items-center bg-white rounded-xl border transition-all duration-200 ${
              errors.password ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-medium"
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
              <span className="text-xs text-red-600 font-semibold block">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Remember me select checkbox */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="w-4 h-4 rounded border-slate-300 bg-white checked:bg-blue-600 text-blue-600 focus:ring-0 focus:ring-offset-0 transition duration-150 cursor-pointer"
              />
              Remember my session
            </label>
          </div>

          {/* Submit Action button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Redirect sign up link */}
        <div className="text-center text-xs text-slate-500 font-semibold border-t border-slate-100 pt-4">
          New to SkyDrive?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bold"
          >
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
