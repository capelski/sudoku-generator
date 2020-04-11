export interface Box {
    candidates: Candidate[];
    column: number;
    isLocked: boolean;
    region: number;
    row: number;
}

export interface Candidate {
    number: number;
    impact: number;
}

export interface Sudoku {
    boxes: Box[][];
    regionSize: number;
    size: number;
}
