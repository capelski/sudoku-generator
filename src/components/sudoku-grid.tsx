import React, { useState } from 'react';
import { BoxCandidate, Sudoku } from '../types/sudoku';
import {
    arePeerBoxes,
    getRandomMaximumImpactBox,
    getSudokuComputedData
} from '../logic/sudoku-operations';
import { isCandidateDiscarded } from '../logic/sudoku-rules';

type CandidateDisplayMode = 'number' | 'impact';

interface GridProps {
    lockBox: (boxId: number, number: number) => void;
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
    const [highlightInvalidGroups, setHighlightInvalidGroups] = useState(true);
    const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [selectedBoxCandidate, setSelectedBoxCandidate] = useState<BoxCandidate | undefined>(
        undefined
    );
    const sudokuComputedData = getSudokuComputedData(props.sudoku);

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

    const highlightInvalidGroupsHandler = () => {
        setHighlightInvalidGroups(!highlightInvalidGroups);
    };

    const highlightMaximumImpactHandler = () => {
        setHighlightMaximumImpact(!highlightMaximumImpact);
    };

    const lockRandomMaximumImpactBox = () => {
        const boxCandidate = getRandomMaximumImpactBox(sudokuComputedData);
        if (boxCandidate) {
            props.lockBox(boxCandidate.boxId, boxCandidate.number);
        } else {
            console.log('No box left to lock!');
        }
    };

    const lockSelectedCandidateHandler = () => {
        if (selectedBoxCandidate !== undefined) {
            props.lockBox(selectedBoxCandidate.boxId, selectedBoxCandidate.number);
            setSelectedBoxCandidate(undefined);
        }
    };

    const latestLockedBox = props.sudoku.locksHistory[props.sudoku.locksHistory.length - 1];

    return (
        <React.Fragment>
            <div className="screen-splitter">
                <div>
                    <div className={`sudoku-grid size-${sudokuComputedData.size}`}>
                        {sudokuComputedData.boxes.map((box) => {
                            const isSelectedBoxPeer =
                                selectedBoxCandidate !== undefined &&
                                arePeerBoxes(
                                    sudokuComputedData.boxes[selectedBoxCandidate.boxId],
                                    box
                                );

                            const isLatestLockedBox = latestLockedBox && latestLockedBox === box.id;

                            return (
                                <div
                                    className={`sudoku-box${box.isLocked ? ' locked-box' : ''}${
                                        isLatestLockedBox ? ' latest-locked-box' : ''
                                    }${
                                        highlightInvalidGroups && !box.groups.column.isValid
                                            ? ' inside-invalid-column'
                                            : ''
                                    }${
                                        highlightInvalidGroups && !box.groups.region.isValid
                                            ? ' inside-invalid-region'
                                            : ''
                                    }${
                                        highlightInvalidGroups && !box.groups.row.isValid
                                            ? ' inside-invalid-row'
                                            : ''
                                    }`}
                                >
                                    {box.isLocked
                                        ? box.number
                                        : Object.values(box.candidates).map((candidate) => {
                                              const isDiscardedCandidate =
                                                  highlightDiscardedCandidates &&
                                                  isCandidateDiscarded(candidate);

                                              const candidateImpact = highlightDiscardedCandidates
                                                  ? candidate.impact
                                                  : candidate.impactWithoutDiscards;

                                              const isSelectedCandidate =
                                                  selectedBoxCandidate !== undefined &&
                                                  selectedBoxCandidate.boxId === box.id &&
                                                  selectedBoxCandidate.number === candidate.number;

                                              const isAffectedCandidate =
                                                  !box.isLocked &&
                                                  (!highlightDiscardedCandidates ||
                                                      !isDiscardedCandidate) &&
                                                  isSelectedBoxPeer &&
                                                  selectedBoxCandidate!.boxId !== box.id &&
                                                  selectedBoxCandidate!.number === candidate.number;

                                              const isMaximumImpactCandidate =
                                                  highlightMaximumImpact &&
                                                  sudokuComputedData.maximumImpact ===
                                                      candidate.impact;

                                              const candidateClickHandler = () => {
                                                  const isCandidateSelected =
                                                      selectedBoxCandidate !== undefined &&
                                                      selectedBoxCandidate.boxId === box.id &&
                                                      selectedBoxCandidate.number ===
                                                          candidate.number;

                                                  if (isCandidateSelected) {
                                                      lockSelectedCandidateHandler();
                                                  } else {
                                                      setSelectedBoxCandidate({
                                                          boxId: box.id,
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
                                                          candidate.isDiscardedBecauseOfLock
                                                              ? ' discarded-because-of-lock'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isChosenBecauseIsTheOnlyCandidateLeftForThisBox
                                                              ? ' chosen-because-is-only-candidate-left-for-this-box'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isDiscardedBecauseIsTheOnlyCandidateLeftForAPeerBox
                                                              ? ' discarded-because-is-only-candidate-left-for-a-peer-box'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isChosenBecauseThisBoxMustHoldThisNumberForSomeGroup
                                                              ? ' chosen-because-this-box-must-hold-this-number-for-some-group'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isDiscardedBecausePeerBoxMustHoldThisNumberForSomeGroup
                                                              ? ' discarded-because-peer-box-must-hold-this-number-for-some-group'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isDiscardedBecauseThisBoxMustHoldAnotherNumberForSomeGroup
                                                              ? ' discarded-because-this-box-must-hold-another-number-for-some-group'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isDiscardedBecauseOfOwnedCandidateInSomeGroup
                                                              ? ' discarded-because-of-owned-candidate-in-same-group'
                                                              : ''
                                                      }${
                                                          highlightDiscardedCandidates &&
                                                          candidate.isDiscardedBecauseOfRegionSubset
                                                              ? ' discarded-because-of-region-subset'
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
                            checked={sudokuComputedData.size === 4}
                        />{' '}
                        4x4
                    </p>
                    <p>
                        <input
                            type="radio"
                            onClick={() => props.resetSudoku(3)}
                            checked={sudokuComputedData.size === 9}
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
                                onClick={highlightInvalidGroupsHandler}
                                checked={highlightInvalidGroups}
                            />{' '}
                            Highlight invalid groups
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
