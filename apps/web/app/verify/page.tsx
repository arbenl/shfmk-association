import { verifyRegistrationToken, generateInMemoryKeyPair } from "@shfmk/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { QR_PRIVATE_KEY_PEM } from "@/lib/env";

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

        // Check current status and perform check-in
        const { createClient } = await import("@supabase/supabase-js");
        const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import("@/lib/env");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            throw new Error("Supabase not configured");
        }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: registration, error: fetchError } = await supabase
            .from("registrations")
            .select("id, full_name, category, checked_in, checked_in_at")
            .eq("id", payload.sub)
            .single();

        if (fetchError || !registration) {
            console.error("[VERIFY] Registration fetch error:", fetchError);
            throw new Error("Regjistrimi nuk u gjet në bazën e të dhënave");
        }

        console.log("[VERIFY] Registration data:", {
            id: registration.id,
            name: registration.full_name,
            checked_in: registration.checked_in,
            checked_in_at: registration.checked_in_at
        });

        // Use optimistic locking: try to update only if checked_in is false
        // This prevents duplicate updates even if we read stale data
        console.log("[VERIFY] Attempting check-in update with optimistic lock...");
        const { data: updateData, error: updateError } = await supabase
            .from("registrations")
            .update({
                checked_in: true,
                checked_in_at: new Date().toISOString()
            })
            .eq("id", payload.sub)
            .eq("checked_in", false)  // Only update if not already checked in
            .select();

        console.log("[VERIFY] Update response:", {
            data: updateData,
            error: updateError,
            rowsAffected: updateData?.length || 0
        });

        let wasAlreadyCheckedIn = false;
        let finalRegistration = registration;

        if (updateError) {
            console.error("[VERIFY] Check-in update failed:", updateError);
            wasAlreadyCheckedIn = true; // Assume already checked in on error
        } else if (!updateData || updateData.length === 0) {
            console.log("[VERIFY] Update returned 0 rows - already checked in!");
            wasAlreadyCheckedIn = true;
            // Re-fetch to get the actual check-in time
            const { data: refetch } = await supabase
                .from("registrations")
                .select("checked_in_at")
                .eq("id", payload.sub)
                .single();
            if (refetch) {
                finalRegistration = { ...registration, checked_in: true, checked_in_at: refetch.checked_in_at };
            }
        } else {
            console.log("[VERIFY] Check-in update successful - first time!");
            wasAlreadyCheckedIn = false;
            finalRegistration = updateData[0];
        }


        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="mx-auto max-w-lg">
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${wasAlreadyCheckedIn ? 'text-yellow-600' : 'text-green-600'}`}>
                            <CheckCircle2 className="h-6 w-6" />
                            {wasAlreadyCheckedIn ? 'Tashmë i Regjistruar' : 'Check-in i Suksesshëm'}
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
                                    {payload.cat === 'farmacist' ? 'Farmacist' : 'Teknik i Farmacisë'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Konferenca:</span>
                                <span className="text-sm">{payload.conf}</span>
                            </div>
                            {wasAlreadyCheckedIn && finalRegistration.checked_in_at && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-muted-foreground">Check-in më parë:</span>
                                    <span className="text-sm">{new Date(finalRegistration.checked_in_at).toLocaleString('sq-AL')}</span>
                                </div>
                            )}
                        </div>
                        <div className={`pt-4 border-t ${wasAlreadyCheckedIn ? 'bg-yellow-50' : 'bg-green-50'} -mx-6 -mb-6 px-6 py-4 rounded-b-lg`}>
                            <p className={`text-sm font-medium text-center ${wasAlreadyCheckedIn ? 'text-yellow-800' : 'text-green-800'}`}>
                                {wasAlreadyCheckedIn
                                    ? '⚠️ Ky pjesëmarrës është regjistruar më parë.'
                                    : '✅ Pjesëmarrësi u regjistrua me sukses!'}
                            </p>
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
