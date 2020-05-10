export interface Box {
    candidates: NumericDictionary<Candidate>;
    causedChoices: NumericDictionary<NumericDictionary<number>>;
    causedDiscards: NumericDictionary<NumericDictionary<number>>;
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
    discardReason: string;
    discardRound: number;
    impact: number;
    inferReason: string;
    inferRound: number;
    number: number;
}

export interface Group {
    // TODO Along with the Box, I should store until which round the Box is available too
    // Then updateGroupsValidations can use this information to tell whether a group is missing
    // a number for the current solution level
    availableBoxesPerNumber: NumericDictionary<Box[]>;
    boxes: Box[];
    ownedCandidates: BoxesCandidatesSet[];
    validRounds: number;
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
