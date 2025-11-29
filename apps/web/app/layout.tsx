import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "SHFMK Conference",
  description: "Shoqata Farmaceutike e Kosovës - Conference registration"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
