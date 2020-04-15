import {
    Box,
    BoxGroups,
    Candidate,
    Dictionary,
    Group,
    Sudoku,
    SudokuGroups
} from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

export const discardInferableCandidates = (boxes: Box[], groups: SudokuGroups) => {
    for (;;) {
        // TODO Discard candidates recursively

        for (;;) {
            let nonMarkedSingleCandidateBoxes = getNonMarkedSingleCandidateBoxes(boxes);
            if (nonMarkedSingleCandidateBoxes.length === 0) {
                break;
            }
            nonMarkedSingleCandidateBoxes.forEach(setBoxSingleCandidate);
        }

        inferByGroup(groups.columns);
        inferByGroup(groups.regions);
        inferByGroup(groups.rows);

        let nonMarkedSingleCandidateBoxes = getNonMarkedSingleCandidateBoxes(boxes);
        if (nonMarkedSingleCandidateBoxes.length === 0) {
            break;
        }
    }
};

export const getBoxGroups = (sudokuGroups: SudokuGroups, box: Box): BoxGroups => {
    return {
        column: sudokuGroups.columns[box.column],
        region: sudokuGroups.regions[box.region],
        row: sudokuGroups.rows[box.row]
    };
};

export const getBoxInferredNumber = (box: Box) =>
    box.candidates.find(
        (candidate) => candidate.isSingleCandidateForBox || candidate.isSingleCandidateForGroup
    )?.number;

export const getBoxPeers = (sudokuGroups: SudokuGroups, box: Box): Box[] => {
    const boxGroups = getBoxGroups(sudokuGroups, box);
    return boxGroups.column.boxes
        .filter((peerBox) => peerBox !== box)
        .concat(boxGroups.row.boxes.filter((peerBox) => peerBox !== box))
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
                            impactWithoutInferring: initialImpact,
                            isSingleCandidateForBox: false,
                            isSingleCandidateForBoxInBoxPeer: false,
                            isSingleCandidateForGroup: false,
                            isSingleCandidateForGroupInBoxPeer: false,
                            isValid: true,
                            number: candidateIndex + 1
                        })
                    ),
                    column: columnIndex,
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

const getNonMarkedSingleCandidateBoxes = (boxes: Box[]) => {
    return boxes.filter(
        (box) =>
            !box.isLocked &&
            box.candidates.filter((candidate) => isValidCandidate(candidate)).length === 1 &&
            box.candidates.filter((candidate) => candidate.isSingleCandidateForBox).length === 0
    );
};

export const getNumbersAvailableBoxes = (boxes: Box[]): Dictionary<Box[]> => {
    const boxesPerNumber: Dictionary<Box[]> = {};
    boxes.forEach((box) => {
        box.candidates.forEach((candidate) => {
            boxesPerNumber[candidate.number] = boxesPerNumber[candidate.number] || [];
            if (isValidCandidate(candidate)) {
                boxesPerNumber[candidate.number].push(box);
            }
        });
    });
    return boxesPerNumber;
};

export const getRandomElement = <T>(array: T[]) =>
    array[Math.round(Math.random() * (array.length - 1))];

export const inferByGroup = (groups: Dictionary<Group>) => {
    Object.values(groups).forEach((group) => {
        const boxesPerNumber = getNumbersAvailableBoxes(group.boxes);

        Object.keys(boxesPerNumber)
            .map((boxesKey) => parseInt(boxesKey))
            .filter(
                (boxesKey) =>
                    boxesPerNumber[boxesKey].length === 1 && !boxesPerNumber[boxesKey][0].isLocked
            )
            .forEach((boxesKey) => {
                const box = boxesPerNumber[boxesKey][0];
                setGroupSingleCandidate(box, boxesKey);
            });

        // TODO If two numbers fight for the same two boxes (i.e. no other boxes are valid for those numbers), remove other numbers for that boxes
        // Object.keys(boxesPerNumber)
        //     .map((boxesKey) => parseInt(boxesKey))
        //     .filter((boxesKey) => boxesPerNumber[boxesKey].length === 2);

        // TODO If two boxes have only the same two numbers, remove those numbers from other boxes

        group.isValid =
            // Group is valid if all boxes have at least a potential candidate
            group.boxes.find((box) => !isValidBox(box)) === undefined &&
            // and if all candidates have at least a potential box
            Object.values(boxesPerNumber).reduce(
                (reduced, boxes) => reduced && boxes.length > 0,
                true
            );
    });
};

export const isBoxInInvalidGroup = (sudoku: Sudoku, box: Box) => {
    const isInvalidColumn = !sudoku.groups.columns[box.column].isValid;
    const isInvalidRegion = !sudoku.groups.regions[box.region].isValid;
    const isInvalidRow = !sudoku.groups.rows[box.row].isValid;

    return isInvalidColumn || isInvalidRegion || isInvalidRow;
};

export const isBoxWithGroupSingleCandidate = (box: Box) =>
    box.candidates.find((candidate) => candidate.isSingleCandidateForGroup);

export const isBoxWithSingleCandidate = (box: Box) =>
    box.candidates.find((candidate) => candidate.isSingleCandidateForBox);

export const isInferableBox = (box: Box) =>
    !box.isLocked && (isBoxWithSingleCandidate(box) || isBoxWithGroupSingleCandidate(box));

export const isValidBox = (box: Box, useCandidateInferring = true) =>
    box.candidates.find((candidate) => isValidCandidate(candidate, useCandidateInferring)) !==
    undefined;

export const isValidCandidate = (candidate: Candidate, useCandidateInferring = true) =>
    candidate.isValid &&
    (!useCandidateInferring ||
        (!candidate.isSingleCandidateForBoxInBoxPeer &&
            !candidate.isSingleCandidateForGroupInBoxPeer));

export const lockBox = (sudoku: Sudoku, selectedBox: Box, selectedNumber: number): Sudoku => {
    const nextBoxes = sudoku.boxes.map(
        (box): Box => {
            if (box === selectedBox) {
                return {
                    candidates: box.candidates.map(
                        (candidate): Candidate => ({
                            impact: -1,
                            impactWithoutInferring: -1,
                            isSingleCandidateForBox: true,
                            isSingleCandidateForBoxInBoxPeer: false,
                            isSingleCandidateForGroup: true,
                            isSingleCandidateForGroupInBoxPeer: false,
                            isValid: candidate.number === selectedNumber,
                            number: candidate.number
                        })
                    ),
                    column: box.column,
                    isLocked: true,
                    maximumImpact: -1,
                    peerBoxes: [], // Some peer boxes might not exist here yet
                    number: selectedNumber,
                    region: box.region,
                    row: box.row
                };
            } else if (!box.isLocked) {
                const isPeerBox = arePeerBoxes(box, selectedBox);
                const nextCandidates = box.candidates.map(
                    (candidate): Candidate => ({
                        impact: -2, // Invalidate the value. Will be computed below
                        impactWithoutInferring: -2, // Invalidate the value. Will be computed below
                        isSingleCandidateForBox: false, // Invalidate the value. Will be computed below
                        isSingleCandidateForBoxInBoxPeer: false, // Invalidate the value. Will be computed below
                        isSingleCandidateForGroup: false, // Invalidate the value. Will be computed below
                        isSingleCandidateForGroupInBoxPeer: false, // Invalidate the value. Will be computed below
                        isValid:
                            candidate.isValid &&
                            (!isPeerBox || candidate.number !== selectedNumber),
                        number: candidate.number
                    })
                );

                return {
                    candidates: nextCandidates,
                    column: box.column,
                    isLocked: false,
                    peerBoxes: [], // Some peer boxes might not exist here yet
                    maximumImpact: -2, // Invalidate the value. Will be computed below
                    region: box.region,
                    row: box.row
                };
            } else {
                return box;
            }
        }
    );
    const nextGroups = getGroups(nextBoxes);
    nextBoxes.forEach((nextBox) => {
        nextBox.peerBoxes = getBoxPeers(nextGroups, nextBox);
    });

    discardInferableCandidates(nextBoxes, nextGroups);

    // Update candidates impact after discarding candidates based on inferring
    nextBoxes.forEach((nextBox) => {
        nextBox.candidates.forEach((_candidate, candidateIndex) => {
            setCandidateImpact(nextBox, candidateIndex);
        });

        nextBox.maximumImpact = nextBox.candidates.reduce(
            (reduced, candidate) => Math.max(reduced, candidate.impact),
            0
        );
    });

    const sudokuMaximumImpact = nextBoxes.reduce(
        (reduced, nextBox) => Math.max(reduced, nextBox.maximumImpact),
        0
    );

    return {
        boxes: nextBoxes,
        groups: nextGroups,
        maximumImpact: sudokuMaximumImpact,
        regionSize: sudoku.regionSize,
        size: sudoku.size
    };
};

export const setBoxSingleCandidate = (box: Box) => {
    const singleCandidateIndex = box.candidates.findIndex((candidate) => candidate.isValid);
    box.candidates[singleCandidateIndex].isSingleCandidateForBox = true;
    box.peerBoxes
        .filter((peerBox) => !peerBox.isLocked)
        .forEach((peerBox) => {
            peerBox.candidates[singleCandidateIndex].isSingleCandidateForBoxInBoxPeer = true;
            // Peer box might now have a single valid candidate; instead of processing it here
            // it will be done in discardInferableCandidates
        });
};

export const setCandidateImpact = (box: Box, candidateIndex: number) => {
    const candidate = box.candidates[candidateIndex];
    candidate.impact = isValidCandidate(candidate)
        ? box.peerBoxes.filter(
              (peerBox) => !peerBox.isLocked && isValidCandidate(peerBox.candidates[candidateIndex])
          ).length
        : -1;

    candidate.impactWithoutInferring = candidate.isValid
        ? box.peerBoxes.filter(
              (peerBox) => !peerBox.isLocked && peerBox.candidates[candidateIndex].isValid
          ).length
        : -1;
};

export const setGroupSingleCandidate = (box: Box, number: number) => {
    const candidateIndex = box.candidates.findIndex((candidate) => candidate.number === number);
    box.candidates[candidateIndex].isSingleCandidateForGroup = true;
    box.peerBoxes.forEach((peerBox) => {
        peerBox.candidates[candidateIndex].isSingleCandidateForGroupInBoxPeer = true;
        // Peer box might now have a single valid candidate; instead of processing it here
        // it will be done in discardInferableCandidates
    });
};
