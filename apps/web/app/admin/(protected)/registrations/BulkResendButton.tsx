"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function BulkResendButton({
  registrationIds,
  disabled,
}: {
  registrationIds: string[];
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!registrationIds.length) return;
    if (!confirm("Ridërgo email-in për të gjithë me status pending/dështuar?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationIds }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Ridërguar: ${data.sent}. Dështuar: ${data.failed}.`);
      } else {
        alert(`Gabim: ${data.error ?? "Bulk resend failed"}`);
      }
    } catch (error) {
      alert("Gabim gjatë ridërgimit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleResend}
      disabled={disabled || loading}
      title="Ridërgo email për të gjithë që janë pending/dështuar"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      Bulk Ridërgo
    </Button>
  );
}
