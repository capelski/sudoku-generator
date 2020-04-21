import { Box, Candidate, Group, NumericDictionary, Sudoku } from '../types/sudoku';
import {
    getGroups,
    getBoxPeers,
    arePeerBoxes,
    isCandidateDiscarded,
    updateCandidateImpact
} from './sudoku-operations';
import { getRandomElement } from './utilities';

// const discardByBoxesNumbersGroupRestriction = (box: Box, numbers: number[]) => {
//     box.candidates
//         .filter((candidate) => numbers.indexOf(candidate.number) === -1)
//         .forEach((candidate) => {
//             candidate.isDiscardedByBoxesNumbersGroupRestriction = true;
//         });
// };

// export const discardByBoxSingleCandidate = (box: Box) => {
//     const singleCandidateIndex = box.candidates.findIndex(
//         (candidate) => !isCandidateDiscarded(candidate)
//     );
//     // This condition is necessary, because box might not have any valid candidate at the time of execution
//     if (singleCandidateIndex > -1) {
//         box.candidates[singleCandidateIndex].isBoxSingleCandidate = true;
//         box.peerBoxes
//             .filter((peerBox) => !peerBox.isLocked)
//             .forEach((peerBox) => {
//                 peerBox.candidates[
//                     singleCandidateIndex
//                 ].isDiscardedByBoxSingleCandidateInPeerBox = true;
//             });
//     }
// };

// export const discardByGroup = (groups: NumericDictionary<Group>) => {
//     Object.values(groups).forEach((group) => {
//         const numbersAvailableBoxes = getNumbersAvailableBoxes(group.boxes);

//         Object.keys(numbersAvailableBoxes)
//             .map((numberKey) => parseInt(numberKey))
//             .filter((number) => numbersAvailableBoxes[number].boxes.length === 1)
//             .forEach((number) => {
//                 const box = numbersAvailableBoxes[number].boxes[0];
//                 discardByGroupSingleCandidate(box, number);
//             });

//         // TODO If a number must be placed in a subset of a row or column for a given region, remove the numbers from the rest of the rows or regions

//         // If two numbers can only be placed in the same two boxes, discard other candidates for that boxes
//         const numbersWithSameBoxes = Object.keys(numbersAvailableBoxes)
//             .map((numberKey) => parseInt(numberKey))
//             .reduce<StringDictionary<BoxesNumbersGroupRestriction>>((reduced, number) => {
//                 const boxesCoordinates = numbersAvailableBoxes[number].boxesCoordinates;
//                 reduced[boxesCoordinates] = reduced[boxesCoordinates] || {
//                     numbers: [],
//                     boxes: numbersAvailableBoxes[number].boxes
//                 };
//                 reduced[boxesCoordinates].numbers.push(number);
//                 return reduced;
//             }, {});
//         Object.values(numbersWithSameBoxes)
//             .filter((x) => x.boxes.length === x.numbers.length)
//             .forEach((x) => {
//                 x.boxes.forEach((box) => discardByBoxesNumbersGroupRestriction(box, x.numbers));
//             });

//         // TODO If two boxes have only the same two numbers, remove those numbers from other peer boxes

//         // TODO Write the group isValid based on whether all candidates appear once, or have the ability to appear once
//         group.isValid =
//             group.boxes.find((box) => !hasBoxAPotentialCandidate(box)) === undefined &&
//             Object.values(numbersWithSameBoxes).filter((x) => x.boxes.length < x.numbers.length)
//                 .length === 0 &&
//             Object.values(numbersAvailableBoxes).reduce(
//                 (reduced, numberAvailableBoxes) => reduced && numberAvailableBoxes.boxes.length > 0,
//                 true
//             );
//     });
// };

// export const discardByGroupSingleCandidate = (box: Box, number: number) => {
//     const candidateIndex = box.candidates.findIndex((candidate) => candidate.number === number);
//     box.candidates.forEach((_, currentCandidateIndex) => {
//         if (currentCandidateIndex === candidateIndex) {
//             box.candidates[currentCandidateIndex].isGroupSingleCandidate = true;
//         } else {
//             box.candidates[currentCandidateIndex].isDiscardedByGroupSingleCandidateInSameBox = true;
//         }
//     });
//     box.peerBoxes
//         .filter((peerBox) => !peerBox.isLocked)
//         .forEach((peerBox) => {
//             peerBox.candidates[candidateIndex].isDiscardedByBoxSingleCandidateInPeerBox = true;
//         });
// };

// export const discardCandidates = (boxes: Box[], groups: SudokuGroups) => {
//     for (;;) {
//         for (;;) {
//             const unnoticedSingleCandidateBoxes = getUnnoticedSingleCandidateBoxes(boxes);
//             if (unnoticedSingleCandidateBoxes.length === 0) {
//                 break;
//             }
//             unnoticedSingleCandidateBoxes.forEach(discardByBoxSingleCandidate);
//             console.log('End of single candidates discard round');
//         }

//         discardByGroup(groups.columns);
//         discardByGroup(groups.regions);
//         discardByGroup(groups.rows);
//         console.log('End of group candidates discard round');

//         const unnoticedSingleCandidateBoxes = getUnnoticedSingleCandidateBoxes(boxes);
//         if (unnoticedSingleCandidateBoxes.length === 0) {
//             break;
//         }
//     }
// };

export const addPeerBoxesToBoxQueue = (boxQueue: Box[], peerBoxes: Box[]) => {
    const boxQueueIds = boxQueue.map((b) => b.id);
    peerBoxes
        .filter((pb) => !pb.isLocked && boxQueueIds.indexOf(pb.id) === -1)
        .forEach((pb) => {
            boxQueue.splice(boxQueue.length, 0, pb);
        });
};

export const doesBoxNeedToUpdateOnlyLeftCandidate = (box: Box) => {
    let doesIt = false;
    const doesBoxHaveOnlyOneCandidateLeft =
        box.candidates.filter((candidate) => !candidate.isDiscardedByLock).length === 1;

    if (doesBoxHaveOnlyOneCandidateLeft) {
        const onlyCandidateLeft = box.candidates.find((candidate) => !candidate.isDiscardedByLock)!;

        doesIt = !onlyCandidateLeft.isTheOnlyCandidateLeftForThisBox;
    }

    return doesIt;
};

export const updateOnlyLeftCandidate = (boxQueue: Box[], box: Box) => {
    const onlyCandidateLeftIndex = box.candidates.findIndex(
        (candidate) => !candidate.isDiscardedByLock
    );
    box.candidates[onlyCandidateLeftIndex].isTheOnlyCandidateLeftForThisBox = true;
    box.peerBoxes.forEach(
        (pb) => (pb.candidates[onlyCandidateLeftIndex].isTheOnlyCandidateLeftForAPeerBox = true)
    );
    addPeerBoxesToBoxQueue(boxQueue, box.peerBoxes);
};

export const discardCandidates = (boxQueue: Box[]) => {
    const currentBox = boxQueue.shift();

    if (currentBox) {
        if (doesBoxNeedToUpdateOnlyLeftCandidate(currentBox)) {
            updateOnlyLeftCandidate(boxQueue, currentBox);
        }

        discardCandidates(boxQueue);
    }
};

export const getNextLockedBox = (currentBox: Box, selectedNumber: number): Box => {
    const nextCandidates = currentBox.candidates.map(
        (candidate): Candidate => ({
            impact: -1,
            impactWithoutDiscards: -1,
            isTheOnlyCandidateLeftForAPeerBox: false,
            isTheOnlyCandidateLeftForThisBox: false,
            isDiscardedByLock: candidate.number !== selectedNumber,
            number: candidate.number
        })
    );

    return {
        candidates: nextCandidates,
        column: currentBox.column,
        id: currentBox.id,
        isLocked: true,
        maximumImpact: -1,
        peerBoxes: [], // Some peer boxes might not exist here yet
        number: selectedNumber,
        region: currentBox.region,
        row: currentBox.row
    };
};

export const getNextOpenBox = (currentBox: Box, selectedBox: Box, selectedNumber: number): Box => {
    const isPeerBox = arePeerBoxes(currentBox, selectedBox);
    const nextCandidates = currentBox.candidates.map(
        (candidate): Candidate => ({
            impact: -2,
            impactWithoutDiscards: -2,
            isTheOnlyCandidateLeftForAPeerBox: false,
            isTheOnlyCandidateLeftForThisBox: false,
            isDiscardedByLock:
                candidate.isDiscardedByLock || (isPeerBox && candidate.number === selectedNumber),
            number: candidate.number
        })
    );

    return {
        candidates: nextCandidates,
        column: currentBox.column,
        id: currentBox.id,
        isLocked: false,
        peerBoxes: [], // Some peer boxes might not exist here yet
        maximumImpact: -2,
        region: currentBox.region,
        row: currentBox.row
    };
};

// export const getNumbersAvailableBoxes = (boxes: Box[]): NumericDictionary<NumberAvailableBoxes> => {
//     const numbersAvailableBoxes: NumericDictionary<NumberAvailableBoxes> = {};
//     boxes.forEach((box) => {
//         box.candidates
//             .filter((candidate) => !isCandidateDiscarded(candidate))
//             .forEach((candidate) => {
//                 numbersAvailableBoxes[candidate.number] = numbersAvailableBoxes[
//                     candidate.number
//                 ] || {
//                     boxes: []
//                 };
//                 numbersAvailableBoxes[candidate.number].boxes.push(box);
//             });
//     });
//     Object.values(numbersAvailableBoxes).forEach((numberAvailableBoxes) => {
//         numberAvailableBoxes.boxesCoordinates = numberAvailableBoxes.boxes
//             .map((box) => box.id)
//             .join();
//     });
//     return numbersAvailableBoxes;
// };

// export const getUnnoticedSingleCandidateBoxes = (boxes: Box[]) =>
//     boxes.filter(
//         (box) =>
//             !box.isLocked &&
//             // TODO They should not always be marked as box single candidate
//             box.candidates.filter((candidate) => !isCandidateDiscarded(candidate)).length === 1 &&
//             box.candidates.filter((candidate) => candidate.isBoxSingleCandidate).length === 0
//     );

export const updateGroupsValidations = (groups: NumericDictionary<Group>) => {
    Object.values(groups).forEach((group) => {
        const lockedBoxesNumbersOccurrences = group.boxes
            .filter((box) => box.isLocked)
            .reduce<NumericDictionary<number>>((reduced, lockedBox) => {
                return { ...reduced, [lockedBox.number!]: (reduced[lockedBox.number!] || 0) + 1 };
            }, {});

        const hasTwoLockedBoxesWithSameNumber = Object.values(lockedBoxesNumbersOccurrences).find(
            (numberOccurrences) => numberOccurrences > 1
        );

        const hasAnyBoxWithoutCandidates =
            group.boxes.find(
                (box) =>
                    box.candidates.find((candidate) => !isCandidateDiscarded(candidate)) ===
                    undefined
            ) !== undefined;

        group.isValid = !hasTwoLockedBoxesWithSameNumber && !hasAnyBoxWithoutCandidates;
    });
};

export const getUpdatedSudoku = (
    sudoku: Sudoku,
    nextBoxes: Box[],
    latestLockedBox?: Box
): Sudoku => {
    const nextGroups = getGroups(nextBoxes);

    nextBoxes.forEach((nextBox) => {
        nextBox.peerBoxes = getBoxPeers(nextGroups, nextBox);
    });

    discardCandidates(nextBoxes.filter((box) => !box.isLocked));
    // discardCandidates(nextBoxes, nextGroup);

    updateGroupsValidations(nextGroups.columns);
    updateGroupsValidations(nextGroups.regions);
    updateGroupsValidations(nextGroups.rows);

    // Update candidates impact after discarding
    nextBoxes.forEach((nextBox) => {
        nextBox.candidates.forEach((_candidate, candidateIndex) => {
            updateCandidateImpact(nextBox, candidateIndex);
        });

        nextBox.maximumImpact = nextBox.candidates.reduce(
            (reduced, candidate) => Math.max(reduced, candidate.impact),
            0
        );
    });

    const sudokuMaximumImpact = nextBoxes.reduce(
        (reduced, box) => Math.max(reduced, box.maximumImpact),
        0
    );

    return {
        boxes: nextBoxes,
        groups: nextGroups,
        latestLockedBox: latestLockedBox,
        maximumImpact: sudokuMaximumImpact,
        regionSize: sudoku.regionSize,
        size: sudoku.size
    };
};

export const hasBoxAPotentialCandidate = (box: Box) =>
    box.candidates.find((candidate) => !isCandidateDiscarded(candidate)) !== undefined;

export const isBoxColumnValid = (sudoku: Sudoku, box: Box) =>
    sudoku.groups.columns[box.column].isValid;

export const isBoxRegionValid = (sudoku: Sudoku, box: Box) =>
    sudoku.groups.regions[box.region].isValid;

export const isBoxRowValid = (sudoku: Sudoku, box: Box) => sudoku.groups.rows[box.row].isValid;

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

export const lockRandomMaximumImpactBox = (sudoku: Sudoku) => {
    const maximumImpactBoxes = sudoku.boxes.filter(
        (box) =>
            !box.isLocked &&
            box.candidates.find(
                (candidate) =>
                    !isCandidateDiscarded(candidate) && candidate.impact === sudoku.maximumImpact
            )
    );

    if (maximumImpactBoxes.length > 0) {
        const randomBox = getRandomElement(maximumImpactBoxes);

        const maximumImpactCandidates = randomBox.candidates.filter(
            (candidate) =>
                !isCandidateDiscarded(candidate) && candidate.impact === sudoku.maximumImpact
        );
        const randomCandidate = getRandomElement(maximumImpactCandidates);

        lockBox(sudoku, randomBox, randomCandidate.number);
    }
};

export const rehydrateSudoku = (serializedSudoku: Sudoku): Sudoku =>
    getUpdatedSudoku(serializedSudoku, serializedSudoku.boxes, serializedSudoku.latestLockedBox);
