"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ResendStatus = 'idle' | 'sending' | 'success' | 'error';

export function ResendButton({ registrationId }: { registrationId: string }) {
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    try {
      setResendStatus('sending');
      setResendError(null);
      const res = await fetch("/api/resend-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      // Safe JSON parsing: check content-type before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error("Serveri ktheu një përgjigje të pavlefshme.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Dërgimi dështoi");
      }
      setResendStatus('success');
    } catch (err) {
      setResendStatus('error');
      setResendError((err as Error).message);
    }
  };

  if (resendStatus === 'success') {
    return <p className="text-sm text-green-600">Emaili u ridërgua me sukses!</p>;
  }

  return (
    <>
      <Button onClick={handleResendEmail} variant="outline" disabled={resendStatus === 'sending'}>
        {resendStatus === 'sending' ? "Duke dërguar..." : "Dërgo përsëri emailin"}
      </Button>
      {resendStatus === 'error' && (
        <p className="text-sm text-red-600 mt-2">Dështoi: {resendError}</p>
      )}
    </>
  );
}
