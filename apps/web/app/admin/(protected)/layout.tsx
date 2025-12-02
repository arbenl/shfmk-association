import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Calendar, Users, Shield } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

export default function ProtectedAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/admin/registrations" className="font-bold text-xl text-blue-900">
                            SHFMK Admin
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                href="/admin/registrations"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2"
                            >
                                <Users className="h-4 w-4" />
                                Regjistrimet
                            </Link>
                            <Link
                                href="/admin/conference"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                Konferenca
                            </Link>
                            <Link
                                href="/admin/admins"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2"
                            >
                                <Shield className="h-4 w-4" />
                                Administratorët
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Cilësimet
                            </Link>
                        </nav>
                    </div>

                    <LogoutButton />
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
