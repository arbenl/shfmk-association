import { getConferenceBySlug, listRegistrations, countRegistrations } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AdminResendButton } from "./AdminResendButton";
import { ExportButton } from "./ExportButton";

export const dynamic = "force-dynamic";

export default async function AdminRegistrations({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const conference = await getConferenceBySlug();
  if (!conference) {
    return <div>Konferenca nuk u gjet</div>;
  }

  const registrations = await listRegistrations({
    conferenceId: conference.id,
    search: searchParams.q,
    limit: 1000, // Reasonable limit for now
  });

  const totalCount = await countRegistrations(conference.id);
  const checkedInCount = registrations.filter((r) => r.checked_in).length;

  // Calculate stats from the fetched list (approximation if limit is hit, but good enough for MVP)
  const memberCount = registrations.filter(r => r.category === 'member').length;
  const nonMemberCount = registrations.filter(r => r.category === 'non_member').length;
  const studentCount = registrations.filter(r => r.category === 'student').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pjesëmarrës
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}% e totalit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Të Hyra (Vlerësim)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.reduce((acc, r) => acc + r.fee_amount, 0)} {conference.currency}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kategoritë
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div className="flex justify-between"><span>Anëtarë:</span> <span>{memberCount}</span></div>
              <div className="flex justify-between"><span>Jo-Anëtarë:</span> <span>{nonMemberCount}</span></div>
              <div className="flex justify-between"><span>Studentë:</span> <span>{studentCount}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form className="flex gap-2 w-full md:w-auto">
          <Input
            name="q"
            placeholder="Kërko sipas emrit ose email..."
            defaultValue={searchParams.q}
            className="w-full md:w-64"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Kërko
          </Button>
        </form>
        <div className="flex gap-2">
          <ExportButton data={registrations} />
          <Button variant="outline" asChild>
            <Link href="/admin/registrations">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rifresko
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Pagesa</TableHead>
              <TableHead>Regjistruar</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead className="text-right">Veprime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nuk u gjetën regjistrime.
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.full_name}</TableCell>
                  <TableCell>{reg.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {reg.category === 'member' ? 'Anëtar' :
                        reg.category === 'student' ? 'Student' : 'Jo-Anëtar'}
                    </Badge>
                  </TableCell>
                  <TableCell>{reg.fee_amount} {reg.currency}</TableCell>
                  <TableCell>{new Date(reg.created_at).toLocaleDateString('sq-AL')}</TableCell>
                  <TableCell>
                    {reg.checked_in ? (
                      <Badge className="bg-green-600">PO</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminResendButton registrationId={reg.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
