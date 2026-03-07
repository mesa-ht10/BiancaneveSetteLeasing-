export const config = { runtime: "edge" };

const MAX_BODY_BYTES = 4 * 1024 * 1024; // 4 MB (sufficiente per PDF base64)

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  // Solo POST
  if (req.method !== "POST") {
    return jsonError("Method Not Allowed", 405);
  }

  // Verifica Content-Type
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonError("Content-Type must be application/json", 400);
  }

  // Verifica Origin: accetta solo richieste dalla stessa app
  // Su Vercel imposta ALLOWED_ORIGIN=https://tua-app.vercel.app
  const origin = req.headers.get("origin");
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    return jsonError("Forbidden", 403);
  }

  // Verifica dimensione payload (header Content-Length se presente)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return jsonError("Payload too large", 413);
  }

  // Leggi body e controlla dimensione reale
  const bodyText = await req.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return jsonError("Payload too large", 413);
  }

  // Valida JSON
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  // Valida struttura minima attesa (model + messages)
  if (
    typeof body.model !== "string" ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return jsonError("Invalid request structure", 400);
  }

  // Controlla API key server-side
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError("ANTHROPIC_API_KEY non configurata sul server Vercel.", 500);
  }

  // Inoltra ad Anthropic
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: bodyText,
  });

  const data = await response.text();
  return new Response(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
