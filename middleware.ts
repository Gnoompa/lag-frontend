import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/vendor")) {
        return new NextResponse(
            `window.__LAG_VENDOR_CONFIG=${await kv.get(
                request.headers.get("referer")?.split("/")[3] as string
            )}`,
            {
                headers: { "Content-Type": "text/javascript" },
            }
        );
    }
}
