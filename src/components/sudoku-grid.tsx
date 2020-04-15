import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';
import {
    arePeerBoxes,
    getRandomElement,
    isBoxInInvalidGroup,
    isValidBox,
    isValidCandidate,
    isInferableBox,
    getBoxInferredNumber
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
            box.candidates.find(
                (candidate) =>
                    isValidCandidate(candidate) && candidate.impact === props.sudoku.maximumImpact
            )
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
                    const isInvalidBox = !isValidBox(box);
                    const isBoxInferable = isInferableBox(box);
                    const isResolvedBox =
                        box.isLocked || (useCandidatesInferring && isBoxInferable);
                    const isSelectedBoxPeer =
                        selectedBoxNumber !== undefined && arePeerBoxes(selectedBoxNumber.box, box);

                    return (
                        <div
                            className={`sudoku-box ${isResolvedBox ? 'resolved-box' : 'open-box'}${
                                isBoxInInvalidGroup(props.sudoku, box)
                                    ? ' inside-invalid-group'
                                    : ''
                            }${isInvalidBox ? ' invalid-box' : ''}${
                                highlightInferableCandidates && isBoxInferable
                                    ? ' inferable-box'
                                    : ''
                            }`}
                        >
                            {box.isLocked
                                ? box.number
                                : useCandidatesInferring && isBoxInferable
                                ? getBoxInferredNumber(box) || '?'
                                : box.candidates.map((candidate) => {
                                      const isInvalidCandidate = !isValidCandidate(
                                          candidate,
                                          useCandidatesInferring
                                      );

                                      const highlightDiscardedCandidates =
                                          highlightInferableCandidates && !useCandidatesInferring;

                                      const isSingleCandidateInBoxPeer =
                                          highlightDiscardedCandidates &&
                                          candidate.isSingleCandidateInBoxPeer;

                                      const isSingleCandidateInGroupPeer =
                                          highlightDiscardedCandidates &&
                                          candidate.isSingleCandidateInGroupPeer;

                                      const candidateImpact = useCandidatesInferring
                                          ? candidate.impact
                                          : candidate.impactWithoutInferring;

                                      const isSelectedCandidate =
                                          selectedBoxNumber !== undefined &&
                                          selectedBoxNumber.box === box &&
                                          selectedBoxNumber.number === candidate.number;

                                      const isAffectedCandidate =
                                          !isInvalidCandidate &&
                                          isSelectedBoxPeer &&
                                          selectedBoxNumber!.box !== box &&
                                          selectedBoxNumber!.number === candidate.number;

                                      const isMaximumImpactCandidate =
                                          displayImpact &&
                                          highlightMaximumImpact &&
                                          props.sudoku.maximumImpact === candidate.impact;

                                      const candidateClickHandler = () => {
                                          if (!isInvalidCandidate) {
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
                                              }${isInvalidCandidate ? ' invalid-candidate' : ''}${
                                                  isMaximumImpactCandidate
                                                      ? ' maximum-impact-candidate'
                                                      : ''
                                              }${isSelectedCandidate ? ' selected-candidate' : ''}${
                                                  isAffectedCandidate ? ' affected-candidate' : ''
                                              }${
                                                  isSingleCandidateInBoxPeer
                                                      ? ' single-candidate-in-box-peer'
                                                      : ''
                                              }${
                                                  isSingleCandidateInGroupPeer
                                                      ? ' single-candidate-for-group-in-box-peer'
                                                      : ''
                                              }`}
                                              onClick={candidateClickHandler}
                                          >
                                              {displayCandidates &&
                                                  (displayImpact
                                                      ? candidateImpact
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
