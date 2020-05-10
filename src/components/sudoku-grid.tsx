import React, { useState, useEffect } from 'react';
import { getSudokuComputedData } from '../logic/sudoku-operations';
import {
    arePeerBoxes,
    isCandidateDiscarded,
    isCandidateInferred,
    isGroupInvalid,
    isSudokuReadyToBeSolved
} from '../logic/sudoku-rules';
import { BoxCandidate, Sudoku } from '../types/sudoku';
import { resources } from './resources';

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
    const [displayCandidates, setDisplayCandidates] = useState(true);
    const [highlightAffectedCandidates, setHighlightAffectedCandidates] = useState(true);
    const [highlightCandidateRestrictions, setHighlightCandidateRestrictions] = useState(false);
    const [highlightDiscardedNumbers, setHighlightDiscardedNumbers] = useState(false);
    const [highlightInferredNumbers, setHighlightInferredNumbers] = useState(false);
    const [highlightInvalidGroups, setHighlightInvalidGroups] = useState(false);
    const [highlightLatestFilledBox, setHighlightFilledBox] = useState(false);
    const [language, setLanguage] = useState<'cat' | 'eng'>('eng');
    // const [highlightMaximumImpact, setHighlightMaximumImpact] = useState(false);
    const [selectedBoxCandidate, setSelectedBoxCandidate] = useState<BoxCandidate | undefined>(
        undefined
    );
    const [solutionLevel, setSolutionLevel] = useState(1);

    useEffect(() => {
        setSolutionLevel(1);
    }, [props.sudoku]);

    const sudokuComputedData = getSudokuComputedData(props.sudoku);
    const isSudokuReady = isSudokuReadyToBeSolved(sudokuComputedData);

    const displayCandidatesHandler = () => {
        if (displayCandidates) {
            setHighlightAffectedCandidates(false);
            setHighlightCandidateRestrictions(false);
            setHighlightInferredNumbers(false);
            setHighlightDiscardedNumbers(false);
            setSolutionLevel(1);
        }
        setDisplayCandidates(!displayCandidates);
    };

    // const displayCandidatesImpact = () => {
    //     setCandidatesDisplayMode('impact');
    // };

    // const displayCandidatesNumber = () => {
    //     setCandidatesDisplayMode('number');
    // };

    const highlightAffectedCandidatesHandler = () => {
        setHighlightAffectedCandidates(!highlightAffectedCandidates);
    };

    const highlightCandidateRestrictionsHandler = () => {
        setHighlightCandidateRestrictions(!highlightCandidateRestrictions);
    };

    const highlightInferredNumbersHandler = () => {
        setHighlightInferredNumbers(!highlightInferredNumbers);
    };

    const highlightDiscardedNumbersHandler = () => {
        setHighlightDiscardedNumbers(!highlightDiscardedNumbers);
    };

    const highlightInvalidGroupsHandler = () => {
        setHighlightInvalidGroups(!highlightInvalidGroups);
    };

    const highlightLatestFilledBoxHandler = () => {
        setHighlightFilledBox(!highlightLatestFilledBox);
    };

    // const highlightMaximumImpactHandler = () => {
    //     setHighlightMaximumImpact(!highlightMaximumImpact);
    // };

    const latestFilledBoxId = props.sudoku.locksHistory[props.sudoku.locksHistory.length - 1];

    const lockSelectedCandidateHandler = () => {
        if (selectedBoxCandidate !== undefined) {
            props.lockBox(selectedBoxCandidate.boxId, selectedBoxCandidate.number);
            setSelectedBoxCandidate(undefined);
        }
    };

    return (
        <React.Fragment>
            <div className="max-square">
                <div className={`sudoku-grid size-${sudokuComputedData.size}`}>
                    {sudokuComputedData.boxes.map((box) => {
                        const isSelectedBox =
                            selectedBoxCandidate !== undefined &&
                            selectedBoxCandidate.boxId === box.id &&
                            selectedBoxCandidate.number === -1;

                        const isSelectedBoxPeer =
                            selectedBoxCandidate !== undefined &&
                            arePeerBoxes(sudokuComputedData.boxes[selectedBoxCandidate.boxId], box);

                        const isLatestFilledBox = latestFilledBoxId && latestFilledBoxId === box.id;

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
                            ] <= solutionLevel;

                        const isCausingChoice =
                            highlightCandidateRestrictions &&
                            selectedBoxCandidate &&
                            box.causedChoices[selectedBoxCandidate.number] &&
                            box.causedChoices[selectedBoxCandidate.number][
                                selectedBoxCandidate.boxId
                            ] !== undefined &&
                            box.causedChoices[selectedBoxCandidate.number][
                                selectedBoxCandidate.boxId
                            ] <= solutionLevel;

                        return (
                            <div
                                onClick={boxClickHandler}
                                className={`sudoku-box${box.isLocked ? ' locked-box' : ''}${
                                    isSelectedBox ? ' selected-box' : ''
                                }${isCausingDiscard ? ' discard-cause' : ''}${
                                    isCausingChoice ? ' choice-cause' : ''
                                }${
                                    highlightLatestFilledBox && isLatestFilledBox
                                        ? ' latest-filled-box'
                                        : ''
                                }${
                                    highlightInvalidGroups &&
                                    isGroupInvalid(box.groups.column, solutionLevel)
                                        ? ' inside-invalid-column'
                                        : ''
                                }${
                                    highlightInvalidGroups &&
                                    isGroupInvalid(box.groups.region, solutionLevel)
                                        ? ' inside-invalid-region'
                                        : ''
                                }${
                                    highlightInvalidGroups &&
                                    isGroupInvalid(box.groups.row, solutionLevel)
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
                                              highlightAffectedCandidates &&
                                              !box.isLocked &&
                                              (!highlightDiscardedNumbers ||
                                                  !isCandidateDiscarded(
                                                      candidate,
                                                      solutionLevel
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
                                                      displayCandidates ? '' : ' hidden-candidate'
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
                                                      highlightDiscardedNumbers &&
                                                      isCandidateDiscarded(candidate, solutionLevel)
                                                          ? ' discarded-candidate'
                                                          : ''
                                                  }${
                                                      highlightDiscardedNumbers &&
                                                      candidate.discardRound === solutionLevel &&
                                                      solutionLevel > 1
                                                          ? ' discarded-immediately-next'
                                                          : ''
                                                  }${
                                                      highlightInferredNumbers &&
                                                      isCandidateInferred(candidate, solutionLevel)
                                                          ? ' inferred-candidate'
                                                          : ''
                                                  }${
                                                      highlightInferredNumbers &&
                                                      candidate.inferRound === solutionLevel &&
                                                      solutionLevel > 1
                                                          ? ' inferred-immediately-next'
                                                          : ''
                                                  }`}
                                                  onClick={candidateClickHandler}
                                                  data-discard-reason={candidate.discardReason}
                                                  data-infer-reason={candidate.inferReason}
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
                    <button className="button" type="button" onClick={props.generateSolvableSudoku}>
                        {resources[language].generateSudoku}
                    </button>
                </p>
                <p>
                    <button className="button" type="button" onClick={props.previousSudoku}>
                        {resources[language].undo}
                    </button>{' '}
                    <button className="button" type="button" onClick={props.nextSudoku}>
                        {resources[language].redo}
                    </button>
                </p>
                <p>
                    <button
                        className="button"
                        type="button"
                        onClick={() => setSelectedBoxCandidate(undefined)}
                    >
                        {resources[language].unselect}
                    </button>
                </p>
                <p>
                    <button
                        className="button"
                        type="button"
                        onClick={() => props.resetSudoku(props.sudoku.regionSize)}
                    >
                        {resources[language].eraseSudoku}
                    </button>
                </p>
                <p>
                    <input
                        type="radio"
                        onClick={() => props.resetSudoku(2)}
                        checked={sudokuComputedData.size === 4}
                    />{' '}
                    4x4{' '}
                    <input
                        type="radio"
                        onClick={() => props.resetSudoku(3)}
                        checked={sudokuComputedData.size === 9}
                    />{' '}
                    9x9
                </p>
                <p>
                    <input
                        type="checkbox"
                        onClick={displayCandidatesHandler}
                        checked={!displayCandidates}
                    />
                    {` ${resources[language].hideCandidates}`}
                </p>
                <p>
                    {resources[language].canSudokuBeSolved}{' '}
                    <b>{isSudokuReady ? resources[language].yes : resources[language].no}</b>
                </p>
                <p>{props.locksNumber + ' ' + resources[language].filledBoxes}</p>
                <p>
                    🌎{' '}
                    <span
                        className={`language ${language === 'cat' ? ' selected' : ''}`}
                        onClick={() => setLanguage('cat')}
                    >
                        Català
                    </span>
                    <span
                        className={`language ${language === 'eng' ? ' selected' : ''}`}
                        onClick={() => setLanguage('eng')}
                    >
                        English
                    </span>
                </p>

                <div>
                    <h3>{resources[language].highlighting}</h3>
                    <p>
                        <input
                            type="checkbox"
                            onClick={highlightAffectedCandidatesHandler}
                            checked={highlightAffectedCandidates}
                        />
                        {' ' + resources[language].affectedCandidates + ' '}
                        <span className="color-legend affected-candidates"></span>
                    </p>
                    <p>
                        <input
                            type="checkbox"
                            onClick={highlightLatestFilledBoxHandler}
                            checked={highlightLatestFilledBox}
                        />
                        {' ' + resources[language].latestFilledBox + ' '}
                        <span className="color-legend latest-filled-box"></span>
                    </p>
                    <p>
                        <input
                            type="checkbox"
                            onClick={highlightInvalidGroupsHandler}
                            checked={highlightInvalidGroups}
                        />
                        {' ' + resources[language].invalidGroups + ' (*) '}
                        <span className="color-legend invalid-groups"></span>
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
                            onClick={highlightDiscardedNumbersHandler}
                            checked={highlightDiscardedNumbers}
                            disabled={!displayCandidates}
                        />
                        {' ' + resources[language].discardedNumbers + ' (*) '}
                        <span className="color-legend discarded-numbers"></span>
                    </p>
                    <p>
                        <input
                            type="checkbox"
                            onClick={highlightInferredNumbersHandler}
                            checked={highlightInferredNumbers}
                            disabled={!displayCandidates}
                        />
                        {' ' + resources[language].inferredNumbers + ' (*) '}
                        <span className="color-legend inferred-numbers"></span>
                    </p>
                    <p>
                        <input
                            type="checkbox"
                            onClick={highlightCandidateRestrictionsHandler}
                            checked={highlightCandidateRestrictions}
                            disabled={!displayCandidates}
                        />
                        {' ' + resources[language].discardInferReason + ' (*) '}
                        <span className="color-legend candidate-restriction"></span>
                    </p>
                    <p>
                        (*) {resources[language].solutionLevel + ': ' + solutionLevel + ' '}
                        <button
                            className="button"
                            type="button"
                            onClick={() => setSolutionLevel(solutionLevel + 1)}
                        >
                            +
                        </button>{' '}
                        <button
                            className="button"
                            type="button"
                            onClick={() => setSolutionLevel(Math.max(solutionLevel - 1, 1))}
                        >
                            -
                        </button>
                    </p>
                </div>
            </div>
        </React.Fragment>
    );
};
