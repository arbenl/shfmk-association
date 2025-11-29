import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const sessions = [
    "Rritja e efikasitetit profesional përmes edukimit, integrimit dhe inovacionit",
    "Farmacia që përshtatë kujdesin shëndetësor përmes qasjes individuale ndaj pacientit",
    "Zhvillimi i qëndrueshëm i profesionit të farmacistit- marrja e përgjegjësive të reja profesionale",
    "Qëndrueshmëria ligjore dhe institucionale e farmacistit",
  ];

  const faqs = [
    {
      q: "Si funksionon hyrja me QR?",
      a: "Çdo biletë ka një kod QR unik që skanohet në hyrje për verifikim të shpejtë dhe pa kontakt.",
    },
    {
      q: "Nuk e kam marrë email-in. Çfarë të bëj?",
      a: "Ju lutemi kontrolloni folderin tuaj të spam-it. Nëse ende nuk e gjeni, mund të përdorni opsionin 'Dërgo përsëri emailin' në faqen e suksesit.",
    },
    {
      q: "A funksionon skanimi offline?",
      a: "Po, aplikacioni i skanimit është dizajnuar të funksionojë offline, duke siguruar hyrje të pandërprerë.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
          E Ardhmja e Farmacisë: Edukimi, Inovacioni dhe Qëndrueshmëria
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Një jubile i 60-vjetorit të Shoqatës Farmaceutike të Kosovës
        </p>
        <div className="mt-6">
          <p className="text-xl font-semibold">
            13 Dhjetor 2025, 08:30
          </p>
          <p className="text-lg text-muted-foreground">
            Hotel Emerald, Prishtinë
          </p>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/conference/register">Regjistrohu</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/konferenca">Detajet e konferencës</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-center">Sesionet e Konferencës</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sessions.map((session, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Sesioni {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{session}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-center">Pyetje të shpeshta</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
