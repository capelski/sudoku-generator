import {
    Box,
    BoxCandidate,
    BoxesCandidatesSet,
    BoxGroups,
    Candidate,
    Group,
    NumericDictionary,
    StringDictionary,
    Sudoku,
    SudokuGroups,
    SudokuComputedData
} from '../types/sudoku';
import {
    doesBoxHaveOnlyOneNonDiscardedCandidate,
    doesGroupHaveABoxWithoutCandidates,
    doesGroupHaveNonPropagatedOwnedCandidates,
    doesGroupNeedToPlaceANumberInCertainBox,
    doesGroupHaveTwoLockedBoxesWithSameNumber,
    isCandidateDiscarded,
    placeGroupNumberInCertainBox,
    restrictOwnedCandidates,
    updateOnlyNonDiscardedCandidate,
    doesRegionRestrictColumnOrRow,
    restrictRegionSubset
} from './sudoku-rules';
import { getRandomElement } from './utilities';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const discardCandidatesByInferring = (boxQueue: Box[], groups: SudokuGroups) => {
    const currentBox = boxQueue.shift();

    if (currentBox) {
        if (doesBoxHaveOnlyOneNonDiscardedCandidate(currentBox)) {
            updateOnlyNonDiscardedCandidate(boxQueue, currentBox);
            updateAllGroups(groups);
        }

        if (doesGroupNeedToPlaceANumberInCertainBox(currentBox.groups.column)) {
            placeGroupNumberInCertainBox(currentBox.groups.column, boxQueue);
            updateAllGroups(groups);
        }
        if (doesGroupNeedToPlaceANumberInCertainBox(currentBox.groups.region)) {
            placeGroupNumberInCertainBox(currentBox.groups.region, boxQueue);
            updateAllGroups(groups);
        }
        if (doesGroupNeedToPlaceANumberInCertainBox(currentBox.groups.row)) {
            placeGroupNumberInCertainBox(currentBox.groups.row, boxQueue);
            updateAllGroups(groups);
        }

        if (doesGroupHaveNonPropagatedOwnedCandidates(currentBox.groups.column)) {
            restrictOwnedCandidates(currentBox.groups.column, boxQueue);
            updateAllGroups(groups);
        }
        if (doesGroupHaveNonPropagatedOwnedCandidates(currentBox.groups.region)) {
            restrictOwnedCandidates(currentBox.groups.region, boxQueue);
            updateAllGroups(groups);
        }
        if (doesGroupHaveNonPropagatedOwnedCandidates(currentBox.groups.row)) {
            restrictOwnedCandidates(currentBox.groups.row, boxQueue);
            updateAllGroups(groups);
        }

        if (doesRegionRestrictColumnOrRow(currentBox.region, currentBox.groups.region)) {
            restrictRegionSubset(currentBox.region, currentBox.groups.region, boxQueue);
            updateAllGroups(groups);
        }

        // TODO If two boxes have only the same two numbers, remove those numbers from other peer boxes

        discardCandidatesByInferring(boxQueue, groups);
    }
};

export const discardCandidatesByLocks = (lockedBoxes: Box[]) => {
    lockedBoxes.forEach((lockedBox) => {
        lockedBox.peerBoxes
            .filter((peerBox) => !peerBox.isLocked)
            .forEach((peerBox) => {
                peerBox.candidates[lockedBox.number!].isDiscardedBecauseOfLock = true;
            });
    });
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

export const getEmptySudoku = (regionSize: number, numbers?: NumericDictionary<number>): Sudoku => {
    return {
        locksHistory: [],
        numbers: numbers || {},
        regionSize
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
                    isValid: true,
                    ownedCandidates: []
                } as Group);
            reduced.regions[box.region] =
                reduced.regions[box.region] ||
                ({
                    availableBoxesPerNumber: {},
                    boxes: [],
                    isValid: true,
                    ownedCandidates: []
                } as Group);
            reduced.rows[box.row] =
                reduced.rows[box.row] ||
                ({
                    availableBoxesPerNumber: {},
                    boxes: [],
                    isValid: true,
                    ownedCandidates: []
                } as Group);

            reduced.columns[box.column].boxes.push(box);
            reduced.regions[box.region].boxes.push(box);
            reduced.rows[box.row].boxes.push(box);

            return reduced;
        },
        { columns: {}, regions: {}, rows: {} }
    );

    return groups;
};

export const getRandomMaximumImpactBox = (sudoku: SudokuComputedData): BoxCandidate | undefined => {
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
            boxId: randomBox.id,
            number: randomCandidate.number
        };
    }

    return undefined;
};

export const getSudokuComputedData = (sudoku: Sudoku): SudokuComputedData => {
    const size = sudoku.regionSize * sudoku.regionSize;
    const boxes = [...Array(size)]
        .map((_x, rowIndex) =>
            [...Array(size)].map(
                (_y, columnIndex): Box => {
                    const boxId = rowIndex * size + columnIndex;
                    const lockedNumber = sudoku.numbers[boxId];
                    return {
                        candidates: [...Array(size)]
                            .map(
                                (_z, candidateIndex): Candidate => ({
                                    impact: -2, // Will be set later, since all boxes must be defined
                                    impactWithoutDiscards: -2, // Will be set later, since all boxes must be defined
                                    isChosenBecauseIsTheOnlyCandidateLeftForThisBox: false,
                                    isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup: false,
                                    isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup: false,
                                    isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup: false,
                                    isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox: false,
                                    isDiscardedBecauseOfLock: false,
                                    isDiscardedBecauseOfOwnedCandidateInSomeGroup: false,
                                    isDiscardedBecauseOfRegionSubset: false,
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
                        id: boxId,
                        isLocked: lockedNumber != undefined,
                        groups: {} as any, // Will be set later, since all boxes must be defined
                        maximumImpact: -2, // Will be set later, since all boxes must be defined
                        number: lockedNumber,
                        peerBoxes: [], // Will be set later, since all boxes must be defined
                        region:
                            Math.floor(rowIndex / sudoku.regionSize) * sudoku.regionSize +
                            Math.floor(columnIndex / sudoku.regionSize),
                        row: rowIndex
                    };
                }
            )
        )
        .reduce<Box[]>((reduced, boxes) => reduced.concat(boxes), []);

    const groups = getGroups(boxes);

    boxes.forEach((box) => {
        box.peerBoxes = getBoxPeers(groups, box);
        box.groups = getBoxGroups(groups, box);
    });

    discardCandidatesByLocks(boxes.filter((box) => box.isLocked));

    Object.values(groups.columns).forEach((group) => {
        updateGroupAvailableBoxesPerNumber(group);
        updateGroupOwnedCandidates(group);
    });
    Object.values(groups.regions).forEach((group) => {
        updateGroupAvailableBoxesPerNumber(group);
        updateGroupOwnedCandidates(group);
    });
    Object.values(groups.rows).forEach((group) => {
        updateGroupAvailableBoxesPerNumber(group);
        updateGroupOwnedCandidates(group);
    });

    discardCandidatesByInferring(
        boxes.filter((box) => !box.isLocked),
        groups
    );

    updateGroupsValidations(groups.columns);
    updateGroupsValidations(groups.regions);
    updateGroupsValidations(groups.rows);

    updateCandidatesImpact(boxes);

    return {
        boxes,
        groups,
        maximumImpact: boxes
            .filter((box) => !box.isLocked)
            .reduce((reduced, box) => Math.max(reduced, box.maximumImpact), 0),
        size
    };
};

export const lockBox = (sudoku: Sudoku, boxId: number, number: number): Sudoku => {
    return {
        locksHistory: sudoku.locksHistory.concat([boxId]),
        numbers: {
            ...sudoku.numbers,
            [boxId]: number
        },
        regionSize: sudoku.regionSize
    };
};

export const unlockBox = (sudoku: Sudoku, boxId: number): Sudoku => {
    const nextNumbers = { ...sudoku.numbers };
    delete nextNumbers[boxId];
    return {
        locksHistory: sudoku.locksHistory.filter((id) => id !== boxId),
        numbers: nextNumbers,
        regionSize: sudoku.regionSize
    };
};

export const updateAllGroups = (groups: SudokuGroups) => {
    Object.values(groups.columns).forEach((group) => {
        updateGroupAvailableBoxesPerNumber(group);
        updateGroupOwnedCandidates(group);
    });
    Object.values(groups.regions).forEach((group) => {
        updateGroupAvailableBoxesPerNumber(group);
        updateGroupOwnedCandidates(group);
    });
    Object.values(groups.rows).forEach((group) => {
        updateGroupAvailableBoxesPerNumber(group);
        updateGroupOwnedCandidates(group);
    });
};

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
    boxes.forEach((box) => {
        Object.keys(box.candidates)
            .map((number) => parseInt(number))
            .forEach((number) => {
                updateCandidateImpact(box, number);
            });

        box.maximumImpact = Object.values(box.candidates).reduce(
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
            if (
                (box.isLocked && box.number === candidate.number) ||
                (!box.isLocked && !isCandidateDiscarded(candidate))
            ) {
                group.availableBoxesPerNumber[candidate.number].push(box);
            }
        });
    });
};

export const updateGroupOwnedCandidates = (group: Group) => {
    const ownedCandidatesDictionary: StringDictionary<BoxesCandidatesSet> = {};

    Object.keys(group.availableBoxesPerNumber)
        .map((number) => parseInt(number))
        .forEach((number) => {
            const boxes = group.availableBoxesPerNumber[number].filter((box) => !box.isLocked);
            const boxesKey = boxes.map((box) => box.id).join('_');
            if (boxesKey) {
                ownedCandidatesDictionary[boxesKey] =
                    ownedCandidatesDictionary[boxesKey] ||
                    ({ boxes, numbers: [] } as BoxesCandidatesSet);
                ownedCandidatesDictionary[boxesKey].numbers.push(number);
            }
        });

    group.ownedCandidates = Object.values(ownedCandidatesDictionary).filter(
        (ownedCandidatesSet) =>
            ownedCandidatesSet.boxes.length === ownedCandidatesSet.numbers.length &&
            ownedCandidatesSet.boxes.length !== group.boxes.filter((box) => !box.isLocked).length
    );
};

export const updateGroupsValidations = (groups: NumericDictionary<Group>) => {
    Object.values(groups).forEach((group) => {
        const hasTwoLockedBoxesWithSameNumber = doesGroupHaveTwoLockedBoxesWithSameNumber(group);
        const hasAnyBoxWithoutCandidates = doesGroupHaveABoxWithoutCandidates(group);
        const hasAnyNumberWithoutPotentialBoxes =
            Object.values(group.availableBoxesPerNumber).find(
                (boxesPerNumber) => boxesPerNumber.length === 0
            ) !== undefined;

        group.isValid =
            !hasTwoLockedBoxesWithSameNumber &&
            !hasAnyBoxWithoutCandidates &&
            !hasAnyNumberWithoutPotentialBoxes;
    });
};
