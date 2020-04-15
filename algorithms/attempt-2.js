const displaySudoku = (sudoku, highlightInferableBoxes = false) => {
	console.log(sudoku.map(row =>
		row.map(box => box.isLocked ?
			String(box.candidates[0]) :
			(highlightInferableBoxes && box.candidates.length === 1) ? '!' : ' ' )));
};

const getInitialSudoku = (sudokuSize) => {
	return [...Array(sudokuSize)].map(_ => [...Array(sudokuSize)].map(__ => ({
		isLocked: false,
		candidates: [...Array(sudokuSize)].map((x, i) => i + 1),
	})));
};

const getInferableBoxesNumber = (sudoku) => {
	return sudoku.reduce((sudokuReduced, nextRow) => {
		return nextRow.reduce((rowReduced, nextBox) =>
			rowReduced + (!nextBox.isLocked && nextBox.candidates.length === 1), sudokuReduced);
	}, 0);
};

const getRandomBoxIndexes = (sudoku) => {
	const availableRows = sudoku
		.map((row, index) => ({
			data: row,
			index: row.find(box => !box.isLocked) ? index : -1
		}))
		.filter(row => row.index !== -1);
	const randomRow = getRandomElement(availableRows);

	const availableBoxes = randomRow.data
		.map((box, index) => ({
			data: box,
			index: box.isLocked ? -1 : index,
		}))
		.filter(box => box.index !== -1);
	const randomBox = getRandomElement(availableBoxes);

	return {
		rowIndex: randomRow.index,
		boxIndex: randomBox.index
	};
};

const getRandomElement = (array) => array[Math.round(Math.random() * (array.length - 1))];

const getSudoku = (regionSize) => {
	const sudoku = getInitialSudoku(regionSize * regionSize);
	let i = 0;

	while (getInferableBoxesNumber(sudoku) < 1) {
		const { rowIndex, boxIndex } = getRandomBoxIndexes(sudoku);
		lockBox(regionSize, sudoku, rowIndex, boxIndex);

		console.log(`Iteration ${++i} -------------------------`);		
		displaySudoku(sudoku, true);
	}

	return sudoku;
};

const lockBox = (regionSize, sudoku, rowIndex, columnIndex) => {
	const chosenBox = sudoku[rowIndex][columnIndex];
	const chosenNumber = getRandomElement(chosenBox.candidates);
	chosenBox.isLocked = true;
	chosenBox.candidates = [chosenNumber];

	const sudokuSize = regionSize * regionSize;
	const regionRow = Math.floor(rowIndex / regionSize);
	const regionColumn = Math.floor(columnIndex / regionSize);

	// Remove the chosenNumber candidate from the boxes in the same column
	for (let i = 0; i < sudokuSize; ++i) {
		if (!sudoku[i][columnIndex].isLocked) {
			sudoku[i][columnIndex].candidates = sudoku[i][columnIndex].candidates.filter(candidate => candidate !== chosenNumber);
		}
	}

	// Remove the chosenNumber candidate from the boxes in the same row
	for (let j = 0; j < sudokuSize; ++j) {
		if (!sudoku[rowIndex][j].isLocked) {
			sudoku[rowIndex][j].candidates = sudoku[rowIndex][j].candidates.filter(candidate => candidate !== chosenNumber);
		}
	}

	// Remove the chosenNumber candidate from the boxes in the same region
	for (let i = regionRow * regionSize, iEnd = (regionRow + 1) * regionSize; i < iEnd; ++i) {
		for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
			if (!sudoku[i][j].isLocked) {
				sudoku[i][j].candidates = sudoku[i][j].candidates.filter(candidate => candidate !== chosenNumber);
			}
		}
	}
};

const sudoku = getSudoku(2);
console.log('Generated sudoku ---------------------');
displaySudoku(sudoku);
