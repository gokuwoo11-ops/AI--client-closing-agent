import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPagePrefixes = [
  "/dashboard",
  "/agent",
  "/funnel",
  "/leads",
  "/inbox",
  "/appointments",
  "/schedule",
  "/settings",
  "/channels",
  "/business-setup",
  "/integrations",
  "/intake",
  "/conversation",
];

const protectedApiPrefixes = [
  "/api/leads",
  "/api/appointments",
  "/api/bookings/slots",
  "/api/agent-config",
  "/api/inbound",
  "/api/conversation",
  "/api/workspace/current",
  "/api/chat",
];

function isProtectedPath(pathname: string) {
  return protectedPagePrefixes.some((path) => pathname.startsWith(path)) || protectedApiPrefixes.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("error", "supabase_not_configured");
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agent/:path*",
    "/funnel/:path*",
    "/leads/:path*",
    "/inbox/:path*",
    "/appointments/:path*",
    "/schedule/:path*",
    "/settings/:path*",
    "/channels/:path*",
    "/business-setup/:path*",
    "/integrations/:path*",
    "/intake/:path*",
    "/conversation/:path*",
    "/api/leads/:path*",
    "/api/appointments/:path*",
    "/api/bookings/slots/:path*",
    "/api/agent-config/:path*",
    "/api/inbound/:path*",
    "/api/conversation/:path*",
    "/api/workspace/current/:path*",
    "/api/chat/:path*",
  ],
};
