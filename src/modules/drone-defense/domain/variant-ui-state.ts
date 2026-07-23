export type VariantSaveStatus = "idle" | "saving" | "error";
export type VariantSaveIndicatorState = "conflict" | "error" | "saved" | "saving";
export type VariantVersionState = "conflict" | "current" | "draft";

type ResolveVariantUiStateInput = {
  activeVariantId: string | null;
  conflict: boolean;
  saveStatus: VariantSaveStatus;
  version: number | null | undefined;
};

export function resolveVariantUiState({
  activeVariantId,
  conflict,
  saveStatus,
  version,
}: ResolveVariantUiStateInput): {
  saveState: VariantSaveIndicatorState | null;
  version: string;
  versionStatus: VariantVersionState;
} {
  const isDraft = !activeVariantId;
  const formattedVersion = isDraft || typeof version !== "number" ? "—" : `v${version}`;

  if (conflict) {
    return { saveState: "conflict", version: formattedVersion, versionStatus: "conflict" };
  }

  if (saveStatus === "saving") {
    return { saveState: "saving", version: formattedVersion, versionStatus: isDraft ? "draft" : "current" };
  }

  if (saveStatus === "error") {
    return { saveState: "error", version: formattedVersion, versionStatus: isDraft ? "draft" : "current" };
  }

  return {
    saveState: isDraft ? null : "saved",
    version: formattedVersion,
    versionStatus: isDraft ? "draft" : "current",
  };
}
