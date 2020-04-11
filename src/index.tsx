import React from 'react';
import ReactDOM from 'react-dom';
import { SudokuGrid } from './components/sudoku-grid';
import './style/main.scss';
import { Sudoku } from './types/sudoku';

const regionSize = 3;
const size = regionSize * regionSize;
const sudoku: Sudoku = {
    boxes: [...Array(size)].map((_x, rowIndex) =>
        [...Array(size)].map((_y, columnIndex) => ({
            candidates: [...Array(size)].map((_z, candidateIndex) => ({
                number: candidateIndex + 1,
                impact: 2 * (size - 1) + (regionSize - 1) * (regionSize - 1)
            })),
            column: columnIndex,
            isLocked: false,
            region:
                Math.floor(rowIndex / regionSize) * regionSize +
                Math.floor(columnIndex / regionSize),
            row: rowIndex
        }))
    ),
    regionSize,
    size
};

(window as any).sudoku = sudoku;

const App = () => <SudokuGrid sudoku={sudoku} />;

const appPlaceholder = document.getElementById('app-placeholder');
ReactDOM.render(<App />, appPlaceholder);
