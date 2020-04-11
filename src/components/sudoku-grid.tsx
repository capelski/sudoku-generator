import React from 'react';
import { Sudoku } from '../types/sudoku';

interface GridProps {
    sudoku: Sudoku;
}

export const SudokuGrid: React.FC<GridProps> = (props) => {
    return (
        <div className={`sudoku-grid size-${props.sudoku.size}`}>
            {props.sudoku.boxes.map((row) => (
                <div className="sudoku-row">
                    {row.map((box) => (
                        <div className="sudoku-box">
                            {box.candidates.map((candidate) => (
                                <div className="sudoku-candidate">{candidate.number}</div>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
