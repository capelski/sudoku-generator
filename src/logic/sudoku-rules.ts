import { Box, Candidate, Group, NumericDictionary } from '../types/sudoku';

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

export const doesGroupHaveNonPropagatedOwnedCandidates = (group: Group) => {
    return (
        group.ownedCandidates.find((ownedCandidatesSet) => {
            return ownedCandidatesSet.boxes.find((ownedBox) =>
                Object.values(ownedBox.candidates).find(
                    (candidate) =>
                        ownedCandidatesSet.numbers.indexOf(candidate.number) === -1 &&
                        !isCandidateDiscarded(candidate)
                )
            );
        }) !== undefined
    );
};

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
    candidate.isDiscardedBecauseOfLock ||
    candidate.isDiscardedBecauseOfOwnedCandidateInSomeGroup;

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

export const restrictOwnedCandidates = (group: Group, boxQueue: Box[]) => {
    group.ownedCandidates.forEach((ownedCandidatesSet) => {
        const ownedBoxesId = ownedCandidatesSet.boxes.map((box) => box.id);
        ownedCandidatesSet.boxes.forEach((ownedBox) => {
            Object.values(ownedBox.candidates)
                .filter(
                    (candidate) =>
                        ownedCandidatesSet.numbers.indexOf(candidate.number) === -1 &&
                        !isCandidateDiscarded(candidate)
                )
                .forEach((candidate) => {
                    candidate.isDiscardedBecauseOfOwnedCandidateInSomeGroup = true;
                });
            addPeerBoxesToBoxQueue(
                boxQueue,
                ownedBox.peerBoxes.filter(
                    (peerBox) => !peerBox.isLocked && ownedBoxesId.indexOf(peerBox.id) === -1
                )
            );
        });
    });
};

export const updateOnlyNonDiscardedCandidate = (boxQueue: Box[], box: Box) => {
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
