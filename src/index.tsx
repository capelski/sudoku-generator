import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { SudokuGrid } from './components/sudoku-grid';
import { getEmptySudoku, lockBox } from './logic/sudoku-logic';
import { Box, Sudoku } from './types/sudoku';

import './style/main.scss';

const initialSudoku = getEmptySudoku(3);

const App = () => {
    const [sudoku, setSudoku] = useState<Sudoku>(initialSudoku);

    const lockBoxWrapper = (selectedBox: Box, selectedNumber: number) => {
        // TODO Stack sudoku and allow time travelling
        if (
            !selectedBox.isLocked &&
            selectedBox.candidates.find(
                (candidate) => candidate.number === selectedNumber && candidate.isValid
            )
        ) {
            setSudoku(lockBox(sudoku, selectedBox, selectedNumber));
        } else {
            console.error("Nah! Can't do that");
        }
    };

    return <SudokuGrid lockBox={lockBoxWrapper} sudoku={sudoku} />;
};

const appPlaceholder = document.getElementById('app-placeholder');
ReactDOM.render(<App />, appPlaceholder);
