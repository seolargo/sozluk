import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'words.json');

const app = express();
app.use(cors());
app.use(express.json());

async function readWords() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeWords(words) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(words, null, 2));
}

// Tüm kelimeleri listele, ?q= ile arama yapılabilir
app.get('/api/words', async (req, res) => {
  const words = await readWords();
  const q = (req.query.q || '').toLocaleLowerCase('tr');
  const result = q
    ? words.filter(
        (w) =>
          w.term.toLocaleLowerCase('tr').includes(q) ||
          w.definition.toLocaleLowerCase('tr').includes(q)
      )
    : words;
  res.json(result);
});

// Yeni kelime ekle
app.post('/api/words', async (req, res) => {
  const { term, definition } = req.body;
  if (!term?.trim() || !definition?.trim()) {
    return res.status(400).json({ error: 'Kelime ve tanım zorunludur.' });
  }
  const words = await readWords();
  const word = {
    id: Date.now().toString(36),
    term: term.trim(),
    definition: definition.trim(),
    createdAt: new Date().toISOString(),
  };
  words.unshift(word);
  await writeWords(words);
  res.status(201).json(word);
});

// Kelime sil
app.delete('/api/words/:id', async (req, res) => {
  const words = await readWords();
  const filtered = words.filter((w) => w.id !== req.params.id);
  if (filtered.length === words.length) {
    return res.status(404).json({ error: 'Kelime bulunamadı.' });
  }
  await writeWords(filtered);
  res.status(204).end();
});

// Doğal dilde his/düşünce tarifinden dünya dillerinde kavram önerisi
const DISCOVER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'language', 'kind', 'pronunciation', 'literal', 'meaning', 'why'],
        properties: {
          term: { type: 'string', description: 'Kelime, deyim veya atasözünün orijinal hali' },
          language: { type: 'string', description: 'Dil ve varsa kültür, örn. "Portekizce", "Japonca"' },
          kind: { type: 'string', enum: ['kelime', 'deyim', 'atasözü', 'kavram'] },
          pronunciation: { type: 'string', description: 'Türkçe okunuşu; bilinmiyorsa boş string' },
          literal: { type: 'string', description: 'Birebir çevirisi; yoksa boş string' },
          meaning: { type: 'string', description: 'Türkçe açıklaması' },
          why: { type: 'string', description: 'Kullanıcının tarif ettiği hisle neden eşleştiği' },
        },
      },
    },
  },
};

const DISCOVER_SYSTEM = `Sen dünya dilleri ve kültürleri konusunda uzman bir sözlükbilimcisin. Kullanıcı sana bir hissini, düşüncesini ya da yaşadığı bir durumu kendi cümleleriyle anlatır. Senin görevin, dünya literatüründe bu hissi tam karşılayan kelimeleri, deyimleri, atasözlerini veya kavramları bulmak — örneğin özlem için Portekizce "saudade", aşk türleri için Yunanca "eros/agape/philia", geçicilik hüznü için Japonca "mono no aware" gibi.

Kurallar:
- 4 ila 6 sonuç döndür; en isabetli olanı en başa koy.
- Farklı dillerden ve kültürlerden seçmeye çalış; sadece tek bir dile yaslanma.
- Gerçekten var olan kelime ve deyimleri öner; uydurma. Emin olmadığın bir şeyi dahil etme.
- Tüm açıklamaları Türkçe yaz.`;

app.post('/api/discover', async (req, res) => {
  const query = (req.body?.query || '').trim();
  const culture = (req.body?.culture || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Bir his veya düşünce tarifi yazmalısın.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY tanımlı değil. server/.env dosyasına anahtarını ekle.',
    });
  }
  try {
    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: culture
            ? `${DISCOVER_SYSTEM}\n\nÖnemli: Kullanıcı belirli bir ülke veya medeniyet seçti: ${culture}. Tüm sonuçları yalnızca bu ülkenin/medeniyetin dillerinden ve geleneğinden seç. Tarihî bir medeniyet seçildiyse (örn. İnka, Antik Mısır, Sümer) o medeniyetin kendi dilinden (Keçuva, Eski Mısırca, Sümerce vb.) ve kültürel mirasından kavramlar öner. "Farklı dillerden seçme" kuralı bu durumda geçerli değildir; seçilen kültürün içinde çeşitlilik göster (kelime, deyim, atasözü karışık olabilir).`
            : DISCOVER_SYSTEM,
        },
        { role: 'user', content: query },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'discover_results', strict: true, schema: DISCOVER_SCHEMA },
      },
    });
    const message = completion.choices[0]?.message;
    if (!message?.content) {
      return res.status(502).json({ error: 'Modelden geçerli bir yanıt alınamadı.' });
    }
    res.json(JSON.parse(message.content));
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) {
      return res.status(503).json({ error: 'API anahtarı geçersiz. OPENAI_API_KEY değerini kontrol et.' });
    }
    if (err instanceof OpenAI.RateLimitError) {
      return res.status(429).json({ error: 'İstek limiti aşıldı, biraz bekleyip tekrar dene.' });
    }
    console.error('discover hatası:', err);
    res.status(502).json({ error: 'Kavram araması sırasında bir hata oluştu.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sözlük API http://localhost:${PORT} adresinde çalışıyor`);
});
