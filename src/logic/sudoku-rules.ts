import { Box, Candidate, Group, NumericDictionary, SudokuComputedData } from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const discardCandidatesCausedByLocks = (lockedBoxes: Box[]) => {
    // At this point, there are no inferred nor discarded candidates
    lockedBoxes.forEach((lockedBox) => {
        lockedBox.peerBoxes
            .filter((peerBox) => !peerBox.isLocked)
            .forEach((peerBox) => {
                peerBox.candidates[lockedBox.number!].discardRound = 1;
                peerBox.candidates[lockedBox.number!].discardReason = 'Locked peer box';
                registerDiscardCause(lockedBox.causedDiscards, lockedBox.number!, peerBox.id, 1);
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
                        !isCandidateDiscarded(box.candidates[number])
                );
                groupBoxesOutsideRegion.forEach((box) => {
                    const candidate = box.candidates[number];
                    candidate.discardRound = iterationNumber;
                    candidate.discardReason = 'Region subset';

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
                        !isCandidateDiscarded(candidate)
                )
                .forEach((candidate) => {
                    candidate.discardRound = iterationNumber;
                    candidate.discardReason = 'Owned candidate in a group';

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

export const doesBoxHaveAllCandidatesDiscardedButOne = (box: Box) =>
    Object.values(box.candidates).filter((candidate) => !isCandidateDiscarded(candidate)).length ===
    1;

export const doesBoxHaveAnInferredCandidate = (box: Box, maxIterations?: number) =>
    Object.values(box.candidates).some((candidate) =>
        isCandidateInferred(candidate, maxIterations)
    );

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
            !doesBoxHaveAnInferredCandidate(box) &&
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
                    !isCandidateInferred(firstBox.candidates[number])
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

export const getRoundForWhichGroupHasABoxWithoutCandidates = (group: Group) => {
    const boxesWithoutCandidates = group.boxes.filter((box) =>
        Object.values(box.candidates).every((candidate) => isCandidateDiscarded(candidate))
    );

    const soonerDiscardedCandidates = boxesWithoutCandidates.map((box) =>
        Object.values(box.candidates).reduce(
            (reduced, candidate) => Math.max(candidate.discardRound, reduced),
            -1
        )
    );

    return soonerDiscardedCandidates.length === 0
        ? 0
        : soonerDiscardedCandidates.reduce(
              (reduced, candidate) => Math.max(candidate, reduced),
              -1
          );
};

export const inferOnlyBoxAvailableInGroupForNumber = (group: Group, iterationNumber: number) => {
    const numbersWithOnlyOneBoxLeft = Object.keys(group.availableBoxesPerNumber)
        .map((number) => parseInt(number))
        .filter((number) => {
            const boxesPerNumber = group.availableBoxesPerNumber[number];
            return (
                boxesPerNumber.length === 1 &&
                !boxesPerNumber[0].isLocked &&
                !isCandidateInferred(boxesPerNumber[0].candidates[number])
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
                candidate.inferRound = iterationNumber;
                candidate.inferReason = 'This box must hold this number for a group';
            } else if (!isCandidateDiscarded(candidate)) {
                candidate.discardRound = iterationNumber + 1;
                candidate.discardReason = 'This box must hold another number for some group';
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
                    !isCandidateDiscarded(pb.candidates[number]) &&
                    !isCandidateInferred(pb.candidates[number])
            )
            .forEach((peerBox) => {
                const candidate = peerBox.candidates[number];
                candidate.discardRound = iterationNumber;
                candidate.discardReason = 'Peer box must hold this number for some group';
                registerDiscardCause(targetBox.causedDiscards, number, peerBox.id, iterationNumber);
            });
    });
};

export const inferOnlyCandidateAvailableForBox = (box: Box, iterationNumber: number) => {
    const onlyNumberAvailable = Object.keys(box.candidates)
        .map((number) => parseInt(number))
        .find(
            (number) =>
                !box.isLocked &&
                !isCandidateDiscarded(box.candidates[number]) &&
                !isCandidateInferred(box.candidates[number])
        );

    if (onlyNumberAvailable) {
        box.candidates[onlyNumberAvailable].inferRound = iterationNumber;
        box.candidates[onlyNumberAvailable].inferReason = 'Only candidate left for this box';
        registerChoiceCause(box.causedChoices, onlyNumberAvailable, box.id, iterationNumber);

        box.peerBoxes
            .filter(
                (pb) => !pb.isLocked && !isCandidateDiscarded(pb.candidates[onlyNumberAvailable])
            )
            .forEach((pb) => {
                const candidate = pb.candidates[onlyNumberAvailable];
                candidate.discardRound = iterationNumber + 1;
                candidate.discardReason = 'Only candidate left for a peer box';

                registerDiscardCause(
                    box.causedDiscards,
                    onlyNumberAvailable,
                    pb.id,
                    iterationNumber + 1
                );
            });
    }
};

export const isCandidateInferred = (candidate: Candidate, maxIterations?: number) =>
    candidate.inferRound > 0 &&
    (maxIterations === undefined || candidate.inferRound <= maxIterations);

export const isCandidateDiscarded = (candidate: Candidate, maxIterations?: number) =>
    candidate.discardRound > 0 &&
    (maxIterations === undefined || candidate.discardRound <= maxIterations);

export const isGroupInvalid = (group: Group, maxIterations?: number) =>
    group.validRounds > 0 && (maxIterations === undefined || group.validRounds <= maxIterations);

export const isSudokuReadyToBeSolved = (sudokuComputedData: SudokuComputedData) =>
    sudokuComputedData.boxes.every(
        (box) =>
            box.isLocked ||
            Object.values(box.candidates).some((candidate) => isCandidateInferred(candidate))
    );

export const isSudokuValid = (sudokuComputedData: SudokuComputedData, maxIterations?: number) => {
    const groups = Object.values(sudokuComputedData.groups.columns)
        .concat(Object.values(sudokuComputedData.groups.regions))
        .concat(Object.values(sudokuComputedData.groups.rows));

    return groups.every((g) => !isGroupInvalid(g, maxIterations));
};

export const registerChoiceCause = (
    causedChoices: NumericDictionary<NumericDictionary<number>>,
    inferredNumber: number,
    boxId: number,
    iterationNumber: number
) => {
    if (causedChoices[inferredNumber] === undefined) {
        causedChoices[inferredNumber] = {};
    }
    causedChoices[inferredNumber][boxId] = iterationNumber;
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
