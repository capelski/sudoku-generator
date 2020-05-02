export interface Box {
    candidates: NumericDictionary<Candidate>;
    causedDiscards: NumericDictionary<number[]>;
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
    boxId: number;
    number: number;
}

export interface BoxesCandidatesSet {
    boxes: Box[];
    numbers: number[];
}

export interface BoxGroups {
    column: Group;
    region: Group;
    row: Group;
}

export interface Candidate {
    chosenReason: string;
    discardedReason: string;
    impact: number;
    isChosen: boolean;
    isDiscarded: boolean;
    number: number;
}

export interface Group {
    availableBoxesPerNumber: NumericDictionary<Box[]>;
    boxes: Box[];
    isValid: boolean;
    ownedCandidates: BoxesCandidatesSet[];
}

export type InferringMode = 'none' | 'direct' | 'all';

export type NumericDictionary<T> = { [key: number]: T };

export type StringDictionary<T> = { [key: string]: T };

export interface Sudoku {
    locksHistory: number[];
    numbers: NumericDictionary<number>;
    regionSize: number;
}

export interface SudokuComputedData {
    boxes: Box[];
    groups: SudokuGroups;
    maximumImpact: number;
    size: number;
}

export interface SudokuGroups {
    columns: NumericDictionary<Group>;
    regions: NumericDictionary<Group>;
    rows: NumericDictionary<Group>;
}
