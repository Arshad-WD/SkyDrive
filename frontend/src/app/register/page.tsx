"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cloud, Mail, Lock, User as UserIcon, Loader2, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
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
              Free Cloud Storage
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Get started with free storage space.
            </h1>
          </div>
          
          <p className="text-sm text-slate-600 font-semibold leading-relaxed">
            Create a free account to instantly claim **1 GB of secure space** for all your files, and access them from anywhere.
          </p>

          <ul className="space-y-4 text-sm text-slate-600 font-medium">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
              <span>1 GB free cloud storage upon signup.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
              <span>Fully private secure directories.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 font-bold">✓</span>
              <span>Real-time file virus threat analysis.</span>
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
              Create Account
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Fill in your details to set up your personal storage vault.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-700 rounded-xl p-3.5 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3.5 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <div className={`relative flex items-center bg-white rounded-xl border transition-all duration-200 ${
                errors.name ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
              }`}>
                <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>
              {errors.name && (
                <span className="text-xs text-red-600 font-semibold block">
                  {errors.name.message}
                </span>
              )}
            </div>

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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className={`relative flex items-center bg-white rounded-xl border transition-all duration-200 ${
                errors.confirmPassword ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
              }`}>
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
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
                <span className="text-xs text-red-600 font-semibold block">
                  {errors.confirmPassword.message}
                </span>
              )}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirect */}
          <div className="text-center text-xs text-slate-500 font-semibold border-t border-slate-100 pt-5 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors font-bold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
