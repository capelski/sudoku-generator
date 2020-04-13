import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';
import { arePeerBoxes, getRandomElement, isBoxInInvalidGroup } from '../logic/sudoku-logic';

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
    const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<BoxNumber | undefined>(undefined);

    const displayCandidatesHandler = () => {
        setDisplayCandidates(!displayCandidates);
    };

    const displayImpactHandler = () => {
        setDisplayImpact(!displayImpact);
    };

    const highlightMaximumImpactHandler = () => {
        setHighlightMaximumImpact(!highlightMaximumImpact);
    };

    const lockSelectedBoxHandler = () => {
        if (selectedBoxNumber !== undefined) {
            props.lockBox(selectedBoxNumber.box, selectedBoxNumber.number);
            setSelectedBoxNumber(undefined);
        }
    };

    const selectRandomMaximumImpactBox = () => {
        const maximumImpactBoxes = props.sudoku.boxes.filter((box) =>
            box.candidates.find((candidate) => candidate.impact === props.sudoku.maximumImpact)
        );
        const randomBox = getRandomElement(maximumImpactBoxes);

        const maximumImpactCandidates = randomBox.candidates.filter(
            (candidate) => candidate.impact === props.sudoku.maximumImpact
        );
        const randomCandidate = getRandomElement(maximumImpactCandidates);

        setSelectedBoxNumber({
            box: randomBox,
            number: randomCandidate.number
        });
    };

    return (
        <React.Fragment>
            <div className={`sudoku-grid size-${props.sudoku.size}`}>
                {props.sudoku.boxes.map((box) => {
                    const isPeerBox =
                        selectedBoxNumber !== undefined && arePeerBoxes(selectedBoxNumber.box, box);

                    return (
                        <div
                            className={`sudoku-box ${box.isLocked ? 'locked-box' : 'open-box'}${
                                isBoxInInvalidGroup(props.sudoku, box)
                                    ? ' inside-invalid-group'
                                    : ''
                            }${!box.hasValidCandidates ? ' invalid-box' : ''}
                            ${box.isInferable ? ' inferable-box' : ''}`}
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
                                          if (candidate.isValid) {
                                              setSelectedBoxNumber({
                                                  box,
                                                  number: candidate.number
                                              });
                                          }
                                      };

                                      return (
                                          <div
                                              className={`sudoku-candidate${
                                                  displayCandidates ? '' : ' hidden-candidate'
                                              }${candidate.isValid ? '' : ' invalid-candidate'}${
                                                  displayImpact &&
                                                  highlightMaximumImpact &&
                                                  props.sudoku.maximumImpact === candidate.impact
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
                    <button type="button" onClick={highlightMaximumImpactHandler}>
                        {highlightMaximumImpact ? 'Disable' : 'Enable'} maximum impact highlight
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
