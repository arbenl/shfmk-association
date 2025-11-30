import { getConferenceBySlug, updateConference } from "@/lib/supabase";
import { CONFERENCE_SLUG } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { AgendaEditor } from "./AgendaEditor";

export const dynamic = "force-dynamic";

export default async function ConferencePage() {
    const conference = await getConferenceBySlug(CONFERENCE_SLUG);

    if (!conference) {
        return (
            <div className="p-8 text-center text-red-600">
                Konferenca &quot;{CONFERENCE_SLUG}&quot; nuk u gjet. Ju lutem kontrolloni bazën e të dhënave.
            </div>
        );
    }

    // Content Health Check
    const missingFields = [];
    if (!conference.start_date) missingFields.push("Data e fillimit");
    if (!conference.location) missingFields.push("Lokacioni");
    if (!conference.member_fee) missingFields.push("Çmimi për farmacistë");
    if (!conference.agenda_json || (Array.isArray(conference.agenda_json) && conference.agenda_json.length === 0)) {
        missingFields.push("Agjenda");
    }

    async function saveConference(formData: FormData) {
        "use server";

        if (!conference) return;

        const raw = {
            name: formData.get("name") as string,
            subtitle: formData.get("subtitle") as string,
            start_date: formData.get("start_date") as string, // ISO string expected or date input
            location: formData.get("location") as string,
            venue_address: formData.get("venue_address") as string,
            venue_city: formData.get("venue_city") as string,
            member_fee: Number(formData.get("member_fee")),
            non_member_fee: Number(formData.get("non_member_fee")),
            student_fee: 0,
            is_published: formData.get("is_published") === "on",
            registration_open: formData.get("registration_open") === "on",
            agenda_json: JSON.parse(formData.get("agenda_json") as string || "[]"),
        };

        await updateConference(conference.id, raw);
        revalidatePath("/admin/conference");
        revalidatePath("/"); // Update public pages
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Menaxho Konferencën</h1>
                    <p className="text-gray-500">Ndrysho detajet, agjendën dhe statusin e publikimit.</p>
                </div>
                <div className="flex items-center gap-2">
                    {missingFields.length > 0 ? (
                        <Alert variant="destructive" className="w-auto py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="ml-2 text-sm font-semibold">Kujdes: Mungojnë të dhëna</AlertTitle>
                        </Alert>
                    ) : (
                        <Alert className="w-auto py-2 border-green-200 bg-green-50 text-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="ml-2 text-sm font-semibold">Gati për publikim</AlertTitle>
                        </Alert>
                    )}
                </div>
            </div>

            {missingFields.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Konfigurimi i paplotë</AlertTitle>
                    <AlertDescription>
                        Fushat e mëposhtme janë bosh ose të paplota: <strong>{missingFields.join(", ")}</strong>.
                        Kjo mund të shkaktojë probleme në faqen publike.
                    </AlertDescription>
                </Alert>
            )}

            <form action={saveConference}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detajet Kryesore</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Titulli i Konferencës</Label>
                                    <Input id="name" name="name" defaultValue={conference.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subtitle">Nëntitulli (Opsional)</Label>
                                    <Input id="subtitle" name="subtitle" defaultValue={conference.subtitle || ""} placeholder="psh. 60 Vjetori i Themelimit" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Data dhe Ora e Fillimit</Label>
                                        <Input
                                            id="start_date"
                                            name="start_date"
                                            type="datetime-local"
                                            defaultValue={conference.start_date ? new Date(conference.start_date).toISOString().slice(0, 16) : ""}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="venue_city">Qyteti</Label>
                                        <Input id="venue_city" name="venue_city" defaultValue={conference.venue_city || ""} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Emri i Lokacionit (Hotel/Sallë)</Label>
                                    <Input id="location" name="location" defaultValue={conference.location || ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="venue_address">Adresa e Plotë</Label>
                                    <Input id="venue_address" name="venue_address" defaultValue={conference.venue_address || ""} />
                                </div>
                            </CardContent>
                        </Card>

                        <AgendaEditor initialData={conference.agenda_json} name="agenda_json" />
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        <Card className="border-blue-200 bg-blue-50/30">
                            <CardHeader>
                                <CardTitle className="text-blue-900">Statusi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Publikuar</Label>
                                        <p className="text-xs text-muted-foreground">Shfaq në faqen kryesore</p>
                                    </div>
                                    <Switch name="is_published" defaultChecked={!!conference.is_published} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Regjistrimi Hapur</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Ky status vetëm shfaq një njoftim publik; formulari i regjistrimit mbetet aktiv.
                                        </p>
                                    </div>
                                    <Switch name="registration_open" defaultChecked={!!conference.registration_open} />
                                </div>
                                <Button type="submit" className="w-full" size="lg">Ruaj Ndryshimet</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tarifat e Regjistrimit ({conference.currency})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="member_fee">Farmacist</Label>
                                    <Input id="member_fee" name="member_fee" type="number" defaultValue={conference.member_fee || 35} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="non_member_fee">Teknik i Farmacisë</Label>
                                    <Input id="non_member_fee" name="non_member_fee" type="number" defaultValue={conference.non_member_fee || 30} />
                                </div>
                                <Input type="hidden" name="student_fee" value="0" />
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </form>
        </div>
    );
}
