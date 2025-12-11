"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type StatusKind = "success" | "info" | "error";

interface StatusState {
  kind: StatusKind;
  message: string;
  details?: string;
}

const STORAGE_KEY = "scanner-admin-key";
const isDev = process.env.NODE_ENV !== "production";

function extractToken(raw: string): string | null {
  // Try URL with ?token=
  try {
    const url = new URL(raw);
    const tokenParam = url.searchParams.get("token");
    if (tokenParam) return tokenParam;
  } catch {
    // Not a URL, fall through
  }

  // Fallback for strings like "token=..."
  const tokenMatch = raw.match(/token=([^&]+)/);
  if (tokenMatch?.[1]) return decodeURIComponent(tokenMatch[1]);

  // Assume raw token
  return raw.trim() || null;
}

export default function ScannerClient() {
  const [pinInput, setPinInput] = useState("");
  const [pin, setPin] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [step, setStep] = useState<"pin" | "scan">("pin");
  const [isStarting, setIsStarting] = useState(false);
  const processingRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = useMemo(() => "qr-reader-container", []);

  // Load stored PIN once
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setPin(stored);
      setPinInput(stored);
      setStep("scan");
      setStatus({ kind: "info", message: "PIN u gjet. Kamera do të hapet për skanim." });
    }
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      scannerRef.current = null;
      try {
        await scanner.stop();
      } catch {
        // ignore
      }
      try {
        await scanner.clear();
      } catch {
        // ignore
      }
    }
  }, []);

  const handleCheckIn = useCallback(
    async (token: string) => {
      if (!pin) {
        setStatus({ kind: "error", message: "Vendosni PIN përpara skanimit." });
        setStep("pin");
        return;
      }

      if (processingRef.current) return;
      processingRef.current = true;
      setStatus({ kind: "info", message: "Duke verifikuar biletën..." });

      try {
        const response = await fetch("/api/admin/checkin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": pin,
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          const already = data.status === "already_checked_in" || data.alreadyCheckedIn === true;
          const fullName = data.fullName as string | undefined;
          const category = data.category as string | undefined;
          const details = fullName ? `${fullName}${category ? ` • ${category}` : ""}` : undefined;

          setStatus({
            kind: already ? "info" : "success",
            message: already ? "Pjesëmarrësi është check-in më herët" : "Check-in u krye",
            details,
          });
        } else if (response.status === 401) {
          setStatus({ kind: "error", message: "PIN i pasaktë. Vendosni përsëri PIN." });
        } else {
          setStatus({ kind: "error", message: "Bileta e pavlefshme" });
        }
      } catch (error) {
        setStatus({
          kind: "error",
          message: "Bileta e pavlefshme",
          details: error instanceof Error ? error.message : String(error),
        });
      } finally {
        processingRef.current = false;
      }
    },
    [pin, setStatus, setStep]
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      const token = extractToken(decodedText);
      if (!token) {
        setStatus({ kind: "error", message: "Nuk u gjet token në këtë QR." });
        return;
      }
      await handleCheckIn(token);
    },
    [handleCheckIn]
  );

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !pin || step !== "scan") return;

    setIsStarting(true);
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 260 },
        (decodedText) => {
          void handleScan(decodedText);
        },
        () => {
          // ignore frame failures to keep UI clean
        }
      );
      setStatus((prev) => prev ?? { kind: "info", message: "Gati për skanim." });
    } catch (error) {
      setStatus({
        kind: "error",
        message: "Nuk u hap kamera",
        details: error instanceof Error ? error.message : String(error),
      });
      await stopScanner();
    } finally {
      setIsStarting(false);
    }
  }, [handleScan, pin, readerId, step, stopScanner]);

  // Start or stop scanner based on step/pin
  useEffect(() => {
    if (step === "scan" && pin) {
      void startScanner();
    } else {
      void stopScanner();
    }
    return () => {
      void stopScanner();
    };
  }, [pin, startScanner, step, stopScanner]);

  const onSubmitPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = pinInput.trim();
    if (!value) {
      setStatus({ kind: "error", message: "Vendosni PIN-in e vullnetarit." });
      return;
    }
    localStorage.setItem(STORAGE_KEY, value);
    setPin(value);
    setStep("scan");
    setStatus({ kind: "info", message: "PIN u ruajt. Kamera do të hapet për skanim." });
  };

  const onLogout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setPin(null);
    setPinInput("");
    setStep("pin");
    setStatus(null);
    await stopScanner();
  };

  const statusColors: Record<StatusKind, string> = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scanner për Vullnetarët</h1>
          <p className="text-sm text-muted-foreground">
            Hyni me PIN dhe skanoni biletat me kamerën e telefonit.
          </p>
        </div>
        {pin && (
          <Badge variant="secondary" className="text-xs">
            PIN aktiv
          </Badge>
        )}
      </div>

      {status && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${statusColors[status.kind]}`}>
          <p className="font-semibold">{status.message}</p>
          {status.details && <p className="mt-1 text-xs opacity-80">{status.details}</p>}
        </div>
      )}

      {step === "pin" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vendos PIN-in për skanim</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmitPin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="pin">
                  PIN i vullnetarit (x-admin-key)
                </label>
                <Input
                  id="pin"
                  type="password"
                  autoComplete="off"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Shkruani PIN"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Vazhdo te skanimi
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "scan" && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Skanimi i biletave</CardTitle>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Ndrysho PIN
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-sm text-muted-foreground">
                Poziciononi QR përpara kamerës. Rezultati do të shfaqet automatikisht.
              </p>
            </div>
            <div
              id={readerId}
              className="aspect-square w-full max-w-md mx-auto rounded-lg border border-dashed border-slate-300 bg-black/5"
            >
              {isStarting && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Duke hapur kamerën...
                </div>
              )}
            </div>
            {isDev && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleScan("https://shfk.org/verify?token=dummy-token")}
                >
                  Simulo skanim (dev)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Udhëzues i Shpejtë</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>1) Hyni me PIN-in që ju ka dhënë koordinatori.</p>
          <p>2) Jepni leje kamerës kur kërkohet.</p>
          <p>3) Skanoni QR nga email/PDF i pjesëmarrësit.</p>
          <p>4) Statuset e mundshme:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>✅ Check-in u krye</li>
            <li>ℹ️ Pjesëmarrësi është check-in më herët</li>
            <li>❌ Bileta e pavlefshme ose PIN gabim</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
