import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesQuery,
  filterWords,
  validateWordInput,
  sanitizeMeta,
  buildWord,
} from '../lib.js';

const sample = [
  { id: '1', term: 'saudade', definition: 'derin özlem' },
  { id: '2', term: 'Ikigai', definition: 'yaşam amacı' },
  { id: '3', term: 'hüzün', definition: 'İstanbul melankolisi' },
];

test('matchesQuery: boş sorgu her kelimeyle eşleşir', () => {
  assert.equal(matchesQuery(sample[0], ''), true);
});

test('matchesQuery: terim içinde eşleşir', () => {
  assert.equal(matchesQuery(sample[0], 'saud'), true);
});

test('matchesQuery: tanım içinde eşleşir', () => {
  assert.equal(matchesQuery(sample[1], 'yaşam'), true);
});

test('matchesQuery: eşleşmeyen sorgu false döner', () => {
  assert.equal(matchesQuery(sample[0], 'xyz'), false);
});

test('matchesQuery: Türkçe locale büyük/küçük harf (İ/i) doğru çalışır', () => {
  // 'Ikigai' içindeki I, TR locale'de 'ı'ya iner; 'ikigai' aramasıyla
  // eşleşMEMELİ (bu tam da toLocaleLowerCase("tr") davranışı).
  assert.equal(matchesQuery(sample[1], 'ıkigai'), true);
  // 'İstanbul' -> 'istanbul'; 'istanbul' aramasıyla eşleşmeli.
  assert.equal(matchesQuery(sample[2], 'istanbul'), true);
});

test('filterWords: boş sorgu listeyi aynen döndürür', () => {
  assert.equal(filterWords(sample, ''), sample);
});

test('filterWords: eşleşenleri süzer', () => {
  const r = filterWords(sample, 'özlem');
  assert.equal(r.length, 1);
  assert.equal(r[0].term, 'saudade');
});

test('validateWordInput: geçerli girdi', () => {
  assert.deepEqual(validateWordInput({ term: 'a', definition: 'b' }), { ok: true });
});

test('validateWordInput: boş/eksik alan reddedilir', () => {
  assert.equal(validateWordInput({ term: '  ', definition: 'b' }).ok, false);
  assert.equal(validateWordInput({ term: 'a', definition: '' }).ok, false);
  assert.equal(validateWordInput({}).ok, false);
  assert.equal(validateWordInput(undefined).ok, false);
});

test('sanitizeMeta: geçersiz meta undefined döner', () => {
  assert.equal(sanitizeMeta(undefined), undefined);
  assert.equal(sanitizeMeta('x'), undefined);
});

test('sanitizeMeta: yalnızca bilinen alanları trim ederek tutar', () => {
  const m = sanitizeMeta({
    language: '  Portekizce ',
    kind: 'kelime',
    evil: 'atılmalı',
    pronunciation: 5,
  });
  assert.deepEqual(m, {
    language: 'Portekizce',
    kind: 'kelime',
    pronunciation: '', // string değildi -> boş
    literal: '',
    meaning: '',
  });
  assert.equal('evil' in m, false);
});

test('buildWord: id/createdAt enjekte edilir, alanlar trim edilir', () => {
  const w = buildWord(
    { term: '  saudade ', definition: ' özlem ' },
    { id: 'abc', createdAt: '2026-07-19T00:00:00.000Z' }
  );
  assert.deepEqual(w, {
    id: 'abc',
    term: 'saudade',
    definition: 'özlem',
    createdAt: '2026-07-19T00:00:00.000Z',
  });
  assert.equal('meta' in w, false);
});

test('buildWord: meta verilirse eklenir', () => {
  const w = buildWord(
    { term: 'a', definition: 'b', meta: { language: 'TR' } },
    { id: 'x', createdAt: 't' }
  );
  assert.equal(w.meta.language, 'TR');
});
