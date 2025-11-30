"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function AdminResendButton({ registrationId }: { registrationId: string }) {
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        if (!confirm("A jeni i sigurt që doni të ridërgoni email-in?")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/resend", {
                method: "POST",
                body: JSON.stringify({ registrationId }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                alert("Email-i u dërgua me sukses!");
            } else {
                const data = await res.json();
                alert(`Gabim: ${data.error}`);
            }
        } catch (error) {
            alert("Gabim gjatë dërgimit.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={loading}
            title="Ridërgo Email"
        >
            <Send className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
        </Button>
    );
}
