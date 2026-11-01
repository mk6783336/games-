import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./index";

// Read by Vercel; Express needs the untouched request stream.
export const config = { api: { bodyParser: false } };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const raw = req.url ?? "/";
  const [pathname, search = ""] = raw.split("?");
  const params = new URLSearchParams(search);
  const forwardedPath = params.get("path");

  if (forwardedPath != null) {
    // vercel.json rewrites /api/v1/* to /api/index?path=* so the function has
    // a fixed route while still seeing the full API path.
    params.delete("path");
    const rest = params.toString();
    req.url = `/v1/${forwardedPath}${rest ? `?${rest}` : ""}`;
  } else if (pathname.startsWith("/api/v1/")) {
    // Direct invocation (local smoke tests and any path-preserving runtime).
    req.url = pathname.slice(4) + (search ? `?${search}` : "");
  } else if (pathname === "/api/v1" || pathname === "/api/index") {
    req.url = "/v1";
  }

  (app as unknown as (request: IncomingMessage, response: ServerResponse) => void)(req, res);
}
