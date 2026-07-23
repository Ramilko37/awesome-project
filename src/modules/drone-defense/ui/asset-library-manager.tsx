"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Icon,
  IconButton,
  Input,
  Select,
  Status,
  Textarea,
} from "@/shared/ui/fortis";
import {
  createDefenseAsset,
  deleteDefenseAsset,
  updateDefenseAsset,
  type DefenseAssetMutationInput,
} from "@/modules/drone-defense/infra/asset-library-api";
import { prototypeRu } from "@/shared/config/prototype-ru";
import styles from "./drone-defense-prototype.module.css";
import type {
  DefenseAsset,
  DefenseAssetCategory,
  DefenseAssetCoverageType,
  PlacedDefenseObject,
} from "@/shared/types/defense-project";

type AssetLibraryManagerProps = {
  assets: DefenseAsset[];
  children?: ReactNode;
  placedObjects: PlacedDefenseObject[];
  selectedAssetId?: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onSelectAsset: (assetId: string) => void;
  onAssetSaved: (asset: DefenseAsset) => void;
  onAssetDeleted: (assetId: string) => { ok: true } | { ok: false; message: string };
  onMessage: (message: string) => void;
};

type AssetFormState = {
  id?: string;
  name: string;
  category: DefenseAssetCategory;
  protectionType: string;
  recommendedLayerCodes: string;
  pricePerUnitMln: string;
  maxEffectiveDistanceKm: string;
  coverageRadiusKm: string;
  coverageType: DefenseAssetCoverageType;
  coverageAngle: string;
  description: string;
  isPublic: boolean;
  enterpriseId: string;
};

type AssetFormErrors = Partial<Record<"name", string>>;

const categoryOptions: Array<{ value: DefenseAssetCategory; label: string }> = [
  ...prototypeRu.library.categoryOptions,
];

const coverageTypeOptions: Array<{ value: DefenseAssetCoverageType; label: string }> = [
  ...prototypeRu.library.coverageTypeOptions,
];

function emptyForm(): AssetFormState {
  return {
    name: "",
    category: "detection",
    protectionType: "",
    recommendedLayerCodes: "L2",
    pricePerUnitMln: "",
    maxEffectiveDistanceKm: "",
    coverageRadiusKm: "",
    coverageType: "circle",
    coverageAngle: "",
    description: "",
    isPublic: true,
    enterpriseId: "",
  };
}

function kmToMeters(value: string) {
  const numeric = Number(value.replace(",", "."));
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric * 1000) : undefined;
}

function optionalNumber(value: string) {
  const numeric = Number(value.replace(",", "."));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function formFromAsset(asset: DefenseAsset): AssetFormState {
  return {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    protectionType: asset.protectionType ?? "",
    recommendedLayerCodes: asset.recommendedLayerCodes?.join(", ") ?? "",
    pricePerUnitMln: asset.pricePerUnitMln === null ? "" : String(asset.pricePerUnitMln),
    maxEffectiveDistanceKm: asset.maxEffectiveDistance ? String(asset.maxEffectiveDistance / 1000) : "",
    coverageRadiusKm: asset.coverageRadius ? String(asset.coverageRadius / 1000) : "",
    coverageType: asset.coverageType,
    coverageAngle: asset.coverageAngle ? String(asset.coverageAngle) : "",
    description: asset.description ?? "",
    isPublic: asset.isPublic ?? true,
    enterpriseId: asset.enterpriseId ?? "",
  };
}

function rolesForCategory(category: DefenseAssetCategory): DefenseAsset["roles"] {
  switch (category) {
    case "detection":
      return ["detect", "track"];
    case "classification":
      return ["classify"];
    case "jamming":
    case "spoofing":
      return ["suppress"];
    case "kinetic":
    case "interceptor":
      return ["destroy"];
    case "passive-protection":
    case "engineering-protection":
      return ["protect"];
    case "command-center":
      return ["coordinate"];
    case "early-warning":
      return ["alert", "monitor"];
    default:
      return ["monitor"];
  }
}

function placementTypeForCoverage(coverageType: DefenseAssetCoverageType): DefenseAsset["placementType"] {
  if (coverageType === "polygon" || coverageType === "line") return "zone-object";
  if (coverageType === "none") return "non-physical";
  return "map-object";
}

function formToAssetInput(form: AssetFormState): DefenseAssetMutationInput {
  const price = optionalNumber(form.pricePerUnitMln);
  const coverageRadius = kmToMeters(form.coverageRadiusKm);
  const maxEffectiveDistance = kmToMeters(form.maxEffectiveDistanceKm) ?? coverageRadius;
  const recommendedLayerCodes = form.recommendedLayerCodes
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  return {
    id: form.id,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    category: form.category,
    roles: rolesForCategory(form.category),
    protectionType: form.protectionType.trim() || undefined,
    pricePerUnitMln: price ?? null,
    currency: "RUB",
    unitLabel: "шт",
    recommendedLayerCodes,
    compatibleLayerCodes: recommendedLayerCodes,
    maxEffectiveDistance,
    coverageType: form.coverageType,
    coverageRadius,
    coverageAngle: optionalNumber(form.coverageAngle),
    deploymentType: form.coverageType === "none" ? "external" : "static",
    placementType: placementTypeForCoverage(form.coverageType),
    tags: recommendedLayerCodes,
    mapCatalogGroupIds: [],
    isPublic: form.isPublic,
    enterpriseId: form.isPublic ? null : form.enterpriseId.trim() || null,
  };
}

export function AssetLibraryManager({
  assets,
  children,
  placedObjects,
  selectedAssetId,
  loading,
  error,
  onRefresh,
  onSelectAsset,
  onAssetSaved,
  onAssetDeleted,
  onMessage,
}: AssetLibraryManagerProps) {
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0] ?? null,
    [assets, selectedAssetId],
  );
  const [form, setForm] = useState<AssetFormState>(() => (selectedAsset ? formFromAsset(selectedAsset) : emptyForm()));
  const [formErrors, setFormErrors] = useState<AssetFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formFooterRef = useRef<HTMLDivElement>(null);
  const usedAssetIds = useMemo(() => new Set(placedObjects.map((object) => object.assetId)), [placedObjects]);
  const selectedAssetUsed = Boolean(selectedAsset && usedAssetIds.has(selectedAsset.id));

  useEffect(() => {
    if (mode !== "closed") {
      nameInputRef.current?.focus();
      formFooterRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [mode]);

  const startCreate = () => {
    setMode("create");
    setForm(emptyForm());
    setFormErrors({});
    setLocalError(null);
  };

  const startEdit = () => {
    if (!selectedAsset) return;
    setMode("edit");
    setForm(formFromAsset(selectedAsset));
    setFormErrors({});
    onSelectAsset(selectedAsset.id);
    setLocalError(null);
  };

  const cancelForm = () => {
    setMode("closed");
    setFormErrors({});
    setLocalError(null);
  };

  const saveAsset = async () => {
    if (!form.name.trim()) {
      setFormErrors({ name: prototypeRu.library.nameRequired });
      return;
    }
    setFormErrors({});
    setSaving(true);
    setLocalError(null);
    try {
      const payload = formToAssetInput(form);
      const asset = mode === "edit" && form.id
        ? await updateDefenseAsset(form.id, payload)
        : await createDefenseAsset(payload);
      onAssetSaved(asset);
      onSelectAsset(asset.id);
      setMode("edit");
      setForm(formFromAsset(asset));
      onMessage(prototypeRu.library.savedMessage(asset.name));
    } catch {
      setLocalError(prototypeRu.library.saveError);
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedAsset = async () => {
    if (!selectedAsset) return;
    if (selectedAssetUsed) {
      setLocalError(prototypeRu.library.assetUsedDeleteError);
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await deleteDefenseAsset(selectedAsset.id);
      const result = onAssetDeleted(selectedAsset.id);
      if (!result.ok) {
        setLocalError(result.message);
        return;
      }
      setMode("closed");
      setForm(emptyForm());
      onMessage(prototypeRu.library.deletedMessage(selectedAsset.name));
    } catch {
      setLocalError(prototypeRu.library.deleteError);
    } finally {
      setSaving(false);
    }
  };

  if (mode === "closed") {
    return (
      <div className={styles.prototypeLibraryCatalogContent}>
        <div className={`${styles.prototypeSection} ${styles.prototypeLibraryManager}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={styles.prototypeEyebrow}>{prototypeRu.library.management}</p>
              <p className={`${styles.prototypeMeta} truncate`}>{prototypeRu.library.count(assets.length)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon="action.refresh"
                label={prototypeRu.library.refresh}
                onClick={() => void onRefresh()}
                disabled={loading}
                size="sm"
                variant="quiet"
              />
              <IconButton
                icon="action.add"
                label={prototypeRu.library.createAsset}
                onClick={startCreate}
                size="sm"
              />
              <IconButton
                icon="action.edit"
                label={prototypeRu.library.editAsset}
                onClick={startEdit}
                disabled={!selectedAsset}
                size="sm"
                variant="quiet"
              />
            </div>
          </div>
        </div>
        <div
          className={styles.prototypeLibraryCatalogScrollRegion}
          data-testid="asset-library-scroll-region"
        >
          {loading || error || localError ? (
            <div className={`${styles.prototypeSection} ${styles.prototypeLibraryFeedback}`}>
              {loading ? <Status label={prototypeRu.library.loading} tone="info" /> : null}
              {error ? <Alert title={prototypeRu.library.loadError} tone="warning">{error}</Alert> : null}
              {localError ? <Alert title={prototypeRu.library.actionError} tone="danger">{localError}</Alert> : null}
            </div>
          ) : null}
          <div className={styles.prototypeLibraryCatalog}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <form
      aria-label={mode === "create" ? prototypeRu.library.createAria : prototypeRu.library.editAria}
      className={styles.prototypeLibraryForm}
      onSubmit={(event) => {
        event.preventDefault();
        void saveAsset();
      }}
    >
      <div className={styles.prototypeLibraryFormHeader}>
        <div>
          <p className={styles.prototypeEyebrow}>
            {mode === "create" ? prototypeRu.library.newAsset : prototypeRu.library.assetCard}
          </p>
          <h2 className={styles.prototypeCardTitle}>
            {mode === "create" ? prototypeRu.library.createAria : prototypeRu.library.editAria}
          </h2>
        </div>
        <IconButton
          icon="action.close"
          label={prototypeRu.library.cancelAndReturn}
          onClick={cancelForm}
          size="sm"
          variant="quiet"
        />
      </div>

      <div className={styles.prototypeLibraryFormBody}>
        {localError ? <Alert title={prototypeRu.library.actionError} tone="danger">{localError}</Alert> : null}
        <div className="fortis-asset-library-form">
          <Input
            invalid={Boolean(formErrors.name)}
            label={prototypeRu.library.name}
            message={formErrors.name}
            ref={nameInputRef}
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              if (formErrors.name) setFormErrors({});
            }}
          />

          <div className="fortis-asset-library-form__grid">
            <Select
              label={prototypeRu.library.category}
              options={categoryOptions}
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value as DefenseAssetCategory }))
              }
            />
            <Select
              label={prototypeRu.library.coverageType}
              options={coverageTypeOptions}
              value={form.coverageType}
              onChange={(event) =>
                setForm((current) => ({ ...current, coverageType: event.target.value as DefenseAssetCoverageType }))
              }
            />
          </div>

          <div className="fortis-asset-library-form__grid">
            <Input
              label={prototypeRu.library.protectionType}
              value={form.protectionType}
              onChange={(event) => setForm((current) => ({ ...current, protectionType: event.target.value }))}
            />
            <Input
              label={prototypeRu.library.recommendedEchelons}
              value={form.recommendedLayerCodes}
              onChange={(event) => setForm((current) => ({ ...current, recommendedLayerCodes: event.target.value }))}
              placeholder={prototypeRu.library.recommendedEchelonsPlaceholder}
            />
          </div>

          <div className="fortis-asset-library-form__grid" data-columns="three">
            <Input
              inputMode="decimal"
              label={prototypeRu.library.priceMln}
              value={form.pricePerUnitMln}
              onChange={(event) => setForm((current) => ({ ...current, pricePerUnitMln: event.target.value }))}
            />
            <Input
              inputMode="decimal"
              label={prototypeRu.library.radiusKm}
              value={form.coverageRadiusKm}
              onChange={(event) => setForm((current) => ({ ...current, coverageRadiusKm: event.target.value }))}
            />
            <Input
              inputMode="decimal"
              label={prototypeRu.library.angleDegrees}
              value={form.coverageAngle}
              onChange={(event) => setForm((current) => ({ ...current, coverageAngle: event.target.value }))}
            />
          </div>

          <Input
            inputMode="decimal"
            label={prototypeRu.library.maxDistanceKm}
            value={form.maxEffectiveDistanceKm}
            onChange={(event) => setForm((current) => ({ ...current, maxEffectiveDistanceKm: event.target.value }))}
          />

          <Textarea
            className="fortis-asset-library-form__description"
            label={prototypeRu.library.description}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />

          <Checkbox
            checked={form.isPublic}
            description={prototypeRu.library.publicCatalogDescription}
            label={prototypeRu.library.publicCatalog}
            onCheckedChange={(isPublic) => setForm((current) => ({ ...current, isPublic }))}
          />

          {!form.isPublic ? (
            <Input
              label={prototypeRu.library.enterpriseId}
              value={form.enterpriseId}
              onChange={(event) => setForm((current) => ({ ...current, enterpriseId: event.target.value }))}
            />
          ) : null}
        </div>
      </div>

      <div className={styles.prototypeLibraryFormFooter} ref={formFooterRef}>
        {mode === "edit" ? (
          <IconButton
            icon="action.delete"
            label={selectedAssetUsed ? prototypeRu.library.assetUsed : prototypeRu.library.deleteAsset}
            onClick={() => void deleteSelectedAsset()}
            disabled={saving || selectedAssetUsed}
            variant="danger"
          />
        ) : null}
        <Button disabled={saving} onClick={cancelForm} variant="secondary">
          {prototypeRu.library.cancel}
        </Button>
        <Button
          className="flex-1"
          leadingIcon={<Icon decorative name="action.save" />}
          loading={saving}
          type="submit"
        >
          {mode === "create" ? prototypeRu.library.create : prototypeRu.library.save}
        </Button>
      </div>
    </form>
  );
}
