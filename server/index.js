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
  const { term, definition, meta } = req.body;
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
  if (meta && typeof meta === 'object') {
    const pick = (k) => (typeof meta[k] === 'string' ? meta[k].trim() : '');
    word.meta = {
      language: pick('language'),
      kind: pick('kind'),
      pronunciation: pick('pronunciation'),
      literal: pick('literal'),
      meaning: pick('meaning'),
    };
  }
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
  required: ['results', 'exhausted', 'note'],
  properties: {
    exhausted: {
      type: 'boolean',
      description:
        'Kullanıcının hissine gerçekten uyan, daha önce önerilmemiş anlamlı sonuç kalmadıysa true. Zorlama eşleştirme yapmak yerine true döndür.',
    },
    note: {
      type: 'string',
      description:
        'exhausted true ise kullanıcıya kısa ve samimi bir açıklama (çıktı dilinde); değilse boş string.',
    },
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'language', 'kind', 'pronunciation', 'literal', 'meaning', 'why'],
        properties: {
          term: { type: 'string', description: 'Kelime, deyim veya atasözünün orijinal hali' },
          language: { type: 'string', description: 'Dil ve varsa kültür, örn. "Portekizce", "Japonca"' },
          kind: { type: 'string', enum: ['kelime', 'deyim', 'atasözü', 'özdeyiş', 'kavram', 'pasaj'] },
          pronunciation: { type: 'string', description: 'Türkçe okunuşu; bilinmiyorsa boş string' },
          literal: { type: 'string', description: 'Birebir çevirisi; yoksa boş string' },
          meaning: { type: 'string', description: 'Türkçe açıklaması' },
          why: { type: 'string', description: 'Kullanıcının tarif ettiği hisle neden eşleştiği' },
        },
      },
    },
  },
};

const DISCOVER_SYSTEM = `Sen dünya dilleri ve kültürleri konusunda uzman bir sözlükbilimcisin. Kullanıcı sana bir hissini, düşüncesini ya da yaşadığı bir durumu kendi cümleleriyle anlatır. Senin görevin, dünya literatüründe bu hissi tam karşılayan kelimeleri, deyimleri, atasözlerini veya kavramları bulmak — örneğin özlem için Portekizce "saudade", geçicilik hüznü için Japonca "mono no aware" gibi.

En önemli kural — KAVRAM AİLELERİNİ ASLA EKSİK BIRAKMA:
Bir dil, kullanıcının tarif ettiği kavramı birden fazla alt türe, dereceye veya bağlama ayırıyorsa, bu ailenin ÜYELERİNİN TAMAMINI ayrı birer sonuç olarak listele. Örnekler:
- Aşk için Yunanca tek kelime yoktur; éros (tutkulu aşk), agápi (koşulsuz sevgi), philía (dostluk sevgisi), storgí (aile bağı), prágma (olgun/kalıcı aşk), philautía (öz sevgi), ludus (oyuncul flört), manía (saplantılı aşk) gibi ayrı kavramlar vardır — hissi "aşk" olan bir kullanıcıya bunların hepsi sunulmalıdır.
- Kar için İnuit dillerinde, pirinç için Japonca'da, deve için Arapça'da, özlem türleri için Türkçe'de (özlem/hasret/dâüssıla) benzer aileler vardır.
Böyle bir aile bulduğunda sonuç sayısı sınırını aşman serbesttir; aile üyesi atlamak, yanlış kelime önermek kadar ciddi bir hatadır.

İkinci önemli kural — TÜR ÇEŞİTLİLİĞİ:
Sonuçlar yalnızca tek kelime ve kavramlardan oluşmamalı. Her aramada, hisse uyan gerçek örnekler var olduğu sürece şu türlerden de sonuç ver:
- atasözü (örn. Japonca "七転び八起き / nana korobi ya oki" — yedi kez düş, sekiz kez kalk),
- deyim (örn. Fransızca "avoir le cafard" — hamamböceği olmak = içine kasvet çökmek),
- özdeyiş/vecize (bilinen bir düşünüre, şaire veya geleneğe ait özlü söz; kaynağını "meaning" veya "why" içinde belirt),
- pasaj (kutsal ve kadim metinlerden: Kur'an ayeti, İncil veya Eski Ahit pasajı, Talmud'dan bir söz, Bhagavad Gita, Tao Te Ching vb. — tam referansıyla: sure/ayet, kitap/bölüm/ayet, bap gibi).
Mümkünse her aramada en az bir atasözü ve bir deyim/özdeyiş bulunmalı; hisse güçlü uyan bir kutsal metin pasajı varsa onu da dahil et. Bunlar için de uydurma yasağı aynen geçerlidir.

Diğer kurallar:
- Normalde 5-8 sonuç döndür; kavram ailesi varsa gerektiği kadar artır. En isabetli sonucu en başa koy.
- Farklı dillerden ve kültürlerden seçmeye çalış; sadece tek bir dile yaslanma. Ancak bir dilin kavram ailesi varsa o aileyi bölme, tamamını ver.
- Bir kelimenin aynı dilde birden çok anlam katmanı/nüansı varsa bunları "meaning" alanında açıkça belirt.
- Gerçekten var olan kelime ve deyimleri öner; uydurma. Emin olmadığın bir şeyi dahil etme.
- "exhausted" alanı: Hisse gerçekten uyan sonuç bulabildiysen false ve "note" boş string. Anlamlı yeni sonuç kalmadıysa (özellikle devam aramalarında) sonuçları ZORLAMA: az sonuç veya boş "results" döndür, "exhausted" alanını true yap ve "note" alanına kullanıcıya kısa, samimi bir açıklama yaz (örn. bu his için literatürdeki en bilinen karşılıkların artık verildiğini söyle). Alakasız veya zayıf eşleşme üretmek, sınırı kabul etmekten çok daha kötüdür.`;

function outputLangRule(lang) {
  return lang === 'en'
    ? '\n\nOutput language: Write ALL free-text fields ("language", "pronunciation", "literal", "meaning", "why") in ENGLISH. The user query may be in any language. Use English phonetic spelling for pronunciations.'
    : '\n\nÇıktı dili: Tüm serbest metin alanlarını ("language", "pronunciation", "literal", "meaning", "why") TÜRKÇE yaz. Okunuşları Türkçe fonetiğiyle ver.';
}

// Kişi alıntılarının web aramasıyla çapraz doğrulaması için şema
const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'verified', 'note'],
        properties: {
          term: {
            type: 'string',
            description: 'Doğrulanan sözün "term" alanı, BİREBİR kopyalanmış',
          },
          verified: {
            type: 'boolean',
            description:
              'Güvenilir kaynaklar söze ve atfa net destek veriyorsa true; kaynak bulunamadı, çelişkili veya apokrif ise false',
          },
          note: {
            type: 'string',
            description:
              'Kısa gerekçe: hangi kaynak doğruladı ya da neden doğrulanamadı (çıktı dilinde)',
          },
        },
      },
    },
  },
};

async function verifyQuotes(client, person, results, lang) {
  const quoteList = results
    .map((r, i) => `${i + 1}. "${r.term}" — iddia edilen kaynak: ${r.meaning}`)
    .join('\n');
  const response = await client.responses.create({
    model: 'gpt-5',
    tools: [{ type: 'web_search' }],
    input: `Aşağıdaki sözlerin her birinin GERÇEKTEN şu kişiye ait olup olmadığını web araması yaparak çapraz kontrol et: ${person}.

${quoteList}

Kurallar:
- Her söz için güvenilir kaynaklarda (Wikiquote, arşivler, akademik kaynaklar, kurum siteleri) atfı ara.
- Kaynaklar net destekliyorsa verified=true; kaynak bulamadıysan, atıf tartışmalıysa veya söz yaygın-ama-apokrif listelerindeyse verified=false.
- Emin olamıyorsan verified=false ver — yanlış onaylamak, temkinli olmamaktan kötüdür.
- "term" alanına sözü BİREBİR kopyala (numarasız, tırnaksız değişiklik yapma).
- "note" kısa olsun ve ${lang === 'en' ? 'İNGİLİZCE' : 'TÜRKÇE'} yazılsın.`,
    text: {
      format: {
        type: 'json_schema',
        name: 'quote_verdicts',
        strict: true,
        schema: VERIFY_SCHEMA,
      },
    },
  });
  return JSON.parse(response.output_text).verdicts;
}

const EXHAUSTED_RULE = `
"exhausted" alanı: Uyan sonuç bulabildiysen false ve "note" boş string. Anlamlı sonuç bulamadıysan veya kalmadıysa ZORLAMA: az sonuç veya boş "results" döndür, "exhausted" alanını true yap ve "note" alanına kullanıcıya kısa, samimi bir açıklama yaz. Alakasız veya zayıf eşleşme üretmek, sınırı kabul etmekten çok daha kötüdür.`;

function buildSystemPrompt({ culture, person, text, lang }) {
  if (text) {
    return `Sen kutsal ve kadim metinler konusunda uzman bir akademisyensin. TEK GÖREVİN: kullanıcının tarif ettiği his/düşünce ile örtüşen pasajları YALNIZCA şu metinden bulmak: ${text}.

KESİN KURALLAR:
- Başka hiçbir kaynaktan sonuç verme. Dünya dillerinden kelime, deyim, atasözü ÖNERME — bu görev kapsamında değil. Yalnızca ${text} içinden pasaj/ayet/bölüm döndür.
- Tüm sonuçlarda "kind" alanı "pasaj" olmalı.
- "term" alanına pasajın kendisini yaz (kısa tut; biliniyorsa orijinal dilinde veya yerleşik çevirisiyle), "language" alanına metnin adı ve orijinal dili (örn. "${text} — orijinal dili"), "literal" alanına çevirisini, "meaning" alanına TAM referansı ve bağlamı (sure/ayet, kitap/bölüm/ayet, bap, traktat vb.), "why" alanına kullanıcının hissiyle bağlantısını yaz.
- SADECE metinde gerçekten geçen pasajları ver; referansları doğru ver. Emin olmadığın pasajı dahil etme; parafraz yapıyorsan bunu belirt.
- Bu metne akademik ve saygılı bir dille yaklaş; yorum katman gerekiyorsa geleneksel tefsir/yorum çerçevesinde kal.
- Bu metinde hisse uyan pasaj bulamıyorsan başka kaynağa SAPMA; exhausted kuralını uygula.
${EXHAUSTED_RULE}${outputLangRule(lang)}`;
  }
  if (person) {
    return `Sen tarihî kişilerin sözleri ve yazıları konusunda uzman bir araştırmacısın. TEK GÖREVİN: kullanıcının tarif ettiği his/düşünce ile örtüşen, YALNIZCA şu kişiye ait sözleri bulmak: ${person}.

KESİN KURALLAR:
- Başka kişilerden veya dünya dillerinden sonuç verme. Yalnızca ${person}'e ait kayıtlı sözler, özdeyişler ve dizeler döndür.
- Tüm sonuçlarda "kind" alanı "özdeyiş" olmalı.
- "term" alanına sözün kendisini yaz (biliniyorsa orijinal dilinde), "language" alanına kişinin adı ve dili (örn. "${person} — dili"), "literal" alanına çevirisini, "meaning" alanına sözün bağlamını/kaynağını (hangi eser, konuşma veya mektup), "why" alanına kullanıcının hissiyle bağlantısını yaz.
- SADECE gerçekten kayıtlı ve bu kişiye ait sözler ver. Yaygın ama yanlış atfedilen (apokrif) sözleri dahil etme; atıf tartışmalıysa bunu "meaning" alanında açıkça belirt.
- Uyan söz bulamıyorsan başka kişiye SAPMA; exhausted kuralını uygula.
${EXHAUSTED_RULE}${outputLangRule(lang)}`;
  }
  if (culture) {
    return `${DISCOVER_SYSTEM}${outputLangRule(lang)}

Önemli: Kullanıcı belirli bir ülke veya medeniyet seçti: ${culture}. Tüm sonuçları yalnızca bu ülkenin/medeniyetin dillerinden ve geleneğinden seç. Tarihî bir medeniyet seçildiyse (örn. İnka, Antik Mısır, Sümer) o medeniyetin kendi dilinden (Keçuva, Eski Mısırca, Sümerce vb.) ve kültürel mirasından kavramlar öner. "Farklı dillerden seçme" kuralı bu durumda geçerli değildir; seçilen kültürün içinde çeşitlilik göster (kelime, deyim, atasözü karışık olabilir). Kavram ailesi kuralı burada daha da önemlidir: bu kültür, kavramı kaç alt türe ayırıyorsa hepsini eksiksiz listele.`;
  }
  return `${DISCOVER_SYSTEM}${outputLangRule(lang)}`;
}

app.post('/api/discover', async (req, res) => {
  const query = (req.body?.query || '').trim();
  const culture = (req.body?.culture || '').trim();
  const person = (req.body?.person || '').trim();
  const text = (req.body?.text || '').trim();
  const lang = req.body?.lang === 'en' ? 'en' : 'tr';
  const exclude = Array.isArray(req.body?.exclude)
    ? req.body.exclude.filter((x) => typeof x === 'string').slice(0, 200)
    : [];
  const err = (tr, en) => (lang === 'en' ? en : tr);
  if (!query) {
    return res.status(400).json({
      error: err(
        'Bir his veya düşünce tarifi yazmalısın.',
        'Please describe a feeling or thought first.'
      ),
    });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: err(
        'OPENAI_API_KEY tanımlı değil. server/.env dosyasına anahtarını ekle.',
        'OPENAI_API_KEY is not set. Add your key to server/.env.'
      ),
    });
  }
  try {
    const client = new OpenAI();
    const sysPrompt = buildSystemPrompt({ culture, person, text, lang });
    const completion = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: sysPrompt },
        {
          role: 'user',
          content: [
            text
              ? `[Kaynak kısıtı: YALNIZCA "${text}" metninden pasajlar döndür.]\n`
              : person
                ? `[Kaynak kısıtı: YALNIZCA ${person}'e ait sözler döndür.]\n`
                : '',
            query,
            exclude.length
              ? `\n\n[Devam araması] Şu öneriler daha önce verildi; bunları, çevirilerini ve çok yakın varyantlarını TEKRARLAMA:\n${exclude
                  .map((x) => `- ${x}`)
                  .join('\n')}\nDaha önce bahsedilmemiş yeni öneriler bul. Gerçekten uyan yeni bir şey kalmadıysa exhausted=true döndür ve zorlamana gerek yok.`
              : '',
          ].join(''),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'discover_results', strict: true, schema: DISCOVER_SCHEMA },
      },
    });
    const message = completion.choices[0]?.message;
    if (!message?.content) {
      return res.status(502).json({
        error: err('Modelden geçerli bir yanıt alınamadı.', 'No valid response from the model.'),
      });
    }
    const payload = JSON.parse(message.content);
    if (person && payload.results?.length) {
      try {
        const verdicts = await verifyQuotes(client, person, payload.results, lang);
        const norm = (s) => s.trim().toLowerCase().replace(/["""'']/g, '');
        const byTerm = new Map(verdicts.map((v) => [norm(v.term), v]));
        payload.results = payload.results.map((r) => {
          const v = byTerm.get(norm(r.term));
          return v
            ? { ...r, verified: v.verified, verifyNote: v.note }
            : { ...r, verified: null, verifyNote: '' };
        });
      } catch (e) {
        console.error('doğrulama hatası:', e);
        payload.results = payload.results.map((r) => ({
          ...r,
          verified: null,
          verifyNote: '',
        }));
      }
    }
    res.json(payload);
  } catch (e) {
    if (e instanceof OpenAI.AuthenticationError) {
      return res.status(503).json({
        error: err(
          'API anahtarı geçersiz. OPENAI_API_KEY değerini kontrol et.',
          'Invalid API key. Check your OPENAI_API_KEY.'
        ),
      });
    }
    if (e instanceof OpenAI.RateLimitError) {
      return res.status(429).json({
        error: err(
          'İstek limiti aşıldı, biraz bekleyip tekrar dene.',
          'Rate limit exceeded, wait a bit and try again.'
        ),
      });
    }
    console.error('discover hatası:', e);
    res.status(502).json({
      error: err(
        'Kavram araması sırasında bir hata oluştu.',
        'An error occurred during the concept search.'
      ),
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sözlük API http://localhost:${PORT} adresinde çalışıyor`);
});
