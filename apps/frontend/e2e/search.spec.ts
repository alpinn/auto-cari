import { test, expect, type Page } from "@playwright/test";
import {
  SUCCESS_WITH_PRODUCTS,
  SUCCESS_EMPTY,
  CLARIFYING,
  COMING_SOON,
  ERROR_LLM_TIMEOUT,
} from "./fixtures/search-responses";

const SEARCH_API = "http://localhost:8000/api/search";

async function mockSearchOnce(page: Page, body: unknown) {
  await page.route(SEARCH_API, (route) => route.fulfill({ json: body }), { times: 1 });
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

test("success state renders products, score, price, and marketplace badge", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await mockSearchOnce(page, SUCCESS_WITH_PRODUCTS);

  await page.goto("/search?q=kamera%20mirrorless%20untuk%20vlog");

  await expect(page.getByText(/Menampilkan rekomendasi untuk/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sony ZV-1 II Vlogging Camera", exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByText("9.2/10")).toBeVisible();
  await expect(page.getByText("Rp 13.214.000")).toBeVisible();
  await expect(page.getByText("Pilihan Editor")).toBeVisible();
  await expect(page.getByText("Shopee").first()).toBeVisible();

  const ctaLinks = page.getByRole("link", { name: /Lihat di/ });
  await expect(ctaLinks).toHaveCount(SUCCESS_WITH_PRODUCTS.products.length);

  await page.screenshot({ path: "e2e/screenshots/search-success.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("empty results renders EmptyState with suggestions", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await mockSearchOnce(page, SUCCESS_EMPTY);

  await page.goto("/search?q=laptop%20buat%20coding%20budget%208%20juta");

  await expect(page.getByText("Hmm, kami tidak menemukan yang cocok")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mulai Pencarian Baru" })).toBeVisible();

  await page.screenshot({ path: "e2e/screenshots/search-empty.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("clarifying flow sends the option label (not id) as clarification", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await mockSearchOnce(page, CLARIFYING);

  await page.goto("/search?q=HP%20bagus");

  await expect(page.getByText(CLARIFYING.question)).toBeVisible();
  await expect(page.getByText("Fotografi & konten kreator")).toBeVisible();

  // Register the follow-up mock only now — routes resolve LIFO, so registering
  // it earlier would let it answer the FIRST request instead of the second.
  const secondRequest = page.waitForRequest(
    (req) => req.url() === SEARCH_API && req.method() === "POST",
  );
  await mockSearchOnce(page, SUCCESS_WITH_PRODUCTS);

  await page.getByRole("button", { name: /Fotografi & konten kreator/ }).click();

  const req = await secondRequest;
  const payload = req.postDataJSON() as { clarification?: string };
  expect(payload.clarification).toBe("Fotografi & konten kreator");

  await expect(
    page.getByRole("link", { name: "Sony ZV-1 II Vlogging Camera", exact: false }).first(),
  ).toBeVisible();

  await page.screenshot({ path: "e2e/screenshots/search-clarifying.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("coming_soon renders waitlist form and accepts an email", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await mockSearchOnce(page, COMING_SOON);

  await page.goto("/search?q=sepatu%20running");

  await expect(page.getByText("Kategori ini sedang kami siapkan!")).toBeVisible();
  await expect(page.getByText(COMING_SOON.message)).toBeVisible();

  await page.getByPlaceholder("Email Anda").fill("test@example.com");
  await page.getByRole("button", { name: "Ingatkan Saya" }).click();

  await expect(page.getByText(/akan mengabarimu/)).toBeVisible();

  await page.screenshot({ path: "e2e/screenshots/search-coming-soon.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("error state shows the backend message and retries on click", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await mockSearchOnce(page, ERROR_LLM_TIMEOUT);

  await page.goto("/search?q=test%20query");

  await expect(page.getByText(ERROR_LLM_TIMEOUT.message)).toBeVisible();

  // Register the retry mock only now — see LIFO note in the clarifying test.
  const retryRequest = page.waitForRequest(
    (req) => req.url() === SEARCH_API && req.method() === "POST",
  );
  await mockSearchOnce(page, SUCCESS_WITH_PRODUCTS);

  await page.getByRole("button", { name: "Coba lagi" }).click();
  await retryRequest;

  await expect(
    page.getByRole("link", { name: "Sony ZV-1 II Vlogging Camera", exact: false }).first(),
  ).toBeVisible();

  await page.screenshot({ path: "e2e/screenshots/search-error.png", fullPage: true });
  expect(errors).toEqual([]);
});
