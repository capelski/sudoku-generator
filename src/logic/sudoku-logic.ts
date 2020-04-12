import { Sudoku, Box } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const getEmptySudoku = (regionSize: number): Sudoku => {
    const size = regionSize * regionSize;

    return {
        boxes: [...Array(size)]
            .map((_x, rowIndex) =>
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
            )
            .reduce<Box[]>((reduced, next) => reduced.concat(next), []),
        regionSize,
        size
    };
};

export const getImpactBoxes = (sudoku: Sudoku, impact: number): Box[] => {
    return sudoku.boxes.filter((box) =>
        box.candidates.find((candidate) => candidate.impact === impact)
    );
};

export const getRandomElement = <T>(array: T[]) =>
    array[Math.round(Math.random() * (array.length - 1))];

export const getSudokuMaximumImpact = (sudoku: Sudoku): number => {
    return sudoku.boxes.reduce(
        (sudokuReduced, nextBox) =>
            nextBox.candidates.reduce(
                (boxReduced, nextCandidate) => Math.max(boxReduced, nextCandidate.impact),
                sudokuReduced
            ),
        0
    );
};

export const lockBox = (sudoku: Sudoku, selectedBox: Box, selectedNumber: number): Sudoku => {
    return {
        regionSize: sudoku.regionSize,
        boxes: sudoku.boxes.map((box) => {
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
        }),
        size: sudoku.size
    };
};
