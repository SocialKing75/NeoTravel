import { NextResponse } from "next/server";

export const runtime = "nodejs";

type DevisRequest = {
  id: string;
  prospect: string;
  email: string;
  tel?: string;
  depart: string;
  destination: string;
  passagers?: number;
  tripDate?: string;
  vehicule?: string;
  message?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(req: Request) {
  const url = process.env.N8N_DEVIS_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json(
      { error: "N8N_DEVIS_WEBHOOK_URL n'est pas configuré." },
      { status: 500 },
    );
  }

  let body: DevisRequest;
  try {
    const raw = await req.json();
    if (!isObject(raw)) throw new Error("invalid");
    body = raw as DevisRequest;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!body.prospect?.trim() || !body.email?.trim() || !body.depart?.trim() || !body.destination?.trim()) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        type: "devis_request",
        id: body.id,
        prospect: body.prospect,
        email: body.email,
        tel: body.tel ?? "",
        depart: body.depart,
        destination: body.destination,
        passagers: body.passagers ?? null,
        tripDate: body.tripDate ?? "",
        vehicule: body.vehicule ?? "",
        message: body.message ?? "",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `n8n a répondu ${res.status}.` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "Délai dépassé côté n8n." : "Échec de l'appel n8n." },
      { status: 504 },
    );
  }
}
