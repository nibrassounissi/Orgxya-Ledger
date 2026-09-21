"use client";

import { useState } from "react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change password.");
      setCurrentPassword("");
      setNewPassword("");
      setMessage(data.message);
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Unable to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Security</h4>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div><Label>Current password</Label><Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></div>
        <div><Label>New password</Label><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></div>
        {error && <p className="text-sm text-error-500" role="alert">{error}</p>}
        {message && <p className="text-sm text-success-500" role="status">{message}</p>}
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
