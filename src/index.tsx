import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SudokuGrid } from './components/sudoku-grid';
import {
    getEmptySudoku,
    getSerializableSudoku,
    lockBox,
    rehydrateSudoku
} from './logic/sudoku-logic';
import { Box, Sudoku } from './types/sudoku';

import './style/main.scss';

const initialSudokuList = [getEmptySudoku(3)];

const persistSudokuList = (sudokuList: Sudoku[]) => {
    const serializableSudokuList = sudokuList.map(getSerializableSudoku);
    localStorage.setItem('sudokuList', JSON.stringify(serializableSudokuList));
};

const retrieveSudokuList = (): Sudoku[] | undefined => {
    let sudokuList: Sudoku[] | undefined;
    const serializedSudokuList = localStorage.getItem('sudokuList');
    if (serializedSudokuList) {
        sudokuList = JSON.parse(serializedSudokuList) as Sudoku[];
        sudokuList.forEach(rehydrateSudoku);
    }
    return sudokuList;
};

const App = () => {
    const [sudokuIndex, setSudokuIndex] = useState(0);
    const [sudokuList, setSudokuList] = useState<Sudoku[]>(initialSudokuList);

    useEffect(() => {
        const sudokuList = retrieveSudokuList();
        if (sudokuList) {
            setSudokuList(sudokuList);
            setSudokuIndex(sudokuList.length - 1);
        }
    }, []);

    const lockBoxWrapper = (selectedBox: Box, selectedNumber: number) => {
        if (
            !selectedBox.isLocked &&
            selectedBox.candidates.find(
                (candidate) => candidate.number === selectedNumber && candidate.isValid
            )
        ) {
            const currentSudoku = sudokuList[sudokuIndex];
            const nextSudoku = lockBox(currentSudoku, selectedBox, selectedNumber);
            const nextSudokuList = sudokuList.splice(0, sudokuIndex + 1).concat([nextSudoku]);
            setSudokuList(nextSudokuList);
            persistSudokuList(nextSudokuList);
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
        const emptySudokuList = [getEmptySudoku(regionSize)];
        setSudokuList(emptySudokuList);
        persistSudokuList(emptySudokuList);
        setSudokuIndex(0);
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
