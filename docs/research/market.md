# Sigil market research (as of 2026-11-03)

Method: every figure below comes from a page opened with WebFetch. Anything seen only in a search snippet is under UNVERIFIED. Several fetched pages are news/secondary reports of primary sources; this is flagged in the table.

## 1. Problem size

**Global.** HireRight's 2026 Global Benchmark Report (survey of 1,900+ HR/risk/TA professionals, fielded 18 Feb-6 Mar 2026, announced 30 Jun 2026) says most companies found candidate discrepancies in the prior 12 months, and employment verification was the check most likely to surface inconsistencies. The fetched copy is a mirror of the press release with no hard percentages. The 2025 edition (1,000+ respondents; HireRight press release 15 Sep 2025) gives harder numbers: "more than three-quarters" uncovered discrepancies; 1 in 6 had experienced identity fraud in hiring and about 3 in 10 were unsure; 47% of EMEA respondents found education issues; employment discrepancies 64% (EMEA) and 72% (APAC).

**India.** AuthBridge Workforce Fraud Files H1 FY26 (16 Feb 2026): overall discrepancy rate 4.33% white-collar, 5.61% gig. White-collar by check: employment 11.15%, address 7.68%, education 4.49%, reference 4.17%. Sector peaks: employment in Retail 16.37%, Telecom 14.32%, BFSI 13.00%; CV-validation discrepancy IT 12.80%. Caveat: the page's intro text (6%/4%) contradicts its body; the number of checks analysed is not stated.

**Fake universities and rackets.** A Free Press Journal article (updated 21 Feb 2026) says UGC lists 32 fake universities (12 in Delhi/New Delhi, 4 UP). The article gives no UGC notice number. Careers360 (10 Apr 2026): Delhi Police arrested 7 at a fake-institution degree racket. ThePrint/PTI (9 Jun 2026): Kanpur Police arrested 4; seized 141 rubber stamps, 80 hologram strips, 830 blank marksheet papers; forged documents linked to eight named universities/boards. The Police Commissioner is quoted: "In some cases, the print quality appeared even better than original certificates." This supports the claim that visual inspection of paper cannot work.

**Time and cost of manual checks.** India (The People's Board, 8 Jul 2026, a vendor-adjacent blog): education 1-3 days if digital, up to 15 days if manual; employment 3-7 days per employer, "depends entirely on how quickly former HR teams respond." India per-check INR prices: not verified. Price anchors from vendor pages (USD): Checkr (pricing page, undated): education $12.50 for 1 degree; employment $12.50 to $50 by lookback; packages $29.99 / $59.99 / $94.99. Springworks help page (undated): extra education check $7.50, employment $7.50 beyond plan quota.

## 2. India infrastructure and policy

- **DigiLocker:** 72.43 crore (724.3 million) registered users; 5,437 document types/services as of 31 Jul 2026 (661 central, 4,776 state); about 72.86 crore access transactions over three years (Free Press Journal / Telangana Today via IANS, 12 Aug 2026, quoting a Rajya Sabha reply). A count of documents issued was not found. The PIB explainer (7 Jul 2026) says DigiLocker hosts NAD since 2020 and is "the operational digital platform for issuing and accessing academic credentials."
- **APAAR/ABC:** Careers360 (17 Dec 2025, citing a Rajya Sabha reply): more than 6 crore APAAR IDs across 2,600+ institutions; 7 crore+ academic records mapped. The same article also cites a conflicting "25 crore by 15,000 institutions", so treat the APAAR count with caution. The PIB document gives institution counts: 1,420 universities, 53,583 colleges, 16,795 standalone institutions. 2,600 institutions on ABC is therefore a small share of roughly 70,000 higher-ed institutions (my arithmetic, indicative only).
- **What this infrastructure does not cover (inference from what the sources describe):** the sources describe academic and government documents. I found no source showing a general mechanism for private-employer employment credentials. Only an EPFO-DigiLocker integration for Joint Declarations (23 Aug 2025) and an IndianOil appointment-letter item (search snippet only) surfaced. Paper-legacy degrees and unlisted private issuers are not addressed in the fetched sources. The Kanpur seizures show forgery of the paper-legacy kind is active. Mark the "gap" claim as inference, not sourced fact.
- **DPDP:** Rules notified 14 Nov 2025 (PIB). Bar & Bench: Board provisions effective 13 Nov 2025; consent-manager rules from 13 Nov 2026 (about 10 days from today); main fiduciary obligations (notice, consent, rights, security) from 13 May 2027. Penalties (PIB): up to Rs 250 crore for failing reasonable security safeguards; up to Rs 200 crore for breach-notification or child-data failures; up to Rs 50 crore for other violations. 90-day response to rights requests; 72-hour breach reporting. The People's Board: collect only what the role requires, erase once purpose is served. Implication: a design that holds no candidate data centrally and verifies signatures offline has a lighter compliance surface than lookup-based BGV.
- **EU:** member states must offer at least one certified EUDI wallet by December 2026; relying parties (banks, telecoms, etc.) must accept around December 2027 (fintech.global, 13 Jul 2026). Germany plans early Jan 2027; readiness varies.
- **US:** DHS S&T Silicon Valley Innovation Program (8 Jul 2024) awarded six firms (~$187k-$200k first-round each; up to $1.7M per firm across four phases) for W3C VC/DID wallets and verifiers for credentials in immigration and travel.

## 3. Competitors and adjacent players

| Player | What they do / model | Scale (sourced) | Last money event (sourced) |
|---|---|---|---|
| Checkr | US BGV API, per-report fees | 30M+ checks/yr, "hundreds of millions" revenue (Sep 2021) | $250M Series E at $4.6B, 1 Sep 2021, Durable Capital lead |
| First Advantage + Sterling | Enterprise BGV | Pro forma revenue ~$1.5B | Acquired Sterling, $2.2B incl. debt, 31 Oct 2024 (Nasdaq) |
| HireRight | Enterprise BGV | ~34,000 customers; 60M+ screens in 2024 | Taken private by General Atlantic and Stone Point at ~$1.65B EV, announced 16 Feb 2024 (Davis Polk; closing date not confirmed on the page) |
| IDfy (India) | KYC/KYB, BGV (CrimeCheck), TrustStack | 500+ enterprise clients, 500M+ checks/yr, ~600 staff | Rs 476 cr (Neo Asset Mgmt lead; YourStory, Feb 2026); $23M at $256.4M post-money, ~22 Jun 2026 (BiometricUpdate). IPO-ready in 2-3 years |
| AuthBridge (India) | BGV, workforce fraud reports | "3,000 clients across 30+ industries" (own boilerplate, Feb 2026) | Funding not found |
| SpringVerify (Springworks, India) | BGV SaaS, per-check pricing | not found | not found |
| Credly (Pearson) | Digital badges, issuer-paid | 2,000+ orgs, 50M credentials, 25M people (Jan 2022) | Acquired by Pearson ~$200M incl. prior stake (31 Jan 2022) |
| Accredible | Credential/badge platform, priced per recipient | 100M+ credentials (Jun 2024); added W3C VC support 13 Jan 2026 | Series B (Frontier Growth) Sep 2023, amount not disclosed on page |
| Dock Labs / Truvera | VC issuance/wallet platform | not found | Pricing: Build $499/mo for 250 production credentials; Scale custom. Funding not found |
| Hyland (Learning Machine) | Blockcerts-derived issuing for universities | not found | Acquired Feb 2020; price not disclosed |
| MIT / Blockcerts | Open-source blockchain diplomas | Pilot of 111 students (Oct 2017) | n/a |
| Persona | Identity verification, API | customer base doubled in a year; clients include OpenAI | $200M Series D at $2B, 30 Apr 2025 (Founders Fund, Ribbit); prior $1.5B in 2021 |
| Veriff | IDV | claimed 8x volume growth in 2021 | $100M Series C at $1.5B, 26 Jan 2022 |
| Onfido (Entrust) | IDV | $140M+ revenue, 1,200+ customers pre-deal | Acquired 9 Apr 2024, price undisclosed |

Socure and Sumsub were not researched; they are not in the table because nothing was verified.

**The gap Sigil can own (reasoned from the above, not a sourced claim):** (a) BGV vendors verify by contacting the issuer, which is where the 1-15 day and per-check cost come from; (b) badge and VC platforms such as Credly, Accredible and Dock serve issuers and are not built for claim-level checks of a whole resume; (c) IDV players (Persona, Veriff, Onfido) verify the person, not the claims; (d) DigiLocker/NAD cover government-issued academic documents but nothing found covers employer-issued claims or paper-legacy degrees. Sigil's wedge is "resume as a bundle of signed claims, holder-carried, verified offline," with a paper-legacy bridge.

## 4. Unicorn logic

Market-size estimates (vendor/analyst, treat as soft): Fortune Business Insights, employment screening services: $7.19B (2025), $7.78B (2026 est.), $13.71B (2034), 7.3% CAGR (updated 19 Oct 2026). Goode Intelligence via BiometricUpdate (24 Jun 2025): global IDV revenue to exceed $20B by 2030; reusable digital identity verification above $11.4B by 2030. No sourced credentialing-market size found.

Comparable $1B+ outcomes (verified above): Checkr $4.6B (2021 round), Veriff $1.5B (2022), Persona $2B (2025), Sterling-First Advantage $2.2B (2024), HireRight $1.65B (2024). Caution: Checkr and Veriff valuations are 2021-22 marks. I did not verify any current valuation for either. India comparable IDfy is at $256M post-money (June 2026), so an Indian-only BGV business has not reached $1B on the evidence found. A global story is needed for unicorn logic.

Models seen: per-report fee (Checkr), per-recipient issuer SaaS (Accredible from $45/mo), monthly credential bundle (Dock $499/mo), enterprise contract (Hyland, FA). Dock's page also describes issuers charging for verification.

Pricing anchors: US education check $12.50, employment $12.50-$50, packages $30-$95 (Checkr); $7.50 per extra education/employment check (Springworks, USD). A zero-lookup model should price below these, or charge issuers/holders instead.

## 5. Fraud and AI angle

- Gartner press release (31 Jul 2025): "by 2028, one in four candidate profiles worldwide will be fake." In its 2Q25 survey of 3,000 candidates, 6% admitted interview fraud (posing as someone or having someone pose). HR Dive (8 Aug 2025) quotes Gartner's Jamie Kohn on cybersecurity risk. Treat the 2028 figure as a prediction, not a measurement.
- UPenn Career Services (13 Aug 2026): cites more than 40 people charged in US DOJ cases over North Korean schemes placing operatives in US jobs; ESET's Jake Moore built a fake candidate with about $50 of software that two companies hired (via HCAMag; undated). These are second-hand citations in a blog.
- Monster Credibility Gap (Pollfish, 19 Jan 2026; published 13 Feb 2026; 1,002 US job seekers): 13% admit lying or misleading on a resume recently.
- HireRight 2025: 1 in 6 respondents had experienced hiring identity fraud.

## Citation table

| Claim | Figure | Source (publisher) | URL | Date | How verified |
|---|---|---|---|---|---|
| Discrepancies, employers | >3/4 found; 1 in 6 identity fraud | HireRight press release | https://www.hireright.com/company/newsroom/identity-fraud-and-candidate-discrepancies-remain-key-concerns-for-employers | 15 Sep 2025 | WebFetch |
| 2026 benchmark | 1,900+ respondents; employment checks most often flag | 01net.it (press release mirror) | https://www.01net.it/hireright-releases-2026-global-benchmark-report/ | 30 Jun 2026 | WebFetch (secondary) |
| HireRight scale | ~34,000 customers; 60M+ screened 2024 | HireRight | same HireRight URL | 2025 | WebFetch |
| India discrepancy | 4.33% / 5.61%; employment 11.15%, education 4.49% | AuthBridge | https://authbridge.com/newsroom/authbridge-releases-workforce-fraud-files-h1-fy26-hiring-discrepancies-persist-across-white-collar-and-gig-workforce/ | 16 Feb 2026 | WebFetch (page internally inconsistent) |
| Fake universities | 32 (12 Delhi) | Free Press Journal | https://www.freepressjournal.in/education/indias-fake-university-crisis-ugc-identifies-32-institutions-operating-without-approval-check-official-notification-here | 21 Feb 2026 | WebFetch (no UGC notice no.) |
| Kanpur racket | 4 arrested; 141 stamps, 80 holograms, 830 blank sheets | ThePrint (PTI) | https://theprint.in/india/kanpur-police-busts-international-fake-degree-racket-4-arrested/2955457/ | 9 Jun 2026 | WebFetch |
| Delhi racket | 7 arrested | Careers360 | https://news.careers360.com/delhi-fake-degree-racket-busted-seven-arrested-govindpuri-forged-certificates-seized-police-investigation | 10 Apr 2026 | WebFetch |
| India BGV TAT | Edu 1-3 d digital, up to 15 manual; employment 3-7 d | The People's Board | https://www.thepeoplesboard.com/hr-compliance/background-verification-in-india-process-timelines-and-dpdp-compliance/ | 8 Jul 2026 | WebFetch (blog) |
| Checkr prices | $29.99/$59.99/$94.99; edu $12.50; emp $12.50-$50 | Checkr | https://checkr.com/pricing | undated | WebFetch |
| Springworks prices | $7.50 per extra edu/emp check | Springworks support | https://support.springworks.in/portal/en/kb/articles/what-are-the-costs-associated-with-the-different-types-of-checks | undated | WebFetch |
| DigiLocker | 72.43 crore users; 5,437 doc types | Free Press Journal (IANS) | https://www.freepressjournal.in/business/digilocker-crosses-7243-crore-users-umang-records-1166-crore-registrations-govt-informs-rajya-sabha | 12 Aug 2026 | WebFetch |
| NAD/DigiLocker role; institution counts | 1,420 univ; 53,583 colleges | PIB | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202677915101.pdf | 7 Jul 2026 | WebFetch |
| APAAR | 6 crore+ IDs, 2,600+ institutions | Careers360 | https://news.careers360.com/education-ministry-more-than-6-crore-apaar-ids-generated-so-far-2600-institutions-rajya-sabha-data-abc-scheme-ncrf-ugc-digilocker/amp | 17 Dec 2025 | WebFetch (internal conflict) |
| DPDP penalties | Rs 250/200/50 crore | PIB | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf | 17 Nov 2025 | WebFetch |
| DPDP timeline | 13 Nov 2025 / 13 Nov 2026 / 13 May 2027 | Bar & Bench | https://www.barandbench.com/view-point/meity-notifies-final-digital-personal-data-protection-rules-2025 | Nov 2025 | WebFetch |
| EUDI | Wallet by Dec 2026; acceptance ~Dec 2027 | fintech.global | https://fintech.global/2026/07/13/eidas-2-0-deadlines-loom-two-tracks-one-trust-chain/ | 13 Jul 2026 | WebFetch |
| DHS SVIP | 6 awards, up to $1.7M each | BiometricUpdate | https://www.biometricupdate.com/202407/dhs-digital-credential-wallet-program-announces-first-six-contracts | 8 Jul 2024 | WebFetch |
| Checkr round | $250M at $4.6B | Checkr blog | https://checkr.com/blog/checkr-raises-250-million-at-4-6-billion-valuation | 1 Sep 2021 | WebFetch |
| FA-Sterling | $2.2B incl. debt | Nasdaq | https://www.nasdaq.com/articles/first-advantage-completes-acquisition-sterling-check-22b | 31 Oct 2024 | WebFetch |
| HireRight take-private | ~$1.65B EV | Davis Polk | https://www.davispolk.com/experience/hireright-1-65-billion-acquisition-general-atlantic-and-stone-point-capital | 16 Feb 2024 | WebFetch |
| IDfy | $23M at $256.4M | BiometricUpdate | https://www.biometricupdate.com/202606/indian-identity-verification-firm-idfy-raises-23m-at-256m-valuation | 22 Jun 2026 | WebFetch |
| IDfy Series F | Rs 476 cr; 500M checks/yr | YourStory | https://yourstory.com/2026/02/digital-trust-platform-idfy-raises-funding-round-led-by-neo-asset-management | Feb 2026 (page undated) | WebFetch |
| AuthBridge scale | 3,000 clients | AuthBridge newsroom | https://authbridge.com/blog/assets/newsroom/page/3/ | Feb 2026 | WebFetch |
| Persona | $200M at $2B | FinTech Global / FinTech Futures | https://fintech.global/2025/04/30/identity-verification-firm-persona-hits-2bn-valuation-following-200m-funding-round/ | 30 Apr 2025 | WebFetch |
| Veriff | $100M at $1.5B | TechCrunch | https://techcrunch.com/2022/01/26/identity-verification-provider-veriff-raises-100m-series-c-co-led-by-tiger-global-and-alkeon | 26 Jan 2022 | WebFetch |
| Onfido | acquired, price undisclosed; $140M+ revenue | Entrust | https://www.entrust.com/company/newsroom/entrust-completes-acquisition-of-onfido-creating-a-new-era-of-identity-centric-security | 9 Apr 2024 | WebFetch |
| Credly | ~$200M, 50M credentials | Pearson plc | https://plc.pearson.com/en-GB/news-and-insights/news/pearson-acquires-digital-credentialing-leader-credly | 31 Jan 2022 | WebFetch |
| Accredible | 100M credentials; VC support; Series B | Accredible newsroom | https://www.accredible.com/newsroom | to Aug 2026 | WebFetch |
| Accredible pricing | from $45/mo, per recipient | Accredible | https://www.accredible.com/pricing | undated | WebFetch |
| Dock pricing | $499/mo, 250 credentials | Dock | https://dock.io/pricing | undated | WebFetch |
| Hyland-Learning Machine | acquired, price undisclosed | KMWorld | https://www.kmworld.com/Articles/News/News/Hyland-acquires-blockchain-solution-provider-Learning-Machine-139079.aspx | 5 Feb 2020 | WebFetch |
| MIT diplomas | 111 students | Campus Technology | https://campustechnology.com/articles/2017/10/19/mit-pilots-digital-diplomas-based-on-bitcoins-blockchain.aspx | 19 Oct 2017 | WebFetch |
| Employment screening market | $7.19B 2025 | Fortune Business Insights | https://www.fortunebusinessinsights.com/employment-screening-services-market-115476 | 19 Oct 2026 | WebFetch (vendor estimate) |
| IDV market | >$20B by 2030 | BiometricUpdate (Goode Intelligence) | https://www.biometricupdate.com/202506/identity-verification-to-surpass-20b-by-2030-amid-transition-to-reusable-digital-id | 24 Jun 2025 | WebFetch (vendor estimate) |
| Gartner fake profiles | 1 in 4 by 2028; 6% interview fraud | Gartner | https://www.gartner.com/en/newsroom/press-releases/2025-07-31-gartner-survey-shows-just-26-percent-of-job-applicants-trust-ai-will-fairly-evaluate-them | 31 Jul 2025 | WebFetch |
| Resume lying | 13% | Monster | https://www.monster.com/career-advice/research/credibility-gap | 13 Feb 2026 | WebFetch |
| Deepfake/NK cases | 40+ charged; $50 fake candidate | UPenn Career Services | https://careerservices.upenn.edu/blog/2026/08/13/you-are-real-now-prove-it/ | 13 Aug 2026 | WebFetch (second-hand) |

## UNVERIFIED / could not confirm

- Number of documents issued via DigiLocker, and academic-document counts; NAD record/user counts (no figures on fetched pages).
- Whether APAAR is 6 crore or 25 crore (the same article conflicts).
- Whether UGC's fake list is 32 with Delhi at 10 or 12 (the article contradicts itself); no UGC notice number seen.
- A "100,000 fake degrees from 22 universities" claim (propakistani.pk, search snippet only, not opened).
- Current valuations for Checkr, Veriff; any Persona round after Apr 2025; AuthBridge and SpringVerify funding or revenue; India per-check INR prices; Credly pricing; Socure and Sumsub details.
- HireRight take-private closing date; HireRight 2026 report hard percentages (only a press-release mirror was fetched).
- Resume Genius and Checkster surveys (searched, not opened).
- Any dollar cost to employers of credential fraud; EU/US/India government VC adoption numbers beyond those above; India-specific W3C VC programmes.
- Any government statement that employer-issued experience credentials are out of scope for DigiLocker/NAD (my inference only).
- A sourced credentialing-market size.

## So what for Sigil

1. The pain is real in India: employment is the worst check (11.15% discrepancy), education 4.49% (AuthBridge, Feb 2026), and forged degrees are police-seized by the stamp-and-hologram kit (Kanpur, Jun 2026).
2. Manual verification is slow (up to 15 days for education, 3-7 per employer) and priced at $7.50-$50 per check in USD vendor lists. Zero-lookup verification attacks both.
3. DigiLocker (72.43 crore users) is the distribution rail to plug into, not a competitor; ship as an issuer/verifier layer compatible with it. Whether employer claims and paper-legacy are uncovered is an inference to validate with HR and BGV interviews.
4. DPDP full obligations start 13 May 2027, with penalties up to Rs 250 crore; a holder-controlled, minimal-disclosure design is a compliance selling point for HR and BGV firms.
5. The EU wallet deadline (Dec 2026) and the DHS VC programme show governments converging on W3C-style credentials; build on open standards (VC, DID) so Sigil stays interoperable.
6. Competitor map shows nobody combines claim-level whole-resume verification with holder-carried proof: BGV firms look up, badge platforms serve issuers, IDV firms verify the person.
7. Fraud tailwind: Gartner predicts 1 in 4 candidate profiles fake by 2028 (a prediction), and 6% of surveyed candidates admit interview fraud. Pitch it as a trend, not a measurement.
8. Unicorn outcomes exist ($1.5B-$4.6B rounds; $1.65B-$2.2B exits) but were all in US/EU BGV and IDV; the Indian comparable IDfy is at $256M, so the global path must be in the story.
9. Pricing: undercut $12.50-$50 per employment/education check with a per-verification fee in INR, or charge issuers per-recipient (Accredible-style, from $45/mo) and verifiers per API call.
10. Go-to-market wedge: sell to BGV firms (AuthBridge, IDfy, SpringVerify) as an accelerator rather than a rival, since they hold employer relationships and compliance.
11. Cold-start risk: verification needs issuers to sign. Lead with a paper-legacy bridge (attested import from existing paper/DigiLocker documents) so value exists before issuers adopt.
12. For the hackathon, cite only the table above; label predictions and vendor market sizes as estimates, and flag the UNVERIFIED list before any judge asks.
