import { Sudoku, Box } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const getEmptySudoku = (regionSize: number): Sudoku => {
    const size = regionSize * regionSize;
    const initialImpact = 2 * (size - 1) + (regionSize - 1) * (regionSize - 1);

    return {
        boxes: [...Array(size)]
            .map((_x, rowIndex) =>
                [...Array(size)].map((_y, columnIndex) => ({
                    candidates: [...Array(size)].map((_z, candidateIndex) => ({
                        impact: initialImpact,
                        isValid: true,
                        number: candidateIndex + 1
                    })),
                    column: columnIndex,
                    isLocked: false,
                    maximumImpact: initialImpact,
                    region:
                        Math.floor(rowIndex / regionSize) * regionSize +
                        Math.floor(columnIndex / regionSize),
                    row: rowIndex
                }))
            )
            .reduce<Box[]>((reduced, boxes) => reduced.concat(boxes), []),
        maximumImpact: initialImpact,
        regionSize,
        size
    };
};

export const getRandomElement = <T>(array: T[]) =>
    array[Math.round(Math.random() * (array.length - 1))];

export const lockBox = (sudoku: Sudoku, selectedBox: Box, selectedNumber: number): Sudoku => {
    const nextBoxes = sudoku.boxes.map((box) => {
        if (box === selectedBox) {
            return {
                candidates: box.candidates.map((candidate) => ({
                    impact: -1,
                    isValid: candidate.number === selectedNumber,
                    number: candidate.number
                })),
                column: box.column,
                isLocked: true,
                maximumImpact: -1,
                number: selectedNumber,
                region: box.region,
                row: box.row
            };
        } else if (!box.isLocked) {
            const isPeerBox = arePeerBoxes(box, selectedBox);
            const nextCandidates = box.candidates.map((candidate) => ({
                impact:
                    candidate.impact === -1
                        ? -1
                        : isPeerBox && candidate.number === selectedNumber
                        ? -1
                        : isPeerBox || candidate.number === selectedNumber
                        ? candidate.impact - 1
                        : candidate.impact,
                isValid: candidate.isValid && (!isPeerBox || candidate.number !== selectedNumber),
                number: candidate.number
            }));
            const boxMaximumImpact = nextCandidates.reduce(
                (reduced, candidate) => Math.max(reduced, candidate.impact),
                0
            );

            return {
                candidates: nextCandidates,
                column: box.column,
                isLocked: false,
                maximumImpact: boxMaximumImpact,
                region: box.region,
                row: box.row
            };
        } else {
            return box;
        }
    });
    const sudokuMaximumImpact = nextBoxes.reduce(
        (reduced, nextBox) => Math.max(reduced, nextBox.maximumImpact),
        0
    );

    return {
        boxes: nextBoxes,
        maximumImpact: sudokuMaximumImpact,
        regionSize: sudoku.regionSize,
        size: sudoku.size
    };
};
