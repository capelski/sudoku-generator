const getBoxCandidates = (regionSize, sudoku, rowIndex, columnIndex) => {
	const bannedNumbers = [];

	// Check for numbers in the same column
	for (let i = 0; i < rowIndex; ++i) {
		bannedNumbers.push(sudoku[i][columnIndex]);
	}

	// Check for numbers in the same row
	for (let j = 0; j < columnIndex; ++j) {
		const number = sudoku[rowIndex][j];
		if (bannedNumbers.indexOf(number) === -1) {
			bannedNumbers.push(number);
		}
	}

	// Check for numbers in the same region
	const regionRow = Math.floor(rowIndex / regionSize);
	const regionColumn = Math.floor(columnIndex / regionSize);
	for (let i = regionRow * regionSize; i < rowIndex; ++i) {
		for (let j = regionColumn * regionSize, jEnd = (regionColumn + 1) * regionSize; j < jEnd; ++j) {
			const number = sudoku[i][j];
			if (bannedNumbers.indexOf(number) === -1) {
				bannedNumbers.push(number);
			}
		}
	}

	const potentialNumbers = [...Array(regionSize * regionSize)].map((x, i) => i + 1);
	const candidates = potentialNumbers.filter(n => bannedNumbers.indexOf(n) === -1);

	return candidates;
};

const getRandomElement = (array) => array[Math.round(Math.random() * (array.length - 1))];

const getSudoku = (regionSize) => {
	const sudoku = [];
	getSudokuRecursive(regionSize, sudoku, 0, 0);
	return sudoku;
};

const getSudokuRecursive = (regionSize, sudoku, rowIndex, columnIndex) => {
	if (sudoku[rowIndex] === undefined) {
		sudoku.push([]);
	}

	const sudokuSize = regionSize * regionSize;
	let candidates = getBoxCandidates(regionSize, sudoku, rowIndex, columnIndex);
	let isFinished = false;

	for (let i = candidates.length - 1; i >= 0; --i) {
		const randomNumber = getRandomElement(candidates);
		candidates = candidates.filter(x => x !== randomNumber);
		sudoku[rowIndex][columnIndex] = randomNumber;

		if ((columnIndex + 1) < sudokuSize) {
			isFinished = getSudokuRecursive(regionSize, sudoku, rowIndex, columnIndex + 1);
		} else if ((rowIndex + 1) < sudokuSize) {
			isFinished = getSudokuRecursive(regionSize, sudoku, rowIndex + 1, 0);
		} else {
			isFinished = true;
		}

		if (isFinished) {
			break;
		}
	}

	return isFinished;
};

const sudoku = getSudoku(3);
console.log(sudoku);