"use client";

import { Check, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  cancelPurchaseOrder,
  receivePurchaseOrder,
} from "@/lib/actions/purchases";

interface Props {
  poId: string;
  status: string;
}

export function PODetailActions({ poId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  if (status !== "draft") return null;

  async function handleReceive() {
    setLoading(true);
    const result = await receivePurchaseOrder(poId);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Purchase order received", type: "success" });
      router.refresh();
    }
    setLoading(false);
  }

  async function handleCancel() {
    setLoading(true);
    const result = await cancelPurchaseOrder(poId);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Purchase order cancelled", type: "success" });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handleReceive} disabled={loading}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Receive
        </Button>
        <Button variant="danger" onClick={handleCancel} disabled={loading}>
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancel PO
        </Button>
      </div>
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
