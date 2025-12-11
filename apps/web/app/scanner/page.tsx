import { Metadata } from "next";
import ScannerClient from "./ScannerClient";

export const metadata: Metadata = {
  title: "SHFK Scanner",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ScannerPage() {
  return <ScannerClient />;
}
