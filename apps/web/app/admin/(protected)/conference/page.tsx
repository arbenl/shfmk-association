import { asTimestamptzOrNull, getConferenceBySlug, updateConference } from "@/lib/supabase";
import { CONFERENCE_SLUG } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { AgendaEditor } from "./AgendaEditor";

export const dynamic = "force-dynamic";

interface StatusToggleCardProps {
    label: string;
    description: string;
    name: string;
    defaultChecked: boolean;
}

function StatusToggleCard({ label, description, name, defaultChecked }: StatusToggleCardProps) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
            <div className="flex-1 min-w-0 space-y-1">
                <Label className="text-base font-semibold">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center justify-end gap-2 shrink-0">
                <Switch
                    name={name}
                    defaultChecked={defaultChecked}
                    aria-label={`Ndrysho statusin ${label}`}
                    className="peer h-6 w-11 cursor-pointer data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
                />
            </div>
        </div>
    );
}

export default async function ConferencePage({ searchParams }: { searchParams?: { error?: string } }) {
    const conference = await getConferenceBySlug(CONFERENCE_SLUG);
    const errorCode = searchParams?.error;
    const errorMessage = errorCode === "invalid-agenda-json"
        ? "Agjenda nuk u ruajt sepse JSON është i pavlefshëm. Korrigjoni strukturën dhe provoni përsëri."
        : null;

    if (!conference) {
        const service = createServiceClient();
        const { data: available } = await service
            .from("conferences")
            .select("name, slug, is_published")
            .order("created_at", { ascending: false });

        return (
            <div className="max-w-3xl mx-auto space-y-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Konferenca &quot;{CONFERENCE_SLUG}&quot; nuk u gjet</AlertTitle>
                    <AlertDescription>
                        Slug-u në env nuk përputhet me të dhënat. Zgjidhni një nga slug-et ekzistuese ose krijoni një konferencë të re.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Slug-et e disponueshme</CardTitle>
                        <CardDescription>
                            Përditësoni `CONFERENCE_SLUG` në env për të përputhur një nga slug-et më poshtë.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {available && available.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {available.map((row) => (
                                    <li key={row.slug} className="flex items-center justify-between rounded border p-2">
                                        <span className="font-medium">{row.slug}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {row.name} • {row.is_published ? "Publikuar" : "Draft"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nuk u gjet asnjë konferencë në bazë.</p>
                        )}
                    </CardContent>
                </Card>
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

        const agendaError = (formData.get("agenda_json_error") as string) || "";
        if (agendaError) {
            redirect("/admin/conference?error=invalid-agenda-json");
        }

        let parsedAgenda: any = [];
        try {
            const rawAgenda = (formData.get("agenda_json") as string) || "[]";
            parsedAgenda = JSON.parse(rawAgenda);
            if (!Array.isArray(parsedAgenda)) {
                throw new Error("Agenda must be an array");
            }
        } catch (err) {
            console.error("Invalid agenda JSON:", err);
            redirect("/admin/conference?error=invalid-agenda-json");
        }

        const raw = {
            name: formData.get("name") as string,
            subtitle: formData.get("subtitle") as string,
            start_date: asTimestamptzOrNull(formData.get("start_date")),
            location: formData.get("location") as string,
            venue_address: formData.get("venue_address") as string,
            venue_city: formData.get("venue_city") as string,
            member_fee: Number(formData.get("member_fee")),
            non_member_fee: Number(formData.get("non_member_fee")),
            student_fee: 0,
            is_published: formData.get("is_published") === "on",
            registration_open: formData.get("registration_open") === "on",
            agenda_json: parsedAgenda,
        };

        await updateConference(conference.id, raw);
        revalidatePath("/admin/conference");
        revalidatePath("/"); // Update public pages
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {errorMessage && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Agjenda nuk u ruajt</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
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
                                    <Label htmlFor="subtitle" className="text-base font-semibold">Përshkrim (Opsional)</Label>
                                    <Textarea
                                        id="subtitle"
                                        name="subtitle"
                                        defaultValue={conference.subtitle || ""}
                                        placeholder="psh. 60 Vjetori i Themelimit — mund të shtoni edhe detaje më të gjata për programin."
                                        className="min-h-[280px] resize-y text-base leading-relaxed p-4"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Mund të shkruani tekst të gjatë për përshkrimin e konferencës. Ruhet në të njëjtën fushë si më parë.
                                    </p>
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
                        <Card className="border-blue-200 bg-blue-50/40">
                            <CardHeader>
                                <CardTitle className="text-blue-900">Statusi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <StatusToggleCard
                                        label="Publikuar"
                                        description='Kur është e ç&apos;publikuar, publiku sheh &quot;Së shpejti&quot; dhe regjistrimi çaktivizohet.'
                                        name="is_published"
                                        defaultChecked={!!conference.is_published}
                                    />
                                    <StatusToggleCard
                                        label="Regjistrimi i hapur"
                                        description="Ky status vetëm shfaq një njoftim publik; formulari i regjistrimit mbetet aktiv."
                                        name="registration_open"
                                        defaultChecked={!!conference.registration_open}
                                    />
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
                                    <Label htmlFor="non_member_fee">Teknik</Label>
                                <Input id="non_member_fee" name="non_member_fee" type="number" defaultValue={conference.non_member_fee || 35} />
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
