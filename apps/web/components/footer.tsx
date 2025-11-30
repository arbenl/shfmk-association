import { SiteSettings } from "@/lib/supabase";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

interface FooterProps {
  settings?: SiteSettings | null;
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{settings?.org_name || "SHFMK"}</h3>
            <p className="text-sm text-muted-foreground">
              Shoqata Farmaceutike e Kosovës është organizatë profesionale që përfaqëson interesat e farmacistëve.
            </p>
            <div className="flex space-x-4">
              {settings?.facebook && (
                <Link href={settings.facebook} target="_blank" className="text-gray-500 hover:text-blue-600">
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {settings?.instagram && (
                <Link href={settings.instagram} target="_blank" className="text-gray-500 hover:text-pink-600">
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {settings?.linkedin && (
                <Link href={settings.linkedin} target="_blank" className="text-gray-500 hover:text-blue-700">
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Lidhje të Shpejta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary">Kryefaqja</Link></li>
              <li><Link href="/#konferenca" className="text-muted-foreground hover:text-primary">Konferenca</Link></li>
              <li><Link href="/#agenda" className="text-muted-foreground hover:text-primary">Agenda</Link></li>
              <li><Link href="/conference/register" className="text-muted-foreground hover:text-primary">Regjistrimi</Link></li>
              <li><Link href="/#kontakti" className="text-muted-foreground hover:text-primary">Kontakti</Link></li>
              <li><Link href="/admin" className="text-muted-foreground hover:text-primary">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-muted-foreground">{settings?.address || "Prishtinë, Kosovë"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{settings?.phone || "+383 38 000 000"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{settings?.email || "info@shfmk.org"}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Orari</h3>
            <p className="text-sm text-muted-foreground">
              Hëne - Premte: 09:00 - 17:00<br />
              Vikend: Mbyllur
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {settings?.org_name || "Shoqata Farmaceutike e Kosovës"}. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </div>
    </footer>
  );
}
