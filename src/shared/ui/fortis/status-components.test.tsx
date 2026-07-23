import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { InlineMessage } from "@/shared/ui/fortis/inline-message";
import { SaveIndicator } from "@/shared/ui/fortis/save-indicator";
import { Status } from "@/shared/ui/fortis/status";
import { VersionIndicator } from "@/shared/ui/fortis/version-indicator";

test("Status renders a semantic sign and readable text without becoming focusable", () => {
  const html = renderToStaticMarkup(<Status label="Покрытие рассчитано" tone="success" />);

  assert.match(html, /Покрытие рассчитано/);
  assert.match(html, /data-tone="success"/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /tabindex|role="button"/i);
});

test("InlineMessage keeps a local explanation and one recovery action", () => {
  const html = renderToStaticMarkup(
    <InlineMessage action={<button type="button">Проверить</button>} tone="warning">
      Северный сектор ниже цели на 14 п.п.
    </InlineMessage>,
  );

  assert.match(html, /Северный сектор ниже цели на 14 п.п\./);
  assert.match(html, /Проверить/);
  assert.match(html, /data-variant="section"/);
});

test("SaveIndicator exposes saving and consequential conflict states", () => {
  const saving = renderToStaticMarkup(<SaveIndicator state="saving" />);
  const conflict = renderToStaticMarkup(<SaveIndicator onResolveConflict={() => undefined} state="conflict" />);

  assert.match(saving, /Сохранение…/);
  assert.match(saving, /aria-busy="true"/);
  assert.match(saving, /aria-live="polite"/);
  assert.match(conflict, /Конфликт версий/);
  assert.match(conflict, /role="alert"/);
  assert.match(conflict, /Сравнить версии/);
});

test("VersionIndicator keeps version identity independent from persistence state", () => {
  const staticVersion = renderToStaticMarkup(<VersionIndicator status="current" version="v12" />);
  const interactiveVersion = renderToStaticMarkup(<VersionIndicator onOpenHistory={() => undefined} status="conflict" version="v11" />);

  assert.match(staticVersion, /Версия/);
  assert.match(staticVersion, /v12/);
  assert.match(staticVersion, /Текущая/);
  assert.match(interactiveVersion, /aria-label="Открыть историю версии v11: есть расхождения"/);
  assert.match(interactiveVersion, /Есть расхождения/);
});
