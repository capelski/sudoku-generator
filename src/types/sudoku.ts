export interface Box {
    candidates: Candidate[];
    column: number;
    hasValidCandidates: boolean;
    isLocked: boolean;
    maximumImpact: number;
    number?: number;
    region: number;
    row: number;
}

export interface Candidate {
    impact: number;
    isValid: boolean;
    number: number;
}

export interface Sudoku {
    boxes: Box[];
    maximumImpact: number;
    regionSize: number;
    size: number;
}
