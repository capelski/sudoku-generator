const displaySudoku = (sudoku, highlightInferableBoxes = false) => {
	console.log(sudoku.map(row =>
		row.map(box => box.isLocked ?
			String(box.candidates[0].number) :
			(highlightInferableBoxes && box.candidates.length === 1) ? '*' : ' ' )));
};

const displaySudokuCandidates = (sudoku) => {
	sudoku.forEach(row => console.log(row.map(box => box.candidates.map(c => c.number).join())));
}

const displaySudokuImpacts = (sudoku, displayMaximumImpactOnly = true) => {
	sudoku.forEach(row => {
		console.log(row.map(box => 
			box.isLocked ?
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
				.filter(boxWrapper => !boxWrapper.box.isLocked && boxWrapper.box.maximumImpact === maximumImpact);
		})
		.filter(row => row.length > 0);
};

const getInitialSudoku = (regionSize) => {
	const sudokuSize = regionSize * regionSize;
	const initialImpact = 2 * (sudokuSize - 1) + (regionSize - 1) * (regionSize - 1);
	return [...Array(sudokuSize)].map(_rowIndex => [...Array(sudokuSize)].map(_boxIndex => ({
		candidates: [...Array(sudokuSize)].map((x, i) => ({ number: i + 1, impact: initialImpact })),
		isLocked: false,
		maximumImpact: initialImpact,
	})));
};

const getRandomElement = (array) => array[Math.round(Math.random() * (array.length - 1))];

const getSudoku = (regionSize, filledBoxesNumber) => {
	const sudoku = getInitialSudoku(regionSize);

	for (let i = 1; i <= filledBoxesNumber; ++i) {
		console.log(`Iteration ${i} -------------------------`);
		lockHighestImpactBox(sudoku, regionSize);
		displaySudoku(sudoku, true);
		console.log('Boxes candidates:');
		displaySudokuCandidates(sudoku);
		console.log('Boxes impact:');
		displaySudokuImpacts(sudoku);
	}

	return sudoku;
};

const lockBox = (sudoku, regionSize, rowIndex, columnIndex, chosenCandidate) => {
	const chosenBox = sudoku[rowIndex][columnIndex];
	chosenBox.candidates = [chosenCandidate];
	chosenBox.isLocked = true;
	chosenBox.maximumImpact = -1;

	const sudokuSize = regionSize * regionSize;
	const regionRow = Math.floor(rowIndex / regionSize);
	const regionColumn = Math.floor(columnIndex / regionSize);

	// Remove the chosenCandidate from the boxes in the same column
	for (let i = 0; i < sudokuSize; ++i) {
		if (!sudoku[i][columnIndex].isLocked) {
			const chosenCandidateIndex = sudoku[i][columnIndex].candidates.findIndex(candidate => candidate.number === chosenCandidate.number);
			if (chosenCandidateIndex > -1) {
				sudoku[i][columnIndex].candidates.splice(chosenCandidateIndex, 1);
			}
		}
	}

	// Remove the chosenCandidate from the boxes in the same row
	for (let j = 0; j < sudokuSize; ++j) {
		// columnIndex box is skipped intentionally; it has already been treated in the previous loop
		if (j !== columnIndex && !sudoku[rowIndex][j].isLocked) {
			const chosenCandidateIndex = sudoku[rowIndex][j].candidates.findIndex(candidate => candidate.number === chosenCandidate.number);
			if (chosenCandidateIndex > -1) {
				sudoku[rowIndex][j].candidates.splice(chosenCandidateIndex, 1);
			}
		}
	}

	// Remove the chosenCandidate from the boxes in the same region
	for (let i = regionRow * regionSize, iEnd = (regionRow + 1) * regionSize; i < iEnd; ++i) {
		for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
			// rowIndex boxes and columnIndex boxes are skipped intentionally; they have already been treated in the previous loops
			if (i !== rowIndex && j !== columnIndex && !sudoku[i][j].isLocked) {
				const chosenCandidateIndex = sudoku[i][j].candidates.findIndex(candidate => candidate.number === chosenCandidate.number);
				if (chosenCandidateIndex > -1) {
					sudoku[i][j].candidates.splice(chosenCandidateIndex, 1);
				}
			}
		}
	}
};

const lockHighestImpactBox = (sudoku, regionSize) => {
	const maximumImpact = sudoku.reduce((rowReduced, row) => {
		return row.reduce((boxReduced, box) => Math.max(boxReduced, box.maximumImpact), rowReduced);
	}, 0);

	const highestImpactBoxes = getHighestImpactBoxes(sudoku, maximumImpact);
	const randomRow = getRandomElement(highestImpactBoxes);
	const { box, columnIndex, rowIndex } = getRandomElement(randomRow);
	const boxCandidates = box.candidates.filter(candidate => candidate.impact === maximumImpact);
	const chosenCandidate = getRandomElement(boxCandidates);

	lockBox(sudoku, regionSize, rowIndex, columnIndex, chosenCandidate);
	updateImpacts(sudoku, regionSize);
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
							sudoku[i][columnIndex].candidates.find(otherCandidate => otherCandidate.number === currentCandidate.number)) {
							candidateImpact++;
						}
					}

					// Iterate the boxes in the currentBox row, searching for the candidate.number
					for (let j = 0; j < sudokuSize; ++j) {
						if (j !== columnIndex &&
							!sudoku[rowIndex][j].isLocked &&
							sudoku[rowIndex][j].candidates.find(otherCandidate => otherCandidate.number === currentCandidate.number)) {
							candidateImpact++;
						}
					}

					// Iterate the boxes in the currentBox region, searching for the candidate.number
					for (let i = regionRow * regionSize, iEnd = (regionRow + 1) * regionSize; i < iEnd; ++i) {
						for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
							if (i !== rowIndex &&
								j !== columnIndex &&
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

const sudoku = getSudoku(2, 10);
console.log('Generated sudoku ---------------------');
displaySudoku(sudoku);