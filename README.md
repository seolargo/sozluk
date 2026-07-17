# 📖 Sözlük — AI-Powered Concept Dictionary

A personal dictionary app with a twist: describe a feeling in your own words, and the app searches world literature for the words, idioms, proverbs and aphorisms that capture it — from Portuguese *saudade* to the entire Greek family of love (*éros*, *agápi*, *philía*, *storgí*...).

Built with React (Vite) on the front end and an Express API backed by OpenAI (`gpt-5`) with strict structured JSON output.

## Features

### 🌍 Concept discovery from natural language
Write how you feel ("I feel a bittersweet longing for days that will never return...") and get matching concepts from world languages, each with:

- the original term (and script), language and culture
- kind: **word, idiom, proverb, aphorism, or concept** (color-coded badges)
- pronunciation, literal translation, meaning, and *why it matches your feeling*

### 🏛️ Search the whole world — or one culture
A dropdown scopes the search to any of ~195 countries (localized names via `Intl.DisplayNames`) or 25 ancient civilizations (Inca, Maya, Ancient Egypt, Mesopotamia, Ottoman Empire, Norse...). Pick the Inca civilization and the results come back in Quechua.

### 🗣️ Famous-person quotes
A second dropdown restricts results to the recorded sayings of ~85 notable figures (Atatürk, Cicero, Rumi, Queen Elizabeth I, Einstein...). The model is instructed to return only genuinely attributed quotes with their source (work, speech, or letter), to flag disputed attributions, and never to include apocryphal ones.

### 📜 Sacred and ancient texts
A third dropdown scopes the search to a single sacred or ancient text — the Quran, New Testament, Old Testament/Tanakh, Talmud, Bhagavad Gita, Tao Te Ching, Epic of Gilgamesh and more (24 texts across 6 traditions). Results come back as **passages** with exact references (surah/verse, book/chapter/verse, tractate...), and the model is instructed to quote only what the text actually contains. In unfiltered searches, strongly matching scripture passages may appear alongside words and proverbs.

### 👨‍👩‍👧 Concept families are never left incomplete
If a language splits the concept into multiple variants — Greek's eight kinds of love, Turkish's shades of longing — the prompt requires **every member of the family** to be returned as a separate result, even beyond the normal result count.

### ✨ Generate more — with honest limits
A "Generate More" button continues the research with previously returned terms excluded, pushing into new languages and civilizations. When the model judges that no meaningful matches remain, it does not force weak results: it returns an `exhausted` flag and a friendly note shown to the user instead of the button.

### 🇹🇷🇬🇧 Full Turkish / English support
A language toggle (persisted in `localStorage`) switches the entire UI, the dropdown contents, and the language of the AI-generated explanations.

### ⏳ Detailed progress loader
Searches take 30–120 seconds, so a staged loader shows what is happening (scanning languages → detecting concept families → checking sources...), with an elapsed-time counter and expectation-setting notes.

### 📚 Classic dictionary underneath
Add any discovered result (or your own entries) to a personal word list with search and delete. Words are stored in `server/data/words.json`.

## Project Structure

```
├── client/               # React + Vite front end
│   └── src/
│       ├── App.jsx       # UI, discovery flow, loader, dictionary list
│       ├── i18n.js       # TR/EN UI strings
│       └── cultures.js   # Civilizations, ISO country codes, famous people (bilingual)
└── server/               # Express API
    ├── index.js          # Dictionary CRUD + /api/discover (OpenAI structured output)
    ├── .env              # OPENAI_API_KEY (gitignored)
    └── data/words.json   # Saved words (gitignored)
```

## Setup

```bash
npm run install:all
```

Create `server/.env` with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

## Run

```bash
npm run dev
```

- Front end: http://localhost:4000
- API: http://localhost:3001 (Vite proxies `/api` requests to it)

Both servers start with one command; the API auto-reloads on changes (`node --watch`) and reads `.env` natively (`--env-file-if-exists`, Node 22.9+).

## API

| Method | Path             | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| GET    | `/api/words`     | List saved words (`?q=` to search)             |
| POST   | `/api/words`     | Add a word `{term, definition}`                |
| DELETE | `/api/words/:id` | Delete a word                                  |
| POST   | `/api/discover`  | AI concept search                              |

### `POST /api/discover`

```json
{
  "query": "I feel a bittersweet longing...",
  "culture": "Japan",            // optional country/civilization filter
  "person": "Cicero",            // optional famous-person filter (overrides culture)
  "text": "The Talmud",          // optional sacred-text filter (overrides person & culture)
  "lang": "en",                  // "tr" | "en" — output language
  "exclude": ["saudade", "..."]  // terms already shown (for Generate More)
}
```

Response (schema-enforced via OpenAI structured outputs, `strict: true`):

```json
{
  "results": [
    {
      "term": "hiraeth",
      "language": "Welsh (Wales)",
      "kind": "kelime",
      "pronunciation": "hi-RAYTH",
      "literal": "longing for home",
      "meaning": "...",
      "why": "..."
    }
  ],
  "exhausted": false,
  "note": ""
}
```

`kind` is a fixed Turkish enum (`kelime`, `deyim`, `atasözü`, `özdeyiş`, `kavram`, `pasaj`) mapped to localized labels client-side. When `exhausted` is `true`, `note` carries the model's explanation that the literature has been covered for this feeling.
