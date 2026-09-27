# PWM WP-03 Local Audit and Checkpoint Reconciliation — 2026-09-26

Status: AUTHORITATIVE EXTRACTION INPUT FOR DROWK CRM

## Sources reconciled

This note reconciles:
1. the committed PWM WP-03 spec at local main `775e0a5`;
2. the untracked local draft files reported by the read-only Codex audit:
   - `CRM_Gmail_Incremental_A1.js`
   - `PWM_Gmail_Incremental_Verification_A1.js`
   - `harness/wp03-regression.mjs`;
3. the later `PWM_CONTINUIDADE_FULL_2026-09-26` checkpoint supplied by the owner.

The later checkpoint supersedes older WP-03 assumptions where they conflict.

## Local audit facts

The Codex read-only audit reported:
- local harness: 150/150 PASS;
- the harness validates the committed direct Gmail-to-Core contract;
- the three implementation/verification/harness files are untracked;
- no runtime Gmail/Sheets/Apps Script proof was established;
- the draft contains useful cursor, pagination, replay, lock, deduplication and
  PREPARED/PASS mechanics.

A green legacy harness is therefore regression evidence for the legacy contract,
not acceptance evidence for the DROWK architecture.

## Checkpoint authority

The 2026-09-26 checkpoint requires:
- discover new manual outbound and inbound events;
- preserve Gmail Message ID and Thread ID;
- preserve labels/state, timestamps, participants, source fingerprint, watermark
  and parser version;
- Draft != Sent;
- Spam does not imply commercial irrelevance;
- marketing/system noise must be relevance-gated before semantic judgment;
- manual outbound may start a candidate commercial chain;
- domain alone never proves identity;
- same Gmail Message ID replay must not duplicate;
- expired/invalid History cursor fails closed into controlled recovery;
- concurrent sync cannot commit inconsistent cursor/state;
- JEV sees only relevant bounded context;
- Shadow/read-only first;
- zero Core mutation at the first runtime gate.

## Safe reuse from the local WP-03 draft

PORT / ADAPT:
- decimal History ID comparison;
- full pagination;
- repeated history/message reference collapse;
- source-key uniqueness preflight;
- replay/idempotency mechanics;
- single-run lock/failure handling;
- PREPARED -> read-back -> PASS cursor audit;
- literal source value handling;
- bounded recovery structure.

TEST_ONLY / REWRITE EXPECTATIONS:
- old regression cases that directly assert Core creation;
- SPAM-removal eligibility;
- sender-only direction inference.

DROP AS AUTHORITY:
- direct Gmail -> Conversation/Activity mutation;
- current-SPAM exclusion as commercial relevance;
- From=owner as sufficient proof of outbound SENT.

## DROWK target boundary

```text
Gmail
  -> SourceObservation
  -> normalized Gmail evidence
  -> deterministic relevance/direction evidence
  -> identity/linkage candidates
  -> PolicyDecision for promotion
  -> accepted CRM projection
```

Source capture and Core promotion are separate operations with separate authority.

## PWM source rule

Do not rewrite or delete the old local draft while extracting it. Preserve it as
legacy implementation evidence until DROWK parity/golden tests exist.
