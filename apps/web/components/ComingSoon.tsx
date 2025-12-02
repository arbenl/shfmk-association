import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { SiteSettings } from "@/lib/supabase";

interface ComingSoonProps {
  settings?: SiteSettings | null;
}

export function ComingSoon({ settings }: ComingSoonProps) {
  const contactEmail = settings?.email || "info@shfmk.org";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 lg:py-28">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#60a5fa,transparent_25%),radial-gradient(circle_at_80%_0%,#a855f7,transparent_25%)]" />
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl space-y-6">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100 ring-1 ring-white/20">
            Së shpejti
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Konferenca ShFarmK po përgatitet
          </h1>
          <p className="text-lg text-blue-100">
            Po finalizojmë datën, vendin dhe agjendën. Regjistrimi do të hapet sapo konferenca të publikohet.
          </p>
          <div className="flex flex-col gap-3 text-sm text-blue-100">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-blue-200" />
              <Link href={`mailto:${contactEmail}`} className="underline underline-offset-4 hover:text-white">
                Njoftohu kur hapet regjistrimi
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-blue-200" />
              <span>{settings?.phone || "+383 38 000 000"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-blue-200" />
              <span>{settings?.address || "Prishtinë, Kosovë"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
