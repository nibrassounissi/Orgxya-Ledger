"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { apiPost } from "@/lib/api";
import { useState } from "react";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiPost("/api/auth/login", { email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <ChevronLeftIcon className="rtl:rotate-180" />
          Back to dashboard
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">Sign In</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and password to sign in!</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label>Email <span className="text-error-500">*</span></Label>
              <Input type="email" placeholder="info@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </div>
            <div>
              <Label>Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="inset-e-4 absolute top-1/2 z-30 -translate-y-1/2 cursor-pointer" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-error-500" role="alert">{error}</p>}
            <Button type="submit" className="w-full" size="sm" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-gray-700 sm:text-start dark:text-gray-400">
          Don&apos;t have an account? <Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
