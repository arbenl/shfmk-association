"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ... (interfaces remain the same) ...
interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  category: string;
  fee_amount: number;
  currency: string;
  created_at: string;
}

interface Conference {
  id: string;
  name: string;
  slug: string;
}


export default function AdminRegistrations() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [conference, setConference] = useState<Conference | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData(search);
  }, [search]);

  async function loadData(query: string) {
    setStatus("loading");
    setError(null);
    try {
      const url = new URL("/api/admin/registrations", window.location.origin);
      if (query) url.searchParams.set("q", query);
      // No longer need to send secret header; cookie is sent automatically
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        // If unauthorized, redirect to login
        if (res.status === 401) {
            router.push('/admin/login');
        }
        throw new Error(data.error ?? "Failed to load registrations");
      }
      setRegistrations(data.registrations);
      setConference(data.conference);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  async function exportCsv() {
    const url = new URL("/api/admin/registrations", window.location.origin);
    url.searchParams.set("format", "csv");
    if (search) url.searchParams.set("q", search);
    const res = await fetch(url.toString()); // Cookie is sent automatically
    const text = await res.text();
    if (!res.ok) {
      setError(text);
      return;
    }
    const blob = new Blob([text], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "registrations.csv";
    link.click();
    document.body.removeChild(link);
  }

  async function resendEmail(registrationId: string) {
    const res = await fetch("/api/admin/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to resend");
      return;
    }
    alert("Resent!");
  }
  
  async function handleLogout() {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
  }

  const totalFees = useMemo(
    () => registrations.reduce((sum, r) => sum + Number(r.fee_amount), 0),
    [registrations]
  );
  
  // The unlock form is removed, as this page is now protected by middleware.
  
  return (
    <div className="grid" style={{ gap: 16 }}>
      <header className="grid" style={{ gap: 6 }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className="pill">Admin</span>
            <button className="btn secondary" type="button" onClick={handleLogout}>
                Logout
            </button>
        </div>
        <h1 style={{ margin: 0 }}>Registrations</h1>
        {conference && <p style={{ margin: 0, color: "#cbd5e1" }}>{conference.name}</p>}
      </header>

      {/* ... (rest of the component remains the same) ... */}
    </div>
  );
}
