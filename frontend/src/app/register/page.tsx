"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, User as UserIcon, Loader2, ArrowRight, Eye, EyeOff, ShieldAlert } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          <span>vault_initialization</span>
          <span className="flex items-center gap-1 font-bold text-amber-600">
            <ShieldAlert className="w-3.5 h-3.5" /> FREE GRADE
          </span>
        </div>

        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-widest block">System Node</span>
              <span className="font-extrabold text-lg tracking-tight block mt-0.5">SkyDrive Setup</span>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              Create Vault Account
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Register below to claim 1 GB of protected cloud storage.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl p-3.5 text-xs font-bold shadow-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl p-3.5 text-xs font-bold shadow-sm">
            {successMsg}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Full Username
            </label>
            <div className={`relative flex items-center bg-[#fdfdfd] rounded-xl border transition-all duration-300 focus-within:bg-white ${
              errors.name ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="John Doe"
                {...register("name")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-semibold"
              />
            </div>
            {errors.name && (
              <span className="text-xs text-red-600 font-bold block mt-1">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Email Address
            </label>
            <div className={`relative flex items-center bg-[#fdfdfd] rounded-xl border transition-all duration-300 focus-within:bg-white ${
              errors.email ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-semibold"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-600 font-bold block mt-1">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Security Key
            </label>
            <div className={`relative flex items-center bg-[#fdfdfd] rounded-xl border transition-all duration-300 focus-within:bg-white ${
              errors.password ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-semibold"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Confirm Security Key
            </label>
            <div className={`relative flex items-center bg-[#fdfdfd] rounded-xl border transition-all duration-300 focus-within:bg-white ${
              errors.confirmPassword ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
            }`}>
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-transparent text-sm text-[#0f172a] focus:outline-none placeholder-slate-400 font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-red-600 font-bold block mt-1">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Action submit button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(15,23,42,0.15)] active:scale-[0.98] border border-slate-800"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Initialize Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Technical Footer redirect link */}
        <div className="text-center text-xs text-slate-500 font-bold border-t border-slate-100 pt-5 mt-6">
          Already verified key?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
