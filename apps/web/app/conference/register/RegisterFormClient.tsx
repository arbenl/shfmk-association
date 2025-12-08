"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResendButton } from "./success/ResendButton";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, any>) => void;
      reset?: (id?: string) => void;
    };
  }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const schema = z.object({
  fullName: z.string().min(2, "Emri i plotë është i detyrueshëm").max(80, "Emri është shumë i gjatë"),
  email: z.string().email("Email-i nuk është i vlefshëm").max(320, "Email-i është shumë i gjatë"),
  phone: z.string().optional(),
  institution: z.string().optional(),
  category: z.enum(["farmacist", "teknik"]),
  turnstileToken: z.string().min(1, "Verifikimi i sigurisë kërkohet"),
  website: z.string().optional(),
});

type State = {
  errors?: {
    fullName?: string[];
    email?: string[];
  };
  message?: string;
  success?: boolean;
  registrationId?: string;
  status?: string;
};

export default function RegisterFormClient() {
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (prevState: State, formData: FormData): Promise<State> => {
    const validatedFields = schema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      institution: formData.get("institution"),
      category: formData.get("category"),
      turnstileToken: formData.get("turnstileToken"),
      website: formData.get("website"),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Ju lutemi korrigjoni gabimet në formë.",
      };
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedFields.data),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Serveri ktheu një përgjigje të pavlefshme. Ju lutemi provoni përsëri.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Regjistrimi dështoi");
      }

      if (data.status === "ALREADY_REGISTERED") {
        return {
          success: true,
          status: data.status,
          message: data.message ?? "Jeni regjistruar tashmë.",
          registrationId: data.registrationId,
        };
      }

      return {
        registrationId: data.registrationId,
        status: data.status,
        success: true,
      };
    } catch (err) {
      return { message: (err as Error).message ?? "Një gabim i papritur ndodhi gjatë dërgimit të kërkesës." };
    }
  };

  const [state, formAction] = useFormState(handleSubmit, {});

  if (state.registrationId && state.status !== "ALREADY_REGISTERED") {
    router.push(`/conference/register/success?rid=${state.registrationId}`);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Regjistrohu në Konferencë</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div>
              <Label htmlFor="fullName">Emri dhe Mbiemri</Label>
              <Input required id="fullName" name="fullName" placeholder="Emri dhe Mbiemri" />
              {state.errors?.fullName && <p className="text-sm text-red-500">{state.errors.fullName}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input required type="email" id="email" name="email" placeholder="email@shembull.com" />
              {state.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefon (opsional)</Label>
                <Input id="phone" name="phone" placeholder="+383..." />
              </div>
              <div>
                <Label htmlFor="institution">Institucioni (opsional)</Label>
                <Input id="institution" name="institution" placeholder="QKUK / Farmaci" />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Kategoria</Label>
              <Select name="category" defaultValue="farmacist">
                <SelectTrigger className="bg-white text-slate-900">
                  <SelectValue placeholder="Zgjidh kategorinë" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900">
                  <SelectItem value="farmacist" className="hover:bg-slate-100">Farmacist</SelectItem>
                  <SelectItem value="teknik" className="hover:bg-slate-100">Teknik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <input type="hidden" name="turnstileToken" value={turnstileToken} />
            <div className="hidden" aria-hidden>
              <Label htmlFor="website">Faqja e kompanisë</Label>
              <Input id="website" name="website" autoComplete="off" tabIndex={-1} />
            </div>
            <TurnstileField onToken={setTurnstileToken} />
            {!turnstileSiteKey && (
              <p className="text-sm text-red-600">
                Konfigurimi i Turnstile mungon. Regjistrimi është i çaktivizuar për siguri.
              </p>
            )}
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-semibold">Pikët OFK</p>
              <p>Pikët: 12 (Pjesëmarrës pasiv) / 15 (Pjesëmarrës aktiv)</p>
            </div>
            {state.success && <p className="text-sm text-green-600 font-medium">{state.message}</p>}
            {state.errors && !state.success && <p className="text-sm text-red-500">Ju lutemi korrigjoni gabimet.</p>}
            {!state.success && state.message && <p className="text-sm text-red-500">{state.message}</p>}
            {state.status === "ALREADY_REGISTERED" && state.registrationId && (
              <Suspense>
                <AlreadyRegistered registrationId={state.registrationId} />
              </Suspense>
            )}
            <Button type="submit" className="w-full" disabled={!turnstileSiteKey}>
              Regjistrohu & Merr QR Kodin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AlreadyRegistered({ registrationId }: { registrationId: string }) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <p className="text-sm text-blue-700 font-medium">Jeni regjistruar tashmë. Mund ta ridërgoni email-in e konfirmimit.</p>
      <ResendButton registrationId={registrationId} />
      <Button variant="outline" onClick={() => router.push(`/conference/register/success?rid=${registrationId}`)}>
        Hap faqen e konfirmimit
      </Button>
    </div>
  );
}

function TurnstileField({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey || !containerRef.current) return;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return;
      window.turnstile.render(containerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const scriptId = "cf-turnstile-script";
    if (document.getElementById(scriptId)) {
      document.getElementById(scriptId)?.addEventListener("load", renderWidget, { once: true } as any);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.body.appendChild(script);
  }, [onToken]);

  return <div className="mt-2" ref={containerRef} />;
}
