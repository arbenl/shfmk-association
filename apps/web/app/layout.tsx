import "./globals.css";
import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "SHFMK Konferenca",
  description: "Shoqata Farmaceutike e Kosovës - Regjistrimi në konferencë"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
