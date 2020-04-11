import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';
import { arePeerBoxes } from '../logic/sudoku-logic';

interface GridProps {
    lockBox: (selectedBox: Box, selectedNumber: number) => void;
    sudoku: Sudoku;
}

interface BoxNumber {
    box: Box;
    number: number;
}

export const SudokuGrid: React.FC<GridProps> = (props) => {
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<BoxNumber | undefined>(undefined);

    const lockBoxHandler = () => {
        if (selectedBoxNumber !== undefined) {
            props.lockBox(selectedBoxNumber.box, selectedBoxNumber.number);
            setSelectedBoxNumber(undefined);
        }
    };

    return (
        <React.Fragment>
            <div className={`sudoku-grid size-${props.sudoku.size}`}>
                {props.sudoku.rows.map((row) => (
                    <div className="sudoku-row">
                        {row.map((box) => {
                            const isPeerBox =
                                selectedBoxNumber !== undefined &&
                                arePeerBoxes(selectedBoxNumber.box, box);

                            return (
                                <div
                                    className={`sudoku-box ${
                                        box.isLocked ? 'locked-box' : 'open-box'
                                    }`}
                                >
                                    {box.isLocked
                                        ? box.number
                                        : box.candidates.map((candidate) => {
                                              const isSelectedCandidate =
                                                  selectedBoxNumber !== undefined &&
                                                  selectedBoxNumber.box === box &&
                                                  selectedBoxNumber.number === candidate.number;

                                              const mustHighlightCandidate =
                                                  isPeerBox &&
                                                  selectedBoxNumber!.number === candidate.number;

                                              const candidateClickHandler = () => {
                                                  setSelectedBoxNumber({
                                                      box,
                                                      number: candidate.number
                                                  });
                                              };

                                              return (
                                                  <div
                                                      className={`sudoku-candidate${
                                                          candidate.isValid
                                                              ? ''
                                                              : ' invalid-candidate'
                                                      }${
                                                          isSelectedCandidate
                                                              ? ' selected'
                                                              : mustHighlightCandidate
                                                              ? ' highlight invalid-candidate'
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
            <button type="button" onClick={lockBoxHandler}>
                Lock box
            </button>
        </React.Fragment>
    );
};
