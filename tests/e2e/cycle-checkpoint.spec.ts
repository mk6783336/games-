import { expect, test } from "@playwright/test";

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

test.describe("Cycle checkpoints", () => {
  test("a cleared gate unlocks the next road and survives a reload", async ({ page }) => {
    await page.goto("/play/cycle");

    const start = page.getByRole("button", { name: /Start at Fern Hollow/ });
    await expect(start).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("0 / 5", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /02 Ridgeclimb/ })).toBeDisabled();

    await start.click();
    await expect(page.getByLabel(/Cycle mountain-bike game canvas/)).toBeVisible();

    // Watch the save before the gate is reached, so the response cannot race
    // the assertion below.
    const progressSaved = page.waitForResponse(
      (response) =>
        response.url().endsWith("/v1/progress") &&
        response.request().method() === "PUT" &&
        response.status() === 200,
      { timeout: 25_000 },
    );

    // Put the real, running game just before the first checkpoint. The gate
    // itself and the page's save path stay untouched; only travel time is cut.
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

    await expect(page.getByText("Road 01 cleared")).toBeVisible({ timeout: 15_000 });
    await progressSaved;

    await page.reload();

    await expect(page.getByRole("button", { name: /Start at Ridgeclimb/ })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("1 / 5", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /01 Fern Hollow/ })).toContainText("Best split");
    await expect(page.getByRole("button", { name: /02 Ridgeclimb/ })).toBeEnabled();

    const me = await page.evaluate(async (apiOrigin) => {
      const response = await fetch(`${apiOrigin}/v1/me`, { credentials: "include" });
      return { status: response.status, body: (await response.json()) as MeResponse };
    }, API_ORIGIN);

    expect(me.status).toBe(200);
    expect(me.body.state?.cycle.levelsCleared).toContain(1);
    expect(me.body.state?.cycle.bestMs["1"]).toBeGreaterThan(0);
  });
});
