import {
    Box,
    BoxesNumbersGroupRestriction,
    BoxGroups,
    Candidate,
    Group,
    NumberAvailableBoxes,
    NumericDictionary,
    StringDictionary,
    Sudoku,
    SudokuGroups
} from '../types/sudoku';

export const arePeerBoxes = (a: Box, b: Box) => {
    return a.column === b.column || a.region === b.region || a.row === b.row;
};

const discardByBoxesNumbersGroupRestriction = (box: Box, numbers: number[]) => {
    box.candidates
        .filter(
            (candidate) => isValidCandidate(candidate) && numbers.indexOf(candidate.number) === -1
        )
        .forEach((candidate) => {
            candidate.isDiscardedByBoxesNumbersGroupRestriction = true;
        });
};

export const discardInferableCandidates = (boxes: Box[], groups: SudokuGroups) => {
    for (;;) {
        for (;;) {
            const unnoticedSingleCandidateBoxes = getUnnoticedSingleCandidateBoxes(boxes);
            if (unnoticedSingleCandidateBoxes.length === 0) {
                break;
            }
            unnoticedSingleCandidateBoxes.forEach(setBoxSingleCandidate);
            console.log('End of single candidates inferring round');
        }

        inferByGroup(groups.columns);
        inferByGroup(groups.regions);
        inferByGroup(groups.rows);
        console.log('End of group candidates inferring round');

        const unnoticedSingleCandidateBoxes = getUnnoticedSingleCandidateBoxes(boxes);
        if (unnoticedSingleCandidateBoxes.length === 0) {
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
        (candidate) => candidate.isBoxSingleCandidate || candidate.isGroupSingleCandidate
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
                            isBoxSingleCandidate: false,
                            isDiscardedByBoxesNumbersGroupRestriction: false,
                            isDiscardedByBoxSingleCandidateInPeerBox: false,
                            isDiscardedByGroupSingleCandidateInSameBox: false,
                            isGroupSingleCandidate: false,
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

export const getNextBoxes = (boxes: Box[], selectedBox: Box, selectedNumber: number) =>
    boxes.map(
        (box): Box => {
            if (box.isLocked) {
                return box;
            } else if (box === selectedBox) {
                return getNextBoxLocked(box, selectedNumber);
            } else {
                return getNextBoxOpened(box, selectedBox, selectedNumber);
            }
        }
    );

export const getNextBoxLocked = (currentBox: Box, selectedNumber: number) => ({
    candidates: currentBox.candidates.map(
        (candidate): Candidate => ({
            impact: -1,
            impactWithoutInferring: -1,
            isBoxSingleCandidate: true,
            isDiscardedByBoxesNumbersGroupRestriction: false,
            isDiscardedByBoxSingleCandidateInPeerBox: false,
            isDiscardedByGroupSingleCandidateInSameBox: false,
            isGroupSingleCandidate: true,
            isValid: candidate.number === selectedNumber,
            number: candidate.number
        })
    ),
    column: currentBox.column,
    isLocked: true,
    maximumImpact: -1,
    peerBoxes: [], // Some peer boxes might not exist here yet
    number: selectedNumber,
    region: currentBox.region,
    row: currentBox.row
});

export const getNextBoxOpened = (currentBox: Box, selectedBox: Box, selectedNumber: number) => {
    const isPeerBox = arePeerBoxes(currentBox, selectedBox);
    const nextCandidates = currentBox.candidates.map(
        (candidate): Candidate => ({
            impact: -2,
            impactWithoutInferring: -2,
            isBoxSingleCandidate: false,
            isDiscardedByBoxesNumbersGroupRestriction: false,
            isDiscardedByBoxSingleCandidateInPeerBox: false,
            isDiscardedByGroupSingleCandidateInSameBox: false,
            isGroupSingleCandidate: false,
            isValid: candidate.isValid && (!isPeerBox || candidate.number !== selectedNumber),
            number: candidate.number
        })
    );

    return {
        candidates: nextCandidates,
        column: currentBox.column,
        isLocked: false,
        peerBoxes: [], // Some peer boxes might not exist here yet
        maximumImpact: -2,
        region: currentBox.region,
        row: currentBox.row
    };
};

export const getNumbersAvailableBoxes = (boxes: Box[]): NumericDictionary<NumberAvailableBoxes> => {
    const numbersAvailableBoxes: NumericDictionary<NumberAvailableBoxes> = {};
    boxes
        .filter((box) => !box.isLocked)
        .forEach((box) => {
            box.candidates
                .filter((candidate) => isValidCandidate(candidate))
                .forEach((candidate) => {
                    numbersAvailableBoxes[candidate.number] = numbersAvailableBoxes[
                        candidate.number
                    ] || {
                        boxes: []
                    };
                    numbersAvailableBoxes[candidate.number].boxes.push(box);
                });
        });
    Object.values(numbersAvailableBoxes).forEach((numberAvailableBoxes) => {
        numberAvailableBoxes.boxesCoordinates = numberAvailableBoxes.boxes
            .map((box) => box.row + '-' + box.column)
            .join();
    });
    return numbersAvailableBoxes;
};

export const getRandomElement = <T>(array: T[]) =>
    array[Math.round(Math.random() * (array.length - 1))];

export const getSerializableSudoku = (sudoku: Sudoku): Sudoku => ({
    ...sudoku,
    boxes: sudoku.boxes.map((box) => ({
        ...box,
        peerBoxes: [] // Would cause cyclic dependencies
    })),
    groups: {
        // Would cause cyclic dependencies
        columns: {},
        regions: {},
        rows: {}
    }
});

export const getUnnoticedSingleCandidateBoxes = (boxes: Box[]) =>
    boxes.filter(
        (box) =>
            !box.isLocked &&
            box.candidates.filter((candidate) => isValidCandidate(candidate)).length === 1 &&
            box.candidates.filter((candidate) => candidate.isBoxSingleCandidate).length === 0
    );

export const inferByGroup = (groups: NumericDictionary<Group>) => {
    Object.values(groups).forEach((group) => {
        const numbersAvailableBoxes = getNumbersAvailableBoxes(group.boxes);

        Object.keys(numbersAvailableBoxes)
            .map((numberKey) => parseInt(numberKey))
            .filter((number) => numbersAvailableBoxes[number].boxes.length === 1)
            .forEach((number) => {
                const box = numbersAvailableBoxes[number].boxes[0];
                setGroupSingleCandidate(box, number);
            });

        // If two numbers can only be placed in the same two boxes, discard other candidates for that boxes
        const boxesWithSameNumbers = Object.keys(numbersAvailableBoxes)
            .map((numberKey) => parseInt(numberKey))
            .reduce<StringDictionary<BoxesNumbersGroupRestriction>>((reduced, number) => {
                const boxesCoordinates = numbersAvailableBoxes[number].boxesCoordinates;
                reduced[boxesCoordinates] = reduced[boxesCoordinates] || {
                    numbers: [],
                    boxes: numbersAvailableBoxes[number].boxes
                };
                reduced[boxesCoordinates].numbers.push(number);
                return reduced;
            }, {});
        Object.values(boxesWithSameNumbers)
            .filter((x) => x.boxes.length === x.numbers.length)
            .forEach((x) => {
                x.boxes.forEach((box) => discardByBoxesNumbersGroupRestriction(box, x.numbers));
            });

        // TODO If two boxes have only the same two numbers, remove those numbers from other peer boxes

        group.isValid =
            // Group is valid if all boxes have at least a potential candidate
            group.boxes.find((box) => !isValidBox(box)) === undefined &&
            // and if all numbers have at least a potential box
            Object.values(numbersAvailableBoxes).reduce(
                (reduced, numberAvailableBoxes) => reduced && numberAvailableBoxes.boxes.length > 0,
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

export const isInferableBox = (box: Box) =>
    !box.isLocked &&
    (box.candidates.find((candidate) => candidate.isGroupSingleCandidate) ||
        box.candidates.find((candidate) => candidate.isBoxSingleCandidate));

export const isValidBox = (box: Box, useCandidateInferring = true) =>
    box.candidates.find((candidate) => isValidCandidate(candidate, useCandidateInferring)) !==
    undefined;

export const isValidCandidate = (candidate: Candidate, useCandidateInferring = true) =>
    candidate.isValid &&
    (!useCandidateInferring ||
        (!candidate.isDiscardedByBoxSingleCandidateInPeerBox &&
            !candidate.isDiscardedByGroupSingleCandidateInSameBox &&
            !candidate.isDiscardedByBoxesNumbersGroupRestriction));

export const lockBox = (sudoku: Sudoku, selectedBox: Box, selectedNumber: number): Sudoku => {
    const nextBoxes = getNextBoxes(sudoku.boxes, selectedBox, selectedNumber);
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

export const rehydrateSudoku = (serializedSudoku: Sudoku) => {
    serializedSudoku.groups = getGroups(serializedSudoku.boxes);
    serializedSudoku.boxes.forEach((box) => {
        box.peerBoxes = getBoxPeers(serializedSudoku.groups, box);
    });
};

export const setBoxSingleCandidate = (box: Box) => {
    const singleCandidateIndex = box.candidates.findIndex((candidate) =>
        isValidCandidate(candidate)
    );
    console.log(
        'Setting candidate',
        box.candidates[singleCandidateIndex].number,
        'in box',
        box.row,
        box.column
    );
    box.candidates[singleCandidateIndex].isBoxSingleCandidate = true;
    box.peerBoxes
        .filter(
            (peerBox) =>
                !peerBox.isLocked && isValidCandidate(peerBox.candidates[singleCandidateIndex])
        )
        .forEach((peerBox) => {
            peerBox.candidates[
                singleCandidateIndex
            ].isDiscardedByBoxSingleCandidateInPeerBox = true;
        });
};

export const setCandidateImpact = (box: Box, candidateIndex: number) => {
    const candidate = box.candidates[candidateIndex];
    candidate.impact = isValidCandidate(candidate)
        ? box.peerBoxes.filter(
              (peerBox) => !peerBox.isLocked && isValidCandidate(peerBox.candidates[candidateIndex])
          ).length
        : -1;

    candidate.impactWithoutInferring = isValidCandidate(candidate, false)
        ? box.peerBoxes.filter(
              (peerBox) =>
                  !peerBox.isLocked && isValidCandidate(peerBox.candidates[candidateIndex], false)
          ).length
        : -1;
};

export const setGroupSingleCandidate = (box: Box, number: number) => {
    const candidateIndex = box.candidates.findIndex((candidate) => candidate.number === number);
    box.candidates.forEach((candidate, currentCandidateIndex) => {
        if (isValidCandidate(candidate)) {
            if (currentCandidateIndex === candidateIndex) {
                box.candidates[currentCandidateIndex].isGroupSingleCandidate = true;
            } else {
                box.candidates[
                    currentCandidateIndex
                ].isDiscardedByGroupSingleCandidateInSameBox = true;
            }
        }
    });
    box.peerBoxes
        .filter(
            (peerBox) => !peerBox.isLocked && isValidCandidate(peerBox.candidates[candidateIndex])
        )
        .forEach((peerBox) => {
            peerBox.candidates[candidateIndex].isDiscardedByBoxSingleCandidateInPeerBox = true;
        });
};
