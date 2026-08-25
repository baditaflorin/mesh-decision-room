import { expect, test, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

const storagePrefix = "mesh-decision-room";

async function prepareLocalRoom(page: Page): Promise<void> {
  await page.addInitScript((prefix) => {
    localStorage.setItem(`${prefix}:signalingUrl`, "ws://localhost:1/never-connects");
    localStorage.setItem(`${prefix}:turnTokenUrl`, "http://127.0.0.1:1/never-connects");
    localStorage.removeItem(`${prefix}:iceServers`);
  }, storagePrefix);
}

async function waitForDecisionEntry(page: Page) {
  const firstOption = page.getByLabel("First option");
  await expect(firstOption).toBeEnabled();
  const primary = page.getByRole("button", { name: "Add this option", exact: true });
  await expect(primary).toBeVisible();
  return { firstOption, primary };
}

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(settings).toBeHidden();
}

test("visual contract — 390×844 entry keeps a real action visible without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareLocalRoom(page);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  const { firstOption, primary } = await waitForDecisionEntry(page);
  await firstOption.fill("Monday lunch");
  await expect(primary).toBeEnabled();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);

  const box = await primary.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
});

test("visual contract — 1141×602 keeps the primary decision action above the fold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1141, height: 602 });
  await prepareLocalRoom(page);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle("Decision Room");
  await expect(page.locator(".mesh-app-bar-title")).toHaveText("Decision Room");
  const { firstOption, primary } = await waitForDecisionEntry(page);
  await firstOption.fill("Monday lunch");
  await expect(primary).toBeEnabled();

  const box = await primary.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(602);
});

test("two peers share the shortlist and live ranked outcome", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    const aEntry = await waitForDecisionEntry(a);
    await waitForDecisionEntry(b);

    await aEntry.firstOption.fill("The courtyard table");
    await aEntry.primary.click();

    await expect(
      a.getByRole("heading", { level: 1, name: "Make the call with clarity." }),
    ).toBeVisible();
    await expect(b.getByText("The courtyard table", { exact: true }).first()).toBeVisible();

    await b.getByRole("button", { name: "Rank The courtyard table", exact: true }).click();
    await expect(a.getByTestId("leading-choice")).toContainText("The courtyard table");
  } finally {
    await cleanup();
  }
});
