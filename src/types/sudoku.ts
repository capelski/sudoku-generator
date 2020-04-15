export interface Box {
    candidates: Candidate[];
    column: number;
    isLocked: boolean;
    maximumImpact: number;
    number?: number;
    peerBoxes: Box[];
    region: number;
    row: number;
}

export interface BoxGroups {
    column: Group;
    region: Group;
    row: Group;
}

export interface Candidate {
    impact: number;
    impactWithoutInferring: number;
    // TODO => Consider inferring loop iteration on the isSingleCandidateInBox?
    isSingleCandidateInBox: boolean;
    isSingleCandidateInBoxPeer: boolean;
    // TODO Rename to isSingleCandidateForGroupInBox, isSingleCandidateForGroupInBoxPeer
    isSingleCandidateInGroup: boolean;
    isSingleCandidateInGroupPeer: boolean;
    isValid: boolean;
    number: number;
}

export type Dictionary<T> = { [key: number]: T };

export interface Group {
    isValid: boolean;
    boxes: Box[];
}
export interface Sudoku {
    boxes: Box[];
    groups: SudokuGroups;
    maximumImpact: number;
    regionSize: number;
    size: number;
}

export interface SudokuGroups {
    columns: Dictionary<Group>;
    regions: Dictionary<Group>;
    rows: Dictionary<Group>;
}
