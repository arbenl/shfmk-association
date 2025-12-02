import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicConference } from "@/lib/supabase/public";
import RegisterFormClient from "./RegisterFormClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const { conference } = await getPublicConference();

  if (!conference) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-xl text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Regjistrimi hapet së shpejti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Konferenca nuk është publikuar ende. Regjistrimi do të hapet sapo të publikohen detajet zyrtare.
            </p>
            <Button asChild variant="outline">
              <Link href="/#kontakti">Na kontakto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RegisterFormClient />;
}
