export interface Box {
    candidates: Candidate[];
    column: number;
    id: number;
    isLocked: boolean;
    maximumImpact: number;
    number?: number;
    peerBoxes: Box[];
    region: number;
    row: number;
}

export interface BoxesNumbersGroupRestriction {
    numbers: number[];
    boxes: Box[];
}

export interface BoxGroups {
    column: Group;
    region: Group;
    row: Group;
}

export interface Candidate {
    impact: number;
    impactWithoutDiscards: number;
    isDiscardedByLock: boolean;
    isTheOnlyCandidateLeftForAPeerBox: boolean;
    isTheOnlyCandidateLeftForThisBox: boolean;
    number: number;
}

export interface Group {
    isValid: boolean;
    boxes: Box[];
}

export interface NumberAvailableBoxes {
    boxes: Box[];
    boxesCoordinates: string;
}

export type NumericDictionary<T> = { [key: number]: T };

export type StringDictionary<T> = { [key: string]: T };

export interface Sudoku {
    boxes: Box[];
    groups: SudokuGroups;
    latestLockedBox?: Box;
    maximumImpact: number;
    regionSize: number;
    size: number;
}

export interface SudokuGroups {
    columns: NumericDictionary<Group>;
    regions: NumericDictionary<Group>;
    rows: NumericDictionary<Group>;
}
