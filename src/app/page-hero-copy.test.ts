import { readFileSync } from "node:fs";

const pageSource = readFileSync("src/app/page.tsx", "utf8");
const heroCtaSource = pageSource.split("ref={heroCta}")[1]?.split("</div>")[0];

if (!heroCtaSource) {
  throw new Error("Landing hero CTA block must remain addressable for copy checks");
}

const expectedHeroCopy = [
  "Модульная система",
  "мониторинга и защиты предприятий",
];

for (const copyChunk of expectedHeroCopy) {
  if (!pageSource.includes(copyChunk)) {
    throw new Error(`Landing hero must include "${copyChunk}"`);
  }
}

if (pageSource.includes("на основе ИИ")) {
  throw new Error('Landing hero must not include "на основе ИИ"');
}

const expectedHeroCta = [
  'href="/prototype"',
  "Открыть конфигуратор",
];

for (const ctaChunk of expectedHeroCta) {
  if (!heroCtaSource.includes(ctaChunk)) {
    throw new Error(`Landing hero CTA must include "${ctaChunk}"`);
  }
}

if (heroCtaSource.includes('href="#cta"') || heroCtaSource.includes("Запросить демо")) {
  throw new Error("Landing hero primary CTA must no longer point to the demo form");
}

console.log("page-hero-copy.test.ts: landing hero copy and configurator CTA match expected behavior");
