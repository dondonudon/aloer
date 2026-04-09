"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { createSupplier } from "@/lib/actions/suppliers";
import type { Supplier } from "@/lib/types";

interface Props {
  suppliers: Supplier[];
}

export function SuppliersClient({ suppliers }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createSupplier(formData);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Supplier created", type: "success" });
      setModalOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Suppliers
        </h2>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add Supplier
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Address
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {supplier.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {supplier.phone || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {supplier.address || "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        supplier.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {supplier.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    No suppliers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Supplier"
      >
        <form action={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" required />
          <Input label="Phone" name="phone" type="tel" />
          <Input label="Address" name="address" />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
