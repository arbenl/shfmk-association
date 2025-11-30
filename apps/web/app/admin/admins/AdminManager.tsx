"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emailSchema = z.string().trim().toLowerCase().email();

interface AdminUser {
  email: string;
  created_at: string;
}

export default function AdminManager({
  initialAdmins,
  loadError,
}: {
  initialAdmins: AdminUser[];
  loadError?: string;
}) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(loadError ? `Gabim gjatë ngarkimit: ${loadError}` : null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    let normalized: string;
    try {
      normalized = emailSchema.parse(email);
    } catch {
      setError("Email i pavlefshëm");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Shtimi dështoi");
      } else {
        setAdmins((prev) => [{ email: normalized, created_at: new Date().toISOString() }, ...prev.filter((a) => a.email !== normalized)]);
        setMessage("U shtua me sukses");
        setEmail("");
      }
    } catch {
      setError("Gabim gjatë shtimit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (targetEmail: string) => {
    setError(null);
    setMessage(null);
    if (!confirm(`Jeni i sigurt që dëshironi të hiqni ${targetEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(targetEmail)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Heqja dështoi");
      } else {
        setAdmins((prev) => prev.filter((a) => a.email !== targetEmail));
        setMessage("U hoq me sukses");
      }
    } catch {
      setError("Gabim gjatë heqjes");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Administratorët</h1>
          <p className="text-gray-500">Menaxho listën e email-eve që kanë qasje në panelin e adminit.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shto administrator</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 md:flex md:items-end md:gap-4" onSubmit={handleAdd}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Duke shtuar..." : "Shto"}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {message && !error && <p className="mt-3 text-sm text-green-600">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista e administratorëve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Shtuar më</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Nuk ka administratorë të regjistruar.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.email}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {admin.created_at ? new Date(admin.created_at).toLocaleString("sq-AL") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(admin.email)}
                        >
                          Hiq
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
