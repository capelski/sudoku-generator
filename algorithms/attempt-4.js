const displaySudoku = (sudoku, displayOptions = {}) => {
	console.log(sudoku.map(row =>
		row.map(box => box.isLocked
			? String(box.candidates[0].number)
			: (box.isInferable && (displayOptions.displayInferredNumbers || displayOptions.displayInferredPropagation))
				? displayOptions.displayInferredNumbers
					? ('=' + box.candidates[0].number)
					: ('*' + box.discardedCandidates.length)
				: ' '
		)
	));
};

const displaySudokuCandidates = (sudoku, displayDiscardedCandidates = false) => {
	sudoku.forEach(row =>
		console.log(row.map(box => box.isLocked ?
			box.candidates[0].number + '!' :
			displayDiscardedCandidates ?
				(box.candidates.concat(box.discardedCandidates)).map(c => c.number).join() :
				box.candidates.map(c => c.number).join()
			)
		)
	);
}

const displaySudokuImpacts = (sudoku, displayMaximumImpactOnly = true) => {
	sudoku.forEach(row => {
		console.log(row.map(box => 
			(box.isLocked || box.isInferable) ?
				0 :
				displayMaximumImpactOnly ?
					box.maximumImpact :
					box.candidates.map(candidate => `${candidate.number}:${candidate.impact}`).join(', ')
		));
	});
};

const getHighestImpactBoxes = (sudoku, maximumImpact) => {
	return sudoku
		.map((row, rowIndex) => {
			return row
				.map((box, columnIndex) => ({
					box,
					columnIndex,
					rowIndex
				}))
				.filter(boxWrapper => boxWrapper.box.maximumImpact === maximumImpact);
		})
		.filter(row => row.length > 0);
};

const getInitialSudoku = (regionSize) => {
	const sudokuSize = regionSize * regionSize;
	const initialImpact = 2 * (sudokuSize - 1) + (regionSize - 1) * (regionSize - 1);
	return [...Array(sudokuSize)].map(_rowIndex => [...Array(sudokuSize)].map(_boxIndex => ({
		candidates: [...Array(sudokuSize)].map((x, i) => ({ number: i + 1, impact: initialImpact })),
		discardedCandidates: [],
		isInferable: false,
		isLocked: false,
		maximumImpact: initialImpact
	})));
};

const getRandomElement = (array) => array[Math.round(Math.random() * (array.length - 1))];

const getSudoku = (regionSize, filledBoxesNumber) => {
	const sudoku = getInitialSudoku(regionSize);

	for (let i = 1; i <= filledBoxesNumber; ++i) {
		console.log(`Iteration ${i} -------------------------`);
		lockHighestImpactBox(sudoku, regionSize);
		console.log('Sudoku at the end of the iteration');
		displaySudoku(sudoku);
	}

	return sudoku;
};

const lockBox = (sudoku, regionSize, rowIndex, columnIndex, chosenCandidate) => {
	const chosenBox = sudoku[rowIndex][columnIndex];
	chosenBox.candidates = [chosenCandidate];
	chosenBox.discardedCandidates = [];
	chosenBox.isLocked = true;
	chosenBox.maximumImpact = -1;

	console.log('Locked box', rowIndex, columnIndex, 'with number', chosenCandidate.number);

	let inferredBoxes = updateRelatedBoxes(sudoku, regionSize, rowIndex, columnIndex, chosenCandidate, true);

	while (inferredBoxes.length > 0) {
		const inferredBoxWrapper = inferredBoxes.shift();
		const inferredCandidate = inferredBoxWrapper.box.candidates[0];
		console.log(`Processing inferred ${inferredCandidate.number} in box`, inferredBoxWrapper.rowIndex, inferredBoxWrapper.columnIndex);
		
		inferredBoxes = inferredBoxes.concat(
			updateRelatedBoxes(sudoku, regionSize, inferredBoxWrapper.rowIndex, inferredBoxWrapper.columnIndex, inferredCandidate, false)
		);
	}
};

const lockHighestImpactBox = (sudoku, regionSize) => {
	const maximumImpact = sudoku.reduce((rowReduced, row) => {
		return row.reduce((boxReduced, box) => Math.max(boxReduced, box.maximumImpact), rowReduced);
	}, 0);

	const highestImpactBoxes = getHighestImpactBoxes(sudoku, maximumImpact);

	if (highestImpactBoxes.length === 0) {
			console.log('The sudoku is already solved!');
	} else {
		const randomRow = getRandomElement(highestImpactBoxes);
		const { box, columnIndex, rowIndex } = getRandomElement(randomRow);
		const boxCandidates = box.candidates.filter(candidate => candidate.impact === maximumImpact);
		const chosenCandidate = getRandomElement(boxCandidates);

		lockBox(sudoku, regionSize, rowIndex, columnIndex, chosenCandidate);
		updateImpacts(sudoku, regionSize);
	}
};

const removeBoxCandidate = (sudoku, rowIndex, columnIndex, removedCandidate, inferredBoxes, isCausedByLock) => {
	const relatedBox = sudoku[rowIndex][columnIndex];

	if (!relatedBox.isLocked && !relatedBox.isInferable) {
		const removedCandidateIndex = relatedBox.candidates.findIndex(candidate => candidate.number === removedCandidate.number);
		if (removedCandidateIndex > -1) {
			console.log(`${isCausedByLock ? 'Removing' : 'Discarding'} number ${removedCandidate.number} from box ${rowIndex} ${columnIndex}`);
			const candidate = relatedBox.candidates.splice(removedCandidateIndex, 1)[0];

			if (!isCausedByLock) {
				relatedBox.discardedCandidates.push(candidate);
			}

			if (relatedBox.candidates.length === 1) {
				relatedBox.isInferable = true;
				inferredBoxes.push({rowIndex, columnIndex, box: relatedBox});
				console.log(`Number ${relatedBox.candidates[0].number} is the only candidate for box ${rowIndex} ${columnIndex}`);
			}
		}
		else if (isCausedByLock) {
			relatedBox.discardedCandidates = relatedBox.discardedCandidates.filter(candidate => candidate.number !== removedCandidate.number);
		}
	}
};

const updateImpacts = (sudoku, regionSize) => {
	const sudokuSize = regionSize * regionSize;
	for (let rowIndex = 0; rowIndex < sudokuSize; ++rowIndex) {
		for (let columnIndex = 0; columnIndex < sudokuSize; ++columnIndex) {
			const currentBox = sudoku[rowIndex][columnIndex];

			if (!currentBox.isLocked) {
				const regionRow = Math.floor(rowIndex / regionSize);
				const regionColumn = Math.floor(columnIndex / regionSize);

				currentBox.candidates.forEach(currentCandidate => {
					let candidateImpact = 0;

					// Iterate the boxes in the currentBox column, searching for the candidate.number
					for (let i = 0; i < sudokuSize; ++i) {
						if (i !== rowIndex &&
							!sudoku[i][columnIndex].isLocked &&
							!sudoku[i][columnIndex].isInferable &&
							sudoku[i][columnIndex].candidates.find(otherCandidate => otherCandidate.number === currentCandidate.number)) {
							candidateImpact++;
						}
					}

					// Iterate the boxes in the currentBox row, searching for the candidate.number
					for (let j = 0; j < sudokuSize; ++j) {
						if (j !== columnIndex &&
							!sudoku[rowIndex][j].isLocked &&
							!sudoku[rowIndex][j].isInferable &&
							sudoku[rowIndex][j].candidates.find(otherCandidate => otherCandidate.number === currentCandidate.number)) {
							candidateImpact++;
						}
					}

					// Iterate the boxes in the currentBox region, searching for the candidate.number
					for (let i = regionRow * regionSize, iEnd = (regionRow + 1) * regionSize; i < iEnd; ++i) {
						for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
							if (i !== rowIndex &&
								j !== columnIndex &&
								!sudoku[i][j].isInferable &&
								!sudoku[i][j].isLocked &&
								sudoku[i][j].candidates.find(otherCandidate => otherCandidate.number === currentCandidate.number)) {
								candidateImpact++;
							}
						}
					}

					currentCandidate.impact = candidateImpact;
				});

				currentBox.maximumImpact = currentBox.candidates.reduce((reduced, nextCandidate) => Math.max(reduced, nextCandidate.impact), 0);
			}
		}
	}
};

const updateRelatedBoxes = (sudoku, regionSize, rowIndex, columnIndex, chosenCandidate, isCausedByLock) => {
	const sudokuSize = regionSize * regionSize;
	const regionRow = Math.floor(rowIndex / regionSize);
	const regionColumn = Math.floor(columnIndex / regionSize);
	const inferredBoxes = [];

	// Remove the chosenCandidate from the boxes in the same column
	for (let i = 0; i < sudokuSize; ++i) {
		if (i !== rowIndex) {
			removeBoxCandidate(sudoku, i, columnIndex, chosenCandidate, inferredBoxes, isCausedByLock);
		}
	}

	// Remove the chosenCandidate from the boxes in the same row
	for (let j = 0; j < sudokuSize; ++j) {
		if (j !== columnIndex) {
			removeBoxCandidate(sudoku, rowIndex, j, chosenCandidate, inferredBoxes, isCausedByLock);
		}
	}

	// Remove the chosenCandidate from the boxes in the same region
	for (let i = regionRow * regionSize, iEnd = (regionRow + 1) * regionSize; i < iEnd; ++i) {
		for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
			if (i !== rowIndex && j !== columnIndex) {
				removeBoxCandidate(sudoku, i, j, chosenCandidate, inferredBoxes, isCausedByLock);
			}
		}
	}


	console.log(`Boxes candidates after ${isCausedByLock ? 'locking' : 'inferring'} box ${rowIndex} ${columnIndex}`);
	displaySudokuCandidates(sudoku, isCausedByLock);

	console.log(`Locked candidates after ${isCausedByLock ? 'locking' : 'inferring'} box ${rowIndex} ${columnIndex}`);
	displaySudoku(sudoku, {
		displayInferredNumbers: true
	});

	console.log('Inferable boxes propagation:');
	displaySudoku(sudoku, {
		displayInferredPropagation: true
	});

	for (let i = 0; i < sudokuSize; ++i) {
		for (let j = 0; j < sudokuSize; ++j) {
			if (sudoku[i][j].candidates.length === 1) {
				validateNumber(sudoku, regionSize, i, j, sudoku[i][j].candidates[0]);
			}
		}
	}

	return inferredBoxes;
};

const validateNumber = (sudoku, regionSize, rowIndex, columnIndex, chosenCandidate) => {
	const sudokuSize = regionSize * regionSize;
	const regionRow = Math.floor(rowIndex / regionSize);
	const regionColumn = Math.floor(columnIndex / regionSize);

	for (let i = 0; i < sudokuSize; ++i) {
		if (i !== rowIndex &&
			(sudoku[i][columnIndex].isLocked || sudoku[i][columnIndex].isInferable) &&
			sudoku[i][columnIndex].candidates[0].number === chosenCandidate.number) {
				throw new Error(`Bad number ${chosenCandidate.number} placed in box ${rowIndex} ${columnIndex}; it conflicts with box ${i} ${columnIndex}`);
		}
	}

	for (let j = 0; j < sudokuSize; ++j) {
		if (j !== columnIndex &&
			(sudoku[rowIndex][j].isLocked || sudoku[rowIndex][j].isInferable) &&
			sudoku[rowIndex][j].candidates[0].number === chosenCandidate.number) {
				throw new Error(`Bad number ${chosenCandidate.number} placed in box ${rowIndex} ${columnIndex}; it conflicts with box ${rowIndex} ${j}`);
		}
	}

	for (let i = regionRow * regionSize, iEnd = (regionRow + 1) * regionSize; i < iEnd; ++i) {
		for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
			if (i !== rowIndex && j !== columnIndex &&
				(sudoku[i][j].isLocked || sudoku[i][j].isInferable) &&
				sudoku[i][j].candidates.length === 1 &&
				sudoku[i][j].candidates[0].number === chosenCandidate.number) {
					throw new Error(`Bad number ${chosenCandidate.number} placed in box ${rowIndex} ${columnIndex}; it conflicts with box ${i} ${j}`);
			}
		}
	}
};

const sudoku = getSudoku(3, 81);