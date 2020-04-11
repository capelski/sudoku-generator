import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';

interface GridProps {
    sudoku: Sudoku;
}

interface BoxNumber {
    box: Box;
    number: number;
}

export const SudokuGrid: React.FC<GridProps> = (props) => {
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<BoxNumber | undefined>(undefined);

    return (
        <div className={`sudoku-grid size-${props.sudoku.size}`}>
            {props.sudoku.boxes.map((row) => (
                <div className="sudoku-row">
                    {row.map((box) => {
                        const isPeerBox =
                            selectedBoxNumber !== undefined &&
                            (selectedBoxNumber.box.column === box.column ||
                                selectedBoxNumber.box.region === box.region ||
                                selectedBoxNumber.box.row === box.row);
                        return (
                            <div className="sudoku-box">
                                {box.candidates.map((candidate) => {
                                    const isSelectedCandidate =
                                        selectedBoxNumber !== undefined &&
                                        selectedBoxNumber.box === box &&
                                        selectedBoxNumber.number === candidate.number;

                                    const mustHighlightCandidate =
                                        isPeerBox && selectedBoxNumber!.number === candidate.number;

                                    const candidateClickHandler = () => {
                                        setSelectedBoxNumber({ box, number: candidate.number });
                                    };

                                    return (
                                        <div
                                            className={`sudoku-candidate${
                                                isSelectedCandidate
                                                    ? ' selected'
                                                    : mustHighlightCandidate
                                                    ? ' highlight'
                                                    : ''
                                            }`}
                                            onClick={candidateClickHandler}
                                        >
                                            {candidate.number}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
