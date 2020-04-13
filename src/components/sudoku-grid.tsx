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
    const [highlightInferableCandidates, setHighlightInferableCandidates] = useState(true);
    const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<BoxNumber | undefined>(undefined);
    const [useCandidatesInferring, setUseCandidatesInferring] = useState(true);

    const displayCandidatesHandler = () => {
        setDisplayCandidates(!displayCandidates);
    };

    const displayImpactHandler = () => {
        setDisplayImpact(!displayImpact);
    };

    const highlightInferableCandidatesHandler = () => {
        setHighlightInferableCandidates(!highlightInferableCandidates);
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

    const useCandidatesInferringHandler = () => {
        setUseCandidatesInferring(!useCandidatesInferring);
    };

    return (
        <React.Fragment>
            <div className={`sudoku-grid size-${props.sudoku.size}`}>
                {props.sudoku.boxes.map((box) => {
                    const isPeerBox =
                        selectedBoxNumber !== undefined && arePeerBoxes(selectedBoxNumber.box, box);
                    const isResolvedBox =
                        box.isLocked || (useCandidatesInferring && box.isInferable);

                    return (
                        <div
                            className={`sudoku-box ${isResolvedBox ? 'resolved-box' : 'open-box'}${
                                isBoxInInvalidGroup(props.sudoku, box)
                                    ? ' inside-invalid-group'
                                    : ''
                            }${!box.hasValidCandidates ? ' invalid-box' : ''}${
                                highlightInferableCandidates && box.isInferable
                                    ? ' inferable-box'
                                    : ''
                            }`}
                        >
                            {box.isLocked
                                ? box.number
                                : useCandidatesInferring && box.isInferable
                                ? box.candidates.find((candidate) => candidate.isValid)!.number
                                : box.candidates.map((candidate) => {
                                      const isSelectedCandidate =
                                          selectedBoxNumber !== undefined &&
                                          selectedBoxNumber.box === box &&
                                          selectedBoxNumber.number === candidate.number;

                                      const isAffectedCandidate =
                                          candidate.isValid &&
                                          isPeerBox &&
                                          selectedBoxNumber!.box !== box &&
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
                                                      ? ' maximum-impact-candidate'
                                                      : ''
                                              }${isSelectedCandidate ? ' selected-candidate' : ''}${
                                                  isAffectedCandidate ? ' affected-candidate' : ''
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
            <div>
                <button type="button" onClick={highlightInferableCandidatesHandler}>
                    {highlightInferableCandidates ? 'Disable' : 'Enable'} inferable candidates
                    highlight
                </button>
                <button type="button" onClick={useCandidatesInferringHandler}>
                    {useCandidatesInferring ? 'Disable' : 'Enable'} candidates inferring
                </button>
            </div>
        </React.Fragment>
    );
};
