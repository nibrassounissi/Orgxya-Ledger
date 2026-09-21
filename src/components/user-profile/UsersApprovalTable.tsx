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

type UserRole = "OPERATEUR" | "VALIDATEUR";
type UserStatus = "PENDING" | "APPROVED" | "DECLINED" | "SUSPENDED";

type ManagedUser = {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

type ActionKind =
  | "approve"
  | "decline"
  | "role-change"
  | "suspend"
  | "reactivate";

type ActionState = { id: number; kind: ActionKind } | null;

export default function UsersApprovalTable() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [view, setView] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [assignedRole, setAssignedRole] = useState<UserRole>("OPERATEUR");
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ users: ManagedUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const beginAction = (id: number, kind: ActionKind, role?: UserRole) => {
    setError(null);
    setAssignedRole(role ?? "OPERATEUR");
    setActionState({ id, kind });
  };

  const confirmAction = async () => {
    if (!actionState) return;

    const decisionByAction: Record<ActionKind, string> = {
      approve: "APPROVED",
      decline: "DECLINED",
      "role-change": "ROLE_CHANGE",
      suspend: "SUSPEND",
      reactivate: "REACTIVATE",
    };

    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${actionState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision: decisionByAction[actionState.kind],
          ...(actionState.kind === "approve" || actionState.kind === "role-change"
            ? { assignedRole }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update user.");

      setActionState(null);
      await loadUsers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const displayedUsers = view === "pending"
    ? users.filter((user) => user.status === "PENDING")
    : users;

  return (
    <div>
      <div className="mb-5 flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setView("pending")}
          className={`border-b-2 px-4 py-3 text-sm font-medium ${view === "pending" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500"}`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setView("all")}
          className={`border-b-2 px-4 py-3 text-sm font-medium ${view === "all" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500"}`}
        >
          All users
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
      ) : displayedUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === "pending" ? "No pending users" : "No users found"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/5">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</TableCell>
                  {view === "all" && <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Role</TableCell>}
                  {view === "all" && <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>}
                  <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Created</TableCell>
                  {view === "all" && <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>}
                  {view === "pending" && <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                {displayedUsers.map((user) => {
                  const activeAction = actionState?.id === user.id ? actionState.kind : null;
                  const needsRole = activeAction === "approve" || activeAction === "role-change";
                  const needsConfirm = activeAction !== null;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{user.name || "Not set"}</TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{user.email}</TableCell>
                      {view === "all" && <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{user.role}</TableCell>}
                      {view === "all" && <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{user.status}</TableCell>}
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="px-5 py-4 text-end">
                        {needsConfirm ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {needsRole && (
                              <select
                                value={assignedRole}
                                onChange={(event) => setAssignedRole(event.target.value as UserRole)}
                                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                <option value="OPERATEUR">Operateur</option>
                                <option value="VALIDATEUR">Validateur</option>
                              </select>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">Confirm?</span>
                            <Button size="sm" disabled={actionLoading} onClick={confirmAction}>Confirm</Button>
                            <Button size="sm" variant="outline" onClick={() => setActionState(null)}>Cancel</Button>
                          </div>
                        ) : view === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => beginAction(user.id, "approve")}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => beginAction(user.id, "decline")}>Decline</Button>
                          </div>
                        ) : user.status === "APPROVED" ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button size="sm" onClick={() => beginAction(user.id, "role-change", user.role === "OPERATEUR" ? "VALIDATEUR" : "OPERATEUR")}>Change role</Button>
                            <Button size="sm" variant="outline" onClick={() => beginAction(user.id, "suspend")}>Suspend</Button>
                          </div>
                        ) : user.status === "SUSPENDED" ? (
                          <Button size="sm" onClick={() => beginAction(user.id, "reactivate")}>Reactivate</Button>
                        ) : null}
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
