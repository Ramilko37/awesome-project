import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Badge } from "@/shared/ui/fortis/badge";
import { Button } from "@/shared/ui/fortis/button";
import { IconButton } from "@/shared/ui/fortis/icon-button";
import { Input, Textarea } from "@/shared/ui/fortis/field";
import { Icon } from "@/shared/ui/fortis/icon";
import { FortisProvider } from "@/shared/ui/fortis/provider";

test("Icon distinguishes decorative and labelled semantic icons", () => {
  const decorative = renderToStaticMarkup(<Icon name="action.save" decorative />);
  const labelled = renderToStaticMarkup(<Icon name="action.save" label="Сохранить проект" />);

  assert.match(decorative, /aria-hidden="true"/);
  assert.doesNotMatch(decorative, /aria-label/);
  assert.match(labelled, /aria-label="Сохранить проект"/);
  assert.match(labelled, /role="img"/);
});

test("Button keeps a native disabled control and busy state while loading", () => {
  const html = renderToStaticMarkup(<Button loading>Сохранить</Button>);

  assert.match(html, /<button/);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Сохранить/);
});

test("IconButton requires and exposes an accessible action name", () => {
  const html = renderToStaticMarkup(<IconButton icon="action.more" label="Дополнительные действия" />);

  assert.match(html, /aria-label="Дополнительные действия"/);
  assert.match(html, /min-h-\[var\(--fortis-density-modes-active-control-height\)\]/);
});

test("Input links its visible label and error message to the native field", () => {
  const html = renderToStaticMarkup(<Input error="Укажите стоимость" invalid label="Стоимость" />);

  const inputId = html.match(/<input[^>]*id="([^"]+)"/u)?.[1];
  assert.ok(inputId);
  assert.match(html, new RegExp(`<label[^>]*for="${inputId}"`));
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="[^"]+"/);
  assert.match(html, /Укажите стоимость/);
});

test("Textarea exposes its counter through the field description", () => {
  const html = renderToStaticMarkup(<Textarea label="Комментарий" maxLength={10} onChange={() => undefined} value="Тест" />);

  assert.match(html, /4\/10/);
  assert.match(html, /aria-describedby="[^"]+"/);
});

test("Badge remains non-interactive and FortisProvider scopes theme and density", () => {
  const badge = renderToStaticMarkup(<Badge>4 актива</Badge>);
  const provider = renderToStaticMarkup(<FortisProvider density="comfortable">Содержимое</FortisProvider>);

  assert.doesNotMatch(badge, /tabindex|role="button"/i);
  assert.match(provider, /data-fortis-theme="light"/);
  assert.match(provider, /data-fortis-density="comfortable"/);
});
