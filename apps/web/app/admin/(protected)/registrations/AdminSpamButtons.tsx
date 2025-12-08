"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, Flag, Undo2, Trash2 } from "lucide-react";

interface Props {
  registrationId: string;
  isSpam: boolean;
  archived: boolean;
}

export function AdminSpamButtons({ registrationId, isSpam, archived }: Props) {
  const [loading, setLoading] = useState(false);

  const act = async (action: "mark_spam" | "unspam" | "archive" | "restore" | "delete") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error ?? "Veprimi dështoi");
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert((err as Error).message ?? "Veprimi dështoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      {isSpam ? (
        <Button size="sm" variant="outline" onClick={() => act("unspam")} disabled={loading}>
          <Undo2 className="h-4 w-4 mr-1" />
          Heq Spam
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => act("mark_spam")} disabled={loading}>
          <Flag className="h-4 w-4 mr-1" />
          Spam
        </Button>
      )}
      {archived ? (
        <Button size="sm" variant="outline" onClick={() => act("restore")} disabled={loading}>
          <Undo2 className="h-4 w-4 mr-1" />
          Rikthe
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => act("archive")} disabled={loading}>
          <Archive className="h-4 w-4 mr-1" />
          Arkivo
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={() => act("delete")} disabled={loading}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
