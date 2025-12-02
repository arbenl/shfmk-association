import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicRegistrationById } from "@/lib/supabase/public";
import { createQrDataUrl } from "@/lib/qr";
import { ResendButton } from "./ResendButton"; // A new client component
import { PrintButton } from "./PrintButton";

interface SuccessPageProps {
  searchParams: {
    rid?: string;
  };
}

// This is now a Server Component
export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const registrationId = searchParams.rid;

  if (!registrationId) {
    return <InvalidState />;
  }

  // Fetch data directly on the server
  const registration = await getPublicRegistrationById(registrationId);

  if (!registration) {
    return <InvalidState message="Regjistrimi me këtë ID nuk u gjet." />;
  }

  const qrDataUrl = await createQrDataUrl(registration.qr_token);

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Regjistrimi u krye me sukses!</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p>Faleminderit për regjistrimin tuaj, {registration.full_name}. Ruajeni këtë kod QR pasi që është bileta juaj për konferencë.</p>
          <div className="flex justify-center bg-white p-4 rounded-lg">
            {qrDataUrl ? <Image src={qrDataUrl} alt="QR Code" width={240} height={240} /> : <div className="w-[240px] h-[240px] bg-gray-200 animate-pulse rounded-md" />}
          </div>

          <div className="text-left bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-lg text-blue-600">Detajet e Pagesës për Pjesëmarrje</h3>
            <div className="text-sm space-y-1">
              <p><strong>Banka:</strong> Pro Credit Bank</p>
              <p><strong>Nr. i llogarisë:</strong> 1110240460000163</p>
              <p><strong>Emri i llogarisë:</strong> KOSOVA FARMACEUTICAL SOCIETY</p>
              <p><strong>Adresa:</strong> Prishtinë</p>
              <p><strong>Përshkrimi:</strong> {registration.full_name}, pagesë për konferencë</p>
              <p><strong>Vlera për pagesë:</strong> {registration.fee_amount}.00 {registration.currency}</p>
              <p><strong>Pjesëmarrja:</strong> {registration.participation_type === "aktiv" ? "Pjesëmarrës aktiv" : "Pjesëmarrës pasiv"}</p>
              <p><strong>Pikët:</strong> 12 (Pjesëmarrës pasiv) / 15 (Pjesëmarrës aktiv)</p>
              <p><strong>Kategoria:</strong> {registration.category === "farmacist" ? "Farmacist" : "Teknik"}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <PrintButton disabled={!qrDataUrl} />
            {/* The Resend button is now its own Client Component to manage its state */}
            <Suspense>
              <ResendButton registrationId={registration.id} />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InvalidState({ message }: { message?: string }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-lg">
        <CardHeader><CardTitle>Regjistrim i Pavlefshëm</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          <p>{message || "Të dhënat e regjistrimit mungojnë. Ju lutemi provoni përsëri."}</p>
          <Link href="/conference/register">
            <Button variant="outline">Kthehu te Regjistrimi</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
