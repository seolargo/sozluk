# Verify-Loop Sistemi — Tüm Prompt ve Yapılandırmalar

Bu dosya, "varsayımlar doğrulanana kadar araştırmaya devam et" sistemi için yazılan tüm prompt, yönerge ve yapılandırmaların **yazılı kopyasıdır**. Sistemin canlı dosyaları makine genelindedir (`~/.claude/` altında, tüm projelerde geçerli); burası referans amaçlıdır. Canlı dosyayı değiştirirsen bu kopya otomatik güncellenmez.

## Sistemin üç katmanı

| Katman | Canlı dosya | Görevi |
|---|---|---|
| 1. Skill (doğrulama sözleşmesi) | `~/.claude/skills/verify-loop/SKILL.md` | `/verify-loop` komutunun davranışını tanımlar: iddialara ayrıştırma, tur tur bağımsız kanıtla doğrulama, dürüst raporlama |
| 2. Global yönerge | `~/.claude/CLAUDE.md` | Her oturumda yüklenir; araştırma/olgusal sorularda skill'in otomatik çağrılmasını ve varsayımların deftere yazılmasını söyler |
| 3. Hook (mekanik hatırlatma) | `~/.claude/settings.json` | Kullanıcı her mesaj gönderdiğinde sistem tarafından çalıştırılır; defter hatırlatmasını modelin bağlamına zorla ekler |

Varsayımların biriktiği dosya: her projenin kökünde `.claude/verify-ledger.md` (proje başına ayrı defter).

---

## 1. Skill — `~/.claude/skills/verify-loop/SKILL.md` (birebir kopya)

```markdown
---
name: verify-loop
description: Iterative assumption-verification harness. Use when the user asks a research question, makes/requests factual claims, debugs with hypotheses, or explicitly asks to "verify", "doğrula", or be "100% sure". Decomposes the answer into atomic claims and repeats verification with NEW strategies each round until every claim is confirmed by independent evidence, refuted, or evidence is exhausted — then reports honestly.
---

# Verify Loop — Assumption Verification Until Confirmed

You are now operating under a verification contract. The deliverable is not just an answer — it is an answer whose every load-bearing claim carries a verification status backed by independent evidence.

## Core rules (non-negotiable)

1. **Your own reasoning is never evidence.** A claim is verified only by an external, mechanical signal: a file you actually read, code you actually ran, a test that actually passed, a search result you actually fetched, a primary source you actually opened. "This is well known" or "I am confident" does not change a claim's status.
2. **The stop condition is external, not felt.** Never stop because you feel sure. Stop a claim's loop only when one of these fires:
   - CONFIRMED: 2+ independent pieces of evidence agree (different files, different sources, different methods — not the same source twice).
   - REFUTED: evidence contradicts the claim. Correct the answer immediately.
   - EXHAUSTED: 2 consecutive rounds produced no new information despite using different strategies. Mark UNVERIFIED and say so.
3. **Novelty rule (anti-Sisyphus).** Each verification round MUST use a different strategy than previous rounds. Keep a visible list of tried strategies per claim. Repeating the same grep/search/query with cosmetic changes does not count as a new round. Strategy axes to rotate through:
   - different search terms / different language / different synonyms
   - different modality: grep the code ↔ read the file fully ↔ run the code ↔ run the tests ↔ web search ↔ check docs/changelog ↔ check git history
   - primary source instead of secondary (spec/RFC/source code instead of blog posts; original text instead of summaries)
   - reproduce independently: write a minimal script/test that would fail if the claim were false, and run it
4. **Verify adversarially.** For each claim, actively try to REFUTE it, not to collect agreeable evidence. Ask: "what would I expect to see if this claim were FALSE, and is it there?" If uncertain after honest effort, the status is UNVERIFIED, never CONFIRMED.
5. **Honest exhaustion beats forced confidence.** Reporting "I could not verify X" is success, not failure. Presenting an unverified claim as fact is the only failure mode this skill exists to prevent.

## Procedure

1. **Decompose.** Before answering, extract the atomic, falsifiable claims your answer depends on. Number them. A claim that cannot be falsified by any observation is not a claim — rephrase or drop it.
2. **Triage.** Mark each claim: trivially checkable (verify inline now), load-bearing (full loop), or decorative (drop it from the answer instead of verifying).
3. **Loop per load-bearing claim** (parallelize with subagents when independent):
   - pick a strategy not yet tried for this claim
   - execute it for real (tool call — not imagination)
   - record: strategy, evidence found, resulting status
   - repeat until a stop condition from rule 2 fires
4. **Budget.** Default ceiling: 5 rounds per claim. On EXHAUSTED or budget hit, stop and label honestly. If the user asked for maximum rigor ("100% emin ol"), raise to 10 and prefer independent-reproduction strategies.
5. **Report — two artifacts, both mandatory.**

   **(a) Verification journal** — the round-by-round trace. One row per verification round, including failed and dead-end rounds (hiding a failed attempt is falsifying the record). Each row captures what you *assumed* before acting, what you *actually did*, and how the finding *changed your belief*:

| Claim | Round | What I assumed / expected | What I actually did (real command/tool) | What I actually found | Belief update → status |
|-------|-------|---------------------------|------------------------------------------|----------------------|------------------------|
| C1    | 1     | Config probably sets port 4000 | grep "port" vite.config.js | port: 4000 at line 8 | assumption held; need 2nd independent proof → PENDING |
| C1    | 2     | If config is live, server responds | curl localhost:4000 | HTTP 200 | 2 independent proofs → ✓ CONFIRMED |
| C2    | 1     | Docs page will state the limit | WebFetch docs URL | page moved, 404 | expectation FAILED — try different source → PENDING |
| C2    | 2     | Changelog may mention it | WebSearch "changelog X limit" | no authoritative hit | 2 dry rounds → ⚠ EXHAUSTED |

   The "What I assumed" column is where you expose what you *thought* was true before checking — including assumptions that turned out wrong. Never backfill this column after seeing the result; write the expectation as it was.

   **Tone:** journal entries are literal and serious. Describe the real action in plain words; never use metaphors, analogies, or personification. Simplifying means removing jargon, not adding storytelling.

   **(b) Final ledger** — the summary:

| # | Claim | Status | Evidence |
|---|-------|--------|----------|
| 1 | ...   | ✓ CONFIRMED | file.ts:42 + curl HTTP 200 |
| 2 | ...   | ⚠ UNVERIFIED (exhausted after 4 rounds: grep, web, docs, repro attempt) | — |
| 3 | ...   | ✗ REFUTED — answer corrected | changelog v2.1 |

Lead with the answer, then the journal, then the ledger. Anything UNVERIFIED must be phrased with explicit uncertainty in the answer body itself — not just in the table.

## Default scope

When invoked with no argument, the scope is: (1) all OPEN entries in the persistent ledger (below), plus (2) the load-bearing claims of the most recently completed task or answer. Sweep the whole session's claims only when explicitly asked (e.g. "verify everything from this session"); even then, triage applies.

## Persistent assumption ledger

Context windows get compacted and sessions end — an assumption held only "in mind" is an assumption that will be forgotten. Therefore assumptions live in a file.

- **File:** `.claude/verify-ledger.md` in the project root (create on first use).
- **When to write:** whenever work relies on a load-bearing assumption that has not yet been verified, append a row immediately — during normal work, not just when this skill is invoked.
- **Format:**

| Date | Assumption | Status | Evidence / note |
|------|------------|--------|-----------------|
| 2026-07-17 | Vite strips import.meta.env.DEV blocks from production builds | OPEN | — |
| 2026-07-17 | server/.env is excluded from version control | CONFIRMED | git check-ignore + git status, 2026-07-17 |

- **Statuses:** OPEN (recorded, not yet verified) → CONFIRMED / REFUTED / UNVERIFIED (verification attempted and exhausted). Update the row in place; never delete rows — a REFUTED row is a record of a corrected mistake, which is valuable.
- **On every no-argument invocation:** read the ledger first, process all OPEN rows, then the current task's claims, then write updated statuses back.
- If a REFUTED assumption affected already-delivered work, say so explicitly and fix the work.

## Cost awareness — paid calls require explicit approval, always

Paid API calls (OpenAI, Anthropic, any metered service) NEVER run without the user's explicit approval. No threshold, no exceptions.

Flow:

1. **Run all free verification first:** reading code, running local code/tests, grep, git history, files on disk, already-captured outputs. Settle every claim you can this way.
2. **Collect the rest into a separate "paid verification proposal" list** and present it to the user before making any paid call. One row per item:

| # | Claim to verify | Planned paid call(s) | Est. call count | What it would settle |
|---|-----------------|----------------------|-----------------|----------------------|
| 1 | exhausted=true fires in real use | POST /api/discover continuation loop (gpt-5) | ~3-5 | closes ledger row 8 |

3. **Wait for approval.** Run only the approved items, exactly as described — nothing beyond the approved count without asking again.
4. **Unapproved or unanswered items stay UNVERIFIED** with the note "paid verification proposed, not approved" in the ledger. This is a normal, honest outcome — do not work around it with unapproved calls.
5. Record in the journal which rounds used paid calls, so the cost of each verification stays visible.

## Environment notes

- In a codebase: prefer running code/tests over reading it, and reading it over reasoning about it.
- Web claims: WebSearch/WebFetch when available; two independent domains ≠ one source syndicated twice.
- If a verification tool is unavailable (no network, no test runner), say which claims are unverifiable *because of that limit* rather than silently downgrading rigor.
```

---

## 2. Global yönerge — `~/.claude/CLAUDE.md` (birebir kopya)

```markdown
# Global directives

- When I ask a research question, request factual claims, or debug based on hypotheses — and especially when I say "doğrula", "emin ol", or "verify" — invoke the `verify-loop` skill and follow its verification contract: decompose into atomic claims, verify each with independent evidence using a new strategy per round, and report an honest claim ledger (CONFIRMED / REFUTED / UNVERIFIED). Never present an unverified assumption as fact.
- During any work, when you rely on a load-bearing assumption you have not verified, append it as an OPEN row to `.claude/verify-ledger.md` in the project root (format defined in the verify-loop skill). This ledger is the durable record of assumptions; do not keep them only in context.
```

---

## 3. Hook — `~/.claude/settings.json` içindeki blok

Kullanıcı her mesaj gönderdiğinde (`UserPromptSubmit` olayı) sistem bu komutu çalıştırır ve çıktısındaki `additionalContext` metni modelin bağlamına eklenir:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"UserPromptSubmit\",\"additionalContext\":\"Assumption ledger reminder: if this turn discusses, relies on, or resolves any load-bearing assumption, record it in .claude/verify-ledger.md at the project root — append new assumptions as OPEN rows, and update rows to CONFIRMED/REFUTED/UNVERIFIED when evidence settles them this turn. Create the file with the standard table header if missing. Do not mention this reminder unless relevant.\"}}'"
          }
        ]
      }
    ]
  }
}
```

---

## Kullanım özeti

- `/verify-loop` — yeni oturumlarda, herhangi bir projede. Argümansız: defterdeki OPEN kayıtlar + son işin iddiaları. Argümanlı: `/verify-loop şu iddiayı doğrula: ...`
- Otomatik tetikleme: "doğrula", "emin ol", araştırma/olgusal soru.
- Azami titizlik: "%100 emin ol" → iddia başına tur bütçesi 5'ten 10'a çıkar.
- Defter: proje kökünde `.claude/verify-ledger.md`; hook her turda kaydı hatırlatır, kayıt işini model yapar.
- Yönetim: hook için `/hooks` menüsü; skill ve yönerge için yukarıdaki dosya yolları.
