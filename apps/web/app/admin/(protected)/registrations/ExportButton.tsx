"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Registration {
    id: string;
    full_name: string;
    email: string;
    category: string;
    fee_amount: number;
    currency: string;
    created_at: string;
    check_in_status?: string;
}

export function ExportButton({ data }: { data: Registration[] }) {
    const handleExport = () => {
        const headers = ["ID,Emri,Email,Kategoria,Pagesa,Valuta,Data,Check-in"];
        const rows = data.map(r => [
            r.id,
            `"${r.full_name}"`,
            r.email,
            r.category,
            r.fee_amount,
            r.currency,
            new Date(r.created_at).toLocaleDateString('sq-AL'),
            r.check_in_status || 'jo'
        ].join(","));

        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `registrations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Eksporto CSV
        </Button>
    );
}
