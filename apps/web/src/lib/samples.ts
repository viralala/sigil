// The sample buttons on /check. Mirrors SAMPLE_CASES in @sigil/core (the client cannot import node:crypto).
// tests/unit/samples.test.ts keeps the two lists in step.
export const SAMPLE_BUTTONS = [
  { id: "asha-degree", person: "Asha Verma", tags: ["degree"], group: "pass" },
  { id: "rohan-internship", person: "Rohan Iyer", tags: ["job"], group: "pass" },
  { id: "meera-closed-college", person: "Meera Joshi", tags: ["degree", "closed"], group: "pass" },
  { id: "isha-derecognised", person: "Isha Pawar", tags: ["degree", "derecognised"], group: "pass" },
  { id: "kabir-revoked", person: "Kabir Shah", tags: ["revoked"], group: "attack" },
  { id: "dev-edited-grade", person: "Dev Kulkarni", tags: ["edited"], group: "attack" },
  { id: "zoya-fake-college", person: "Zoya Khan", tags: ["fake"], group: "attack" },
  { id: "arjun-unknown-signer", person: "Arjun Rao", tags: ["unknown"], group: "attack" },
  { id: "neel-relayed", person: "Neel Desai", tags: ["relayed"], group: "attack" },
  { id: "tara-backdated", person: "Tara Menon", tags: ["backdated"], group: "attack" },
] as const;
