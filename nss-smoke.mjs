import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fails = [];
function ok(name, cond, extra = "") {
  if (cond) console.log("PASS", name);
  else {
    console.log("FAIL", name, extra);
    fails.push(name + " " + extra);
  }
}

try {
  await page.addInitScript(() => sessionStorage.setItem("nsp-splash-seen", "1"));
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);
  const home = await page.locator("body").innerText();
  ok("student registration btn", /Student registration/i.test(home));
  ok("student login btn", /Student login/i.test(home));
  ok("admin login btn", /Admin login/i.test(home));
  ok("contact nav", /Contact/i.test(home));

  await page.goto(base + "/register", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const reg = await page.locator("body").innerText();
  ok("register photo", /Passport photograph/i.test(reg));
  ok("register abc", /ABC ID/i.test(reg));
  ok("register my bharat", /MY Bharat ID/i.test(reg));

  await page.goto(base + "/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const contact = await page.locator("body").innerText();
  ok("contact po", /Programme Officer/i.test(contact) && /WhatsApp/i.test(contact));

  await page.goto(base + "/login?role=po", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.locator("#id").fill("po");
  await page.locator("input[type=password]").first().fill("haresh123");
  await page.locator("form button[type=submit]").click();
  await page.waitForURL(/\/po/, { timeout: 15000 });
  await page.waitForTimeout(1000);
  const dash = await page.locator("body").innerText();
  ok("present today", /Present/i.test(dash));
  ok("nav logs", /Logs/i.test(dash));

  await page.goto(base + "/po/volunteers", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const vol = await page.locator("body").innerText();
  ok("promote", /Promote selected/i.test(vol));
  ok("id card btn", /\bID\b/.test(vol));
  ok("edit", /Edit/i.test(vol));

  await page.goto(base + "/po/logs", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  ok("logs page", /Activity logs/i.test(await page.locator("body").innerText()));

  await page.goto(base + "/po/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  ok("change password", /Change Programme Officer password/i.test(await page.locator("body").innerText()));

  await page.goto(base + "/student-register", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  ok("student-register alias", page.url().includes("/register"));

  await page.screenshot({ path: "/workspace/screenshots/qa-netlify-volunteers.png" });
} catch (e) {
  console.log("ERROR", e);
  fails.push(String(e));
  await page.screenshot({ path: "/workspace/screenshots/qa-error.png" }).catch(() => {});
} finally {
  await browser.close();
  console.log(fails.length ? "RESULT FAIL " + fails.length : "RESULT PASS");
  process.exit(fails.length ? 1 : 0);
}
