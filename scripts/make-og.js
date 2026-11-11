// Generates the 1200x630 share images (WhatsApp / Facebook / X previews) into src/assets/og/.
// Run with `npm run og` after changing a package name or price. Needs Google Chrome or Edge installed.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const site = require(path.join(root, "src/_data/site.json"));
const packages = require(path.join(root, "src/_data/packages.json"));
const outDir = path.join(root, "src/assets/og");
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);
const browser = browsers.find((p) => fs.existsSync(p));
if (!browser) throw new Error("Chrome or Edge not found. Set CHROME_PATH to the browser executable.");

function card({ kicker, title, price, was, line, flag }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: "Plus Jakarta Sans", sans-serif;
    background: #6e1628; color: #fff;
    display: flex; flex-direction: column; justify-content: space-between; padding: 56px 70px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-family: "Cinzel", serif; font-weight: 800; font-size: 40px; letter-spacing: 2px; }
  .brand small { display: block; font-family: "Plus Jakarta Sans", sans-serif; font-size: 16px; letter-spacing: 6px; color: #f7df99; font-weight: 700; margin-top: 6px; }
  .flag { background: linear-gradient(135deg, #f7df99, #cba043); color: #1a1505; font-weight: 800; font-size: 22px; letter-spacing: 2px; padding: 10px 24px; border-radius: 40px; }
  .kicker { font-size: 24px; letter-spacing: 5px; color: #f7df99; font-weight: 700; text-transform: uppercase; }
  h1 { font-family: "Cinzel", serif; font-size: ${title.length > 22 ? 62 : 78}px; line-height: 1.08; margin: 12px 0 18px; }
  .price { display: flex; align-items: baseline; gap: 26px; }
  .price b { font-size: 92px; font-weight: 800; color: #f7df99; letter-spacing: -2px; }
  .price s { font-size: 40px; opacity: .75; }
  .line { font-size: 27px; font-weight: 500; opacity: .95; }
  .foot { display: flex; justify-content: space-between; align-items: center; font-size: 23px; font-weight: 700;
    border-top: 1px solid rgba(255,255,255,.25); padding-top: 22px; }
  .foot span:last-child { color: #f7df99; }
</style></head><body>
  <div class="top">
    <div class="brand">DPLANNER<small>PHOTOGRAPHY | IBADAN</small></div>
    ${flag ? `<div class="flag">${flag}</div>` : ""}
  </div>
  <div>
    <div class="kicker">${kicker}</div>
    <h1>${title}</h1>
    ${price ? `<div class="price"><b>${price}</b>${was ? `<s>${was}</s>` : ""}</div>` : ""}
    ${line ? `<div class="line">${line}</div>` : ""}
  </div>
  <div class="foot"><span>★ ${site.rating.value} from ${site.rating.count} Google reviews</span><span>dplanner.com.ng</span></div>
</body></html>`;
}

const cards = {
  home: card({
    kicker: "Wedding, studio & event photography",
    title: "Wedding Photographer in Ibadan",
    line: "Studio in Yemetu, Ibadan. Shooting in Ibadan and Lagos."
  }),
  weddings: card({
    kicker: "Wedding packages · book by " + site.promo.endsText,
    title: "Wedding Photography & Film",
    price: "From " + naira(packages[0].price),
    line: "Essential · Classic · Signature Album"
  })
};
for (const pkg of packages) {
  cards[pkg.slug] = card({
    kicker: pkg.isAddon ? "Add to Essential or Classic" : "Wedding package · book by " + site.promo.endsText,
    title: pkg.fullName,
    price: naira(pkg.price),
    was: naira(pkg.was),
    flag: pkg.popular ? "MOST POPULAR" : "",
    line: pkg.isAddon ? "Included in Signature Album" : site.deposit.replace(/^50%/, "50%")
  });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dp-og-"));
fs.mkdirSync(outDir, { recursive: true });
for (const [name, html] of Object.entries(cards)) {
  const htmlFile = path.join(tmp, name + ".html");
  const pngFile = path.join(tmp, name + ".png");
  fs.writeFileSync(htmlFile, html);
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--user-data-dir=" + path.join(tmp, "profile"),
    "--window-size=1200,630", "--virtual-time-budget=6000",
    "--screenshot=" + pngFile,
    "file:///" + htmlFile.replace(/\\/g, "/")
  ], { stdio: "ignore" });
  fs.copyFileSync(pngFile, path.join(outDir, name + ".png"));
  console.log("wrote", path.relative(root, path.join(outDir, name + ".png")));
}
fs.rmSync(tmp, { recursive: true, force: true });
