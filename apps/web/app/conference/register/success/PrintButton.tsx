"use client";

import { Button } from "@/components/ui/button";

interface PrintButtonProps {
    disabled?: boolean;
}

export function PrintButton({ disabled }: PrintButtonProps) {
    return (
        <Button onClick={() => window.print()} disabled={disabled}>
            Printo / Ruaj
        </Button>
    );
}
