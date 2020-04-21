import { Box, Candidate, Group, NumericDictionary } from '../types/sudoku';

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

export const doesBoxHaveOnlyOneNonDiscardedCandidate = (box: Box) => {
    const nonDiscardedCandidates = Object.values(box.candidates).filter(
        (candidate) => !isCandidateDiscarded(candidate)
    );

    let result = false;
    if (nonDiscardedCandidates.length === 1) {
        const singleNonDiscardedCandidate = nonDiscardedCandidates[0];
        result = !isCandidateChosen(singleNonDiscardedCandidate);
    }

    return result;
};

export const doesGroupHaveABoxWithoutCandidates = (group: Group) =>
    group.boxes.find((box) => isBoxOutOfCandidates(box)) !== undefined;

export const doesGroupHaveTwoLockedBoxesWithSameNumber = (group: Group) => {
    const lockedBoxesNumbersOccurrences = group.boxes
        .filter((box) => box.isLocked)
        .reduce<NumericDictionary<number>>((reduced, lockedBox) => {
            return { ...reduced, [lockedBox.number!]: (reduced[lockedBox.number!] || 0) + 1 };
        }, {});

    return Object.values(lockedBoxesNumbersOccurrences).find(
        (numberOccurrences) => numberOccurrences > 1
    );
};

export const doesGroupNeedToPlaceANumberInCertainBox = (group: Group) => {
    const numbersWithOnlyOneBoxLeft = Object.keys(group.availableBoxesPerNumber)
        .map((number) => parseInt(number))
        .filter((number) => {
            const boxesPerNumber = group.availableBoxesPerNumber[number];
            let doesIt = false;

            if (boxesPerNumber.length === 1 && !boxesPerNumber[0].isLocked) {
                doesIt = !isCandidateChosen(boxesPerNumber[0].candidates[number]);
            }

            return doesIt;
        });

    return numbersWithOnlyOneBoxLeft.length > 0;
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

export const isBoxOutOfCandidates = (box: Box) =>
    Object.values(box.candidates).find((candidate) => !isCandidateDiscarded(candidate)) ===
    undefined;

export const isCandidateChosen = (candidate: Candidate) =>
    candidate.isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup ||
    candidate.isChosenBecauseIsTheOnlyCandidateLeftForThisBox;

export const isCandidateDiscarded = (candidate: Candidate) =>
    candidate.isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup ||
    candidate.isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup ||
    candidate.isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox ||
    candidate.isDiscardedBecauseOfLock;

export const placeGroupNumberInCertainBox = (group: Group, boxQueue: Box[]) => {
    const numbersWithOnlyOneBoxLeft = Object.keys(group.availableBoxesPerNumber)
        .map((number) => parseInt(number))
        .filter((number) => {
            const boxesPerNumber = group.availableBoxesPerNumber[number];
            return boxesPerNumber.length === 1 && !boxesPerNumber[0].isLocked;
        });

    numbersWithOnlyOneBoxLeft.forEach((number) => {
        const targetBox = group.availableBoxesPerNumber[number][0];
        Object.values(targetBox.candidates).forEach((candidate) => {
            if (candidate === targetBox.candidates[number]) {
                candidate.isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup = true;
            } else if (!isCandidateDiscarded(candidate)) {
                candidate.isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup = true;
            }
        });
        targetBox.peerBoxes
            .filter((pb) => !pb.isLocked)
            .forEach((peerBox) => {
                peerBox.candidates[
                    number
                ].isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup = true;
            });
        addPeerBoxesToBoxQueue(boxQueue, targetBox.peerBoxes);
    });
};

export const updateOnlyLeftCandidate = (boxQueue: Box[], box: Box) => {
    const onlyCandidateLeftNumber = Object.keys(box.candidates)
        .map((number) => parseInt(number))
        .find((number) => !isCandidateDiscarded(box.candidates[number]))!;

    box.candidates[onlyCandidateLeftNumber].isChosenBecauseIsTheOnlyCandidateLeftForThisBox = true;
    box.peerBoxes.forEach(
        (pb) =>
            (pb.candidates[
                onlyCandidateLeftNumber
            ].isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox = true)
    );
    addPeerBoxesToBoxQueue(boxQueue, box.peerBoxes);
};
