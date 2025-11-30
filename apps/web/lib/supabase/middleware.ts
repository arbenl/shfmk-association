import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "@/lib/env";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refreshing the auth token
    await supabase.auth.getUser();

    return response;
}
