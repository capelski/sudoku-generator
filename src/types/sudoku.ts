export interface Box {
    candidates: NumericDictionary<Candidate>;
    column: number;
    groups: BoxGroups;
    id: number;
    isLocked: boolean;
    maximumImpact: number;
    number?: number;
    peerBoxes: Box[];
    region: number;
    row: number;
}

export interface BoxCandidate {
    box: Box;
    number: number;
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
    isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup: boolean;
    isChosenBecauseIsTheOnlyCandidateLeftForThisBox: boolean;
    isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup: boolean;
    isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup: boolean;
    isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox: boolean;
    isDiscardedBecauseOfLock: boolean;
    number: number;
}

export interface Group {
    availableBoxesPerNumber: NumericDictionary<Box[]>;
    boxes: Box[];
    isValid: boolean;
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
