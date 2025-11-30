import { getSiteSettings, updateSiteSettings } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const settings = await getSiteSettings();

    async function saveSettings(formData: FormData) {
        "use server";

        const raw = {
            org_name: formData.get("org_name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            phone2: formData.get("phone2") as string,
            address: formData.get("address") as string,
            city: formData.get("city") as string,
            website: formData.get("website") as string,
            facebook: formData.get("facebook") as string,
            instagram: formData.get("instagram") as string,
            linkedin: formData.get("linkedin") as string,
        };

        await updateSiteSettings(raw);
        revalidatePath("/admin/settings");
        revalidatePath("/"); // Update public pages
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cilësimet e Faqes</h1>
                <p className="text-gray-500">Menaxho të dhënat e kontaktit dhe rrjetet sociale.</p>
            </div>

            <form action={saveSettings}>
                <Card>
                    <CardHeader>
                        <CardTitle>Të Dhënat e Organizatës</CardTitle>
                        <CardDescription>Këto të dhëna shfaqen në fund të faqes (Footer).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="org_name">Emri i Organizatës</Label>
                                <Input id="org_name" name="org_name" defaultValue={settings?.org_name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Zyrtar</Label>
                                <Input id="email" name="email" type="email" defaultValue={settings?.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefoni Kryesor</Label>
                                <Input id="phone" name="phone" defaultValue={settings?.phone || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone2">Telefoni Dytësor (Opsional)</Label>
                                <Input id="phone2" name="phone2" defaultValue={settings?.phone2 || ""} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Adresa</Label>
                                <Input id="address" name="address" defaultValue={settings?.address || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Qyteti</Label>
                                <Input id="city" name="city" defaultValue={settings?.city || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website URL</Label>
                                <Input id="website" name="website" defaultValue={settings?.website || ""} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Rrjetet Sociale</CardTitle>
                        <CardDescription>Lidhjet për profilet zyrtare.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="facebook">Facebook URL</Label>
                                <Input id="facebook" name="facebook" defaultValue={settings?.facebook || ""} placeholder="https://facebook.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram URL</Label>
                                <Input id="instagram" name="instagram" defaultValue={settings?.instagram || ""} placeholder="https://instagram.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn URL</Label>
                                <Input id="linkedin" name="linkedin" defaultValue={settings?.linkedin || ""} placeholder="https://linkedin.com/..." />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" size="lg">Ruaj Ndryshimet</Button>
                </div>
            </form>
        </div>
    );
}
