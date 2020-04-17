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
            (candidate) =>
                !isDiscardedCandidate(candidate) && numbers.indexOf(candidate.number) === -1
        )
        .forEach((candidate) => {
            candidate.isDiscardedByBoxesNumbersGroupRestriction = true;
        });
};

export const discardByBoxSingleCandidate = (box: Box) => {
    const singleCandidateIndex = box.candidates.findIndex(
        (candidate) => !isDiscardedCandidate(candidate)
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
                !peerBox.isLocked && !isDiscardedCandidate(peerBox.candidates[singleCandidateIndex])
        )
        .forEach((peerBox) => {
            peerBox.candidates[
                singleCandidateIndex
            ].isDiscardedByBoxSingleCandidateInPeerBox = true;
        });
};

export const discardByGroup = (groups: NumericDictionary<Group>) => {
    Object.values(groups).forEach((group) => {
        const numbersAvailableBoxes = getNumbersAvailableBoxes(group.boxes);

        Object.keys(numbersAvailableBoxes)
            .map((numberKey) => parseInt(numberKey))
            .filter((number) => numbersAvailableBoxes[number].boxes.length === 1)
            .forEach((number) => {
                const box = numbersAvailableBoxes[number].boxes[0];
                discardByGroupSingleCandidate(box, number);
            });

        // TODO If a number must be placed in a subset of a row or column for a given region, remove the numbers from the rest of the rows or regions

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
            group.boxes.find((box) => hasBoxAPotentialCandidate(box)) !== undefined &&
            // TODO Remove: if following would happen, some of the boxes would not have a potential candidate
            Object.values(numbersAvailableBoxes).reduce(
                (reduced, numberAvailableBoxes) => reduced && numberAvailableBoxes.boxes.length > 0,
                true
            );
    });
};

export const discardByGroupSingleCandidate = (box: Box, number: number) => {
    const candidateIndex = box.candidates.findIndex((candidate) => candidate.number === number);
    box.candidates.forEach((candidate, currentCandidateIndex) => {
        if (!isDiscardedCandidate(candidate)) {
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
            (peerBox) =>
                !peerBox.isLocked && !isDiscardedCandidate(peerBox.candidates[candidateIndex])
        )
        .forEach((peerBox) => {
            peerBox.candidates[candidateIndex].isDiscardedByBoxSingleCandidateInPeerBox = true;
        });
};

export const discardCandidates = (boxes: Box[], groups: SudokuGroups) => {
    for (;;) {
        for (;;) {
            const unnoticedSingleCandidateBoxes = getUnnoticedSingleCandidateBoxes(boxes);
            if (unnoticedSingleCandidateBoxes.length === 0) {
                break;
            }
            unnoticedSingleCandidateBoxes.forEach(discardByBoxSingleCandidate);
            console.log('End of single candidates discard round');
        }

        discardByGroup(groups.columns);
        discardByGroup(groups.regions);
        discardByGroup(groups.rows);
        console.log('End of group candidates discard round');

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
                            impactWithoutDiscards: initialImpact,
                            isBoxSingleCandidate: false,
                            isDiscardedByBoxesNumbersGroupRestriction: false,
                            isDiscardedByBoxSingleCandidateInPeerBox: false,
                            isDiscardedByGroupSingleCandidateInSameBox: false,
                            isDiscardedByLock: false,
                            isGroupSingleCandidate: false,
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

export const getNextLockedBox = (currentBox: Box, selectedNumber: number) => {
    const nextCandidates = currentBox.candidates.map(
        (candidate): Candidate => ({
            // TODO The impact of the candidate needs to be computed actually
            impact: -1,
            impactWithoutDiscards: -1,
            isBoxSingleCandidate: true,
            isDiscardedByBoxesNumbersGroupRestriction: false,
            isDiscardedByBoxSingleCandidateInPeerBox: false,
            isDiscardedByGroupSingleCandidateInSameBox: false,
            isDiscardedByLock: candidate.number !== selectedNumber,
            isGroupSingleCandidate: true,
            number: candidate.number
        })
    );

    return {
        candidates: nextCandidates,
        column: currentBox.column,
        isLocked: true,
        maximumImpact: -1,
        peerBoxes: [], // Some peer boxes might not exist here yet
        number: selectedNumber,
        region: currentBox.region,
        row: currentBox.row
    };
};

export const getNextOpenBox = (currentBox: Box, selectedBox: Box, selectedNumber: number) => {
    const isPeerBox = arePeerBoxes(currentBox, selectedBox);
    const nextCandidates = currentBox.candidates.map(
        (candidate): Candidate => ({
            impact: -2,
            impactWithoutDiscards: -2,
            isBoxSingleCandidate: false,
            isDiscardedByBoxesNumbersGroupRestriction: false,
            isDiscardedByBoxSingleCandidateInPeerBox: false,
            isDiscardedByGroupSingleCandidateInSameBox: false,
            isDiscardedByLock:
                candidate.isDiscardedByLock || (isPeerBox && candidate.number === selectedNumber),
            isGroupSingleCandidate: false,
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
                .filter((candidate) => !isDiscardedCandidate(candidate))
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
            // TODO They should not always be marked as box single candidate
            box.candidates.filter((candidate) => !isDiscardedCandidate(candidate)).length === 1 &&
            box.candidates.filter((candidate) => candidate.isBoxSingleCandidate).length === 0
    );

export const getUpdatedSudoku = (sudoku: Sudoku, nextBoxes: Box[]): Sudoku => {
    const nextGroup = getGroups(nextBoxes);

    nextBoxes.forEach((nextBox) => {
        nextBox.peerBoxes = getBoxPeers(nextGroup, nextBox);
    });

    discardCandidates(nextBoxes, nextGroup);

    // Update candidates impact after discarding
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
        (reduced, box) => Math.max(reduced, box.maximumImpact),
        0
    );

    return {
        boxes: nextBoxes,
        groups: nextGroup,
        maximumImpact: sudokuMaximumImpact,
        regionSize: sudoku.regionSize,
        size: sudoku.size
    };
};

export const hasBoxAPotentialCandidate = (box: Box) =>
    box.candidates.find((candidate) => !isDiscardedCandidate(candidate)) !== undefined;

export const isBoxColumnInvalid = (sudoku: Sudoku, box: Box) =>
    !sudoku.groups.columns[box.column].isValid;

export const isBoxRegionInvalid = (sudoku: Sudoku, box: Box) =>
    !sudoku.groups.regions[box.region].isValid;

export const isBoxRowInvalid = (sudoku: Sudoku, box: Box) => !sudoku.groups.rows[box.row].isValid;

export const isDiscardedCandidate = (candidate: Candidate) =>
    candidate.isDiscardedByLock ||
    candidate.isDiscardedByBoxSingleCandidateInPeerBox ||
    candidate.isDiscardedByGroupSingleCandidateInSameBox ||
    candidate.isDiscardedByBoxesNumbersGroupRestriction;

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
    return getUpdatedSudoku(sudoku, boxesAfterLock);
};

export const rehydrateSudoku = (serializedSudoku: Sudoku): Sudoku =>
    getUpdatedSudoku(serializedSudoku, serializedSudoku.boxes);

export const setCandidateImpact = (box: Box, candidateIndex: number) => {
    const candidate = box.candidates[candidateIndex];
    candidate.impact = isDiscardedCandidate(candidate)
        ? -1
        : box.peerBoxes.filter(
              (peerBox) =>
                  !peerBox.isLocked && !isDiscardedCandidate(peerBox.candidates[candidateIndex])
          ).length;

    candidate.impactWithoutDiscards = box.peerBoxes.filter((peerBox) => !peerBox.isLocked).length;
};
