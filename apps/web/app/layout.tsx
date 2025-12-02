export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";
import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import { getPublicConference } from "@/lib/supabase/public";

export const metadata = {
  title: "SHFMK Konferenca",
  description: "Shoqata Farmaceutike e Kosovës - Regjistrimi në konferencë"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { conference, settings } = await getPublicConference();

  return (
    <html lang="sq">
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col")}>
        <Header settings={settings} showConferenceNav={!!conference} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
