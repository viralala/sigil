import { describe, expect, it } from "vitest";
import { POST as verify } from "@/app/api/verify/route";

const req = (url: string, body: unknown, ip = "1.1.1.1") =>
  new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });

describe("/api/verify (samples)", () => {
  it("green sample names its witness and is labelled sample", async () => {
    const res = await verify(req("http://localhost/api/verify", { link: "http://localhost:3000/s/asha-degree" }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.verdict).toBe("green");
    expect(j.sample).toBe(true);
    expect(j.witness.who).toMatch(/^Sample /);
  });
  it("revoked sample is red with a reason", async () => {
    const j = await (await verify(req("http://localhost/api/verify", { link: "kabir-revoked" }))).json();
    expect(j.verdict).toBe("red");
    expect(j.reasons).toContain("REVOKED");
  });
  it("bad link is a 400 with a code", async () => {
    const res = await verify(req("http://localhost/api/verify", { link: "javascript:alert(1)" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("NOT_SIGIL");
  });
  it("unknown id is a 404", async () => {
    const res = await verify(req("http://localhost/api/verify", { link: "nobody-here" }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("UNKNOWN_SAMPLE");
  });
  it("malformed JSON is a 400", async () => {
    const res = await verify(new Request("http://localhost/api/verify", { method: "POST", body: "{" }));
    expect(res.status).toBe(400);
  });
  it("rate limits a flood from one client", async () => {
    let last = 200;
    for (let i = 0; i < 70; i++)
      last = (await verify(req("http://localhost/api/verify", { link: "asha-degree" }, "9.9.9.9"))).status;
    expect(last).toBe(429);
  });
});
