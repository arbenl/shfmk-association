"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [secret, setSecret] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [conference, setConference] = useState<Conference | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("shfmk_admin_secret");
    if (saved) {
      setSecret(saved);
      loadData(saved, "");
    }
  }, []);

  async function loadData(currentSecret: string, query: string) {
    setStatus("loading");
    setError(null);
    try {
      const url = new URL("/api/admin/registrations", window.location.origin);
      if (query) url.searchParams.set("q", query);
      const res = await fetch(url.toString(), {
        headers: { "x-admin-secret": currentSecret }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load registrations");
      setRegistrations(data.registrations);
      setConference(data.conference);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    window.localStorage.setItem("shfmk_admin_secret", secret);
    await loadData(secret, search);
  }

  async function exportCsv() {
    const url = new URL("/api/admin/registrations", window.location.origin);
    url.searchParams.set("format", "csv");
    if (search) url.searchParams.set("q", search);
    const res = await fetch(url.toString(), {
      headers: { "x-admin-secret": secret }
    });
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
  }

  async function resendEmail(registrationId: string) {
    const res = await fetch("/api/admin/resend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret
      },
      body: JSON.stringify({ registrationId })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to resend");
      return;
    }
    alert("Resent!");
  }

  const totalFees = useMemo(
    () => registrations.reduce((sum, r) => sum + Number(r.fee_amount), 0),
    [registrations]
  );

  if (!secret) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Admin access</h1>
        <form onSubmit={handleUnlock} className="grid" style={{ gap: 12 }}>
          <div>
            <label className="label" htmlFor="secret">
              Shared secret
            </label>
            <input
              id="secret"
              className="input"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
            />
          </div>
          <button className="btn" type="submit">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <header className="grid" style={{ gap: 6 }}>
        <span className="pill">Admin</span>
        <h1 style={{ margin: 0 }}>Registrations</h1>
        {conference && <p style={{ margin: 0, color: "#cbd5e1" }}>{conference.name}</p>}
      </header>

      <div className="card grid" style={{ gap: 12 }}>
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Search name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              loadData(secret, e.target.value);
            }}
          />
          <button className="btn secondary" type="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
        {status === "loading" && <div>Loading...</div>}
        {error && <div style={{ color: "#fca5a5" }}>{error}</div>}

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Fee</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>{reg.full_name}</td>
                  <td>{reg.email}</td>
                  <td>
                    <span className="badge">{reg.category}</span>
                  </td>
                  <td>
                    {reg.fee_amount} {reg.currency}
                  </td>
                  <td>{new Date(reg.created_at).toLocaleString()}</td>
                  <td>
                    <button className="btn secondary" type="button" onClick={() => resendEmail(reg.id)}>
                      Resend email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ color: "#cbd5e1" }}>
          Total registrations: <strong>{registrations.length}</strong> | Fees:{" "}
          <strong>{totalFees.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}
