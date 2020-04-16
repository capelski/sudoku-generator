import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { SudokuGrid } from './components/sudoku-grid';
import { getEmptySudoku, lockBox } from './logic/sudoku-logic';
import { Box, Sudoku } from './types/sudoku';

import './style/main.scss';

const initialSudokuList = [getEmptySudoku(3)];

const App = () => {
    const [sudokuIndex, setSudokuIndex] = useState(0);
    const [sudokuList, setSudokuList] = useState<Sudoku[]>(initialSudokuList);

    const lockBoxWrapper = (selectedBox: Box, selectedNumber: number) => {
        if (
            !selectedBox.isLocked &&
            selectedBox.candidates.find(
                (candidate) => candidate.number === selectedNumber && candidate.isValid
            )
        ) {
            const currentSudoku = sudokuList[sudokuIndex];
            const nextSudoku = lockBox(currentSudoku, selectedBox, selectedNumber);
            setSudokuList(sudokuList.splice(0, sudokuIndex + 1).concat([nextSudoku]));
            setSudokuIndex(sudokuIndex + 1);
        } else {
            console.error("Nah! Can't do that");
        }
    };

    const nextSudoku = () => {
        setSudokuIndex(Math.min(sudokuIndex + 1, sudokuList.length - 1));
    };

    const previousSudoku = () => {
        setSudokuIndex(Math.max(sudokuIndex - 1, 0));
    };

    const setRegionSize = (regionSize: number) => {
        setSudokuIndex(0);
        setSudokuList([getEmptySudoku(regionSize)]);
    };

    return (
        <SudokuGrid
            lockBox={lockBoxWrapper}
            locksNumber={sudokuIndex}
            nextSudoku={nextSudoku}
            previousSudoku={previousSudoku}
            setRegionSize={setRegionSize}
            sudoku={sudokuList[sudokuIndex]}
        />
    );
};

const appPlaceholder = document.getElementById('app-placeholder');
ReactDOM.render(<App />, appPlaceholder);
