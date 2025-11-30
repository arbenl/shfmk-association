import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold mb-4">Faqja nuk u gjet</h2>
            <p className="text-muted-foreground mb-8">Kjo faqe nuk ekziston ose është zhvendosur.</p>
            <Button asChild>
                <Link href="/">Kthehu në Ballinë</Link>
            </Button>
        </div>
    );
}
