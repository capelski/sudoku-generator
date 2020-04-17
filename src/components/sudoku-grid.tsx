import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';
import {
    arePeerBoxes,
    getRandomElement,
    isBoxColumnInvalid,
    isBoxRegionInvalid,
    isBoxRowInvalid,
    isInferableBox,
    isValidBox,
    isValidCandidate,
    getBoxInferredNumber
} from '../logic/sudoku-logic';

interface BoxNumber {
    box: Box;
    number: number;
}

type CandidateDisplayMode = 'number' | 'impact';

interface GridProps {
    lockBox: (selectedBox: Box, selectedNumber: number) => void;
    locksNumber: number;
    nextSudoku: () => void;
    previousSudoku: () => void;
    resetSudoku: (size: number) => void;
    sudoku: Sudoku;
}

export const SudokuGrid: React.FC<GridProps> = (props) => {
    const [candidatesDisplayMode, setCandidatesDisplayMode] = useState<CandidateDisplayMode>(
        'number'
    );
    const [displayCandidates, setDisplayCandidates] = useState(true);
    const [highlightInferableCandidates, setHighlightInferableCandidates] = useState(true);
    const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<BoxNumber | undefined>(undefined);
    const [automaticInferring, setAutomaticInferring] = useState(false);

    const automaticInferringHandler = () => {
        setAutomaticInferring(!automaticInferring);
    };

    const displayCandidatesHandler = () => {
        setDisplayCandidates(!displayCandidates);
    };

    const displayCandidatesImpact = () => {
        setCandidatesDisplayMode('impact');
    };

    const displayCandidatesNumber = () => {
        setCandidatesDisplayMode('number');
    };

    const highlightInferableCandidatesHandler = () => {
        setHighlightInferableCandidates(!highlightInferableCandidates);
    };

    const highlightMaximumImpactHandler = () => {
        setHighlightMaximumImpact(!highlightMaximumImpact);
    };

    const lockRandomMaximumImpactBox = () => {
        const maximumImpactBoxes = props.sudoku.boxes.filter(
            (box) =>
                !box.isLocked &&
                box.candidates.find(
                    (candidate) =>
                        isValidCandidate(candidate) &&
                        candidate.impact === props.sudoku.maximumImpact
                )
        );

        if (maximumImpactBoxes.length > 0) {
            const randomBox = getRandomElement(maximumImpactBoxes);

            const maximumImpactCandidates = randomBox.candidates.filter(
                (candidate) =>
                    isValidCandidate(candidate) && candidate.impact === props.sudoku.maximumImpact
            );
            const randomCandidate = getRandomElement(maximumImpactCandidates);

            console.log('Locking', randomCandidate.number, 'in', randomBox.row, randomBox.column);
            props.lockBox(randomBox, randomCandidate.number);
        }
    };

    const lockSelectedBoxHandler = () => {
        if (selectedBoxNumber !== undefined) {
            props.lockBox(selectedBoxNumber.box, selectedBoxNumber.number);
            setSelectedBoxNumber(undefined);
        }
    };

    return (
        <React.Fragment>
            <div className="screen-splitter">
                <div>
                    <div className={`sudoku-grid size-${props.sudoku.size}`}>
                        {props.sudoku.boxes.map((box) => {
                            const isInvalidBox = !isValidBox(box, automaticInferring);
                            const isBoxInferable = isInferableBox(box);
                            const isResolvedBox =
                                box.isLocked || (automaticInferring && isBoxInferable);
                            const isSelectedBoxPeer =
                                selectedBoxNumber !== undefined &&
                                arePeerBoxes(selectedBoxNumber.box, box);

                            return (
                                <div
                                    className={`sudoku-box ${
                                        isResolvedBox ? 'resolved-box' : 'open-box'
                                    }${
                                        isBoxColumnInvalid(props.sudoku, box)
                                            ? ' inside-invalid-column'
                                            : ''
                                    }${
                                        isBoxRegionInvalid(props.sudoku, box)
                                            ? ' inside-invalid-region'
                                            : ''
                                    }${
                                        isBoxRowInvalid(props.sudoku, box)
                                            ? ' inside-invalid-row'
                                            : ''
                                    }${isInvalidBox ? ' invalid-box' : ''}${
                                        highlightInferableCandidates && isBoxInferable
                                            ? ' inferable-box'
                                            : ''
                                    }`}
                                >
                                    {box.isLocked
                                        ? box.number
                                        : automaticInferring && isBoxInferable
                                        ? getBoxInferredNumber(box) || '?'
                                        : box.candidates.map((candidate) => {
                                              const isInvalidCandidate = !isValidCandidate(
                                                  candidate,
                                                  automaticInferring
                                              );

                                              const candidateImpact = automaticInferring
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
                                                  highlightMaximumImpact &&
                                                  props.sudoku.maximumImpact === candidate.impact;

                                              const candidateClickHandler = () => {
                                                  const isCandidateSelected =
                                                      selectedBoxNumber !== undefined &&
                                                      selectedBoxNumber.box === box &&
                                                      selectedBoxNumber.number === candidate.number;

                                                  if (!isCandidateSelected && !isInvalidCandidate) {
                                                      setSelectedBoxNumber({
                                                          box,
                                                          number: candidate.number
                                                      });
                                                  } else if (isCandidateSelected) {
                                                      lockSelectedBoxHandler();
                                                  }
                                              };

                                              return (
                                                  <div
                                                      className={`sudoku-candidate${
                                                          displayCandidates
                                                              ? ''
                                                              : ' hidden-candidate'
                                                      }${
                                                          isInvalidCandidate
                                                              ? ' invalid-candidate'
                                                              : ''
                                                      }${
                                                          isMaximumImpactCandidate
                                                              ? ' maximum-impact-candidate'
                                                              : ''
                                                      }${
                                                          isSelectedCandidate
                                                              ? ' selected-candidate'
                                                              : ''
                                                      }${
                                                          isAffectedCandidate
                                                              ? ' affected-candidate'
                                                              : ''
                                                      }${
                                                          candidate.isBoxSingleCandidate
                                                              ? ' box-single-candidate'
                                                              : ''
                                                      }${
                                                          candidate.isGroupSingleCandidate
                                                              ? ' group-single-candidate'
                                                              : ''
                                                      }${
                                                          highlightInferableCandidates &&
                                                          candidate.isDiscardedByBoxSingleCandidateInPeerBox
                                                              ? ' discarded-by-box-single-candidate-in-peer-box'
                                                              : ''
                                                      }${
                                                          highlightInferableCandidates &&
                                                          candidate.isDiscardedByGroupSingleCandidateInSameBox
                                                              ? ' discarded-by-group-single-candidate-in-same-box'
                                                              : ''
                                                      }${
                                                          highlightInferableCandidates &&
                                                          candidate.isDiscardedByBoxesNumbersGroupRestriction
                                                              ? ' discarded-by-boxes-numbers-group-restriction'
                                                              : ''
                                                      }`}
                                                      onClick={candidateClickHandler}
                                                  >
                                                      {displayCandidates &&
                                                          (candidatesDisplayMode === 'impact'
                                                              ? candidateImpact
                                                              : candidate.number)}
                                                  </div>
                                              );
                                          })}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <div>{props.locksNumber} locked boxes</div>
                    <p>
                        <input
                            type="radio"
                            onClick={() => props.resetSudoku(2)}
                            checked={props.sudoku.size === 4}
                        />{' '}
                        4x4
                    </p>
                    <p>
                        <input
                            type="radio"
                            onClick={() => props.resetSudoku(3)}
                            checked={props.sudoku.size === 9}
                        />{' '}
                        9x9
                    </p>

                    <div>
                        <h3>Display options</h3>
                        <p>
                            <input
                                type="checkbox"
                                onClick={displayCandidatesHandler}
                                checked={displayCandidates}
                            />{' '}
                            Display candidates
                        </p>

                        <p>
                            <input
                                type="radio"
                                onClick={displayCandidatesNumber}
                                checked={candidatesDisplayMode === 'number'}
                            />{' '}
                            Show candidates number
                        </p>
                        <p>
                            <input
                                type="radio"
                                onClick={displayCandidatesImpact}
                                checked={candidatesDisplayMode === 'impact'}
                            />{' '}
                            Show candidates impact
                        </p>

                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightMaximumImpactHandler}
                                checked={highlightMaximumImpact}
                            />{' '}
                            Highlight maximum impact candidates
                        </p>

                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightInferableCandidatesHandler}
                                checked={highlightInferableCandidates}
                            />{' '}
                            Highlight inferable candidates
                        </p>
                        <p>
                            <input
                                type="checkbox"
                                onClick={automaticInferringHandler}
                                checked={automaticInferring}
                            />{' '}
                            Automatically infer candidates
                        </p>
                    </div>
                    <div>
                        <h3>Actions</h3>
                        <p>
                            <button type="button" onClick={lockSelectedBoxHandler}>
                                Lock selected box
                            </button>
                        </p>
                        <p>
                            <button type="button" onClick={lockRandomMaximumImpactBox}>
                                Lock random candidate (with maximum impact)
                            </button>
                        </p>
                        <p>
                            <button type="button" onClick={props.previousSudoku}>
                                Previous lock
                            </button>
                        </p>
                        <p>
                            <button type="button" onClick={props.nextSudoku}>
                                Next lock
                            </button>
                        </p>
                        <p>
                            <button
                                type="button"
                                onClick={() => props.resetSudoku(props.sudoku.regionSize)}
                            >
                                Clear sudoku
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};
