import { createQrDataUrl } from "@/lib/qr";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const token = typeof searchParams.token === "string" ? searchParams.token : null;
  const name = typeof searchParams.name === "string" ? searchParams.name : "";
  const cat = typeof searchParams.cat === "string" ? searchParams.cat : "";
  const emailError =
    typeof searchParams.emailError === "string" ? searchParams.emailError : null;

  if (!token) {
    return (
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Missing QR token</h1>
        <p>Please return to the registration form and submit again.</p>
      </div>
    );
  }

  const qrDataUrl = await createQrDataUrl(token);

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid" style={{ gap: 6 }}>
        <span className="pill">Registration complete</span>
        <h1 style={{ margin: 0 }}>Save your QR badge</h1>
        <p style={{ color: "#cbd5e1", margin: 0 }}>
          Screenshot or save the QR below. It works offline because it contains a signed token
          verifiable with the public key inside the scanner app.
        </p>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ marginBottom: 12 }}>
          {name && <strong>{name}</strong>} {cat && <span className="badge">{cat}</span>}
        </p>
        <img src={qrDataUrl} alt="QR Code" width={240} height={240} />
        <p style={{ color: "#cbd5e1" }}>Keep this QR safe; it is your ticket.</p>
        {emailError && (
          <p style={{ color: "#fca5a5" }}>
            Email delivery failed: {emailError}. Please screenshot this page.
          </p>
        )}
      </div>
    </div>
  );
}
