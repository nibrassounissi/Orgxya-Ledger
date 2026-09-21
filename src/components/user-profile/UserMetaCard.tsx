"use client";

import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

export default function UserMetaCard({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string;
  role: string;
}) {
  const { isOpen, openModal, closeModal } = useModal();
  const [nameValue, setNameValue] = useState(name ?? "");
  const [emailValue, setEmailValue] = useState(email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const displayName = name || "Not set";
  const initials = (name || email).slice(0, 2).toUpperCase();

  const handleOpen = () => {
    setNameValue(name ?? "");
    setEmailValue(email);
    setError(null);
    setMessage(null);
    openModal();
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: nameValue.trim() || null, email: emailValue.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update profile.");
      setMessage("Profile updated successfully.");
      closeModal();
      window.location.reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <div className="flex flex-col gap-5 sm:flex-row xl:gap-10">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-brand-500 text-xl font-semibold text-white dark:border-gray-800">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{displayName}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{role}</p>
            </div>
            <Button size="sm" onClick={handleOpen}>Edit</Button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div><p className="mb-2 text-xs text-gray-500">Name</p><p className="text-sm font-medium text-gray-800 dark:text-white/90">{displayName}</p></div>
            <div><p className="mb-2 text-xs text-gray-500">Email address</p><p className="text-sm font-medium text-gray-800 dark:text-white/90">{email}</p></div>
            <div><p className="mb-2 text-xs text-gray-500">Role</p><p className="text-sm font-medium text-gray-800 dark:text-white/90">{role}</p></div>
          </div>
          {message && <p className="mt-4 text-sm text-success-500" role="status">{message}</p>}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[560px]">
        <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit profile</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update the fields stored on your Orgaxya Ledger account.</p>
          <div className="space-y-5">
            <div><Label>Name</Label><Input value={nameValue} onChange={(event) => setNameValue(event.target.value)} maxLength={100} placeholder="Not set" /></div>
            <div><Label>Email Address</Label><Input type="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} required /></div>
          </div>
          {error && <p className="mt-4 text-sm text-error-500" role="alert">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
