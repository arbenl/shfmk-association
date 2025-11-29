import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl">Na Kontaktoni</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div>
            <h3 className="text-xl font-semibold">Informata Kontaktuese</h3>
            <p className="text-muted-foreground">
              Për çdo pyetje apo informacion, ju lutemi na kontaktoni përmes email-it apo telefonit.
            </p>
            <div className="mt-4 grid gap-2">
              <p><strong>Email:</strong> info@shfmk.org</p>
              <p><strong>Telefon:</strong> +383 44 123 456</p>
              <p><strong>Adresa:</strong> Rr. Universiteti, p.n., 10000 Prishtinë</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Dërgo një Mesazh</h3>
            <form className="grid gap-4 mt-4">
              <div>
                <Label htmlFor="name">Emri juaj</Label>
                <Input id="name" placeholder="Emri i plotë" />
              </div>
              <div>
                <Label htmlFor="email">Email juaj</Label>
                <Input type="email" id="email" placeholder="email@shembull.com" />
              </div>
              <div>
                <Label htmlFor="message">Mesazhi juaj</Label>
                <Textarea id="message" placeholder="Shkruani mesazhin tuaj këtu..." />
              </div>
              <Button type="submit">Dërgo Mesazhin</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
