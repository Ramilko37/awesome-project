export type SelectedEntity =
  | { type: "echelon"; id: string }
  | { type: "object"; id: string }
  | null;

export type WorkspaceState = {
  activeEchelonId: string | null;
  selectedEntity: SelectedEntity;
};

export function selectEchelon(_state: WorkspaceState, echelonId: string): WorkspaceState {
  return {
    activeEchelonId: echelonId,
    selectedEntity: { type: "echelon", id: echelonId },
  };
}

export function selectObject(_state: WorkspaceState, objectId: string, echelonId: string): WorkspaceState {
  return {
    activeEchelonId: echelonId,
    selectedEntity: { type: "object", id: objectId },
  };
}

export function clearSelection(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    selectedEntity: null,
  };
}
