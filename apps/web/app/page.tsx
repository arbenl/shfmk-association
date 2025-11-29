import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid" style={{ gap: 32 }}>
      <header className="grid" style={{ gap: 8 }}>
        <span className="pill">Shoqata Farmaceutike e Kosovës</span>
        <h1 style={{ fontSize: 40, margin: 0 }}>Annual Conference 2024</h1>
        <p style={{ maxWidth: 720, color: "#cbd5e1" }}>
          Join peers from across Kosovo for three days of clinical updates, industry
          insights, and networking. Secure your spot and receive an offline-verifiable QR
          badge for seamless check-in.
        </p>
        <div className="actions">
          <Link href="/conference/register" className="btn">
            Register now
          </Link>
          <Link href="/admin/registrations" className="btn secondary">
            Admin
          </Link>
        </div>
      </header>
      <section className="grid card" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>Why offline QR?</h2>
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          QR codes embed a signed token (RS256). The scanner app verifies signatures using
          the public key—no internet needed at the venue. Even if Supabase or Vercel are
          down, check-ins keep flowing.
        </p>
      </section>
    </div>
  );
}
