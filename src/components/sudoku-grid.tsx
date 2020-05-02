import React, { useState } from 'react';
import { getSudokuComputedData } from '../logic/sudoku-operations';
import { isCandidateDiscarded, arePeerBoxes } from '../logic/sudoku-rules';
import { BoxCandidate, InferringMode, Sudoku } from '../types/sudoku';

// type CandidateDisplayMode = 'number' | 'impact';

interface GridProps {
    generateSolvableSudoku: () => void;
    lockBox: (boxId: number, number: number) => void;
    locksNumber: number;
    nextSudoku: () => void;
    previousSudoku: () => void;
    resetSudoku: (size: number) => void;
    sudoku: Sudoku;
    unlockBox: (boxId: number) => void;
}

export const SudokuGrid: React.FC<GridProps> = (props) => {
    // const [candidatesDisplayMode, setCandidatesDisplayMode] = useState<CandidateDisplayMode>(
    //     'number'
    // );
    const [displayCandidates, setDisplayCandidates] = useState(false);
    const [highlightInvalidGroups, setHighlightInvalidGroups] = useState(true);
    const [highlightLatestLockedBox, setHighlightLatestLockedBox] = useState(false);
    // const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [inferringMode, setInferringMode] = useState<InferringMode>('none');
    const [selectedBoxCandidate, setSelectedBoxCandidate] = useState<BoxCandidate | undefined>(
        undefined
    );
    const sudokuComputedData = getSudokuComputedData(props.sudoku, inferringMode);
    // TODO isSudokuReady is no longer valid because of inferringMode
    // const isSudokuReady = isSudokuReadyToBeSolved(sudokuComputedData);

    const displayCandidatesHandler = () => {
        if (displayCandidates) {
            setInferringMode('none');
        }
        setDisplayCandidates(!displayCandidates);
    };

    // const displayCandidatesImpact = () => {
    //     setCandidatesDisplayMode('impact');
    // };

    // const displayCandidatesNumber = () => {
    //     setCandidatesDisplayMode('number');
    // };

    const highlightDiscardedCandidates = inferringMode === 'direct';

    const highlightInvalidGroupsHandler = () => {
        setHighlightInvalidGroups(!highlightInvalidGroups);
    };

    const highlightLatestLockedBoxHandler = () => {
        setHighlightLatestLockedBox(!highlightLatestLockedBox);
    };

    // const highlightMaximumImpactHandler = () => {
    //     setHighlightMaximumImpact(!highlightMaximumImpact);
    // };

    const inferringModeHandler = () => {
        setInferringMode(inferringMode === 'none' ? 'direct' : 'none');
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
                            const isSelectedBox =
                                selectedBoxCandidate !== undefined &&
                                selectedBoxCandidate.boxId === box.id &&
                                selectedBoxCandidate.number === -1;

                            const isSelectedBoxPeer =
                                selectedBoxCandidate !== undefined &&
                                arePeerBoxes(
                                    sudokuComputedData.boxes[selectedBoxCandidate.boxId],
                                    box
                                );

                            const isLatestLockedBox = latestLockedBox && latestLockedBox === box.id;

                            const boxClickHandler = () => {
                                if (box.isLocked) {
                                    if (isSelectedBox) {
                                        props.unlockBox(box.id);
                                        setSelectedBoxCandidate(undefined);
                                    } else {
                                        setSelectedBoxCandidate({
                                            boxId: box.id,
                                            number: -1
                                        });
                                    }
                                }
                            };

                            return (
                                <div
                                    onClick={boxClickHandler}
                                    className={`sudoku-box${box.isLocked ? ' locked-box' : ''}${
                                        isSelectedBox ? ' selected-box' : ''
                                    }${
                                        highlightLatestLockedBox && isLatestLockedBox
                                            ? ' latest-locked-box'
                                            : ''
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

                                              //   const isMaximumImpactCandidate =
                                              //       highlightMaximumImpact &&
                                              //       sudokuComputedData.maximumImpact ===
                                              //           candidate.impact;

                                              const candidateClickHandler = () => {
                                                  if (isSelectedCandidate) {
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
                                                          //   isMaximumImpactCandidate
                                                          //       ? ' maximum-impact-candidate'
                                                          //       : ''
                                                          ''
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
                                                      {/* {displayCandidates &&
                                                          (candidatesDisplayMode === 'impact'
                                                              ? candidate.impact
                                                              : candidate.number)} */}
                                                      {displayCandidates && candidate.number}
                                                  </div>
                                              );
                                          })}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="options">
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
                    <p>
                        <button type="button" onClick={props.generateSolvableSudoku}>
                            Generate sudoku
                        </button>
                    </p>
                    {/* <p>
                        Has single solution? <b>{isSudokuReady ? 'Yes' : 'No'}</b>
                    </p> */}
                    <div>{props.locksNumber} locked boxes</div>

                    <div>
                        <h3>Display options</h3>

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
                                onClick={displayCandidatesHandler}
                                checked={displayCandidates}
                            />{' '}
                            Display candidates
                        </p>

                        {/* <p>
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
                        </p> */}

                        <p>
                            <input
                                type="checkbox"
                                onClick={inferringModeHandler}
                                checked={inferringMode === 'direct'}
                                disabled={!displayCandidates}
                            />{' '}
                            Highlight discarded/chosen candidates
                        </p>

                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightLatestLockedBoxHandler}
                                checked={highlightLatestLockedBox}
                            />{' '}
                            Highlight latest locked box
                        </p>

                        {/* <p>
                            <input
                                type="checkbox"
                                onClick={highlightMaximumImpactHandler}
                                checked={highlightMaximumImpact}
                            />{' '}
                            Highlight maximum impact candidates
                        </p> */}
                    </div>
                    <div>
                        <h3>Actions</h3>
                        <p>
                            <button
                                type="button"
                                onClick={() => setSelectedBoxCandidate(undefined)}
                            >
                                Clear selection
                            </button>
                        </p>
                        <p>
                            <button type="button" onClick={props.previousSudoku}>
                                Undo
                            </button>
                        </p>
                        <p>
                            <button type="button" onClick={props.nextSudoku}>
                                Redo
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
