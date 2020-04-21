import {
    Box,
    BoxCandidate,
    BoxGroups,
    Candidate,
    Group,
    NumericDictionary,
    Sudoku,
    SudokuGroups
} from '../types/sudoku';
import {
    doesBoxHaveOnlyOneNonDiscardedCandidate,
    doesGroupHaveABoxWithoutCandidates,
    doesGroupHaveTwoLockedBoxesWithSameNumber,
    doesGroupNeedToPlaceANumberInCertainBox,
    isCandidateDiscarded,
    placeGroupNumberInCertainBox,
    updateOnlyLeftCandidate as updateOnlyNonDiscardedCandidate
} from './sudoku-rules';
import { getRandomElement } from './utilities';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const discardCandidates = (boxQueue: Box[]) => {
    const currentBox = boxQueue.shift();

    if (currentBox) {
        if (doesBoxHaveOnlyOneNonDiscardedCandidate(currentBox)) {
            updateOnlyNonDiscardedCandidate(boxQueue, currentBox);
        }

        if (doesGroupNeedToPlaceANumberInCertainBox(currentBox.groups.column)) {
            placeGroupNumberInCertainBox(currentBox.groups.column, boxQueue);
            updateGroupAvailableBoxesPerNumber(currentBox.groups.column);
        }
        if (doesGroupNeedToPlaceANumberInCertainBox(currentBox.groups.region)) {
            placeGroupNumberInCertainBox(currentBox.groups.region, boxQueue);
            updateGroupAvailableBoxesPerNumber(currentBox.groups.region);
        }
        if (doesGroupNeedToPlaceANumberInCertainBox(currentBox.groups.row)) {
            placeGroupNumberInCertainBox(currentBox.groups.row, boxQueue);
            updateGroupAvailableBoxesPerNumber(currentBox.groups.row);
        }

        // TODO Discard candidates by other means here
        // - bound boxes

        discardCandidates(boxQueue);
    }
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
                    candidates: [...Array(size)]
                        .map(
                            (_z, candidateIndex): Candidate => ({
                                impact: initialImpact,
                                impactWithoutDiscards: initialImpact,
                                isChosenBecauseIsTheOnlyCandidateLeftForThisBox: false,
                                isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup: false,
                                isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup: false,
                                isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup: false,
                                isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox: false,
                                isDiscardedBecauseOfLock: false,
                                number: candidateIndex + 1
                            })
                        )
                        .reduce<NumericDictionary<Candidate>>(
                            (reduced, candidate) => ({
                                ...reduced,
                                [candidate.number]: candidate
                            }),
                            {}
                        ),
                    column: columnIndex,
                    id: rowIndex * size + columnIndex,
                    isLocked: false,
                    groups: {} as any, // Will be set later, since all boxes must be defined
                    maximumImpact: initialImpact,
                    peerBoxes: [], // Will be set later, since all boxes must be defined
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
        box.groups = getBoxGroups(groups, box);
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

export const getGroups = (boxes: Box[]): SudokuGroups => {
    const groups = boxes.reduce<SudokuGroups>(
        (reduced, box) => {
            reduced.columns[box.column] =
                reduced.columns[box.column] ||
                ({
                    availableBoxesPerNumber: {},
                    boxes: [],
                    isValid: true
                } as Group);
            reduced.regions[box.region] =
                reduced.regions[box.region] ||
                ({
                    availableBoxesPerNumber: {},
                    boxes: [],
                    isValid: true
                } as Group);
            reduced.rows[box.row] =
                reduced.rows[box.row] ||
                ({
                    availableBoxesPerNumber: {},
                    boxes: [],
                    isValid: true
                } as Group);

            reduced.columns[box.column].boxes.push(box);
            reduced.regions[box.region].boxes.push(box);
            reduced.rows[box.row].boxes.push(box);

            return reduced;
        },
        { columns: {}, regions: {}, rows: {} }
    );

    Object.values(groups.columns).forEach(updateGroupAvailableBoxesPerNumber);
    Object.values(groups.regions).forEach(updateGroupAvailableBoxesPerNumber);
    Object.values(groups.rows).forEach(updateGroupAvailableBoxesPerNumber);

    return groups;
};

export const getNextLockedBox = (currentBox: Box, selectedNumber: number): Box => {
    const nextCandidates = Object.keys(currentBox.candidates)
        .map((number) => parseInt(number))
        .map(
            (number): Candidate => ({
                impact: -1,
                impactWithoutDiscards: -1,
                isChosenBecauseIsTheOnlyCandidateLeftForThisBox: false,
                isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup: false,
                isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup: false,
                isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup: false,
                isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox: false,
                isDiscardedBecauseOfLock: number !== selectedNumber,
                number: number
            })
        )
        .reduce<NumericDictionary<Candidate>>(
            (reduced, candidate) => ({ ...reduced, [candidate.number]: candidate }),
            {}
        );

    return {
        candidates: nextCandidates,
        column: currentBox.column,
        groups: {} as any, // Will be set later, since all boxes must be defined
        id: currentBox.id,
        isLocked: true,
        maximumImpact: -1,
        peerBoxes: [], // Will be set later, since all boxes must be defined
        number: selectedNumber,
        region: currentBox.region,
        row: currentBox.row
    };
};

export const getNextOpenBox = (currentBox: Box, selectedBox: Box, selectedNumber: number): Box => {
    const isPeerBox = arePeerBoxes(currentBox, selectedBox);
    const nextCandidates = Object.keys(currentBox.candidates)
        .map((number) => parseInt(number))
        .map(
            (number): Candidate => ({
                impact: -2,
                impactWithoutDiscards: -2,
                isChosenBecauseIsTheOnlyCandidateLeftForThisBox: false,
                isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup: false,
                isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup: false,
                isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup: false,
                isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox: false,
                isDiscardedBecauseOfLock:
                    currentBox.candidates[number].isDiscardedBecauseOfLock ||
                    (isPeerBox && number === selectedNumber),
                number
            })
        )
        .reduce<NumericDictionary<Candidate>>(
            (reduced, candidate) => ({ ...reduced, [candidate.number]: candidate }),
            {}
        );

    return {
        candidates: nextCandidates,
        column: currentBox.column,
        groups: {} as any, // Will be set later, since all boxes must be defined
        id: currentBox.id,
        isLocked: false,
        peerBoxes: [], // Will be set later, since all boxes must be defined
        maximumImpact: -2,
        region: currentBox.region,
        row: currentBox.row
    };
};

export const getRandomMaximumImpactBox = (sudoku: Sudoku): BoxCandidate | undefined => {
    const maximumImpactBoxes = sudoku.boxes.filter(
        (box) =>
            !box.isLocked &&
            Object.values(box.candidates).find(
                (candidate) =>
                    !isCandidateDiscarded(candidate) && candidate.impact === sudoku.maximumImpact
            )
    );

    if (maximumImpactBoxes.length > 0) {
        const randomBox = getRandomElement(maximumImpactBoxes);

        const maximumImpactCandidates = Object.values(randomBox.candidates).filter(
            (candidate) =>
                !isCandidateDiscarded(candidate) && candidate.impact === sudoku.maximumImpact
        );
        const randomCandidate = getRandomElement(maximumImpactCandidates);

        return {
            box: randomBox,
            number: randomCandidate.number
        };
    }

    return undefined;
};

export const getSerializableSudoku = (sudoku: Sudoku): Sudoku => ({
    ...sudoku,
    boxes: sudoku.boxes.map((box) => ({
        ...box,
        // Would cause cyclic dependencies
        groups: {} as any,
        peerBoxes: []
    })),
    latestLockedBox: sudoku.latestLockedBox && {
        ...sudoku.latestLockedBox,
        // Would cause cyclic dependencies
        groups: {} as any,
        peerBoxes: []
    },
    // Would cause cyclic dependencies
    groups: {} as any
});

export const getUpdatedSudoku = (
    sudoku: Sudoku,
    nextBoxes: Box[],
    latestLockedBox?: Box
): Sudoku => {
    const nextGroups = getGroups(nextBoxes);

    nextBoxes.forEach((nextBox) => {
        nextBox.peerBoxes = getBoxPeers(nextGroups, nextBox);
        nextBox.groups = getBoxGroups(nextGroups, nextBox);
    });

    discardCandidates(nextBoxes.filter((box) => !box.isLocked));

    updateGroupsValidations(nextGroups.columns);
    updateGroupsValidations(nextGroups.regions);
    updateGroupsValidations(nextGroups.rows);

    updateCandidatesImpact(nextBoxes);

    return {
        boxes: nextBoxes,
        groups: nextGroups,
        latestLockedBox: latestLockedBox,
        maximumImpact: nextBoxes.reduce((reduced, box) => Math.max(reduced, box.maximumImpact), 0),
        regionSize: sudoku.regionSize,
        size: sudoku.size
    };
};

export const lockBox = (sudoku: Sudoku, selectedBox: Box, selectedNumber: number): Sudoku => {
    const boxesAfterLock = sudoku.boxes.map(
        (box): Box => {
            if (box.isLocked) {
                return box;
            } else if (box === selectedBox) {
                return getNextLockedBox(box, selectedNumber);
            } else {
                return getNextOpenBox(box, selectedBox, selectedNumber);
            }
        }
    );
    return getUpdatedSudoku(sudoku, boxesAfterLock, selectedBox);
};

export const rehydrateSudoku = (serializedSudoku: Sudoku): Sudoku =>
    getUpdatedSudoku(serializedSudoku, serializedSudoku.boxes, serializedSudoku.latestLockedBox);

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

export const updateCandidatesImpact = (boxes: Box[]) => {
    boxes.forEach((nextBox) => {
        Object.keys(nextBox.candidates)
            .map((number) => parseInt(number))
            .forEach((number) => {
                updateCandidateImpact(nextBox, number);
            });

        nextBox.maximumImpact = Object.values(nextBox.candidates).reduce(
            (reduced, candidate) => Math.max(reduced, candidate.impact),
            0
        );
    });
};

export const updateGroupAvailableBoxesPerNumber = (group: Group) => {
    group.availableBoxesPerNumber = {};
    group.boxes.forEach((box) => {
        Object.values(box.candidates).forEach((candidate) => {
            group.availableBoxesPerNumber[candidate.number] =
                group.availableBoxesPerNumber[candidate.number] || [];
            if (!isCandidateDiscarded(candidate)) {
                group.availableBoxesPerNumber[candidate.number].push(box);
            }
        });
    });
};

export const updateGroupsValidations = (groups: NumericDictionary<Group>) => {
    Object.values(groups).forEach((group) => {
        const hasTwoLockedBoxesWithSameNumber = doesGroupHaveTwoLockedBoxesWithSameNumber(group);
        const hasAnyBoxWithoutCandidates = doesGroupHaveABoxWithoutCandidates(group);

        group.isValid = !hasTwoLockedBoxesWithSameNumber && !hasAnyBoxWithoutCandidates;
    });
};
