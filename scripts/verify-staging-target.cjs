const expectedStagingRef = "rwikjhdehbambuztlcwu";
const productionRef = "ndvknwejrghmchdzsmrs";
const origin = "http://localhost:3001";

async function main() {
  const response = await fetch(`${origin}/login`, { cache: "no-store" });
  const html = await response.text();
  const scriptUrls = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((match) => new URL(match[1], origin).href)
    .filter((url) => new URL(url).pathname.startsWith("/_next/"));

  let stagingMatches = 0;
  let productionMatches = 0;
  for (const scriptUrl of scriptUrls) {
    const scriptResponse = await fetch(scriptUrl, { cache: "no-store" });
    if (!scriptResponse.ok) continue;
    const script = await scriptResponse.text();
    if (script.includes(expectedStagingRef)) stagingMatches += 1;
    if (script.includes(productionRef)) productionMatches += 1;
  }

  console.log(`LOCAL_HTTP_STATUS=${response.status}`);
  console.log(`LOGIN_PAGE_MARKER=${html.includes("Client Login") ? "YES" : "NO"}`);
  console.log(`STAGING_REF_MATCHED_IN_BROWSER_CHUNKS=${stagingMatches}`);
  console.log(`PRODUCTION_REF_MATCHED_IN_BROWSER_CHUNKS=${productionMatches}`);
  if (!response.ok || stagingMatches === 0 || productionMatches !== 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.log("LOCAL_STAGING_CHECK=UNAVAILABLE");
  console.log(`ERROR_TYPE=${error?.name ?? "Error"}`);
  process.exitCode = 1;
});
