import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AssetCard, Button, DropdownMenu, EchelonTreeItem, Icon } from "./index";

test("Fortis public UI exposes semantic actions required by the GIS runtime", () => {
  const html = renderToStaticMarkup(
    <div>
      <Icon decorative name="navigation.back" />
      <Icon decorative name="action.add" />
      <Icon decorative name="action.visibility-off" />
      <Icon decorative name="map.zoom-in" />
      <Icon decorative name="map.basemap" />
      <DropdownMenu
        icon="action.more"
        iconOnly
        items={[{ label: "Настроить эшелон", onSelect: () => undefined }]}
        label="Действия эшелона"
      />
    </div>,
  );

  assert.match(html, /svg/);
  assert.match(html, /aria-label="Действия эшелона"/);
  assert.match(html, /class="fortis-icon-button/);
});

test("GIS domain components accept real project states instead of Storybook-only L1-L4 data", () => {
  const html = renderToStaticMarkup(
    <div>
      <EchelonTreeItem
        color="#6f6aa8"
        count={4}
        detail="Активный · скрыт"
        hidden
        label="Резерв"
        level="L9"
        pattern="dashed"
        selected
      />
      <AssetCard
        actions={<Button size="sm">Разместить</Button>}
        disabled
        meta="МОГ · 3,2 км"
        status="Недоступно для L9"
        title="МОГ — пост №1"
        warning
      >
        Требуется другой эшелон
      </AssetCard>
    </div>,
  );

  assert.match(html, /L9/);
  assert.match(html, /Активный · скрыт/);
  assert.match(html, /data-hidden="true"/);
  assert.match(html, /data-disabled="true"/);
  assert.match(html, /data-warning="true"/);
  assert.match(html, /Разместить/);
});
