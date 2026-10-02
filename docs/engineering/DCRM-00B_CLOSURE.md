# DCRM-00B Closure — legacy reference Extraction Bridge

Status: CLOSED / SOURCE-TARGET ALIGNED
Closed from owner-supplied local Codex evidence.

## Local legacy reference state used

Observed source checkout:
- repository: `<owner-controlled legacy source workspace>`
- HEAD before local alignment: `775e0a52ceed63c9be9b756a2735e031265358a6`
- WP-03 implementation/verifier/regression were local untracked draft artifacts.

## Local alignment result

Codex reported these local changes:
- `docs/PWM_WP03_MASTER_SPEC.md`
- `docs/PWM_WP03_DROWK_EXTRACTION_HANDOFF.md`
- `CRM_Gmail_Incremental_A1.js`
- `PWM_Gmail_Incremental_Verification_A1.js`
- `harness/wp03-regression.mjs`
- `harness/wp03-extraction-regression.mjs`

The authoritative checkpoint file already existed untracked and matched the
supplied 2026-09-26 checkpoint, so it was preserved.

## Verification evidence

Reported local/static/synthetic checks:
- syntax: 4/4 PASS;
- current WP-02 harness: 67/67 PASS;
- revised WP-03 extraction regression: 25/25 PASS;
- namespace review: 0 collisions;
- old WP-03 draft regression: 150/150 retained only as legacy-contract evidence.

No Gmail/Sheets/Apps Script writer runtime was executed.
Nothing was committed during this gate.

## Historical mismatch retained

An older baseline profile has one expected failure because it asserts Decision
Layer A1.1 while this checkout uses A1.2.

This is recorded as a historical compatibility mismatch, not silently converted
to PASS. It does not block DROWK extraction because the current harness and revised
WP-03 extraction regression are the relevant local evidence.

## Semantic reconciliation

The local source and DROWK target now agree on:

- Gmail source capture is separate from Core promotion;
- Draft != Sent;
- owned From alone is insufficient SENT evidence;
- SPAM is mailbox-state evidence, not a relevance decision;
- relevance precedes JEV/semantic judgment;
- first runtime gate has zero Core mutation;
- decimal History cursor/pagination/replay/lock/audit mechanics remain reusable;
- legacy direct-Core behavior remains historical reference only.

## Promotion consequence

DCRM-00B is closed.

The canonical development stream resumes in `drowknet/drowk-crm`.
legacy CRM source remains a preservation/regression oracle and must not evolve as a parallel
product.

Next active gate: DCRM-01A PostgreSQL execution and persistence foundation.
