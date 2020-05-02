import { Box, Candidate, Group, NumericDictionary, SudokuComputedData } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const choseOnlyBoxAvailableInGroupForNumber = (group: Group) => {
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
                candidate.isChosen = true;
                candidate.chosenReason = 'This box must hold this number for a group';
            } else if (!isCandidateDiscarded(candidate)) {
                candidate.isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup = true;
            }
        });
        targetBox.peerBoxes
            .filter((pb) => !pb.isLocked) // TODO And is not chosen
            .forEach((peerBox) => {
                peerBox.candidates[
                    number
                ].isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup = true;
            });
    });
};

export const choseOnlyCandidateAvailableForBox = (box: Box) => {
    const onlyNumberAvailable = Object.keys(box.candidates)
        .map((number) => parseInt(number))
        .find((number) => !box.isLocked && !isCandidateDiscarded(box.candidates[number]))!;

    if (onlyNumberAvailable) {
        box.candidates[onlyNumberAvailable].isChosen = true;
        box.candidates[onlyNumberAvailable].chosenReason = 'Only candidate left for this box';
        box.peerBoxes.forEach(
            (pb) =>
                (pb.candidates[
                    onlyNumberAvailable
                ].isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox = true)
        );
    }
};

export const discardCandidatesFromGroupBecauseOfRegionRestriction = (
    regionNumber: number,
    region: Group,
    groupType: 'column' | 'row'
) => {
    Object.keys(region.availableBoxesPerNumber)
        .map((number) => parseInt(number))
        .forEach((number) => {
            const numberBoxes = region.availableBoxesPerNumber[number];
            const boxesGroups = numberBoxes.reduce<NumericDictionary<number>>(
                (reduced, box) => ({
                    ...reduced,
                    [box[groupType]]: (reduced[box[groupType]] || 0) + 1
                }),
                {}
            );
            const areAllBoxesInSameGroup =
                Object.keys(boxesGroups).length === 1 && Object.values(boxesGroups)[0] > 1;

            if (areAllBoxesInSameGroup) {
                const group = numberBoxes[0].groups[groupType];
                const groupBoxesOutsideRegion = group.boxes.filter(
                    (box) =>
                        box.region !== regionNumber &&
                        !box.isLocked &&
                        !isCandidateDiscarded(box.candidates[number])
                );
                groupBoxesOutsideRegion.forEach((box) => {
                    box.candidates[number].isDiscardedBecauseOfRegionSubset = true;
                });
            }
        });
};

export const discardOwnedCandidatesFromNonOwnerBoxes = (group: Group) => {
    group.ownedCandidates.forEach((ownedCandidatesSet) => {
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
        });
    });
};

export const doesBoxHaveAChosenCandidate = (box: Box) =>
    Object.values(box.candidates).some((c) => c.isChosen);

export const doesBoxHaveAllCandidatesDiscardedButOne = (box: Box) =>
    Object.values(box.candidates).filter((candidate) => !isCandidateDiscarded(candidate)).length ===
    1;

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

export const getAllBoxesWithOnlyOneCandidateAvailable = (boxes: Box[]) => {
    return boxes.filter(
        (box) =>
            !box.isLocked &&
            !doesBoxHaveAChosenCandidate(box) &&
            doesBoxHaveAllCandidatesDiscardedButOne(box)
    );
};

export const getAllGroupsWithANumberAvailableInJustOneBox = (groups: NumericDictionary<Group>) => {
    return Object.values(groups).filter((group) => {
        return Object.keys(group.availableBoxesPerNumber)
            .map((number) => parseInt(number))
            .some((number) => {
                const boxesPerNumber = group.availableBoxesPerNumber[number];
                const firstBox = boxesPerNumber[0];
                return (
                    boxesPerNumber.length === 1 &&
                    !firstBox.isLocked &&
                    !firstBox.candidates[number].isChosen
                );
            });
    });
};

export const getAllGroupsWithOwnedCandidates = (groups: NumericDictionary<Group>) => {
    return Object.values(groups).filter((group) => {
        return group.ownedCandidates.some((ownedCandidatesSet) => {
            return ownedCandidatesSet.boxes.some((ownedBox) =>
                Object.values(ownedBox.candidates).some(
                    (candidate) =>
                        ownedCandidatesSet.numbers.indexOf(candidate.number) === -1 &&
                        !isCandidateDiscarded(candidate)
                )
            );
        });
    });
};

export const getAllRegionsThatCauseSubsetRestrictions = (
    regions: NumericDictionary<Group>,
    groupType: 'column' | 'row'
) => {
    return Object.keys(regions).filter((regionKey) => {
        const regionNumber = parseInt(regionKey, 10);
        const region = regions[regionNumber];

        return Object.keys(region.availableBoxesPerNumber)
            .map((number) => parseInt(number))
            .some((number) => {
                const numberBoxes = region.availableBoxesPerNumber[number];
                const boxesGroups = numberBoxes.reduce<NumericDictionary<number>>(
                    (reduced, box) => ({
                        ...reduced,
                        [box[groupType]]: (reduced[box[groupType]] || 0) + 1
                    }),
                    {}
                );

                const areAllBoxesInSameGroup =
                    Object.keys(boxesGroups).length === 1 && Object.values(boxesGroups)[0] > 1;

                return (
                    areAllBoxesInSameGroup &&
                    numberBoxes[0].groups[groupType].boxes.some(
                        (box) =>
                            box.region !== regionNumber &&
                            !box.isLocked &&
                            !isCandidateDiscarded(box.candidates[number])
                    )
                );
            });
    });
};

export const isBoxOutOfCandidates = (box: Box) =>
    Object.values(box.candidates).find((candidate) => !isCandidateDiscarded(candidate)) ===
    undefined;

export const isCandidateDiscarded = (candidate: Candidate) =>
    candidate.isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup ||
    candidate.isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup ||
    candidate.isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox ||
    candidate.isDiscardedBecauseOfLock ||
    candidate.isDiscardedBecauseOfOwnedCandidateInSomeGroup ||
    candidate.isDiscardedBecauseOfRegionSubset;

export const isSudokuReadyToBeSolved = (sudokuComputedData: SudokuComputedData) =>
    !sudokuComputedData.boxes.some(
        (box) => !box.isLocked && !Object.values(box.candidates).some((c) => c.isChosen)
    );

export const isSudokuValid = (sudokuComputedData: SudokuComputedData) => {
    const groups = Object.values(sudokuComputedData.groups.columns)
        .concat(Object.values(sudokuComputedData.groups.regions))
        .concat(Object.values(sudokuComputedData.groups.rows));

    return !groups.some((g) => !g.isValid);
};
