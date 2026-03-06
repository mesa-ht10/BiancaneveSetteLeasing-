# AI Assistant

L'applicazione integra **Claude** (Anthropic) per due funzionalità AI:

1. **Chat IFRS16** — assistente conversazionale contestualizzato al contratto selezionato
2. **Import PDF** — estrazione automatica dei dati da un contratto in formato PDF

---

## Chat IFRS16

Il pannello AI è accessibile dal pulsante **🤖 AI Assistant** in alto a destra. Si apre come floating panel nell'angolo in basso a destra.

### Funzionamento

- Il sistema invia a Claude il **contesto del contratto selezionato** (tutti i campi) come parte del system prompt
- L'assistente risponde in italiano con guidance su calcoli, normativa e trattamento contabile
- La conversazione mantiene la **history** dei messaggi per risposte contestualizzate

### Suggerimenti Rapidi

Al primo avvio del pannello vengono mostrati 4 suggerimenti:
- "Spiegami il calcolo del ROU Asset"
- "Quando si applica l'esenzione short-term?"
- "Come gestire una modifica del contratto?"
- "Qual è il trattamento dell'opzione di acquisto?"

### Modello utilizzato

```
claude-sonnet-4-20250514
max_tokens: 1000
```

---

## Import PDF

Accessibile dal form contratto → pulsante **📄 PDF Import** (in alto a destra nel form).

### Flusso

1. L'utente carica un file PDF di contratto di leasing
2. Il file viene convertito in base64 e inviato a Claude come `document`
3. Claude estrae i dati e restituisce un JSON strutturato
4. Il form viene pre-compilato con i dati estratti
5. L'utente verifica e salva

### Dati estratti dal PDF

Il modello AI tenta di estrarre:
`contractCode`, `description`, `lessorName`, `commencementDate`, `endDate`, `leaseCategory`, `basePaymentAmount`, `paymentTiming`, `discountRateAnnual`, opzioni contrattuali, esenzioni, `notes` e un campo `confidence` (HIGH/MEDIUM/LOW).

---

## Configurazione API Key

L'AI richiede una API key Anthropic valida configurata come variabile d'ambiente.

### In locale

Crea il file `.env.local` nella root del progetto:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Poi riavvia il server di sviluppo (`npm run dev`).

> ⚠️ Non committare mai `.env.local` su GitHub. Il file è incluso nel `.gitignore`.

### Sul sito pubblico (GitHub Pages)

Le funzionalità AI **non sono attive** nella demo pubblica: la API key non può essere inclusa nel bundle JavaScript pubblico per motivi di sicurezza (sarebbe visibile a chiunque ispezionasse il codice sorgente del browser).

Per abilitare l'AI su un deployment pubblico è necessario un **backend proxy** che gestisca la chiave lato server.

---

## Header CORS

L'applicazione usa la chiamata diretta da browser alle API Anthropic tramite l'header speciale:

```
anthropic-dangerous-direct-browser-access: true
```

Questo è supportato da Anthropic per use case di sviluppo e POC, non raccomandato per produzione con chiavi esposte.
