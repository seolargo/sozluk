import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

import { CIVILIZATIONS, COUNTRY_GROUPS, PERSON_GROUPS } from './cultures';
import { STRINGS } from './i18n';

const API = '/api/words';

function loaderSteps(t, culture, person) {
  const s = t.steps;
  if (person) {
    return [
      { at: 0, label: s.parse },
      { at: 4, label: s.scanPerson(person) },
      { at: 14, label: s.matchQuotes },
      { at: 28, label: s.checkSources },
      { at: 45, label: s.translating },
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

function DiscoverLoader({ t, culture, person }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const steps = loaderSteps(t, culture, person);
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
      <p className="loader-note">{t.loaderNote}</p>
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
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [addedTerms, setAddedTerms] = useState(new Set());

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

  async function handleDiscover(e) {
    e.preventDefault();
    if (!feeling.trim() || discoverLoading) return;
    setDiscoverLoading(true);
    setDiscoverError('');
    setDiscoverResults([]);
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: feeling, culture, person, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscoverError(data.error || t.genericError);
      } else {
        setDiscoverResults(data.results || []);
        setAddedTerms(new Set());
      }
    } catch {
      setDiscoverError(t.serverUnreachable);
    } finally {
      setDiscoverLoading(false);
    }
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
      body: JSON.stringify({ term: r.term, definition }),
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
            <button type="submit" disabled={discoverLoading}>
              {discoverLoading ? t.searching : t.searchBtn}
            </button>
          </div>
        </form>
        {discoverError && <p className="error">{discoverError}</p>}
        {discoverLoading && (
          <DiscoverLoader t={t} culture={culture} person={person} />
        )}
        <ul className="discover-list">
          {discoverResults.map((r) => (
            <li key={`${r.language}-${r.term}`} className="discover-card">
              <div className="discover-head">
                <span className="word-term">{r.term}</span>
                <span className="badge">{r.language}</span>
                <span
                  className={`badge badge-kind kind-${(r.kind || '')
                    .replaceAll('ö', 'o')
                    .replaceAll('ü', 'u')
                    .replaceAll('ş', 's')}`}
                >
                  {t.kinds[r.kind] || r.kind}
                </span>
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
              <button
                className="add-result-btn"
                onClick={() => handleAddResult(r)}
                disabled={addedTerms.has(r.term)}
              >
                {addedTerms.has(r.term) ? t.added : t.addToDict}
              </button>
            </li>
          ))}
        </ul>
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
            <div>
              <span className="word-term">{w.term}</span>
              <p className="word-def">{w.definition}</p>
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
