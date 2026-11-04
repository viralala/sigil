# Claim-type classifier and resume parser: evaluation

Measured 2026-11-04. Scripts and raw aggregates are in this folder (`train.py`, `leak_check.py`, `eval_parser.mjs`, `results.json`, `parser_results.json`).

## Claim classifier (`packages/parser/src/model.js`)
Trained on CESAC student records. The records themselves are private and not in this repo. Test split: 2,318 records from 246 students; no student appears in both train and test.

| Measure | Result |
|---|---|
| Accuracy | 0.914 (always guessing the majority class: 0.498) |
| Macro F1, 6 kinds with real test rows | 0.840 |
| Accuracy on the 1,274 rows whose text never appears in train (the fairer number) | 0.851 |
| Macro F1 on those rows | 0.816 |

Per class F1: certificate 0.97, publication 0.93, patent 0.91, event 0.90, job 0.75, other 0.58. Main confusion: `event` and `other` overlap in wording.

## Parser, on 12 invented resumes (a smoke test, not a benchmark)
Recall 94.7%, precision 100%, 93.4% of expected claims with all five fields exact. Field accuracy on matched claims: kind 100%, title 100%, org 98.6%, from 98.6%, to 98.6%.

## Hostile text
All 40 injection cases leave claims unchanged or produce only valid Claim fields. 31 of 40 are also detected and dropped with a warning that never echoes the text. The detector is a keyword list, so a cleverly phrased line passes it and becomes an ordinary card the holder must confirm.

## Privacy check
`leak_check.py`, run from the private folder, reports 0 hits against every student and faculty name, email and PRN. A feature must occur in at least 5 students, 292 name-matching features were stripped, digits are folded, emails and URLs are removed before featurising. A self-test plants a name fragment and confirms the checker fails.

## Limits
- The data has no real `education`, `skill` or `award` rows, and `job` means internships. Those kinds were trained on invented text (0.47 on unseen words), so the parser leans on headings and rules for them.
- One college's students: professional resumes are untested. No labelled real resumes exist, so there is no real-resume evaluation.
- Text input only, no column repair. Devanagari digits in dates are not read. `DD/MM/YYYY` is read the Indian way.
