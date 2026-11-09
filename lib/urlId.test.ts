/*
 * Round-trip tests for the URL id codec. Run with `npm run test:urlid`.
 *
 * What matters here: every id that goes into a link comes back out of it unchanged,
 * the token never contains the id, links made before the change still resolve, and the
 * server renders a link exactly as the browser does (SSR and hydration must agree).
 */
import { randomUUID } from "node:crypto";
import { encodeId, decodeId, encodeIds, decodeIds } from "./urlId";

let failures = 0;
function check(name: string, passed: boolean, detail = "") {
  if (!passed) failures++;
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("URL id codec\n");

let roundTripped = true;
let sample = "";
for (let i = 0; i < 5000; i++) {
  const id = randomUUID();
  const token = encodeId(id);
  if (i === 0) sample = `${id} → ${token}`;
  if (decodeId(token) !== id || !/^[A-Za-z0-9_-]{22}$/.test(token)) {
    roundTripped = false;
    console.log(`    broke on ${id} → ${token} → ${decodeId(token)}`);
    break;
  }
}
check("5000 ids round trip, 22 url-safe characters each", roundTripped, sample);

const id = "3f0b8c2a-1111-4222-8333-444455556666";
check("the token does not contain the id", !encodeId(id).includes("3f0b"), encodeId(id));
check("different ids give different tokens", encodeId(id) !== encodeId(randomUUID()));
check("the same id always gives the same token", encodeId(id) === encodeId(id));
check("a plain uuid still decodes, so older links keep working", decodeId(id) === id);
check("a non-uuid segment passes through", encodeId("admin") === "admin" && decodeId("admin") === "admin");
check("null and undefined are safe", encodeId(null) === "" && decodeId(undefined) === "");
check("an unreadable token is handed back untouched", decodeId("!!not-a-token!!") === "!!not-a-token!!");

const ids = [randomUUID(), randomUUID(), randomUUID()];
check("an id list round trips", JSON.stringify(decodeIds(encodeIds(ids))) === JSON.stringify(ids));

// Server-rendered links must match the ones the browser builds, or hydration breaks.
const browserToken = encodeId(id);
const { atob: realAtob, btoa: realBtoa } = globalThis;
Reflect.deleteProperty(globalThis, "btoa");
Reflect.deleteProperty(globalThis, "atob");
check("the server builds the same token as the browser", encodeId(id) === browserToken);
check("the server decodes it the same way", decodeId(browserToken) === id);
Object.assign(globalThis, { atob: realAtob, btoa: realBtoa });

console.log(`\n${failures === 0 ? "all passed" : `${failures} failed`}`);
process.exit(failures === 0 ? 0 : 1);
