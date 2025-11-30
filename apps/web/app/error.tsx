"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold mb-4">Ndodhi një gabim</h2>
            <p className="text-muted-foreground mb-8">Diçka shkoi keq. Ju lutem provoni përsëri.</p>
            <Button onClick={() => reset()}>Provo Përsëri</Button>
        </div>
    );
}
