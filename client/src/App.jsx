import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

import {
  CIVILIZATIONS,
  COUNTRY_GROUPS,
  PERSON_GROUPS,
  SACRED_TEXT_GROUPS,
} from './cultures';
import { STRINGS } from './i18n';

const API = '/api/words';

// "atasözü" → "atasozu" gibi CSS sınıfı için ASCII'ye çevirir
function kindSlug(kind) {
  return (kind || '')
    .replaceAll('ö', 'o')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's');
}

function loaderSteps(t, culture, person, sacredText) {
  const s = t.steps;
  if (sacredText) {
    return [
      { at: 0, label: s.parse },
      { at: 4, label: s.scanText(sacredText) },
      { at: 14, label: s.matchPassages },
      { at: 28, label: s.checkRefs },
      { at: 45, label: s.translating },
    ];
  }
  if (person) {
    return [
      { at: 0, label: s.parse },
      { at: 4, label: s.scanPerson(person) },
      { at: 14, label: s.matchQuotes },
      { at: 30, label: s.translating },
      { at: 55, label: s.checkSources },
    ];
  }
  return [
    { at: 0, label: s.parse },
    { at: 4, label: culture ? s.scanCulture(culture) : s.scanWorld },
    { at: 14, label: s.families },
    { at: 28, label: s.proverbs },
    { at: 45, label: s.writing },
  ];
}

function DiscoverLoader({ t, culture, person, sacredText, isMore }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const steps = loaderSteps(t, culture, person, sacredText);
  const activeIndex = steps.reduce(
    (acc, s, i) => (elapsed >= s.at ? i : acc),
    0
  );

  return (
    <div className="loader-card">
      <div className="loader-header">
        <span className="spinner" />
        <strong>{steps[activeIndex].label}...</strong>
        <span className="loader-elapsed">{elapsed}s</span>
      </div>
      <ul className="loader-steps">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={
              i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'
            }
          >
            {i < activeIndex ? '✓' : i === activeIndex ? '●' : '○'} {s.label}
          </li>
        ))}
      </ul>
      <p className="loader-note">{isMore ? t.loaderNoteMore : t.loaderNote}</p>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState(
    () => localStorage.getItem('sozluk-lang') || 'tr'
  );
  const t = STRINGS[lang];

  const [words, setWords] = useState([]);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feeling, setFeeling] = useState('');
  const [culture, setCulture] = useState('');
  const [person, setPerson] = useState('');
  const [sacredText, setSacredText] = useState('');
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [addedTerms, setAddedTerms] = useState(new Set());
  const [exhausted, setExhausted] = useState(false);
  const [exhaustedNote, setExhaustedNote] = useState('');
  const [isMoreSearch, setIsMoreSearch] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const copyTimerRef = useRef(null);

  function formatResult(r) {
    const lines = [
      `${r.term} — ${r.language} (${t.kinds[r.kind] || r.kind})${
        r.pronunciation ? ` [${r.pronunciation}]` : ''
      }`,
    ];
    if (r.literal) lines.push(`${t.literalLabel} ${r.literal}`);
    lines.push(r.meaning);
    if (r.why) lines.push(`${t.whyLabel}: ${r.why}`);
    return lines.join('\n');
  }

  async function copyText(key, textToCopy) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(key);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(''), 1500);
    } catch {
      // pano erişimi reddedildi; sessiz geç
    }
  }

  function copyOne(r) {
    copyText(r.term, formatResult(r));
  }

  function copyAll() {
    const all = [
      `${t.feelingLabel}: ${feeling.trim()}`,
      '',
      ...discoverResults.map((r) => formatResult(r)),
    ].join('\n\n');
    copyText('__all__', all);
  }

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: 'region' }),
    [lang]
  );

  function toggleLang() {
    const next = lang === 'tr' ? 'en' : 'tr';
    setLang(next);
    localStorage.setItem('sozluk-lang', next);
    // Seçili filtre adları dile bağlı; karışıklığı önlemek için sıfırla
    setCulture('');
    setPerson('');
    setSacredText('');
  }

  async function fetchWords(q = '') {
    setLoading(true);
    try {
      const res = await fetch(q ? `${API}?q=${encodeURIComponent(q)}` : API);
      setWords(await res.json());
      setError('');
    } catch {
      setError(t.serverUnreachable);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchWords(query), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, definition }),
    });
    if (res.ok) {
      setTerm('');
      setDefinition('');
      fetchWords(query);
    }
  }

  async function handleDelete(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchWords(query);
  }

  async function runDiscover({ more = false } = {}) {
    if (!feeling.trim() || discoverLoading) return;
    setDiscoverLoading(true);
    setIsMoreSearch(more);
    setDiscoverError('');
    if (!more) {
      setDiscoverResults([]);
      setExhausted(false);
      setExhaustedNote('');
    }
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: feeling,
          culture,
          person,
          text: sacredText,
          lang,
          exclude: more ? discoverResults.map((r) => r.term) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscoverError(data.error || t.genericError);
      } else {
        const seen = new Set(
          more ? discoverResults.map((r) => r.term.toLowerCase()) : []
        );
        const fresh = (data.results || []).filter(
          (r) => !seen.has(r.term.toLowerCase())
        );
        setDiscoverResults((prev) => (more ? [...prev, ...fresh] : fresh));
        if (!more) setAddedTerms(new Set());
        if (data.exhausted) {
          setExhausted(true);
          setExhaustedNote(data.note || t.exhaustedDefault);
        }
      }
    } catch {
      setDiscoverError(t.serverUnreachable);
    } finally {
      setDiscoverLoading(false);
    }
  }

  function handleDiscover(e) {
    e.preventDefault();
    runDiscover();
  }

  async function handleAddResult(r) {
    const definition = [
      `(${r.language}${r.kind ? `, ${t.kinds[r.kind] || r.kind}` : ''})`,
      r.literal ? `${t.literalWord}: "${r.literal}".` : '',
      r.meaning,
    ]
      .filter(Boolean)
      .join(' ');
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        term: r.term,
        definition,
        meta: {
          language: r.language,
          kind: r.kind,
          pronunciation: r.pronunciation,
          literal: r.literal,
          meaning: r.meaning,
        },
      }),
    });
    if (res.ok) {
      setAddedTerms((prev) => new Set(prev).add(r.term));
      fetchWords(query);
    }
  }

  return (
    <div className="container">
      <button className="lang-toggle" onClick={toggleLang} title="Türkçe / English">
        {t.langToggle}
      </button>
      <header>
        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
      </header>

      <section className="discover">
        <h2>{t.discoverTitle}</h2>
        <p className="muted discover-hint">{t.discoverHint}</p>
        <form onSubmit={handleDiscover}>
          <textarea
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            rows={3}
            placeholder={t.feelingPlaceholder}
          />
          <div className="discover-controls">
            <select
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              title={t.cultureTitle}
            >
              <option value="">{t.allWorld}</option>
              <optgroup label={CIVILIZATIONS.label[lang]}>
                {CIVILIZATIONS.options.map((c) => (
                  <option key={c.tr} value={c[lang]}>
                    {c[lang]}
                  </option>
                ))}
              </optgroup>
              {COUNTRY_GROUPS.map((group) => (
                <optgroup key={group.label.en} label={group.label[lang]}>
                  {group.codes
                    .map((code) => ({ code, name: regionNames.of(code) }))
                    .sort((a, b) => a.name.localeCompare(b.name, lang))
                    .map(({ code, name }) => (
                      <option key={code} value={name}>
                        {name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              title={t.personTitle}
            >
              <option value="">{t.noPerson}</option>
              {PERSON_GROUPS.map((group) => (
                <optgroup key={group.label.en} label={group.label[lang]}>
                  {group.options.map((p) => (
                    <option key={p.tr} value={p[lang]}>
                      {p[lang]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              value={sacredText}
              onChange={(e) => setSacredText(e.target.value)}
              title={t.textTitle}
            >
              <option value="">{t.noText}</option>
              {SACRED_TEXT_GROUPS.map((group) => (
                <optgroup key={group.label.en} label={group.label[lang]}>
                  {group.options.map((x) => (
                    <option key={x.tr} value={x[lang]}>
                      {x[lang]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button type="submit" disabled={discoverLoading}>
              {discoverLoading ? t.searching : t.searchBtn}
            </button>
          </div>
        </form>
        {discoverError && <p className="error">{discoverError}</p>}
        {discoverLoading && (
          <DiscoverLoader
            t={t}
            culture={culture}
            person={person}
            sacredText={sacredText}
            isMore={isMoreSearch}
          />
        )}
        {discoverResults.length > 0 && (
          <div className="results-toolbar">
            <button type="button" className="copy-btn" onClick={copyAll}>
              {copiedKey === '__all__' ? t.copiedAll : t.copyAll}
            </button>
          </div>
        )}
        <ul className="discover-list">
          {discoverResults.map((r) => (
            <li
              key={`${r.language}-${r.term}`}
              className={`discover-card${r.verified === false ? ' unverified' : ''}`}
            >
              <div className="discover-head">
                <span className="word-term">{r.term}</span>
                <span className="badge">{r.language}</span>
                <span className={`badge badge-kind kind-${kindSlug(r.kind)}`}>
                  {t.kinds[r.kind] || r.kind}
                </span>
                {r.verified === true && (
                  <span className="badge badge-verified">{t.verified}</span>
                )}
                {r.verified === false && (
                  <span className="badge badge-unverified">{t.unverified}</span>
                )}
                {r.pronunciation && (
                  <span className="muted pron">[{r.pronunciation}]</span>
                )}
              </div>
              {r.literal && (
                <p className="word-def">
                  <em>{t.literalLabel}</em> {r.literal}
                </p>
              )}
              <p className="word-def">{r.meaning}</p>
              <p className="discover-why">{r.why}</p>
              {r.verifyNote && (
                <p
                  className={`verify-note ${
                    r.verified === false ? 'verify-warn' : 'verify-ok'
                  }`}
                >
                  {r.verifyNote}
                </p>
              )}
              <div className="card-actions">
                <button
                  className="add-result-btn"
                  onClick={() => handleAddResult(r)}
                  disabled={addedTerms.has(r.term)}
                >
                  {addedTerms.has(r.term) ? t.added : t.addToDict}
                </button>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyOne(r)}
                >
                  {copiedKey === r.term ? t.copied : t.copy}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {discoverResults.length > 0 && !discoverLoading && (
          exhausted ? (
            <p className="exhausted-note">🏁 {exhaustedNote}</p>
          ) : (
            <button
              type="button"
              className="more-btn"
              onClick={() => runDiscover({ more: true })}
            >
              {t.generateMore}
            </button>
          )
        )}
      </section>

      <form className="add-form" onSubmit={handleSubmit}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t.termPlaceholder}
        />
        <input
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder={t.defPlaceholder}
        />
        <button type="submit">{t.addBtn}</button>
      </form>

      <input
        className="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.searchPlaceholder}
      />

      {error && <p className="error">{error}</p>}
      {loading && !error && <p className="muted">{t.loadingWords}</p>}
      {!loading && !error && words.length === 0 && (
        <p className="muted">{query ? t.noResults : t.emptyDict}</p>
      )}

      <ul className="word-list">
        {words.map((w) => (
          <li key={w.id} className="word-card">
            <div className="word-body">
              <div className="word-head">
                <span className="word-term">{w.term}</span>
                {w.meta?.language && (
                  <span className="badge">{w.meta.language}</span>
                )}
                {w.meta?.kind && (
                  <span className={`badge badge-kind kind-${kindSlug(w.meta.kind)}`}>
                    {t.kinds[w.meta.kind] || w.meta.kind}
                  </span>
                )}
                {w.meta?.pronunciation && (
                  <span className="muted pron">[{w.meta.pronunciation}]</span>
                )}
              </div>
              {w.meta ? (
                <>
                  {w.meta.literal && (
                    <p className="word-def">
                      <em>{t.literalLabel}</em> {w.meta.literal}
                    </p>
                  )}
                  {w.meta.meaning && <p className="word-def">{w.meta.meaning}</p>}
                </>
              ) : (
                <p className="word-def">{w.definition}</p>
              )}
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDelete(w.id)}
              title={t.deleteTitle}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
