"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

type PendingUser = {
  id: number;
  name: string | null;
  email: string;
  role: "OPERATEUR" | "VALIDATEUR";
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
};

type UsersResponse = { users: PendingUser[] };

type ActionState = {
  id: number;
  kind: "approve" | "decline";
} | null;

export default function UsersApprovalTable() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [assignedRole, setAssignedRole] = useState<PendingUser["role"]>("OPERATEUR");
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const data = await apiGet<UsersResponse>("/api/admin/users?status=PENDING");
        if (!cancelled) setUsers(data.users);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load pending users.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const beginApprove = (id: number) => {
    setError(null);
    setAssignedRole("OPERATEUR");
    setActionState({ id, kind: "approve" });
  };

  const beginDecline = (id: number) => {
    setError(null);
    setActionState({ id, kind: "decline" });
  };

  const confirmAction = async () => {
    if (!actionState) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${actionState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          actionState.kind === "approve"
            ? { decision: "APPROVED", assignedRole }
            : { decision: "DECLINED" },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update user.");

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== actionState.id),
      );
      setActionState(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading pending users...</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400" role="alert">
          {error}
        </p>
      )}

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">No pending users</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/5">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Created</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                {users.map((user) => {
                  const isApproving = actionState?.id === user.id && actionState.kind === "approve";
                  const isDeclining = actionState?.id === user.id && actionState.kind === "decline";

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{user.name || "Not set"}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{user.email}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="px-5 py-4 text-end">
                        {isApproving ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <select
                              value={assignedRole}
                              onChange={(event) => setAssignedRole(event.target.value as PendingUser["role"])}
                              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              <option value="OPERATEUR">Operateur</option>
                              <option value="VALIDATEUR">Validateur</option>
                            </select>
                            <Button size="sm" disabled={actionLoading} onClick={confirmAction}>Confirm</Button>
                            <Button size="sm" variant="outline" onClick={() => setActionState(null)}>Cancel</Button>
                          </div>
                        ) : isDeclining ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Decline?</span>
                            <Button size="sm" disabled={actionLoading} onClick={confirmAction}>Confirm</Button>
                            <Button size="sm" variant="outline" onClick={() => setActionState(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => beginApprove(user.id)}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => beginDecline(user.id)}>Decline</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
