"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuthStore } from "@/store/authStore";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
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
        err.response?.data?.message || "Incorrect email or password. Please try again."
      );
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setErrorMsg("");
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-white text-[#0f172a]">
      {/* Visual Welcome Side (Left) */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-slate-50 p-12 border-r border-slate-100">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">SkyDrive</span>
        </div>

        {/* Feature presentation using clear, simple human language */}
        <div className="my-auto max-w-sm space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 uppercase tracking-wider">
              Easy Cloud Storage
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              A safe home for all your files.
            </h1>
          </div>
          
          <ul className="space-y-4 text-sm text-slate-600 font-medium">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
              <span>Keep your documents, photos, and videos safe.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
              <span>Organize files inside folders easily.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
              <span>Automatically scan files to keep out viruses.</span>
            </li>
          </ul>
        </div>

        {/* Support note */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <Shield className="w-4 h-4 text-blue-500" />
          <span>Secure data protection standard.</span>
        </div>
      </div>

      {/* Input Form Side (Right) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-slate-50/30">
        <div className="w-full max-w-[420px] bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl p-8 sm:p-10">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Cloud className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">SkyDrive</span>
          </div>

          <div className="space-y-2 mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Please enter your email and password to access your drive.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-700 rounded-xl p-3.5 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className={`relative flex items-center bg-white rounded-xl border transition-all duration-200 ${
                errors.email ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
              }`}>
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@email.com"
                  {...register("email")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-600 font-semibold block">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className={`relative flex items-center bg-white rounded-xl border transition-all duration-200 ${
                errors.password ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
              }`}>
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
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

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded border-slate-300 bg-white checked:bg-blue-600 text-blue-600 focus:ring-0 focus:ring-offset-0 transition duration-150 cursor-pointer"
                />
                Remember me next time
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirect */}
          <div className="text-center text-xs text-slate-500 font-semibold border-t border-slate-100 pt-5 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bold"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
