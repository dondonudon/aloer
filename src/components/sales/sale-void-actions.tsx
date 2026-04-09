"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { voidSale } from "@/lib/actions/sales";

interface Props {
  saleId: string;
  status: string;
}

/**
 * Void action button for a completed sale, shown only on the detail page.
 * Requires a mandatory reason before confirming — prevents accidental voids.
 */
export function SaleVoidActions({ saleId, status }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  if (status !== "completed") return null;

  async function handleVoid() {
    if (!reason.trim()) return;
    setLoading(true);
    const result = await voidSale(saleId, reason);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Sale voided successfully", type: "success" });
      router.refresh();
    }
    setModalOpen(false);
    setReason("");
    setLoading(false);
  }

  return (
    <>
      <Button variant="danger" onClick={() => setModalOpen(true)}>
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Void Sale
      </Button>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReason("");
        }}
        title="Void Sale"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will reverse the sale and restore inventory. This action cannot
            be undone.
          </p>
          <Input
            label="Reason for voiding"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="e.g. Customer cancelled, wrong items"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              disabled={loading || !reason.trim()}
            >
              {loading ? "Voiding..." : "Confirm Void"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
