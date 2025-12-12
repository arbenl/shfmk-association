"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type StatusKind = "success" | "info" | "error";
type Mode = "pin" | "scan" | "result";

interface ResultState {
  kind: StatusKind;
  message: string;
  details?: string;
}

const STORAGE_KEY = "scanner-admin-key";
const isDev = process.env.NODE_ENV !== "production";
const DEBUG_SCANNER = process.env.NEXT_PUBLIC_DEBUG_SCANNER === "1";

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
  const [mode, setMode] = useState<Mode>("pin");
  const [result, setResult] = useState<ResultState | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [lastDecodedText, setLastDecodedText] = useState<string | null>(null);
  const [lastCheckinStatus, setLastCheckinStatus] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastDecodedRef = useRef<{ text: string; ts: number } | null>(null);
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

  // Full-screen mode: hide site chrome while on scanner page
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("scanner-fullscreen");
    return () => {
      document.body.classList.remove("scanner-fullscreen");
    };
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

  const mapResponseToResult = (res: Response, data: any): ResultState => {
    const status = data?.status;
    if (res.ok && status === "checked_in") {
      const details = data?.fullName ? `${data.fullName}${data.category ? ` • ${data.category}` : ""}` : undefined;
      return { kind: "success", message: "Check-in u krye", details };
    }
    if (res.ok && (status === "already_checked" || status === "already_checked_in")) {
      const details = data?.fullName ? `${data.fullName}${data.category ? ` • ${data.category}` : ""}` : undefined;
      return { kind: "info", message: "Pjesëmarrësi është check-in më herët", details };
    }
    if (res.ok && status === "invalid") {
      return { kind: "error", message: "Bileta e pavlefshme ose PIN gabim" };
    }
    if (res.ok && data?.ok === true && !status) {
      return { kind: "success", message: "Check-in u krye" };
    }
    return { kind: "error", message: "Bileta e pavlefshme ose PIN gabim" };
  };

  const handleCheckIn = useCallback(
    async (token: string): Promise<ResultState> => {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": pin ?? "",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json().catch(() => null);
      if (isDev) console.log("[scanner] check-in response", response.status, data);
      setLastCheckinStatus(JSON.stringify({ status: data?.status, http: response.status }));

      const mapped = mapResponseToResult(response, data);
      if (mapped.kind === "error" && isDev) {
        setLastError(`Unexpected payload: ${JSON.stringify(data)}`);
      }
      return mapped;
    },
    [pin]
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (isDev) console.log("[scanner] decoded QR:", decodedText);
      setLastDecodedText(decodedText);
      if (processingRef.current) {
        setLastError("ignored: processing");
        return;
      }
      const now = Date.now();
      if (lastDecodedRef.current && lastDecodedRef.current.text === decodedText && now - lastDecodedRef.current.ts < 2000) {
        setLastError("ignored: debounce");
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);
      lastDecodedRef.current = { text: decodedText, ts: now };
      setLastCheckinStatus(null);
      setLastError(null);

      try {
        // Dev simulation shortcuts
        if (DEBUG_SCANNER && decodedText === "dev-valid") {
          setResult({ kind: "success", message: "Check-in u krye (simuluar)" });
          setMode("result");
          return;
        }
        if (DEBUG_SCANNER && decodedText === "dev-repeat") {
          setResult({ kind: "info", message: "Pjesëmarrësi është check-in më herët (simuluar)" });
          setMode("result");
          return;
        }
        if (DEBUG_SCANNER && decodedText === "dev-invalid") {
          setResult({ kind: "error", message: "Bileta e pavlefshme ose PIN gabim (simuluar)" });
          setMode("result");
          return;
        }

        const token = extractToken(decodedText);
        if (!token) {
          setResult({ kind: "error", message: "Bileta e pavlefshme ose PIN gabim" });
          setLastError("token missing");
          setMode("result");
          return;
        }
        if (!pin) {
          setResult({ kind: "error", message: "Vendosni PIN përpara skanimit." });
          setMode("pin");
          return;
        }

        const mapped = await handleCheckIn(token);
        setResult(mapped);
        setMode("result");
      } catch (error) {
        setLastError(error instanceof Error ? error.message : String(error));
        setResult({
          kind: "error",
          message: "Bileta e pavlefshme ose PIN gabim",
          details: error instanceof Error ? error.message : String(error),
        });
        setMode("result");
      } finally {
        await stopScanner();
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [handleCheckIn, pin, stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !pin || mode !== "scan") return;

    setIsStarting(true);
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 20,
          disableFlip: true,
        },
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

  const handleRetry = useCallback(async () => {
    await stopScanner();
    setResult(null);
    processingRef.current = false;
    setIsProcessing(false);
    setLastCheckinStatus(null);
    setLastError(null);
    if (pin) {
      setMode("scan");
    } else {
      setMode("pin");
    }
  }, [pin, stopScanner]);

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
        <div className="relative min-h-screen bg-black text-white">
          <div id={readerId} className="absolute inset-0 bg-black">
            {isStarting && (
              <div className="flex h-full items-center justify-center text-sm text-white/80">
                Duke hapur kamerën...
              </div>
            )}
          </div>

          <div className="absolute top-0 left-0 right-0 px-4 py-3 text-center pointer-events-none">
            <p className="text-xs uppercase tracking-wide text-blue-300">2. Skanoni biletën</p>
            <p className="font-semibold">{isProcessing ? "Duke verifikuar..." : "Gati për skanim"}</p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-12 w-full text-base" onClick={onLogout}>
                Ndrysho PIN
              </Button>
              <Button variant="secondary" className="h-12 w-full text-base" onClick={handleRetry}>
                Rifresko / Anulo
              </Button>
            </div>
            {DEBUG_SCANNER && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white/80"
                  onClick={() => void handleScan("dev-valid")}
                >
                  Simulo valid
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white/80"
                  onClick={() => void handleScan("dev-valid")}
                >
                  Simulo repeat
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white/80"
                  onClick={() => void handleScan("dev-invalid")}
                >
                  Simulo invalid
                </Button>
              </div>
            )}
            {(isDev || DEBUG_SCANNER) && (
              <div className="mt-3 rounded-lg border border-white/20 bg-white/10 p-3 text-xs space-y-1">
                <div>lastDecoded: {lastDecodedText ?? "n/a"}</div>
                <div>lastStatus: {lastCheckinStatus ?? "n/a"}</div>
                <div>lastError: {lastError ?? "n/a"}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "result" && (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-10 text-white">
          <div className="w-full max-w-lg space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">3. Rezultati</p>
            {result && (
              <div className={`rounded-lg px-4 py-5 text-base font-semibold ${statusColors[result.kind]}`}>
                <p>{result.message}</p>
                {result.details && <p className="mt-2 text-sm opacity-90">{result.details}</p>}
              </div>
            )}
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
          </div>
        </div>
      )}
    </div>
  );
}
