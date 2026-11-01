import { expect, test, type Page } from "@playwright/test";

const API_ORIGIN = "http://127.0.0.1:8791";

type CycleProbe = {
  W: number;
  x: number;
  y: number;
  camX: number;
  camLift: number;
  world: { spans: { gate: number }[] };
  hAt: (x: number) => number;
};

interface MeResponse {
  state: {
    cycle: {
      levelsCleared: number[];
      bestMs: Record<string, number>;
    };
  } | null;
}

declare global {
  interface Window {
    __playflixCycle?: CycleProbe;
  }
}

const canvas = (page: Page) => page.getByLabel(/Cycle mountain-bike game canvas/);

function progressSaved(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().endsWith("/v1/progress") &&
      response.request().method() === "PUT" &&
      response.status() === 200,
    { timeout: 25_000 },
  );
}

/**
 * Put the running game just before the next gate. Every road generator keeps
 * its final 760 units hazard-free, so this never skips an obstacle; only the
 * travel time is cut. The gate, the banner and the page's save path all stay
 * untouched.
 */
async function approachFirstGate(page: Page) {
  await expect(canvas(page)).toBeVisible();
  const approach = await page.evaluate(() => {
    const game = window.__playflixCycle;
    if (!game) throw new Error("The Cycle engine was not exposed to the test.");
    const span = game.world.spans[0];
    game.x = span.gate - 260;
    game.y = game.hAt(game.x);
    game.camX = game.x - game.W * 0.33;
    game.camLift = game.y * 0.68;
    return { gateX: span.gate, startX: game.x };
  });
  expect(approach.startX).toBeLessThan(approach.gateX);
}

test.describe("Cycle checkpoints", () => {
  test("two cleared gates unlock the next roads and both splits survive a reload", async ({ page }) => {
    test.setTimeout(90_000);

    // Gate 1: Fern Hollow.
    await page.goto("/play/cycle");

    const startFern = page.getByRole("button", { name: /Start at Fern Hollow/ });
    await expect(startFern).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("0 / 5", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /02 Ridgeclimb/ })).toBeDisabled();

    await startFern.click();

    // Watch the save before the gate is reached, so the response cannot race
    // the assertion below.
    const fernSaved = progressSaved(page);
    await approachFirstGate(page);
    await expect(page.getByText("Road 01 cleared")).toBeVisible({ timeout: 15_000 });
    await fernSaved;

    await page.reload();

    await expect(page.getByText("1 / 5", { exact: true })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("button", { name: /01 Fern Hollow/ })).toContainText("Best split");
    await expect(page.getByRole("button", { name: /02 Ridgeclimb/ })).toBeEnabled();

    // Gate 2: Ridgeclimb. Starting a run here makes it span 0 of a fresh world.
    const startRidge = page.getByRole("button", { name: /Start at Ridgeclimb/ });
    await expect(startRidge).toBeVisible();
    await startRidge.click();

    const ridgeSaved = progressSaved(page);
    await approachFirstGate(page);
    await expect(page.getByText("Road 02 cleared")).toBeVisible({ timeout: 15_000 });
    await ridgeSaved;

    await page.reload();

    await expect(page.getByText("2 / 5", { exact: true })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("button", { name: /01 Fern Hollow/ })).toContainText("Best split");
    await expect(page.getByRole("button", { name: /02 Ridgeclimb/ })).toContainText("Best split");
    await expect(page.getByRole("button", { name: /03 Aurora Pass/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /04 Ember Canyon/ })).toBeDisabled();

    const me = await page.evaluate(async (apiOrigin) => {
      const response = await fetch(`${apiOrigin}/v1/me`, { credentials: "include" });
      return { status: response.status, body: (await response.json()) as MeResponse };
    }, API_ORIGIN);

    expect(me.status).toBe(200);
    expect(me.body.state?.cycle.levelsCleared).toEqual([1, 2]);
    expect(me.body.state?.cycle.bestMs["1"]).toBeGreaterThan(0);
    expect(me.body.state?.cycle.bestMs["2"]).toBeGreaterThan(0);
  });
});
