"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Category = "member" | "non_member" | "student";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      institution: String(formData.get("institution") ?? ""),
      category: String(formData.get("category") ?? "non_member") as Category
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Registration failed");
      }

      const params = new URLSearchParams({
        token: data.token,
        name: payload.fullName,
        cat: payload.category
      });
      if (data.emailError) {
        params.set("emailError", data.emailError);
      }
      router.push(`/conference/register/success?${params.toString()}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid" style={{ gap: 6 }}>
        <span className="pill">Conference registration</span>
        <h1 style={{ margin: 0 }}>Save your spot</h1>
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          Fill the form to receive a signed QR badge. Please use a valid email to receive your copy,
          but you will also see the QR immediately after submitting.
        </p>
      </div>

      <form className="card grid" style={{ gap: 14 }} onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <input required className="input" name="fullName" id="fullName" placeholder="Emri i plotë" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input required className="input" type="email" name="email" id="email" placeholder="email@shembull.com" />
        </div>
        <div className="grid" style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input className="input" name="phone" id="phone" placeholder="+383 ..." />
          </div>
          <div>
            <label className="label" htmlFor="institution">
              Institution
            </label>
            <input className="input" name="institution" id="institution" placeholder="QKUK / University / Pharmacy" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select className="input" name="category" id="category" defaultValue="non_member">
            <option value="member">Member</option>
            <option value="non_member">Non-member</option>
            <option value="student">Student</option>
          </select>
        </div>

        {error && (
          <div style={{ color: "#fca5a5", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Processing..." : "Submit & get QR"}
          </button>
        </div>
      </form>
    </div>
  );
}
