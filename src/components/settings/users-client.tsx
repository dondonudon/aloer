"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import type { ManagedUser } from "@/lib/actions/users";
import { setUserRole } from "@/lib/actions/users";
import { useI18n } from "@/lib/i18n/context";
import type { UserRole } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface UsersClientProps {
  users: ManagedUser[];
  currentUserId: string;
}

export function UsersClient({ users, currentUserId }: UsersClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const roleOptions = [
    { value: "", label: t.settings.noAccess },
    { value: "owner", label: t.settings.ownerRole },
    { value: "cashier", label: t.settings.cashierRole },
  ];
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleRoleChange(userId: string, value: string) {
    setLoading(userId);
    const role = value === "" ? null : (value as UserRole);
    const result = await setUserRole(userId, role);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: role
          ? `${t.settings.roleSetTo} ${role}`
          : t.settings.accessRevoked,
        type: "success",
      });
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t.settings.userAccess}
      </h2>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                {t.settings.user}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                {t.settings.signedUp}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-44">
                {t.settings.role}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isMe = user.id === currentUserId;
              return (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                      {isMe && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                          ({t.settings.you})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    {isMe ? (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {user.role}
                      </span>
                    ) : (
                      <Select
                        options={roleOptions}
                        value={user.role ?? ""}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={loading === user.id}
                        aria-label={`Role for ${user.name}`}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-gray-400 dark:text-gray-500"
                >
                  {t.settings.noUsersFound}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t.settings.userAccessNote}
      </p>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
