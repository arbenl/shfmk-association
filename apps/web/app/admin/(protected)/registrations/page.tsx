import { getConferenceBySlug, listRegistrations, countRegistrations } from "@/lib/supabase";
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
import { BulkResendButton } from "./BulkResendButton";

export const dynamic = "force-dynamic";

export default async function AdminRegistrations({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; status?: string };
}) {
  const conference = await getConferenceBySlug();
  if (!conference) {
    return <div>Konferenca nuk u gjet</div>;
  }

  const registrations = await listRegistrations({
    conferenceId: conference.id,
    search: searchParams.q,
    emailStatus: searchParams.status,
    limit: 1000, // Reasonable limit for now
  });

  const totalCount = await countRegistrations(conference.id);
  const checkedInCount = registrations.filter((r) => r.checked_in).length;

  // Calculate stats from the fetched list (approximation if limit is hit, but good enough for MVP)
  const memberCount = registrations.filter(r => r.category === 'farmacist').length;
  const nonMemberCount = registrations.filter(r => r.category === 'teknik').length;
  const statusCounts = registrations.reduce(
    (acc, reg) => {
      const status = reg.email_status ?? "pending";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const sentCount = statusCounts["sent"] ?? 0;
  const pendingCount = statusCounts["pending"] ?? 0;
  const failedCount =
    (statusCounts["failed"] ?? 0) +
    (statusCounts["bounced"] ?? 0) +
    (statusCounts["complained"] ?? 0);

  const bulkResendIds = registrations
    .filter((r) => ["pending", "failed", "bounced", "complained"].includes(r.email_status))
    .map((r) => r.id);

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
              <div className="flex justify-between"><span>Farmacist:</span> <span>{memberCount}</span></div>
              <div className="flex justify-between"><span>Teknik:</span> <span>{nonMemberCount}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Statusi i email-it
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="flex justify-between"><span>Dërguar:</span> <span>{sentCount}</span></div>
            <div className="flex justify-between"><span>Në pritje:</span> <span>{pendingCount}</span></div>
            <div className="flex justify-between"><span>Dështuar/Bounce:</span> <span>{failedCount}</span></div>
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
        <div className="flex flex-wrap gap-2 items-center">
          <BulkResendButton registrationIds={bulkResendIds} disabled={bulkResendIds.length === 0} />
          <ExportButton data={registrations} />
          <Button variant="outline" asChild>
            <Link href="/admin/registrations">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rifresko
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill label="Të gjitha" href="/admin/registrations" active={!searchParams.status} />
        <FilterPill label="Dërguar" href="/admin/registrations?status=sent" active={searchParams.status === "sent"} />
        <FilterPill label="Në pritje" href="/admin/registrations?status=pending" active={searchParams.status === "pending"} />
        <FilterPill label="Dështuar/Bounce" href="/admin/registrations?status=failed" active={searchParams.status === "failed"} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Pjesëmarrja</TableHead>
              <TableHead>Pikë</TableHead>
            <TableHead>Pagesa</TableHead>
            <TableHead>Regjistruar</TableHead>
            <TableHead>Status Email</TableHead>
            <TableHead>Spam</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead className="text-right">Veprime</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    {reg.category === 'farmacist' ? 'Farmacist' : 'Teknik'}
                  </Badge>
                </TableCell>
                  <TableCell>
                    {reg.participation_type === "aktiv" ? "Pjesëmarrës aktiv" : "Pjesëmarrës pasiv"}
                  </TableCell>
                  <TableCell>{reg.points}</TableCell>
                  <TableCell>{reg.fee_amount} {reg.currency}</TableCell>
                  <TableCell>{new Date(reg.created_at).toLocaleDateString('sq-AL')}</TableCell>
                  <TableCell>
                    <EmailStatusBadge status={reg.email_status} />
                  </TableCell>
                  <TableCell>
                    {reg.is_spam ? (
                      <Badge className="bg-red-600">Spam</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
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

function EmailStatusBadge({ status }: { status: string }) {
  const normalized = status ?? "pending";
  if (normalized === "sent") return <Badge className="bg-green-600">Dërguar</Badge>;
  if (normalized === "pending") return <Badge variant="outline">Në pritje</Badge>;
  if (normalized === "bounced" || normalized === "complained")
    return <Badge className="bg-red-600">Bounced</Badge>;
  if (normalized === "failed")
    return <Badge className="bg-amber-500">Dështuar</Badge>;
  return <Badge variant="outline">{normalized}</Badge>;
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href} className={`px-3 py-1 rounded-full text-sm border ${active ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}>
      {label}
    </Link>
  );
}
