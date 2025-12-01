import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SCANNER_ANDROID_URL, SCANNER_IOS_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "SHFK Scanner",
  robots: {
    index: false,
    follow: false,
  },
};

function DownloadTile({
  label,
  href,
}: {
  label: string;
  href?: string;
}) {
  const disabled = !href;
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <p className="text-sm text-muted-foreground">
            Linku për shkarkim nuk është konfiguruar ende.
          </p>
        ) : (
          <Button asChild className="w-full text-base py-6">
            <Link href={href} prefetch={false}>
              Shkarko
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ScannerPage() {
  const missingAndroid = !SCANNER_ANDROID_URL;
  const missingIos = !SCANNER_IOS_URL;
  const missingAny = missingAndroid || missingIos;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">SHFK Scanner</h1>
          <p className="text-muted-foreground">
            Kjo faqe u dedikohet vullnetarëve të autorizuar.
          </p>
          <p className="text-xs text-muted-foreground">Ky link u dërgohet vetëm vullnetarëve.</p>
        </div>

        {missingAny && (
          <Alert>
            <AlertDescription className="text-sm">
              Linku për shkarkim nuk është konfiguruar ende. Vendosni SCANNER_ANDROID_URL dhe SCANNER_IOS_URL në ambientet e hostimit para se ta shpërndani këtë faqe.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DownloadTile label="Android Download (APK)" href={SCANNER_ANDROID_URL} />
          <DownloadTile label="iPhone Download" href={SCANNER_IOS_URL} />
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Udhëzues i Shpejtë për Vullnetarët</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>1) Hapni linkun /scanner vetëm nga telefoni juaj.</p>
            <p>2) Shkarkoni aplikacionin:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Android:</strong> Instaloni APK, lejoni instalim nga burime të panjohura në Settings &gt; Security.</li>
              <li><strong>iPhone:</strong> Ndiqni udhëzimin (TestFlight/Expo Go) pasi të hapni butonin për iPhone.</li>
            </ul>
            <p>3) Hapni aplikacionin, jepni leje për kamerën dhe vendosni sekretin <code>x-admin-key</code> nga koordinatori.</p>
            <p>4) Skanoni QR nga email/PDF i pjesëmarrësit. Statuset:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>✅ Check-in u krye</li>
              <li>ℹ️ Pjesëmarrësi është check-in më herët</li>
              <li>❌ Bileta e pavlefshme</li>
            </ul>
            <p>5) Troubleshooting: siguroni internet për sinkronizim, kontrolloni sekretin, lejet e kamerës dhe provoni sërish.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
