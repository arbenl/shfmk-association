import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl">Rreth Shoqatës Farmaceutike të Kosovës</CardTitle>
        </CardHeader>
        <CardContent className="text-lg grid gap-4">
          <p>
            Shoqata Farmaceutike e Kosovës (SHFK) është organizatë profesionale që përfaqëson farmacistët në Kosovë. Që nga themelimi i saj, SHFK ka luajtur një rol kyç në zhvillimin e profesionit të farmacistit, promovimin e standardeve më të larta etike dhe profesionale, dhe në përmirësimin e shëndetit publik.
          </p>
          <p>
            Në kuadër të 60-vjetorit të themelimit, ne jemi të përkushtuar të vazhdojmë misionin tonë për të forcuar rolin e farmacistit si një anëtar i pazëvendësueshëm i ekipit shëndetësor. Kjo konferencë është një hap i rëndësishëm në këtë drejtim, duke ofruar një platformë për edukim, inovacion dhe bashkëpunim.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
