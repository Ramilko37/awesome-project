"use client";

import Link from "next/link";

export function RegisterPage() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Create account</h1>
        <p className="text-sm text-[#94a6ae]">Fill in the details to get started</p>
      </div>

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-[#94a6ae]">Name</span>
          <input
            type="text"
            placeholder="John Doe"
            className="h-10 px-3 rounded-md border border-white/10 bg-white/5 text-white placeholder:text-white/30 outline-none focus:border-[#54d7ff]/60"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-[#94a6ae]">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            className="h-10 px-3 rounded-md border border-white/10 bg-white/5 text-white placeholder:text-white/30 outline-none focus:border-[#54d7ff]/60"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-[#94a6ae]">Password</span>
          <input
            type="password"
            placeholder="••••••••"
            className="h-10 px-3 rounded-md border border-white/10 bg-white/5 text-white placeholder:text-white/30 outline-none focus:border-[#54d7ff]/60"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-md bg-[#54d7ff] text-[#070d11] font-bold hover:bg-[#7ae3ff] transition-colors"
        >
          Create account
        </button>
      </form>

      <p className="text-sm text-center text-[#94a6ae]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#54d7ff] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
