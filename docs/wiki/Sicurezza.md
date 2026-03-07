# Sicurezza

Questa pagina descrive le misure di sicurezza implementate per il deployment su Vercel (branch `vercel-deploy`).

---

## Architettura sicura dell'AI

Nella versione Vercel, la chiamata all'API Anthropic non avviene più dal browser ma passa attraverso una **Edge Function server-side**:

```
Browser  ──POST /api/ai──►  Vercel Edge Function  ──► Anthropic API
                                      │
                           ANTHROPIC_API_KEY (solo server)
                           Mai esposta nel codice client
```

La chiave API non compare mai nel bundle JavaScript scaricato dal browser.

---

## Protezioni del Proxy API (`api/ai.ts`)

| Controllo | Dettaglio |
|-----------|-----------|
| **Method check** | Solo `POST` accettato; tutto il resto → `405 Method Not Allowed` |
| **Content-Type** | Rifiuta richieste che non siano `application/json` → `400` |
| **Origin check** | Confronta l'header `Origin` con `ALLOWED_ORIGIN` (env var); origini non autorizzate → `403 Forbidden` |
| **Payload size** | Limite a **4 MB** (sufficiente per PDF base64); payload più grandi → `413` |
| **JSON validation** | Rifiuta body non parsabile come JSON → `400` |
| **Struttura minima** | Verifica che `model` (stringa) e `messages` (array non vuoto) siano presenti → `400` |
| **API key assente** | Se `ANTHROPIC_API_KEY` non è configurata su Vercel → `500` con messaggio esplicativo |

---

## Security Headers (`vercel.json`)

Applicati a tutte le risposte dell'app:

| Header | Valore | Protezione |
|--------|--------|------------|
| `X-Frame-Options` | `DENY` | Impedisce l'embedding in iframe (clickjacking) |
| `X-Content-Type-Options` | `nosniff` | Blocca il MIME-type sniffing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forza HTTPS per 1 anno su tutti i sottodomini |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita le informazioni di referrer verso siti esterni |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disabilita accesso a camera, microfono e posizione |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self'; frame-ancestors 'none'; ...` | Limita le origini da cui si caricano script, stili, font e connessioni di rete |

---

## Variabili d'ambiente Vercel

Configurare nel pannello **Project Settings → Environment Variables**:

| Variabile | Obbligatoria | Descrizione |
|-----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | Sì (per AI) | API key Anthropic — rimane **solo server-side**, mai nel client |
| `ALLOWED_ORIGIN` | Consigliata | URL esatto del deployment, es. `https://tua-app.vercel.app` — blocca chiamate da origini esterne |

> **Nota:** a differenza del branch `main` (GitHub Pages), qui si usa `ANTHROPIC_API_KEY` **senza** il prefisso `VITE_`. Le variabili con prefisso `VITE_` vengono incorporate nel bundle client da Vite e sarebbero visibili pubblicamente.

---

## Cosa rimane esposto

| Elemento | Stato |
|----------|-------|
| Codice sorgente frontend | Pubblico (bundle JS minificato) |
| API key Anthropic | ✅ Nascosta (solo Vercel server) |
| Endpoint `/api/ai` | Pubblico ma protetto da Origin + validazioni |
| Dati contratti | Solo `localStorage` del browser dell'utente |

---

## Limitazioni note

- **Origin check non è autenticazione**: un attaccante che conosce il dominio può impostare l'header `Origin` manualmente via curl/Postman. Per uso strettamente privato valutare l'aggiunta di un token segreto o la **Vercel Password Protection** (piano Pro).
- **Rate limiting**: non implementato. In caso di abuso considerare [Vercel KV](https://vercel.com/docs/storage/vercel-kv) per un rate limiter basato su IP.
- **CSP e `unsafe-inline`**: gli stili inline di Tailwind richiedono `unsafe-inline` per `style-src`. Per una CSP più restrittiva valutare l'uso di hash o nonce.
