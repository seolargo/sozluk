// Saf yardımcı fonksiyonlar. Ağ, dosya ve OpenAI'den bağımsız tutulur ki
// birim testlerle (server/test/lib.test.js) doğrulanabilsinler.

// Bir kelimenin ?q= aramasıyla eşleşip eşleşmediğini söyler.
// Karşılaştırma Türkçe locale'de yapılır (i/İ, ı/I ayrımı için).
export function matchesQuery(word, q) {
  if (!q) return true;
  const needle = q.toLocaleLowerCase('tr');
  return (
    (word.term || '').toLocaleLowerCase('tr').includes(needle) ||
    (word.definition || '').toLocaleLowerCase('tr').includes(needle)
  );
}

// Kelime listesini arama terimine göre süzer. q boşsa liste aynen döner.
export function filterWords(words, q) {
  const needle = (q || '').toLocaleLowerCase('tr');
  if (!needle) return words;
  return words.filter((w) => matchesQuery(w, needle));
}

// POST /api/words girdisini doğrular. Geçersizse { ok:false, error } döner.
export function validateWordInput(body) {
  const term = body?.term;
  const definition = body?.definition;
  if (!term?.trim() || !definition?.trim()) {
    return { ok: false, error: 'Kelime ve tanım zorunludur.' };
  }
  return { ok: true };
}

// meta nesnesini yalnızca bilinen string alanlara indirger (trim'li).
// meta yoksa/geçersizse undefined döner.
export function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return undefined;
  const pick = (k) => (typeof meta[k] === 'string' ? meta[k].trim() : '');
  return {
    language: pick('language'),
    kind: pick('kind'),
    pronunciation: pick('pronunciation'),
    literal: pick('literal'),
    meaning: pick('meaning'),
  };
}

// Doğrulanmış girdiden kaydedilecek kelime nesnesini kurar.
// id ve createdAt dışarıdan verilir (Date.now() saf değildir; test edilebilirlik
// ve belirlenirlik için enjekte edilir).
export function buildWord({ term, definition, meta }, { id, createdAt }) {
  const word = {
    id,
    term: term.trim(),
    definition: definition.trim(),
    createdAt,
  };
  const cleanMeta = sanitizeMeta(meta);
  if (cleanMeta) word.meta = cleanMeta;
  return word;
}
