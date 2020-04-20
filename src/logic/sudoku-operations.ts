import { SudokuGroups, Box, BoxGroups, Sudoku, Candidate } from '../types/sudoku';

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

export const getBoxPeers = (sudokuGroups: SudokuGroups, box: Box): Box[] => {
    const boxGroups = getBoxGroups(sudokuGroups, box);
    return boxGroups.column.boxes
        .filter((peerBox) => peerBox.id !== box.id)
        .concat(boxGroups.row.boxes.filter((peerBox) => peerBox.id !== box.id))
        .concat(
            boxGroups.region.boxes.filter(
                (peerBox) => peerBox.column !== box.column && peerBox.row !== box.row
            )
        );
};

export const getEmptySudoku = (regionSize: number): Sudoku => {
    const size = regionSize * regionSize;
    const initialImpact = 2 * (size - 1) + (regionSize - 1) * (regionSize - 1);
    const boxes = [...Array(size)]
        .map((_x, rowIndex) =>
            [...Array(size)].map(
                (_y, columnIndex): Box => ({
                    candidates: [...Array(size)].map(
                        (_z, candidateIndex): Candidate => ({
                            impact: initialImpact,
                            impactWithoutDiscards: initialImpact,
                            isDiscardedByLock: false,
                            number: candidateIndex + 1
                        })
                    ),
                    column: columnIndex,
                    id: `${rowIndex}-${columnIndex}`,
                    isLocked: false,
                    maximumImpact: initialImpact,
                    peerBoxes: [], // Some peer boxes might not exist here yet
                    region:
                        Math.floor(rowIndex / regionSize) * regionSize +
                        Math.floor(columnIndex / regionSize),
                    row: rowIndex
                })
            )
        )
        .reduce<Box[]>((reduced, boxes) => reduced.concat(boxes), []);

    const groups = getGroups(boxes);

    boxes.forEach((box) => {
        box.peerBoxes = getBoxPeers(groups, box);
    });

    return {
        boxes,
        groups,
        latestLockedBox: undefined,
        maximumImpact: initialImpact,
        regionSize,
        size
    };
};

export const getGroups = (boxes: Box[]): SudokuGroups =>
    boxes.reduce<SudokuGroups>(
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

            return reduced;
        },
        { columns: {}, regions: {}, rows: {} }
    );

export const getSerializableSudoku = (sudoku: Sudoku): Sudoku => ({
    ...sudoku,
    boxes: sudoku.boxes.map((box) => ({
        ...box,
        peerBoxes: [] // Would cause cyclic dependencies
    })),
    latestLockedBox: sudoku.latestLockedBox && {
        ...sudoku.latestLockedBox,
        peerBoxes: []
    },
    groups: {
        // Would cause cyclic dependencies
        columns: {},
        regions: {},
        rows: {}
    }
});

export const isCandidateDiscarded = (candidate: Candidate) => candidate.isDiscardedByLock;

export const updateCandidateImpact = (box: Box, candidateIndex: number) => {
    const candidate = box.candidates[candidateIndex];
    candidate.impact = isCandidateDiscarded(candidate)
        ? -1
        : box.peerBoxes.filter(
              (peerBox) =>
                  !peerBox.isLocked && !isCandidateDiscarded(peerBox.candidates[candidateIndex])
          ).length;

    candidate.impactWithoutDiscards = box.peerBoxes.filter((peerBox) => !peerBox.isLocked).length;
};
