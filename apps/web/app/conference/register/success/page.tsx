"use client";

import { createQrDataUrl } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const name = searchParams.get("name");
  const cat = searchParams.get("cat");
  const emailError = searchParams.get("emailError");

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Regjistrim i Pa Vlefshëm</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Tokeni i QR kodit mungon. Ju lutemi kthehuni te forma e regjistrimit dhe provoni përsëri.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qrDataUrl = createQrDataUrl(token);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "shfmk-konferenca-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleResendEmail = async () => {
    // This requires an API endpoint that can resend the email given a token or registration ID.
    // For now, we will just show an alert.
    alert("Funksionaliteti për ridërgesën e email-it do të shtohet së shpejti.");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Regjistrimi u krye me sukses!</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p>Faleminderit për regjistrimin tuaj, {name}. Ruajeni këtë kod QR pasi që është bileta juaj për konferencë.</p>
          <div className="flex justify-center">
            <img src={qrDataUrl} alt="QR Code" width={240} height={240} />
          </div>
          {cat && <p className="text-lg font-semibold">{cat}</p>}
          {emailError && <p className="text-sm text-red-500">Dërgesa e email-it dështoi: {emailError}.</p>}
          <div className="flex justify-center gap-4">
            <Button onClick={handleDownload}>Shkarko QR</Button>
            <Button onClick={handleResendEmail} variant="outline">
              Dërgo përsëri emailin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
