import { expect, test, type Page } from "@playwright/test";

const API_ORIGIN = "http://127.0.0.1:8791";

interface MeResponse {
  state: {
    stats: Record<string, { best: number }>;
  } | null;
}

// The page exposes the engine handle in development only; the E2E uses it to
// shorten the fuel tank so a run ends deterministically instead of on the
// server clock. The probe reaches runtime instance fields directly.
declare global {
  interface Window {
    __playflixCycle?: {
      fuel: number;
      bike: { x: number };
      phase: string;
    };
  }
}

const canvas = (page: Page) => page.getByLabel(/Cycle hill climb racing game/);

function progressSaved(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().endsWith("/v1/progress") &&
      response.request().method() === "PUT" &&
      response.status() === 200,
    { timeout: 30_000 },
  );
}

test.describe("Cycle hill climb", () => {
  test("five roads, one life: a gas run drains the tank, records the run and persists the best", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/play/cycle");

    const startRide = page.getByRole("button", { name: /Start Riding/ });
    await expect(startRide).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("button", { name: /1 Green Hills/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /5 Volcano Rim/ })).toBeVisible();

    // Watch for the save before the run can end, so the response cannot race
    // the assertions below.
    const saved = progressSaved(page);
    await startRide.click();
    await expect(canvas(page)).toBeVisible({ timeout: 10_000 });

    // Shrink the tank: four riding seconds of fuel, then the bike stalls.
    const state = await page.evaluate(() => {
      const game = window.__playflixCycle;
      if (!game) throw new Error("The Cycle engine was not exposed to the test.");
      game.fuel = 4;
      return { phase: game.phase, x: game.bike.x };
    });
    expect(state.phase).toBe("riding");
    expect(state.x).toBeGreaterThan(0);

    // Hold gas until the tank is dry, then let the bike roll to a stop so the
    // engine takes its fuel-depletion crash path. Obstacle bumps and refuel
    // pickups are part of real runs now, so re-pin the tank low right before the
    // end to keep the finish deterministic.
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(2_200);
    await page.keyboard.up("ArrowUp");
    await page.evaluate(() => {
      const game = window.__playflixCycle;
      if (game) game.fuel = 0.4;
    });

    await saved;
    await expect(page.getByRole("button", { name: /Ride again/ })).toBeVisible({
      timeout: 40_000,
    });

    // The run is server-authoritative: reload and read the profile back.
    await page.reload();
    await expect(page.getByRole("button", { name: /Start Riding/ })).toBeVisible({
      timeout: 25_000,
    });

    const me = await page.evaluate(async (apiOrigin) => {
      const response = await fetch(`${apiOrigin}/v1/me`, { credentials: "include" });
      return { status: response.status, body: (await response.json()) as MeResponse };
    }, API_ORIGIN);

    expect(me.status).toBe(200);
    expect(me.body.state?.stats?.cycle?.best).toBeGreaterThan(0);
  });
});
