"use client";

import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormEvent, useEffect } from "react";
import { ResendButton } from "./success/ResendButton";

const schema = z.object({
  fullName: z.string().min(1, "Emri i plotë është i detyrueshëm"),
  email: z.string().email("Email-i nuk është i vlefshëm"),
  phone: z.string().optional(),
  institution: z.string().optional(),
  category: z.enum(["farmacist", "teknik"]),
});

type State = {
  errors?: {
    fullName?: string[];
    email?: string[];
  };
  message?: string;
  success?: boolean;
  registrationId?: string; // The only piece of state we need for the redirect
  status?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = async (prevState: State, formData: FormData): Promise<State> => {
      const validatedFields = schema.safeParse({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        institution: formData.get("institution"),
        category: formData.get("category"),
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

      // Safe JSON parsing: check content-type before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
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

  useEffect(() => {
    // Redirect only for new registrations; duplicates stay on the page with resend option.
    if (state.registrationId && state.status !== "ALREADY_REGISTERED") {
      router.push(`/conference/register/success?rid=${state.registrationId}`);
    }
  }, [state.registrationId, state.status, router]);

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Regjistrohu në Konferencë</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div>
              <Label htmlFor="fullName">Emri i plotë</Label>
              <Input required id="fullName" name="fullName" placeholder="Emri i plotë" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidh kategorinë" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmacist">Farmacist</SelectItem>
                  <SelectItem value="teknik">Teknik i Farmacisë</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-semibold">Pikët OMK</p>
              <p>Pjesëmarrës pasiv (ndjekës): 12 pikë.</p>
              <p>Pjesëmarrës aktiv (vetëm ligjërues/prezentues): 15 pikë.</p>
              <p className="text-xs mt-1 text-blue-800"><strong>Shënim:</strong> 15 pikë vlejnë vetëm për ligjëruesit/prezentuesit, jo për pjesëmarrësit e zakonshëm.</p>
            </div>
            {state.success && <p className="text-sm text-green-600 font-medium">{state.message}</p>}
            {state.errors && !state.success && <p className="text-sm text-red-500">Ju lutemi korrigjoni gabimet.</p>}
            {!state.success && state.message && <p className="text-sm text-red-500">{state.message}</p>}
            {state.status === "ALREADY_REGISTERED" && state.registrationId && (
              <div className="space-y-2">
                <p className="text-sm text-blue-700 font-medium">Jeni regjistruar tashmë. Mund ta ridërgoni email-in e konfirmimit.</p>
                <ResendButton registrationId={state.registrationId} />
                <Button variant="outline" onClick={() => router.push(`/conference/register/success?rid=${state.registrationId}`)}>
                  Hap faqen e konfirmimit
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full">
              Regjistrohu & Merr QR Kodin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
