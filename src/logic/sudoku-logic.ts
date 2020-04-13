import { Sudoku, Box, SudokuGroups, BoxGroups } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const getBoxGroups = (sudokuGroups: SudokuGroups, box: Box): BoxGroups => {
    return {
        column: sudokuGroups.columns[box.column],
        region: sudokuGroups.regions[box.region],
        row: sudokuGroups.rows[box.row]
    };
};

export const getEmptySudoku = (regionSize: number): Sudoku => {
    const size = regionSize * regionSize;
    const initialImpact = 2 * (size - 1) + (regionSize - 1) * (regionSize - 1);
    const boxes = [...Array(size)]
        .map((_x, rowIndex) =>
            [...Array(size)].map((_y, columnIndex) => ({
                candidates: [...Array(size)].map((_z, candidateIndex) => ({
                    impact: initialImpact,
                    isValid: true,
                    number: candidateIndex + 1
                })),
                column: columnIndex,
                hasValidCandidates: true,
                isInferable: false,
                isLocked: false,
                maximumImpact: initialImpact,
                region:
                    Math.floor(rowIndex / regionSize) * regionSize +
                    Math.floor(columnIndex / regionSize),
                row: rowIndex
            }))
        )
        .reduce<Box[]>((reduced, boxes) => reduced.concat(boxes), []);
    const groups = getGroups(boxes);

    return {
        boxes,
        groups,
        maximumImpact: initialImpact,
        regionSize,
        size
    };
};

export const getGroups = (boxes: Box[]): SudokuGroups => {
    return boxes.reduce<SudokuGroups>(
        (reduced, box) => {
            reduced.columns[box.column] = reduced.columns[box.column] || {
                isValid: true,
                boxes: []
            };
            reduced.regions[box.region] = reduced.regions[box.region] || {
                isValid: true,
                boxes: []
            };
            reduced.rows[box.row] = reduced.rows[box.row] || { isValid: true, boxes: [] };

            reduced.columns[box.column].boxes.push(box);
            reduced.regions[box.region].boxes.push(box);
            reduced.rows[box.row].boxes.push(box);

            reduced.columns[box.column].isValid =
                reduced.columns[box.column].isValid && box.hasValidCandidates;
            reduced.regions[box.region].isValid =
                reduced.regions[box.region].isValid && box.hasValidCandidates;
            reduced.rows[box.row].isValid = reduced.rows[box.row].isValid && box.hasValidCandidates;

            // TODO Compute groups isValid based on whether all numbers have an available box

            return reduced;
        },
        { columns: {}, regions: {}, rows: {} }
    );
};

export const getRandomElement = <T>(array: T[]) =>
    array[Math.round(Math.random() * (array.length - 1))];

export const isBoxInInvalidGroup = (sudoku: Sudoku, box: Box) => {
    const isInvalidColumn = !sudoku.groups.columns[box.column].isValid;
    const isInvalidRegion = !sudoku.groups.regions[box.region].isValid;
    const isInvalidRow = !sudoku.groups.rows[box.row].isValid;

    return isInvalidColumn || isInvalidRegion || isInvalidRow;
};

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
                isInferable: false,
                hasValidCandidates: true,
                maximumImpact: -1,
                number: selectedNumber,
                region: box.region,
                row: box.row
            };
        } else if (!box.isLocked) {
            const isPeerBox = arePeerBoxes(box, selectedBox);
            const nextCandidates = box.candidates.map((candidate) => ({
                impact: -2, //  = Invalidate the value. Will be computed below
                isValid: candidate.isValid && (!isPeerBox || candidate.number !== selectedNumber),
                number: candidate.number
            }));

            return {
                candidates: nextCandidates,
                column: box.column,
                hasValidCandidates:
                    nextCandidates.filter((candidate) => candidate.isValid).length > 0,
                isLocked: false,
                isInferable: nextCandidates.filter((candidate) => candidate.isValid).length === 1,
                maximumImpact: -2, // Invalidate the value. Will be computed below
                region: box.region,
                row: box.row
            };
        } else {
            return box;
        }
    });
    const nextGroups = getGroups(nextBoxes);

    nextBoxes
        .filter((box) => !box.isLocked)
        .forEach((nextBox) => {
            const boxGroups = getBoxGroups(nextGroups, nextBox);
            const peerBoxes = boxGroups.column.boxes
                .filter((peerBox) => peerBox !== nextBox)
                .concat(boxGroups.row.boxes.filter((peerBox) => peerBox !== nextBox))
                .concat(
                    boxGroups.region.boxes.filter(
                        (peerBox) =>
                            peerBox.column !== nextBox.column && peerBox.row !== nextBox.row
                    )
                );

            nextBox.candidates.forEach((candidate, candidateIndex) => {
                candidate.impact = candidate.isValid
                    ? peerBoxes.filter((peerBox) => peerBox.candidates[candidateIndex].isValid)
                          .length
                    : -1;
            });

            nextBox.maximumImpact = nextBox.candidates.reduce(
                (reduced, candidate) => Math.max(reduced, candidate.impact),
                0
            );
        });
    const sudokuMaximumImpact = nextBoxes.reduce(
        (reduced, nextBox) => Math.max(reduced, nextBox.maximumImpact),
        0
    );

    return {
        boxes: nextBoxes,
        groups: nextGroups,
        maximumImpact: sudokuMaximumImpact,
        regionSize: sudoku.regionSize,
        size: sudoku.size
    };
};
