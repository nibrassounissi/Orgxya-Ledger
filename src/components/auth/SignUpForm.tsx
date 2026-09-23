"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Link } from "@/i18n/navigation";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { apiPost } from "@/lib/api";
import { useState } from "react";

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const data = await apiPost<{ message: string }>("/api/auth/register", {
        name: `${firstName} ${lastName}`.trim() || null,
        email,
        password,
      });
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <ChevronLeftIcon className="rtl:rotate-180" />
          Back to dashboard
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">Sign Up</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your details to create an account.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>First Name<span className="text-error-500">*</span></Label>
                <Input type="text" placeholder="Enter your first name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </div>
              <div>
                <Label>Last Name<span className="text-error-500">*</span></Label>
                <Input type="text" placeholder="Enter your last name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </div>
            </div>
            <div>
              <Label>Email<span className="text-error-500">*</span></Label>
              <Input type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </div>
            <div>
              <Label>Password<span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input placeholder="Enter your password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="inset-e-4 absolute top-1/2 z-30 -translate-y-1/2 cursor-pointer" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-error-500" role="alert">{error}</p>}
            {message && <p className="text-sm text-success-500" role="status">{message}</p>}
            <div className="flex items-start gap-3">
              <Checkbox className="h-5 w-5" checked={isChecked} onChange={setIsChecked} />
              <p className="font-normal text-gray-500 dark:text-gray-400">By creating an account means you agree to the Terms and Conditions and our Privacy Policy.</p>
            </div>
            <button type="submit" disabled={loading || !isChecked} className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50">
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-gray-700 sm:text-start dark:text-gray-400">
          Already have an account? <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
