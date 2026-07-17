# 📖 Sözlük

React + Node.js ile yazılmış basit bir kişisel sözlük uygulaması. Kelime ekleyebilir, arayabilir ve silebilirsiniz.

## Yapı

- `client/` — React frontend (Vite)
- `server/` — Express API (kelimeler `server/data/words.json` dosyasında saklanır)

## Kurulum

```bash
npm run install:all
```

## Çalıştırma

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

Tek komutla hem backend hem frontend başlar. Vite, `/api` isteklerini otomatik olarak backend'e yönlendirir.

## API

| Metot  | Yol              | Açıklama                          |
| ------ | ---------------- | --------------------------------- |
| GET    | `/api/words`     | Tüm kelimeler (`?q=` ile arama)   |
| POST   | `/api/words`     | Yeni kelime ekle `{term, definition}` |
| DELETE | `/api/words/:id` | Kelime sil                        |
