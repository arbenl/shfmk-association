import { verifyRegistrationToken, generateInMemoryKeyPair } from "@shfmk/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { QR_PRIVATE_KEY_PEM } from "@/lib/env";
import { getPublicRegistrationById } from "@/lib/supabase/public";

import { createPublicKey } from "crypto";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";

interface VerifyPageProps {
    searchParams: {
        token?: string;
    };
}

async function getPublicKey(): Promise<string> {
    if (QR_PRIVATE_KEY_PEM) {
        // Derive public key from private key using Node's crypto module
        const publicKey = createPublicKey(QR_PRIVATE_KEY_PEM);

        return publicKey.export({
            type: 'spki',
            format: 'pem'
        }) as string;
    }

    // Fallback: generate temporary key pair (dev only)
    const pair = await generateInMemoryKeyPair();
    return pair.publicKeyPem;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
    const token = searchParams.token;

    if (!token) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="mx-auto max-w-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-6 w-6" />
                            Token Mungon
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Nuk u gjet asnjë token për verifikim. Ju lutemi skanoni një kod QR të vlefshëm.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    try {
        const publicKey = await getPublicKey();
        const payload = await verifyRegistrationToken(token, publicKey);

        const registration = await getPublicRegistrationById(payload.sub);

        if (!registration) {
            console.error("[VERIFY] Registration fetch error: registration not found");
            throw new Error("Regjistrimi nuk u gjet në bazën e të dhënave");
        }

        const wasAlreadyCheckedIn = registration.checked_in;
        const finalRegistration = registration;

        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="mx-auto max-w-lg">
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${wasAlreadyCheckedIn ? 'text-yellow-600' : 'text-green-600'}`}>
                            <CheckCircle2 className="h-6 w-6" />
                            {wasAlreadyCheckedIn ? 'Bileta është valide' : 'Bileta është valide'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Emri:</span>
                                <span className="font-semibold">{payload.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Kategoria:</span>
                                <Badge variant="outline">
                                    {payload.cat === 'farmacist' ? 'Farmacist' : 'Teknik'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Konferenca:</span>
                                <span className="text-sm">{payload.conf}</span>
                            </div>
                            {wasAlreadyCheckedIn && finalRegistration.checked_in_at && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-muted-foreground">Check-in:</span>
                                    <span className="text-sm">{new Date(finalRegistration.checked_in_at).toLocaleString('sq-AL')}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t -mx-6 -mb-6 px-6 py-4 rounded-b-lg bg-slate-50">
                            <p className="text-xs text-center text-slate-700">Ky kod verifikohet në hyrje nga vullnetarët.</p>
                            {wasAlreadyCheckedIn && (
                                <p className="text-xs text-center text-yellow-800 mt-2">Kjo biletë është skanuar më parë.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="mx-auto max-w-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-6 w-6" />
                            Token i Pavlefshëm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Ky kod QR është i pavlefshëm ose i skaduar. Ju lutemi kontaktoni organizatorët nëse mendoni se kjo është një gabim.
                        </p>
                        {error instanceof Error && (
                            <p className="text-xs text-red-500 mt-2">Gabim: {error.message}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }
}
