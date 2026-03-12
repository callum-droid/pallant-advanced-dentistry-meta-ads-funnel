import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

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
    custom25: "Meta Ads Funnel",
  });

  const response = await fetch(triggerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const responseText = await response.text();
  console.log("📥 PRM response:", response.status, responseText);

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to submit to PRM", detail: responseText }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
