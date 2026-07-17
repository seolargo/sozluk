import { useEffect, useState } from 'react';
import './App.css';

import { CULTURE_GROUPS } from './cultures';

const API = '/api/words';

function App() {
  const [words, setWords] = useState([]);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feeling, setFeeling] = useState('');
  const [culture, setCulture] = useState('');
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [addedTerms, setAddedTerms] = useState(new Set());

  async function fetchWords(q = '') {
    setLoading(true);
    try {
      const res = await fetch(q ? `${API}?q=${encodeURIComponent(q)}` : API);
      setWords(await res.json());
      setError('');
    } catch {
      setError('Sunucuya ulaşılamadı. Backend çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchWords(query), 300);
    return () => clearTimeout(t);
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
        body: JSON.stringify({ query: feeling, culture }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscoverError(data.error || 'Bir hata oluştu.');
      } else {
        setDiscoverResults(data.results || []);
        setAddedTerms(new Set());
      }
    } catch {
      setDiscoverError('Sunucuya ulaşılamadı. Backend çalışıyor mu?');
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function handleAddResult(r) {
    const definition = [
      `(${r.language}${r.kind ? `, ${r.kind}` : ''})`,
      r.literal ? `Birebir: "${r.literal}".` : '',
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
      <header>
        <h1>📖 Sözlük</h1>
        <p className="subtitle">Kendi kelime dağarcığını oluştur</p>
      </header>

      <section className="discover">
        <h2>🌍 Hissini anlat, kelimesini bul</h2>
        <p className="muted discover-hint">
          Ne hissettiğini kendi cümlelerinle yaz; dünya dillerinden bu hissi
          karşılayan kelime, deyim ve atasözlerini bulalım.
        </p>
        <form onSubmit={handleDiscover}>
          <textarea
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            rows={3}
            placeholder="Örn: Bir daha asla dönmeyecek güzel günlere karşı tatlı-buruk bir özlem duyuyorum..."
          />
          <div className="discover-controls">
            <select
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              title="Aramayı bir ülke veya medeniyetle sınırla"
            >
              <option value="">🌍 Tüm dünya</option>
              {CULTURE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button type="submit" disabled={discoverLoading}>
              {discoverLoading ? 'Aranıyor...' : 'Kavram Ara'}
            </button>
          </div>
        </form>
        {discoverError && <p className="error">{discoverError}</p>}
        {discoverLoading && (
          <p className="muted">Dünya literatürü taranıyor, bu biraz sürebilir...</p>
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
                  {r.kind}
                </span>
                {r.pronunciation && (
                  <span className="muted pron">[{r.pronunciation}]</span>
                )}
              </div>
              {r.literal && (
                <p className="word-def">
                  <em>Birebir çeviri:</em> {r.literal}
                </p>
              )}
              <p className="word-def">{r.meaning}</p>
              <p className="discover-why">{r.why}</p>
              <button
                className="add-result-btn"
                onClick={() => handleAddResult(r)}
                disabled={addedTerms.has(r.term)}
              >
                {addedTerms.has(r.term) ? '✓ Eklendi' : '+ Sözlüğe ekle'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <form className="add-form" onSubmit={handleSubmit}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Kelime"
        />
        <input
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Tanım"
        />
        <button type="submit">Ekle</button>
      </form>

      <input
        className="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Kelime veya tanım ara..."
      />

      {error && <p className="error">{error}</p>}
      {loading && !error && <p className="muted">Yükleniyor...</p>}
      {!loading && !error && words.length === 0 && (
        <p className="muted">
          {query ? 'Sonuç bulunamadı.' : 'Henüz kelime yok. İlk kelimeni ekle!'}
        </p>
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
              title="Sil"
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
