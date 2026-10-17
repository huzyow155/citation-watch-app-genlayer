async function verify() {
  const res = await fetch("https://commitment-ledger-app-genlayer.vercel.app");
  const html = await res.text();
  console.log("Production HTML status:", res.status);
  const match = html.match(/\/assets\/index-[^"]+\.js/);
  if (!match) {
    console.error("Failed to locate bundle script in HTML");
    process.exit(1);
  }
  const jsUrl = "https://commitment-ledger-app-genlayer.vercel.app" + match[0];
  console.log("Fetching production bundle:", jsUrl);
  const jsRes = await fetch(jsUrl);
  const js = (await jsRes.text()).toLowerCase();
  const active = "0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB".toLowerCase();
  const superseded = "0xdD0d120B50ED65400E8b6a060bB15103B42544E8".toLowerCase();
  console.log("Active address present:", js.includes(active));
  console.log("Superseded address present:", js.includes(superseded));
  if (!js.includes(active) || js.includes(superseded)) {
    console.error("Production bundle verification FAILED!");
    process.exit(1);
  }
  console.log("PROD VERIFICATION PASSED: Only active contract 0xBaC9... is served.");
}
verify();
