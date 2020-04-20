import React, { useState } from 'react';
import { Sudoku, Box } from '../types/sudoku';
import { arePeerBoxes, isCandidateDiscarded } from '../logic/sudoku-operations';
import {
    isBoxColumnInvalid,
    isBoxRegionInvalid,
    isBoxRowInvalid,
    lockRandomMaximumImpactBox
} from '../logic/sudoku-rules';

interface BoxCandidate {
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
    const [highlightDiscardedCandidates, setHighlightDiscardedCandidates] = useState(true);
    const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [selectedBoxCandidate, setSelectedBoxCandidate] = useState<BoxCandidate | undefined>(
        undefined
    );

    const displayCandidatesHandler = () => {
        setDisplayCandidates(!displayCandidates);
    };

    const displayCandidatesImpact = () => {
        setCandidatesDisplayMode('impact');
    };

    const displayCandidatesNumber = () => {
        setCandidatesDisplayMode('number');
    };

    const highlightDiscardedCandidatesHandler = () => {
        setHighlightDiscardedCandidates(!highlightDiscardedCandidates);
    };

    const highlightMaximumImpactHandler = () => {
        setHighlightMaximumImpact(!highlightMaximumImpact);
    };

    const lockSelectedCandidateHandler = () => {
        if (selectedBoxCandidate !== undefined) {
            props.lockBox(selectedBoxCandidate.box, selectedBoxCandidate.number);
            setSelectedBoxCandidate(undefined);
        }
    };

    return (
        <React.Fragment>
            <div className="screen-splitter">
                <div>
                    <div className={`sudoku-grid size-${props.sudoku.size}`}>
                        {props.sudoku.boxes.map((box) => {
                            const isSelectedBoxPeer =
                                selectedBoxCandidate !== undefined &&
                                arePeerBoxes(selectedBoxCandidate.box, box);

                            const isLatestLockedBox =
                                props.sudoku.latestLockedBox &&
                                props.sudoku.latestLockedBox.id === box.id;

                            return (
                                <div
                                    className={`sudoku-box${box.isLocked ? ' locked-box' : ''}${
                                        isLatestLockedBox ? ' latest-locked-box' : ''
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
                                    }`}
                                >
                                    {box.isLocked
                                        ? box.number
                                        : box.candidates.map((candidate) => {
                                              const isDiscardedCandidate =
                                                  highlightDiscardedCandidates &&
                                                  isCandidateDiscarded(candidate);

                                              const candidateImpact = highlightDiscardedCandidates
                                                  ? candidate.impact
                                                  : candidate.impactWithoutDiscards;

                                              const isSelectedCandidate =
                                                  selectedBoxCandidate !== undefined &&
                                                  selectedBoxCandidate.box === box &&
                                                  selectedBoxCandidate.number === candidate.number;

                                              const isAffectedCandidate =
                                                  !box.isLocked &&
                                                  (!highlightDiscardedCandidates ||
                                                      !isDiscardedCandidate) &&
                                                  isSelectedBoxPeer &&
                                                  selectedBoxCandidate!.box !== box &&
                                                  selectedBoxCandidate!.number === candidate.number;

                                              const isMaximumImpactCandidate =
                                                  highlightMaximumImpact &&
                                                  props.sudoku.maximumImpact === candidate.impact;

                                              const candidateClickHandler = () => {
                                                  const isCandidateSelected =
                                                      selectedBoxCandidate !== undefined &&
                                                      selectedBoxCandidate.box === box &&
                                                      selectedBoxCandidate.number ===
                                                          candidate.number;

                                                  if (isCandidateSelected) {
                                                      lockSelectedCandidateHandler();
                                                  } else {
                                                      setSelectedBoxCandidate({
                                                          box,
                                                          number: candidate.number
                                                      });
                                                  }
                                              };

                                              return (
                                                  <div
                                                      className={`sudoku-candidate${
                                                          displayCandidates
                                                              ? ''
                                                              : ' hidden-candidate'
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
                                                          highlightDiscardedCandidates &&
                                                          candidate.isDiscardedByLock
                                                              ? ' discarded-by-lock'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isTheOnlyCandidateLeftForThisBox
                                                              ? ' only-candidate-left-for-this-box'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isTheOnlyCandidateLeftForAPeerBox
                                                              ? ' only-candidate-left-for-a-peer-box'
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
                                onClick={highlightDiscardedCandidatesHandler}
                                checked={highlightDiscardedCandidates}
                            />{' '}
                            Highlight discarded candidates
                        </p>

                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightMaximumImpactHandler}
                                checked={highlightMaximumImpact}
                            />{' '}
                            Highlight maximum impact candidates
                        </p>
                    </div>
                    <div>
                        <h3>Actions</h3>
                        <p>
                            <button type="button" onClick={lockSelectedCandidateHandler}>
                                Lock selected candidate
                            </button>
                        </p>
                        <p>
                            <button
                                type="button"
                                onClick={() => setSelectedBoxCandidate(undefined)}
                            >
                                Unselect selected candidate
                            </button>
                        </p>
                        <p>
                            <button
                                type="button"
                                onClick={() => lockRandomMaximumImpactBox(props.sudoku)}
                            >
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
