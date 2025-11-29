import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConferencePage() {
  const sessions = [
    "Rritja e efikasitetit profesional përmes edukimit, integrimit dhe inovacionit",
    "Farmacia që përshtatë kujdesin shëndetësor përmes qasjes individuale ndaj pacientit",
    "Zhvillimi i qëndrueshëm i profesionit të farmacistit- marrja e përgjegjësive të reja profesionale",
    "Qëndrueshmëria ligjore dhe institucionale e farmacistit",
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
          Detajet e Konferencës
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          E Ardhmja e Farmacisë: Edukimi, Inovacioni dhe Qëndrueshmëria
        </p>
      </section>

      <section className="mt-12">
        <p className="text-lg">
          Konferenca e sivjetme, në kuadër të 60-vjetorit të Shoqatës Farmaceutike të Kosovës, do të shërbejë si një platformë për të diskutuar të ardhmen e profesionit tonë. Do të eksplorojmë së bashku se si edukimi i vazhdueshëm, inovacioni teknologjik dhe qëndrueshmëria institucionale mund të formësojnë një të ardhme më të ndritur për farmacistët dhe pacientët në Kosovë.
        </p>
      </section>

      <section className="mt-12">
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

      <section className="mt-12 text-center">
        <h2 className="text-3xl font-bold">Orari dhe Vendi</h2>
        <p className="mt-4 text-lg text-muted-foreground">Orari i plotë do të publikohet së shpejti.</p>
        <p className="mt-2 text-lg">
          <strong>Vendi:</strong> Hotel Emerald, Prishtinë
        </p>
      </section>

      <div className="mt-12 flex justify-center">
        <Button asChild size="lg">
          <Link href="/conference/register">Regjistrohu Tani</Link>
        </Button>
      </div>
    </div>
  );
}
