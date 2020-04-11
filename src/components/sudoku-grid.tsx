import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';
import {
    arePeerBoxes,
    getSudokuMaximumImpact,
    getRandomElement,
    getImpactBoxes
} from '../logic/sudoku-logic';

interface GridProps {
    lockBox: (selectedBox: Box, selectedNumber: number) => void;
    locksNumber: number;
    nextSudoku: () => void;
    previousSudoku: () => void;
    sudoku: Sudoku;
}

interface BoxNumber {
    box: Box;
    number: number;
}

export const SudokuGrid: React.FC<GridProps> = (props) => {
    const [displayCandidates, setDisplayCandidates] = useState(true);
    const [displayImpact, setDisplayImpact] = useState(false);
    const [maximumImpact, setMaximumImpact] = useState({ display: false, value: -1 });
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<BoxNumber | undefined>(undefined);

    const displayImpactHandler = () => {
        setDisplayImpact(!displayImpact);
    };

    const displayCandidatesHandler = () => {
        setDisplayCandidates(!displayCandidates);
    };

    const maximumImpactHandler = () => {
        if (maximumImpact.display) {
            setMaximumImpact({
                display: false,
                value: -1
            });
        } else {
            setMaximumImpact({
                display: true,
                value: getSudokuMaximumImpact(props.sudoku)
            });
        }
    };

    const lockSelectedBoxHandler = () => {
        if (selectedBoxNumber !== undefined) {
            props.lockBox(selectedBoxNumber.box, selectedBoxNumber.number);
            setSelectedBoxNumber(undefined);
        }
    };

    const selectRandomMaximumImpactBox = () => {
        const maximumImpact = getSudokuMaximumImpact(props.sudoku);
        const maximumImpactBoxes = getImpactBoxes(props.sudoku, maximumImpact);
        const randomBox = getRandomElement(maximumImpactBoxes);
        const randomCandidate = getRandomElement(
            randomBox.candidates.filter((candidate) => candidate.impact === maximumImpact)
        );

        setSelectedBoxNumber({
            box: randomBox,
            number: randomCandidate.number
        });
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
                                                          displayCandidates
                                                              ? ''
                                                              : ' hidden-candidate'
                                                      }${
                                                          candidate.isValid
                                                              ? ''
                                                              : ' invalid-candidate'
                                                      }${
                                                          displayImpact &&
                                                          maximumImpact.display &&
                                                          maximumImpact.value === candidate.impact
                                                              ? ' maximum-impact'
                                                              : ''
                                                      }${
                                                          isSelectedCandidate
                                                              ? ' selected'
                                                              : mustHighlightCandidate
                                                              ? ' highlight'
                                                              : ''
                                                      }`}
                                                      onClick={candidateClickHandler}
                                                  >
                                                      {displayCandidates &&
                                                          (displayImpact
                                                              ? candidate.impact
                                                              : candidate.number)}
                                                  </div>
                                              );
                                          })}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div>{props.locksNumber} locked boxes</div>
            <div>
                <button type="button" onClick={lockSelectedBoxHandler}>
                    Lock selected box
                </button>
                <button type="button" onClick={selectRandomMaximumImpactBox}>
                    Select maximum impact box
                </button>
                <button type="button" onClick={props.previousSudoku}>
                    Previous lock
                </button>
                <button type="button" onClick={props.nextSudoku}>
                    Next lock
                </button>
            </div>
            <div>
                <button type="button" onClick={displayImpactHandler}>
                    {displayImpact ? 'Show numbers' : 'Show impact'}
                </button>
                {displayImpact && (
                    <button type="button" onClick={maximumImpactHandler}>
                        {maximumImpact.display ? 'Disable' : 'Enable'} maximum impact
                    </button>
                )}
                {!displayImpact && (
                    <button type="button" onClick={displayCandidatesHandler}>
                        {displayCandidates ? 'Hide' : 'Show'} candidates
                    </button>
                )}
            </div>
        </React.Fragment>
    );
};
