import { Box, Group, NumericDictionary, SudokuComputedData } from '../types/sudoku';

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
            } else if (!candidate.isDiscarded) {
                candidate.isDiscarded = true;
                candidate.discardedReason = 'This box must hold another number for some group';
            }
        });
        targetBox.peerBoxes
            .filter((pb) => !pb.isLocked) // TODO And is not chosen
            .forEach((peerBox) => {
                const candidate = peerBox.candidates[number];
                candidate.isDiscarded = true;
                candidate.discardedReason = 'Peer box must hold this number for some group';
            });
    });
};

export const choseOnlyCandidateAvailableForBox = (box: Box) => {
    const onlyNumberAvailable = Object.keys(box.candidates)
        .map((number) => parseInt(number))
        .find((number) => !box.isLocked && !box.candidates[number].isDiscarded);

    if (onlyNumberAvailable) {
        box.candidates[onlyNumberAvailable].isChosen = true;
        box.candidates[onlyNumberAvailable].chosenReason = 'Only candidate left for this box';
        box.peerBoxes.forEach((pb) => {
            const candidate = pb.candidates[onlyNumberAvailable];
            candidate.isDiscarded = true;
            candidate.discardedReason = 'Only candidate left for a peer box';
        });
    }
};

export const discardCandidatesCausedByLocks = (lockedBoxes: Box[]) => {
    lockedBoxes.forEach((lockedBox) => {
        lockedBox.peerBoxes
            .filter((peerBox) => !peerBox.isLocked)
            .forEach((peerBox) => {
                peerBox.candidates[lockedBox.number!].isDiscarded = true;
                peerBox.candidates[lockedBox.number!].discardedReason = 'Locked peer box';
            });
    });
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
                        !box.candidates[number].isDiscarded
                );
                groupBoxesOutsideRegion.forEach((box) => {
                    const candidate = box.candidates[number];
                    candidate.isDiscarded = true;
                    candidate.discardedReason = 'Region subset';
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
                        !candidate.isDiscarded
                )
                .forEach((candidate) => {
                    candidate.isDiscarded = true;
                    candidate.discardedReason = 'Owned candidate in a group';
                });
        });
    });
};

export const doesBoxHaveAChosenCandidate = (box: Box) =>
    Object.values(box.candidates).some((c) => c.isChosen);

export const doesBoxHaveAllCandidatesDiscardedButOne = (box: Box) =>
    Object.values(box.candidates).filter((candidate) => !candidate.isDiscarded).length === 1;

export const doesGroupHaveABoxWithoutCandidates = (group: Group) =>
    group.boxes.some((box) => isBoxOutOfCandidates(box));

export const doesGroupHaveTwoLockedBoxesWithSameNumber = (group: Group) => {
    const lockedBoxesNumbersOccurrences = group.boxes
        .filter((box) => box.isLocked)
        .reduce<NumericDictionary<number>>((reduced, lockedBox) => {
            return { ...reduced, [lockedBox.number!]: (reduced[lockedBox.number!] || 0) + 1 };
        }, {});

    return Object.values(lockedBoxesNumbersOccurrences).some(
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
                        !candidate.isDiscarded
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
                            !box.candidates[number].isDiscarded
                    )
                );
            });
    });
};

export const isBoxOutOfCandidates = (box: Box) =>
    !Object.values(box.candidates).some((candidate) => !candidate.isDiscarded);

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
