"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  createDefenseAsset,
  deleteDefenseAsset,
  updateDefenseAsset,
  type DefenseAssetMutationInput,
} from "@/modules/drone-defense/infra/asset-library-api";
import {
  buildAssetDocumentDownloadUrl,
  createAssetDocument,
  deleteAssetDocument,
  listAssetDocuments,
  type AssetDocument,
} from "@/modules/drone-defense/infra/asset-documents-api";
import styles from "./drone-defense-prototype.module.css";
import type {
  DefenseAsset,
  DefenseAssetCategory,
  DefenseAssetCoverageType,
  PlacedDefenseObject,
} from "@/shared/types/defense-project";

type AssetLibraryManagerProps = {
  assets: DefenseAsset[];
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

type DocumentFormState = {
  name: string;
  url: string;
};

const categoryOptions: Array<{ value: DefenseAssetCategory; label: string }> = [
  { value: "detection", label: "Обнаружение" },
  { value: "classification", label: "Классификация" },
  { value: "jamming", label: "РЭБ" },
  { value: "spoofing", label: "Спуфинг" },
  { value: "kinetic", label: "Поражение" },
  { value: "interceptor", label: "Перехват" },
  { value: "passive-protection", label: "Пассивная защита" },
  { value: "engineering-protection", label: "Инженерная защита" },
  { value: "infrastructure", label: "Инфраструктура" },
  { value: "command-center", label: "Командный центр" },
  { value: "early-warning", label: "Раннее предупреждение" },
  { value: "software", label: "ПО" },
  { value: "external-service", label: "Внешний сервис" },
];

const coverageTypeOptions: Array<{ value: DefenseAssetCoverageType; label: string }> = [
  { value: "circle", label: "Круг" },
  { value: "sector", label: "Сектор" },
  { value: "line", label: "Линия" },
  { value: "polygon", label: "Полигон" },
  { value: "none", label: "Нет" },
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

function emptyDocumentForm(): DocumentFormState {
  return {
    name: "",
    url: "",
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
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(() => emptyDocumentForm());
  const usedAssetIds = useMemo(() => new Set(placedObjects.map((object) => object.assetId)), [placedObjects]);
  const selectedAssetUsed = Boolean(selectedAsset && usedAssetIds.has(selectedAsset.id));
  const selectedAssetIdForDocuments = selectedAsset?.id;

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(async () => {
        if (!selectedAssetIdForDocuments) {
          setDocuments([]);
          setDocumentsError(null);
          setDocumentsLoading(false);
          return;
        }
        setDocumentsLoading(true);
        setDocumentsError(null);
        const items = await listAssetDocuments(selectedAssetIdForDocuments);
        if (cancelled) return;
        setDocuments(items);
        setDocumentsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDocuments([]);
        setDocumentsError("Не удалось загрузить документы.");
        setDocumentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAssetIdForDocuments]);

  const startCreate = () => {
    setMode("create");
    setForm(emptyForm());
    setLocalError(null);
  };

  const startEdit = () => {
    if (!selectedAsset) return;
    setMode("edit");
    setForm(formFromAsset(selectedAsset));
    onSelectAsset(selectedAsset.id);
    setLocalError(null);
  };

  const saveAsset = async () => {
    if (!form.name.trim()) {
      setLocalError("Укажите название средства защиты.");
      return;
    }
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
      onMessage(`${asset.name} сохранено в библиотеке`);
    } catch {
      setLocalError("Не удалось сохранить карточку на сервере.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedAsset = async () => {
    if (!selectedAsset) return;
    if (selectedAssetUsed) {
      setLocalError("Средство уже размещено на карте. Удаление заблокировано.");
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
      onMessage(`${selectedAsset.name} удалено из библиотеки`);
    } catch {
      setLocalError("Не удалось удалить карточку на сервере.");
    } finally {
      setSaving(false);
    }
  };

  const addDocument = async () => {
    if (!selectedAsset) return;
    const name = documentForm.name.trim();
    const url = documentForm.url.trim();
    if (!name || !url) {
      setDocumentsError("Укажите название и ссылку на документ.");
      return;
    }
    setDocumentSaving(true);
    setDocumentsError(null);
    try {
      const document = await createAssetDocument({
        assetId: selectedAsset.id,
        name,
        storageKey: url,
        downloadUrl: url,
      });
      setDocuments((current) => [document, ...current]);
      setDocumentForm(emptyDocumentForm());
      onMessage(`Документ ${document.name} прикреплён к карточке`);
    } catch {
      setDocumentsError("Не удалось сохранить документ на сервере.");
    } finally {
      setDocumentSaving(false);
    }
  };

  const removeDocument = async (document: AssetDocument) => {
    setDocumentSaving(true);
    setDocumentsError(null);
    try {
      await deleteAssetDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      onMessage(`Документ ${document.name} удалён`);
    } catch {
      setDocumentsError("Не удалось удалить документ на сервере.");
    } finally {
      setDocumentSaving(false);
    }
  };

  return (
    <div className={styles.prototypeSection}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={styles.prototypeEyebrow}>Управление карточками</p>
          <p className={`${styles.prototypeMeta} truncate`}>{assets.length} средств в текущей библиотеке</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={`${styles.prototypeIconButton} cursor-pointer disabled:cursor-wait`}
            onClick={() => void onRefresh()}
            disabled={loading}
            title="Обновить каталог с сервера"
            aria-label="Обновить каталог с сервера"
          >
            <ReloadOutlined />
          </button>
          <button
            type="button"
            className={`${styles.prototypeButtonPrimary} w-8 cursor-pointer`}
            onClick={startCreate}
            title="Создать средство защиты"
            aria-label="Создать средство защиты"
          >
            <PlusOutlined />
          </button>
          <button
            type="button"
            className={`${styles.prototypeIconButton} cursor-pointer`}
            onClick={startEdit}
            disabled={!selectedAsset}
            title="Редактировать выбранное средство"
            aria-label="Редактировать выбранное средство"
          >
            <EditOutlined />
          </button>
        </div>
      </div>

      {loading ? <p className={`${styles.prototypeMeta} mt-2 text-blue-600`}>Загрузка библиотеки…</p> : null}
      {error ? <p className={`${styles.prototypeNoticeWarning} mt-2`}>{error}</p> : null}
      {localError ? <p className={`${styles.prototypeNoticeDanger} mt-2`}>{localError}</p> : null}

      {mode !== "closed" ? (
        <div className={`${styles.prototypeFormCard} mt-3 grid gap-2 bg-slate-50 p-2`}>
          <div className="flex items-center justify-between gap-2">
            <p className={styles.prototypeCardTitle}>
              {mode === "create" ? "Новая карточка" : "Редактирование"}
            </p>
            <button
              type="button"
              className={`${styles.prototypeIconButton} cursor-pointer`}
              onClick={() => setMode("closed")}
              title="Закрыть форму"
              aria-label="Закрыть форму"
            >
              <CloseOutlined />
            </button>
          </div>

          <input
            className={styles.prototypeField}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Название"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              className={styles.prototypeSelect}
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value as DefenseAssetCategory }))
              }
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={styles.prototypeSelect}
              value={form.coverageType}
              onChange={(event) =>
                setForm((current) => ({ ...current, coverageType: event.target.value as DefenseAssetCoverageType }))
              }
            >
              {coverageTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              className={styles.prototypeField}
              value={form.protectionType}
              onChange={(event) => setForm((current) => ({ ...current, protectionType: event.target.value }))}
              placeholder="Тип защиты"
            />
            <input
              className={styles.prototypeField}
              value={form.recommendedLayerCodes}
              onChange={(event) => setForm((current) => ({ ...current, recommendedLayerCodes: event.target.value }))}
              placeholder="Эшелоны: L2, L3"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              className={styles.prototypeField}
              value={form.pricePerUnitMln}
              onChange={(event) => setForm((current) => ({ ...current, pricePerUnitMln: event.target.value }))}
              placeholder="млн ₽"
              inputMode="decimal"
            />
            <input
              className={styles.prototypeField}
              value={form.coverageRadiusKm}
              onChange={(event) => setForm((current) => ({ ...current, coverageRadiusKm: event.target.value }))}
              placeholder="радиус, км"
              inputMode="decimal"
            />
            <input
              className={styles.prototypeField}
              value={form.coverageAngle}
              onChange={(event) => setForm((current) => ({ ...current, coverageAngle: event.target.value }))}
              placeholder="угол"
              inputMode="decimal"
            />
          </div>

          <input
            className={styles.prototypeField}
            value={form.maxEffectiveDistanceKm}
            onChange={(event) => setForm((current) => ({ ...current, maxEffectiveDistanceKm: event.target.value }))}
            placeholder="максимальная дальность, км"
            inputMode="decimal"
          />

          <textarea
            className={`${styles.prototypeTextarea} min-h-16 resize-y`}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Описание"
          />

          <label className={`${styles.prototypeInlineCard} text-xs text-slate-600`}>
            <span>Общий каталог</span>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))}
            />
          </label>

          {!form.isPublic ? (
            <input
              className={styles.prototypeField}
              value={form.enterpriseId}
              onChange={(event) => setForm((current) => ({ ...current, enterpriseId: event.target.value }))}
              placeholder="enterpriseId"
            />
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`${styles.prototypeButtonPrimary} flex-1 cursor-pointer px-3 disabled:cursor-wait`}
              onClick={() => void saveAsset()}
              disabled={saving}
            >
              <SaveOutlined />
              Сохранить
            </button>
            {mode === "edit" ? (
              <button
                type="button"
                className={`${styles.prototypeButtonDanger} w-10 cursor-pointer`}
                onClick={() => void deleteSelectedAsset()}
                disabled={saving || selectedAssetUsed}
                title={selectedAssetUsed ? "Средство размещено на карте" : "Удалить средство защиты"}
                aria-label="Удалить средство защиты"
              >
                <DeleteOutlined />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedAsset ? (
        <div className={`${styles.prototypeFormCard} mt-3 grid gap-2 bg-slate-50 p-2`}>
          <div className="flex items-center justify-between gap-2">
            <p className={`${styles.prototypeCardTitle} flex items-center gap-2`}>
              <FileTextOutlined />
              Документы
            </p>
            <span className={styles.prototypeMeta}>{documents.length}</span>
          </div>

          {documentsLoading ? <p className={`${styles.prototypeMeta} text-blue-600`}>Загрузка документов…</p> : null}
          {documentsError ? <p className={styles.prototypeNoticeWarning}>{documentsError}</p> : null}

          <div className="grid gap-1.5">
            {documents.length === 0 && !documentsLoading ? (
              <p className={styles.prototypeMeta}>Документы к карточке пока не прикреплены.</p>
            ) : null}
            {documents.map((document) => (
              <div key={document.id} className={`${styles.prototypeInlineCard} gap-2`}>
                <div className="min-w-0">
                  <p className={`${styles.prototypeCardTitle} truncate`}>{document.name}</p>
                  <p className={`${styles.prototypeMeta} truncate`}>{document.mimeType || "application/octet-stream"}</p>
                </div>
                <a
                  className={styles.prototypeIconButton}
                  href={document.downloadUrl || buildAssetDocumentDownloadUrl(document.id)}
                  target="_blank"
                  rel="noreferrer"
                  title="Открыть документ"
                  aria-label="Открыть документ"
                >
                  <DownloadOutlined />
                </a>
                <button
                  type="button"
                  className={`${styles.prototypeIconButton} cursor-pointer`}
                  onClick={() => void removeDocument(document)}
                  disabled={documentSaving}
                  title="Удалить документ"
                  aria-label="Удалить документ"
                >
                  <DeleteOutlined />
                </button>
              </div>
            ))}
          </div>

          <input
            className={styles.prototypeField}
            value={documentForm.name}
            onChange={(event) => setDocumentForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Название документа"
          />
          <input
            className={styles.prototypeField}
            value={documentForm.url}
            onChange={(event) => setDocumentForm((current) => ({ ...current, url: event.target.value }))}
            placeholder="URL или storage key"
          />
          <button
            type="button"
            className={`${styles.prototypeButtonPrimary} cursor-pointer px-3 disabled:cursor-wait`}
            onClick={() => void addDocument()}
            disabled={documentSaving}
          >
            <PlusOutlined />
            Прикрепить документ
          </button>
        </div>
      ) : null}
    </div>
  );
}
