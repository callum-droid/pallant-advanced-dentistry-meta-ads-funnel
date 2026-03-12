import { NextRequest, NextResponse } from "next/server";

// ─── RATE LIMITING ────────────────────────────────────────────────
// Max 3 submissions per IP per 10 minutes
const RATE_LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000;
const ipMap = new Map<string, { count: number; firstRequest: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now - entry.firstRequest > WINDOW_MS) {
    ipMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  return false;
}

// ─── VALIDATION ───────────────────────────────────────────────────
function validate(body: Record<string, unknown>): string | null {
  const { firstName, lastName, email, phone } = body as Record<string, string>;

  if (!firstName?.trim()) return "First name is required";
  if (!lastName?.trim()) return "Last name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "")) return "Valid email is required";
  if (!phone?.replace(/\s/g, "") || phone.replace(/\s/g, "").length < 7) return "Valid phone number is required";

  return null;
}

// ─── HANDLER ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const triggerUrl = process.env.PRM_TRIGGER_URL;
  if (!triggerUrl) {
    return NextResponse.json({ error: "Trigger URL not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    firstname: body.firstName ?? "",
    lastname: body.lastName ?? "",
    email: body.email ?? "",
    phone1: body.phone ?? "",
    custom21: body.concerns?.join(", ") ?? "",
    custom22: body.treatment ?? "",
    custom23: body.timeline ?? "",
    custom24: body.previousTreatment ?? "",
  });

  const response = await fetch(triggerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to submit to PRM" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
