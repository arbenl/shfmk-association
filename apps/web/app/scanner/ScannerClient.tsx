"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type StatusKind = "success" | "info" | "error";

interface ResultState {
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
  const [mode, setMode] = useState<"pin" | "scan" | "result">("pin");
  const [result, setResult] = useState<ResultState | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
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
      setMode("scan");
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
        setResult({ kind: "error", message: "Vendosni PIN përpara skanimit." });
        setMode("pin");
        return;
      }

      if (processingRef.current) return;
      processingRef.current = true;

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

          setResult({
            kind: already ? "info" : "success",
            message: already ? "Pjesëmarrësi është check-in më herët" : "Check-in u krye",
            details,
          });
          setMode("result");
        } else if (response.status === 401) {
          setResult({ kind: "error", message: "PIN i pasaktë. Vendosni përsëri PIN." });
          setMode("result");
        } else {
          setResult({ kind: "error", message: "Bileta e pavlefshme" });
          setMode("result");
        }
      } catch (error) {
        setResult({
          kind: "error",
          message: "Bileta e pavlefshme",
          details: error instanceof Error ? error.message : String(error),
        });
        setMode("result");
      } finally {
        await stopScanner();
        processingRef.current = false;
      }
    },
    [pin, stopScanner]
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      const token = extractToken(decodedText);
      if (!token) {
        setResult({ kind: "error", message: "Nuk u gjet token në këtë QR." });
        setMode("result");
        return;
      }
      await handleCheckIn(token);
    },
    [handleCheckIn]
  );

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !pin || mode !== "scan") return;

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
    } catch (error) {
      setResult({
        kind: "error",
        message: "Nuk u hap kamera",
        details: error instanceof Error ? error.message : String(error),
      });
      setMode("result");
      await stopScanner();
    } finally {
      setIsStarting(false);
    }
  }, [handleScan, mode, pin, readerId, stopScanner]);

  // Start or stop scanner based on step/pin
  useEffect(() => {
    if (mode === "scan" && pin) {
      void startScanner();
    } else {
      void stopScanner();
    }
    return () => {
      void stopScanner();
    };
  }, [mode, pin, startScanner, stopScanner]);

  const onSubmitPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = pinInput.trim();
    if (!value) {
      setPinError("Vendosni PIN-in e vullnetarit.");
      return;
    }
    setPinError(null);
    localStorage.setItem(STORAGE_KEY, value);
    setPin(value);
    setMode("scan");
  };

  const onLogout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setPin(null);
    setPinInput("");
    setMode("pin");
    setResult(null);
    await stopScanner();
  };

  const statusColors: Record<StatusKind, string> = {
    success: "bg-emerald-600 text-white",
    info: "bg-blue-600 text-white",
    error: "bg-red-600 text-white",
  };

  const handleRetry = async () => {
    await stopScanner();
    setResult(null);
    if (pin) {
      setMode("scan");
    } else {
      setMode("pin");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {mode === "pin" && (
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-10">
          <div className="flex flex-1 items-center">
            <Card className="w-full shadow-md">
              <CardHeader className="space-y-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">1. Shkruaj PIN-in</p>
                <CardTitle className="text-2xl">Scanner për vullnetarët</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hyni me PIN dhe skanoni biletat me kamerën e telefonit.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={onSubmitPin}>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-slate-800" htmlFor="pin">
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
                      className="h-12 text-base"
                    />
                    {pinError && <p className="text-sm text-red-600">{pinError}</p>}
                  </div>
                  <Button type="submit" className="h-12 w-full text-base">
                    Vazhdo te skanimi
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {mode === "scan" && (
        <div className="flex min-h-screen flex-col bg-black text-white">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-blue-300">2. Skanoni biletën</p>
              <p className="font-semibold">Vendosni QR-në në qendër të kamerës.</p>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              PIN aktiv
            </Badge>
          </div>
          <div className="flex-1">
            <div className="flex h-full items-center justify-center">
              <div
                id={readerId}
                className="aspect-[3/4] w-full max-w-3xl overflow-hidden bg-black"
              >
                {isStarting && (
                  <div className="flex h-full items-center justify-center text-sm text-white/80">
                    Duke hapur kamerën...
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2 px-4 pb-6">
            <p className="text-center text-sm text-white/80">Vendosni QR-në në qendër të kamerës.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-12 w-full text-base" onClick={onLogout}>
                Ndrysho PIN
              </Button>
              <Button variant="secondary" className="h-12 w-full text-base" onClick={handleRetry}>
                Rifresko / Anulo
              </Button>
            </div>
            {isDev && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleScan("https://shfk.org/verify?token=dummy-token")}
                  className="text-white/80"
                >
                  Simulo skanim (dev)
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "result" && (
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-10">
          <div className="flex flex-1 items-center">
            <Card className="w-full shadow-md">
              <CardHeader className="space-y-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">3. Rezultati</p>
                {result && (
                  <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${statusColors[result.kind]}`}>
                    <p>{result.message}</p>
                    {result.details && <p className="mt-1 text-xs opacity-90">{result.details}</p>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="h-12 w-full text-base"
                  onClick={() => {
                    setResult(null);
                    setMode("scan");
                  }}
                >
                  Skanoni biletën tjetër
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full text-base"
                  onClick={onLogout}
                >
                  Ndrysho PIN
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
