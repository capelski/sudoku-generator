import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SudokuGrid } from './components/sudoku-grid';
import { getEmptySudoku, getSerializableSudoku } from './logic/sudoku-operations';
import { lockBox, rehydrateSudoku } from './logic/sudoku-rules';
import { Box, Sudoku } from './types/sudoku';

import './style/main.scss';

const initialSudokuList = [getEmptySudoku(3)];

const persistSudokuStatus = (sudokuList: Sudoku[], sudokuIndex: number) => {
    const sudokuStatus = {
        sudokuList: sudokuList.map(getSerializableSudoku),
        sudokuIndex
    };
    try {
        localStorage.setItem('sudokuStatus', JSON.stringify(sudokuStatus));
    } catch {
        console.error('Cannot persist this sudoku anymore');
    }
};

const retrieveSudokuStatus = (): { sudokuIndex: number; sudokuList: Sudoku[] } | undefined => {
    let sudokuStatus: { sudokuIndex: number; sudokuList: Sudoku[] } | undefined;
    const serializedSudokuStatus = localStorage.getItem('sudokuStatus');
    if (serializedSudokuStatus) {
        sudokuStatus = JSON.parse(serializedSudokuStatus);
        sudokuStatus!.sudokuList = sudokuStatus!.sudokuList.map(rehydrateSudoku);
    }
    return sudokuStatus;
};

const App = () => {
    const [sudokuIndex, setSudokuIndex] = useState(0);
    const [sudokuList, setSudokuList] = useState<Sudoku[]>(initialSudokuList);

    useEffect(() => {
        const sudokuStatus = retrieveSudokuStatus();
        if (sudokuStatus) {
            setSudokuList(sudokuStatus.sudokuList);
            setSudokuIndex(sudokuStatus.sudokuIndex);
        }
    }, []);

    const lockBoxWrapper = (selectedBox: Box, selectedNumber: number) => {
        if (!selectedBox.isLocked) {
            const currentSudoku = sudokuList[sudokuIndex];
            const nextSudoku = lockBox(currentSudoku, selectedBox, selectedNumber);
            const nextSudokuList = sudokuList.splice(0, sudokuIndex + 1).concat([nextSudoku]);
            const nextSudokuIndex = sudokuIndex + 1;

            setSudokuList(nextSudokuList);
            setSudokuIndex(nextSudokuIndex);

            persistSudokuStatus(nextSudokuList, nextSudokuIndex);
        } else {
            console.error('Box is already locked');
        }
    };

    const nextSudoku = () => {
        const nextIndex = Math.min(sudokuIndex + 1, sudokuList.length - 1);
        setSudokuIndex(nextIndex);
        persistSudokuStatus(sudokuList, nextIndex);
    };

    const previousSudoku = () => {
        const previousIndex = Math.max(sudokuIndex - 1, 0);
        setSudokuIndex(previousIndex);
        persistSudokuStatus(sudokuList, previousIndex);
    };

    const resetSudoku = (regionSize: number) => {
        const emptySudokuList = [getEmptySudoku(regionSize)];
        const initialIndex = 0;

        setSudokuList(emptySudokuList);
        setSudokuIndex(initialIndex);

        persistSudokuStatus(emptySudokuList, initialIndex);
    };

    return (
        <SudokuGrid
            lockBox={lockBoxWrapper}
            locksNumber={sudokuIndex}
            nextSudoku={nextSudoku}
            previousSudoku={previousSudoku}
            resetSudoku={resetSudoku}
            sudoku={sudokuList[sudokuIndex]}
        />
    );
};

const appPlaceholder = document.getElementById('app-placeholder');
ReactDOM.render(<App />, appPlaceholder);
