import Link from "next/link";
import Image from "next/image";
import { SiteSettings } from "@/lib/supabase";

interface HeaderProps {
  settings?: SiteSettings | null;
  showConferenceNav?: boolean;
}

export function Header({ settings, showConferenceNav = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/logo-shfk.png" width={32} height={32} alt="SHFK Logo" />
            <span className="hidden font-bold sm:inline-block">
              {settings?.org_name || "SHFMK"}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/">Kryefaqja</Link>
            {showConferenceNav ? (
              <>
                <Link href="/#konferenca">Konferenca</Link>
                <Link href="/#agenda">Agenda</Link>
                <Link href="/conference/register">Regjistrimi</Link>
              </>
            ) : (
              <Link href="/#kontakti">Kontakti</Link>
            )}
            {showConferenceNav && <Link href="/#kontakti">Kontakti</Link>}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Link
              href="/admin/registrations"
              className="mr-3 hidden text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline md:inline-flex"
            >
              Admin
            </Link>
            <Link
              href="/conference/register"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              Regjistrohu
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
