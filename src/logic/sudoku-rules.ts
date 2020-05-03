import { Box, Candidate, Group, NumericDictionary, SudokuComputedData } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const choseOnlyBoxAvailableInGroupForNumber = (group: Group, iterationNumber: number) => {
    const numbersWithOnlyOneBoxLeft = Object.keys(group.availableBoxesPerNumber)
        .map((number) => parseInt(number))
        .filter((number) => {
            const boxesPerNumber = group.availableBoxesPerNumber[number];
            return (
                boxesPerNumber.length === 1 &&
                !boxesPerNumber[0].isLocked &&
                !isChosenCandidate(boxesPerNumber[0].candidates[number])
            );
        });

    numbersWithOnlyOneBoxLeft.forEach((number) => {
        const targetBox = group.availableBoxesPerNumber[number][0];

        group.boxes
            .filter((box) => box !== targetBox)
            .forEach((box) => {
                registerChoiceCause(box.causedChoices, number, targetBox.id, iterationNumber);
            });

        Object.values(targetBox.candidates).forEach((candidate) => {
            if (candidate === targetBox.candidates[number]) {
                candidate.isChosen = iterationNumber;
                candidate.chosenReason = 'This box must hold this number for a group';
            } else if (!isDiscardedCandidate(candidate)) {
                candidate.isDiscarded = iterationNumber + 1;
                candidate.discardedReason = 'This box must hold another number for some group';
                registerDiscardCause(
                    targetBox.causedDiscards,
                    candidate.number,
                    targetBox.id,
                    iterationNumber + 1
                );
            }
        });

        targetBox.peerBoxes
            .filter(
                (pb) =>
                    !pb.isLocked &&
                    !isDiscardedCandidate(pb.candidates[number]) &&
                    !isChosenCandidate(pb.candidates[number])
            )
            .forEach((peerBox) => {
                const candidate = peerBox.candidates[number];
                candidate.isDiscarded = iterationNumber;
                candidate.discardedReason = 'Peer box must hold this number for some group';
                registerDiscardCause(targetBox.causedDiscards, number, peerBox.id, iterationNumber);
            });
    });
};

export const choseOnlyCandidateAvailableForBox = (box: Box, iterationNumber: number) => {
    const onlyNumberAvailable = Object.keys(box.candidates)
        .map((number) => parseInt(number))
        .find(
            (number) =>
                !box.isLocked &&
                !isDiscardedCandidate(box.candidates[number]) &&
                !isChosenCandidate(box.candidates[number])
        );

    if (onlyNumberAvailable) {
        box.candidates[onlyNumberAvailable].isChosen = iterationNumber;
        box.candidates[onlyNumberAvailable].chosenReason = 'Only candidate left for this box';
        registerChoiceCause(box.causedChoices, onlyNumberAvailable, box.id, iterationNumber);

        box.peerBoxes
            .filter(
                (pb) => !pb.isLocked && !isDiscardedCandidate(pb.candidates[onlyNumberAvailable])
            )
            .forEach((pb) => {
                const candidate = pb.candidates[onlyNumberAvailable];
                candidate.isDiscarded = iterationNumber + 1;
                candidate.discardedReason = 'Only candidate left for a peer box';

                registerDiscardCause(
                    box.causedDiscards,
                    onlyNumberAvailable,
                    pb.id,
                    iterationNumber + 1
                );
            });
    }
};

export const discardCandidatesCausedByLocks = (lockedBoxes: Box[]) => {
    // At this point, there are still no candidates chosen or discarded
    lockedBoxes.forEach((lockedBox) => {
        lockedBox.peerBoxes
            .filter((peerBox) => !peerBox.isLocked)
            .forEach((peerBox) => {
                peerBox.candidates[lockedBox.number!].isDiscarded = 0;
                peerBox.candidates[lockedBox.number!].discardedReason = 'Locked peer box';
                registerDiscardCause(lockedBox.causedDiscards, lockedBox.number!, peerBox.id, 0);
            });
    });
};

export const discardCandidatesFromGroupBecauseOfRegionRestriction = (
    regionNumber: number,
    region: Group,
    groupType: 'column' | 'row',
    iterationNumber: number
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
                        !isDiscardedCandidate(box.candidates[number])
                );
                groupBoxesOutsideRegion.forEach((box) => {
                    const candidate = box.candidates[number];
                    candidate.isDiscarded = iterationNumber;
                    candidate.discardedReason = 'Region subset';

                    numberBoxes.forEach((b) => {
                        registerDiscardCause(b.causedDiscards, number, box.id, iterationNumber);
                    });
                });
            }
        });
};

export const discardNonOwnedCandidatesFromOwningBoxes = (group: Group, iterationNumber: number) => {
    group.ownedCandidates.forEach((ownedCandidatesSet) => {
        ownedCandidatesSet.boxes.forEach((ownedBox) => {
            Object.values(ownedBox.candidates)
                .filter(
                    (candidate) =>
                        ownedCandidatesSet.numbers.indexOf(candidate.number) === -1 &&
                        !isDiscardedCandidate(candidate)
                )
                .forEach((candidate) => {
                    candidate.isDiscarded = iterationNumber;
                    candidate.discardedReason = 'Owned candidate in a group';

                    ownedCandidatesSet.boxes.forEach((b) => {
                        registerDiscardCause(
                            b.causedDiscards,
                            candidate.number,
                            ownedBox.id,
                            iterationNumber
                        );
                    });
                });
        });
    });
};

export const doesBoxHaveAChosenCandidate = (box: Box, maxIterations?: number) =>
    Object.values(box.candidates).some((candidate) => isChosenCandidate(candidate, maxIterations));

export const doesBoxHaveAllCandidatesDiscardedButOne = (box: Box) =>
    Object.values(box.candidates).filter((candidate) => !isDiscardedCandidate(candidate)).length ===
    1;

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
                    !isChosenCandidate(firstBox.candidates[number])
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
                        !isDiscardedCandidate(candidate)
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
                            !isDiscardedCandidate(box.candidates[number])
                    )
                );
            });
    });
};

export const isBoxOutOfCandidates = (box: Box) =>
    !Object.values(box.candidates).some((candidate) => !isDiscardedCandidate(candidate));

export const isChosenCandidate = (candidate: Candidate, maxIterations?: number) =>
    candidate.isChosen > 0 && (maxIterations === undefined || candidate.isChosen <= maxIterations);

export const isDiscardedCandidate = (candidate: Candidate, maxIterations?: number) =>
    candidate.isDiscarded > -1 &&
    (maxIterations === undefined || candidate.isDiscarded <= maxIterations);

export const isSudokuReadyToBeSolved = (sudokuComputedData: SudokuComputedData) =>
    !sudokuComputedData.boxes.some(
        (box) =>
            !box.isLocked &&
            !Object.values(box.candidates).some((candidate) => isChosenCandidate(candidate))
    );

export const isSudokuValid = (sudokuComputedData: SudokuComputedData) => {
    const groups = Object.values(sudokuComputedData.groups.columns)
        .concat(Object.values(sudokuComputedData.groups.regions))
        .concat(Object.values(sudokuComputedData.groups.rows));

    return !groups.some((g) => !g.isValid);
};

export const registerChoiceCause = (
    causedChoices: NumericDictionary<NumericDictionary<number>>,
    chosenNumber: number,
    boxId: number,
    iterationNumber: number
) => {
    if (causedChoices[chosenNumber] === undefined) {
        causedChoices[chosenNumber] = {};
    }
    causedChoices[chosenNumber][boxId] = iterationNumber;
};

export const registerDiscardCause = (
    causedDiscards: NumericDictionary<NumericDictionary<number>>,
    discardedNumber: number,
    boxId: number,
    iterationNumber: number
) => {
    if (causedDiscards[discardedNumber] === undefined) {
        causedDiscards[discardedNumber] = {};
    }
    causedDiscards[discardedNumber][boxId] = iterationNumber;
};
