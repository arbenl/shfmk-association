import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, ArrowRight, CheckCircle2, Phone, Mail } from "lucide-react";
import { getPublicConference } from "@/lib/supabase/public";
import { ComingSoon } from "@/components/ComingSoon";

type AgendaItem = {
  time?: string;
  title?: string;
  speaker?: string;
  description?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LEGACY_FAQS = [
  {
    q: "Si funksionon hyrja me QR?",
    a: "Çdo biletë ka një kod QR unik që skanohet në hyrje për verifikim të shpejtë dhe pa kontakt.",
  },
  {
    q: "Nuk e kam marrë email-in. Çfarë të bëj?",
    a: "Ju lutemi kontrolloni folderin tuaj të spam-it. Nëse ende nuk e gjeni, mund të përdorni opsionin 'Dërgo përsëri emailin' në faqen e suksesit.",
  },
];

export default async function HomePage() {
  const { conference, settings } = await getPublicConference();

  const heroTitle = conference?.name || "Konferenca ShFarmK";
  const heroSubtitle =
    conference?.subtitle ||
    "Detajet e konferencës do të publikohen sapo të finalizohen.";

  // Parse agenda if string
  let agenda: AgendaItem[] = [];
  let agendaRaw = conference?.agenda_json;
  if (typeof agendaRaw === "string") {
    try { agendaRaw = JSON.parse(agendaRaw); } catch (e) { agendaRaw = []; }
  }
  if (Array.isArray(agendaRaw)) {
    agenda = agendaRaw as AgendaItem[];
  }

  if (!conference) {
    return (
      <div className="flex flex-col min-h-screen">
        <ComingSoon settings={settings} />
        <section id="kontakti" className="py-16 bg-slate-50 border-t">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Na kontaktoni</h2>
                <p className="text-slate-600">
                  Për pyetje rreth konferencës, regjistrimit apo partneriteteve, ekipi i Shoqatës Farmaceutike të Kosovës është në dispozicion.
                </p>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Adresa</p>
                      <p className="text-sm text-slate-700">{settings?.address || "Prishtinë, Kosovë"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Telefon</p>
                      <p className="text-sm text-slate-700">{settings?.phone || "+383 38 000 000"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Email</p>
                      <p className="text-sm text-slate-700">{settings?.email || "info@shfmk.org"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Mbani kontaktin</h3>
                <p className="mt-3 text-slate-600">
                  Regjistrimi do të hapet sapo konferenca të publikohet. Na shkruani dhe ekipi do t’ju njoftojë.
                </p>
                <div className="mt-6 space-y-3 text-left text-sm text-slate-700">
                  <p>• Orari: Hëne - Premte, 09:00 - 17:00</p>
                  <p>• Email: {settings?.email || "info@shfmk.org"}</p>
                  <p>• Telefon: {settings?.phone || "+383 38 000 000"}</p>
                </div>
                <div className="mt-6">
                  <Button asChild className="w-full md:w-auto">
                    <Link href={`mailto:${settings?.email || "info@shfmk.org"}`}>Njoftohu</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            {heroTitle}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <Calendar className="h-4 w-4 text-blue-600" />
              {conference.start_date ? new Date(conference.start_date).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' }) : "Së shpejti"}
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <Clock className="h-4 w-4 text-blue-600" />
              {conference.start_date ? new Date(conference.start_date).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }) : "Së shpejti"}
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
              <MapPin className="h-4 w-4 text-blue-600" />
              {conference.location || "Do të njoftohet"}, {conference.venue_city || "Kosovë"}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" asChild>
              <Link href="/conference/register">
                Regjistrohu Tani <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-slate-300 hover:bg-slate-50" asChild>
              <Link href="#agenda">Shiko Agjendën</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Conference Details */}
      <section id="konferenca" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {conference ? (
            <div className="grid items-start gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900">Detajet e Konferencës</h2>
                <p className="text-lg leading-relaxed text-slate-700">
                  {conference.subtitle || "Konferenca e sivjetme do të shërbejë si platformë për të diskutuar të ardhmen e profesionit tonë."}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card className="border-blue-100 bg-blue-50/60">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase text-blue-700">Data & Ora</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {conference.start_date
                          ? new Date(conference.start_date).toLocaleString("sq-AL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "Do të njoftohet"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-100 bg-green-50/60">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase text-green-700">Vendi</p>
                      <p className="mt-1 font-semibold text-slate-900">{conference.location || "Do të njoftohet"}</p>
                      <p className="text-sm text-slate-600">{conference.venue_city || "Kosovë"}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-100 bg-amber-50/60">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase text-amber-700 leading-tight">
                        Akredituar nga OFK, 12 pikë (pjesëmarrës pasiv) / 15 pikë (pjesëmarrës aktiv)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Sesionet kryesore</h3>
                  <span className="text-sm text-slate-500">{agenda.length} tema</span>
                </div>
                <div className="space-y-3">
                  {agenda.length === 0 ? (
                    <div className="rounded-lg bg-white/60 p-3 text-sm text-slate-600 shadow-sm">
                      Agjenda do të publikohet së shpejti.
                    </div>
                  ) : (
                    agenda.map((session, index) => (
                      <div key={session.title ?? index} className="flex items-start gap-3 rounded-lg bg-white/60 p-3 shadow-sm">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 text-center text-sm font-semibold text-blue-700 leading-10">
                          {session.time || `0${index + 1}:00`}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Sesioni {index + 1}</p>
                          <p className="text-sm text-slate-700">{session.title}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Card className="max-w-3xl mx-auto bg-slate-50">
              <CardContent className="py-10 text-center space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900">Konferenca nuk është publikuar ende</h2>
                <p className="text-slate-600">
                  Posa të hapet publikimi, do të gjeni këtu datën, vendin dhe agjendën e plotë.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Stats / Overview */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{agenda.length}</h3>
              <p className="text-slate-600">Sesione Profesionale</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1 text-center leading-tight">
                Akredituar nga OFK, 12 pikë (pjesëmarrës pasiv) / 15 pikë (pjesëmarrës aktiv)
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Agenda Section */}
      {conference && (
        <section id="agenda" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Agjenda e Konferencës</h2>
              <p className="mt-4 text-slate-600">Një program i pasur me ekspertë të fushës</p>
            </div>

            <div className="space-y-4">
              {agenda.length === 0 ? (
                <Card className="border border-dashed">
                  <CardContent className="p-6 text-center text-slate-600">
                    Agjenda do të publikohet së shpejti.
                  </CardContent>
                </Card>
              ) : (
                agenda.map((session: any, idx: number) => (
                  <Card key={idx} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                      <div className="sm:w-32 flex-shrink-0">
                        <div className="text-xl font-bold text-blue-600">{session.time || `Sesioni ${idx + 1}`}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{session.title}</h3>
                        {session.speaker && (
                          <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <span className="font-medium">{session.speaker}</span>
                          </div>
                        )}
                        {session.description && (
                          <p className="text-slate-500 text-sm leading-relaxed">{session.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Registration CTA */}
      {conference ? (
        <section className="py-20 bg-blue-900 text-white">
          <div className="container mx-auto px-4 text-center">
            {conference.registration_open === false && (
              <div className="mx-auto mb-6 flex max-w-2xl items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-blue-50">
                <CheckCircle2 className="h-4 w-4 text-blue-100" />
                Administrata ka shënuar regjistrimet si të mbyllura, por regjistrimi online mbetet aktiv. Ju mirëpresim!
              </div>
            )}
            <h2 className="text-3xl font-bold mb-6">Rezervoni vendin tuaj sot</h2>
            <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg">
              Numri i vendeve është i kufizuar. Regjistrohuni tani për të siguruar pjesëmarrjen tuaj në këtë ngjarje të rëndësishme.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12 text-left">
              <div className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
                <div className="text-sm text-blue-200 mb-1">Farmacist</div>
                <div className="text-3xl font-bold">{conference.member_fee ?? 0} {conference.currency}</div>
              </div>
              <div className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
                <div className="text-sm text-blue-200 mb-1">Teknik</div>
                <div className="text-3xl font-bold">{conference.non_member_fee ?? 0} {conference.currency}</div>
              </div>
            </div>

            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold shadow-xl" asChild>
              <Link href="/conference/register">
                Regjistrohu Tani
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-blue-50">
          <div className="container mx-auto px-4 text-center space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Regjistrimi do të hapet pasi konferenca të publikohet</h2>
            <p className="text-slate-600">Njoftime shtesë do të publikohen këtu.</p>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Pyetje të shpeshta</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {LEGACY_FAQS.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontakti" className="py-16 bg-slate-50 border-t">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Na kontaktoni</h2>
              <p className="text-slate-600">
                Për pyetje rreth konferencës, regjistrimit apo partneriteteve, ekipi i Shoqatës Farmaceutike të Kosovës është në dispozicion.
              </p>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Adresa</p>
                    <p className="text-sm text-slate-700">{settings?.address || "Prishtinë, Kosovë"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Telefon</p>
                    <p className="text-sm text-slate-700">{settings?.phone || "+383 38 000 000"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <p className="text-sm text-slate-700">{settings?.email || "info@shfmk.org"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Mbani kontaktin</h3>
              <p className="mt-3 text-slate-600">
                Regjistrimi qëndron i hapur. Nëse keni vështirësi me formularin ose pagesën, na shkruani dhe ekipi do t’ju përgjigjet shpejt.
              </p>
              <div className="mt-6 space-y-3 text-left text-sm text-slate-700">
                <p>• Orari: Hëne - Premte, 09:00 - 17:00</p>
                <p>• Vendi i konferencës: {conference?.location || "Do të njoftohet"}, {conference?.venue_city || "Kosovë"}</p>
                <p>• Regjistrimi online: Hapur 24/7</p>
              </div>
              <div className="mt-6">
                <Button asChild className="w-full md:w-auto">
                  <Link href="/conference/register">Hape formularin e regjistrimit</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
