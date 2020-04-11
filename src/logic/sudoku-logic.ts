import { Sudoku, Box } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const getEmptySudoku = (regionSize: number): Sudoku => {
    const size = regionSize * regionSize;

    return {
        rows: [...Array(size)].map((_x, rowIndex) =>
            [...Array(size)].map((_y, columnIndex) => ({
                candidates: [...Array(size)].map((_z, candidateIndex) => ({
                    impact: 2 * (size - 1) + (regionSize - 1) * (regionSize - 1),
                    isValid: true,
                    number: candidateIndex + 1
                })),
                column: columnIndex,
                isLocked: false,
                region:
                    Math.floor(rowIndex / regionSize) * regionSize +
                    Math.floor(columnIndex / regionSize),
                row: rowIndex
            }))
        ),
        regionSize,
        size
    };
};

export const lockBox = (sudoku: Sudoku, selectedBox: Box, selectedNumber: number): Sudoku => {
    return {
        regionSize: sudoku.regionSize,
        rows: sudoku.rows.map((row) =>
            row.map((box) => {
                if (box === selectedBox) {
                    return {
                        candidates: box.candidates.map((candidate) => ({
                            impact: -1,
                            isValid: candidate.number === selectedNumber,
                            number: candidate.number
                        })),
                        column: box.column,
                        isLocked: true,
                        number: selectedNumber,
                        region: box.region,
                        row: box.row
                    };
                } else if (!box.isLocked) {
                    const isPeerBox = arePeerBoxes(box, selectedBox);
                    return {
                        candidates: box.candidates.map((candidate) => ({
                            impact:
                                candidate.impact === -1
                                    ? -1
                                    : isPeerBox && candidate.number === selectedNumber
                                    ? -1
                                    : isPeerBox || candidate.number === selectedNumber
                                    ? candidate.impact - 1
                                    : candidate.impact,
                            isValid:
                                candidate.isValid &&
                                (!isPeerBox || candidate.number !== selectedNumber),
                            number: candidate.number
                        })),
                        column: box.column,
                        isLocked: false,
                        region: box.region,
                        row: box.row
                    };
                } else {
                    return box;
                }
            })
        ),
        size: sudoku.size
    };
};
