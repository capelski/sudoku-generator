import React, { useState } from 'react';
import { getSudokuComputedData } from '../logic/sudoku-operations';
import {
    arePeerBoxes,
    isChosenCandidate,
    isDiscardedCandidate,
    isSudokuReadyToBeSolved
} from '../logic/sudoku-rules';
import { BoxCandidate, Sudoku } from '../types/sudoku';

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

// TODO
// Put a color square legend next to the ticks
// Implement the missing rule

export const SudokuGrid: React.FC<GridProps> = (props) => {
    // const [candidatesDisplayMode, setCandidatesDisplayMode] = useState<CandidateDisplayMode>(
    //     'number'
    // );
    const [displayCandidates, setDisplayCandidates] = useState(true);
    const [highlightCandidateRestrictions, setHighlightCandidateRestrictions] = useState(false);
    const [highlightInvalidGroups, setHighlightInvalidGroups] = useState(false);
    const [highlightLatestLockedBox, setHighlightLatestLockedBox] = useState(false);
    // const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [revealChosenCandidates, setRevealChosenCandidates] = useState(false);
    const [revealDiscardedCandidates, setRevealDiscardedCandidates] = useState(false);
    const [revealLevel, setRevelLevel] = useState(0);
    const [selectedBoxCandidate, setSelectedBoxCandidate] = useState<BoxCandidate | undefined>(
        undefined
    );

    const sudokuComputedData = getSudokuComputedData(props.sudoku);
    const isSudokuReady = isSudokuReadyToBeSolved(sudokuComputedData);

    const displayCandidatesHandler = () => {
        if (displayCandidates) {
            setRevealChosenCandidates(false);
            setRevealDiscardedCandidates(false);
            setHighlightCandidateRestrictions(false);
        }
        setDisplayCandidates(!displayCandidates);
    };

    // const displayCandidatesImpact = () => {
    //     setCandidatesDisplayMode('impact');
    // };

    // const displayCandidatesNumber = () => {
    //     setCandidatesDisplayMode('number');
    // };

    const highlightCandidateRestrictionsHandler = () => {
        setHighlightCandidateRestrictions(!highlightCandidateRestrictions);
    };

    const highlightInvalidGroupsHandler = () => {
        setHighlightInvalidGroups(!highlightInvalidGroups);
    };

    const highlightLatestLockedBoxHandler = () => {
        setHighlightLatestLockedBox(!highlightLatestLockedBox);
    };

    // const highlightMaximumImpactHandler = () => {
    //     setHighlightMaximumImpact(!highlightMaximumImpact);
    // };

    const latestLockedBox = props.sudoku.locksHistory[props.sudoku.locksHistory.length - 1];

    const lockSelectedCandidateHandler = () => {
        if (selectedBoxCandidate !== undefined) {
            props.lockBox(selectedBoxCandidate.boxId, selectedBoxCandidate.number);
            setSelectedBoxCandidate(undefined);
        }
    };

    const revealChosenCandidatesHandler = () => {
        setRevealChosenCandidates(!revealChosenCandidates);
    };

    const revealDiscardedCandidatesHandler = () => {
        setRevealDiscardedCandidates(!revealDiscardedCandidates);
    };

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

                            // const isBoxNextInferable =
                            //     highlightInferableBoxes &&
                            //     doesBoxHaveAChosenCandidate(box, revealLevel);

                            // const doesBoxHaveACandidateToBeDiscardedNext =
                            //     highlightInferableBoxes &&
                            //     revealLevel > 0 &&
                            //     Object.values(box.candidates).some(
                            //         (c) => c.isDiscarded === revealLevel
                            //     );

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

                            const isCausingDiscard =
                                highlightCandidateRestrictions &&
                                selectedBoxCandidate &&
                                box.causedDiscards[selectedBoxCandidate.number] &&
                                box.causedDiscards[selectedBoxCandidate.number][
                                    selectedBoxCandidate.boxId
                                ] !== undefined &&
                                box.causedDiscards[selectedBoxCandidate.number][
                                    selectedBoxCandidate.boxId
                                ] <= revealLevel;

                            const isCausingChoice =
                                highlightCandidateRestrictions &&
                                selectedBoxCandidate &&
                                box.causedChoices[selectedBoxCandidate.number] &&
                                box.causedChoices[selectedBoxCandidate.number][
                                    selectedBoxCandidate.boxId
                                ] !== undefined &&
                                box.causedChoices[selectedBoxCandidate.number][
                                    selectedBoxCandidate.boxId
                                ] <= revealLevel;
                            return (
                                <div
                                    onClick={boxClickHandler}
                                    className={`sudoku-box${box.isLocked ? ' locked-box' : ''}${
                                        isSelectedBox ? ' selected-box' : ''
                                    }${isCausingDiscard ? ' discard-cause' : ''}${
                                        isCausingChoice ? ' choice-cause' : ''
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
                                              const isSelectedCandidate =
                                                  selectedBoxCandidate !== undefined &&
                                                  selectedBoxCandidate.boxId === box.id &&
                                                  selectedBoxCandidate.number === candidate.number;

                                              const isAffectedCandidate =
                                                  !box.isLocked &&
                                                  (!revealDiscardedCandidates ||
                                                      !isDiscardedCandidate(
                                                          candidate,
                                                          revealLevel
                                                      )) &&
                                                  isSelectedBoxPeer &&
                                                  selectedBoxCandidate!.boxId !== box.id &&
                                                  selectedBoxCandidate!.number === candidate.number;

                                              //   const isMaximumImpactCandidate =
                                              //       highlightMaximumImpact &&
                                              //       sudokuComputedData.maximumImpact ===
                                              //           candidate.impact;

                                              const candidateClickHandler = () => {
                                                  if (displayCandidates && isSelectedCandidate) {
                                                      lockSelectedCandidateHandler();
                                                  } else if (displayCandidates) {
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
                                                          revealDiscardedCandidates &&
                                                          isDiscardedCandidate(
                                                              candidate,
                                                              revealLevel
                                                          )
                                                              ? ' discarded-candidate'
                                                              : ''
                                                      }${
                                                          revealDiscardedCandidates &&
                                                          candidate.isDiscarded === revealLevel &&
                                                          revealLevel > 0
                                                              ? ' discarded-immediately-next'
                                                              : ''
                                                      }${
                                                          revealChosenCandidates &&
                                                          isChosenCandidate(candidate, revealLevel)
                                                              ? ' chosen-candidate'
                                                              : ''
                                                      }${
                                                          revealChosenCandidates &&
                                                          candidate.isChosen === revealLevel
                                                              ? ' chosen-immediately-next'
                                                              : ''
                                                      }`}
                                                      onClick={candidateClickHandler}
                                                      data-discard-reason={
                                                          candidate.discardedReason
                                                      }
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
                    <p>
                        Has single solution? <b>{isSudokuReady ? 'Yes' : 'No'}</b>
                    </p>
                    <div>{props.locksNumber} locked boxes</div>

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
                                type="checkbox"
                                onClick={highlightInvalidGroupsHandler}
                                checked={highlightInvalidGroups}
                            />{' '}
                            Highlight invalid groups
                        </p>
                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightLatestLockedBoxHandler}
                                checked={highlightLatestLockedBox}
                            />{' '}
                            Highlight latest locked box
                        </p>
                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightCandidateRestrictionsHandler}
                                checked={highlightCandidateRestrictions}
                                disabled={!displayCandidates}
                            />{' '}
                            Highlight candidate restrictions
                        </p>
                        {/* <p>
                            <input
                                type="checkbox"
                                onClick={highlightMaximumImpactHandler}
                                checked={highlightMaximumImpact}
                            />{' '}
                            Highlight maximum impact candidates
                        </p> */}
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
                                onClick={revealDiscardedCandidatesHandler}
                                checked={revealDiscardedCandidates}
                                disabled={!displayCandidates}
                            />{' '}
                            Reveal discardable candidates
                        </p>
                        <p>
                            <input
                                type="checkbox"
                                onClick={revealChosenCandidatesHandler}
                                checked={revealChosenCandidates}
                                disabled={!displayCandidates}
                            />{' '}
                            Reveal choosable candidates
                        </p>
                        <p>
                            Reveal level:{' ' + revealLevel + ' '}
                            <button
                                type="button"
                                onClick={() => setRevelLevel(revealLevel + 1)}
                                disabled={
                                    !displayCandidates ||
                                    !(revealChosenCandidates || revealDiscardedCandidates)
                                }
                            >
                                +
                            </button>{' '}
                            <button
                                type="button"
                                onClick={() => setRevelLevel(Math.max(revealLevel - 1, 0))}
                                disabled={
                                    !displayCandidates ||
                                    !(revealChosenCandidates || revealDiscardedCandidates)
                                }
                            >
                                -
                            </button>
                        </p>
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
