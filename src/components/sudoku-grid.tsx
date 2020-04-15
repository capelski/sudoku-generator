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
    const [useCandidatesInferring, setUseCandidatesInferring] = useState(true);

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
            <div className="screen-splitter">
                <div className={`sudoku-grid size-${props.sudoku.size}`}>
                    {props.sudoku.boxes.map((box) => {
                        const isInvalidBox = !isValidBox(box, useCandidatesInferring);
                        const isBoxInferable = isInferableBox(box);
                        const isResolvedBox =
                            box.isLocked || (useCandidatesInferring && isBoxInferable);
                        const isSelectedBoxPeer =
                            selectedBoxNumber !== undefined &&
                            arePeerBoxes(selectedBoxNumber.box, box);

                        return (
                            <div
                                className={`sudoku-box ${
                                    isResolvedBox ? 'resolved-box' : 'open-box'
                                }${
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

                                          const isSingleCandidateInBoxPeer =
                                              highlightInferableCandidates &&
                                              candidate.isSingleCandidateInBoxPeer;

                                          const isSingleCandidateInGroupPeer =
                                              highlightInferableCandidates &&
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
                                              candidatesDisplayMode === 'impact' &&
                                              highlightMaximumImpact &&
                                              props.sudoku.maximumImpact === candidate.impact;

                                          const candidateClickHandler = () => {
                                              if (
                                                  !isInvalidCandidate &&
                                                  (selectedBoxNumber === undefined ||
                                                      selectedBoxNumber.box !== box)
                                              ) {
                                                  setSelectedBoxNumber({
                                                      box,
                                                      number: candidate.number
                                                  });
                                              } else if (
                                                  !isInvalidCandidate &&
                                                  selectedBoxNumber !== undefined &&
                                                  selectedBoxNumber.box === box
                                              ) {
                                                  lockSelectedBoxHandler();
                                              }
                                          };

                                          return (
                                              <div
                                                  className={`sudoku-candidate${
                                                      displayCandidates ? '' : ' hidden-candidate'
                                                  }${
                                                      isInvalidCandidate ? ' invalid-candidate' : ''
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
                <div>
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
                                onClick={useCandidatesInferringHandler}
                                checked={useCandidatesInferring}
                            />{' '}
                            Automatically infer candidates
                        </p>

                        <p>
                            <input
                                type="checkbox"
                                onClick={highlightInferableCandidatesHandler}
                                checked={highlightInferableCandidates}
                            />{' '}
                            Highlight inferable candidates
                        </p>
                    </div>
                    <div>
                        <h3>Actions</h3>
                        <p>
                            <button type="button" onClick={selectRandomMaximumImpactBox}>
                                Select random candidate (with maximum impact)
                            </button>
                        </p>
                        <p>
                            <button type="button" onClick={lockSelectedBoxHandler}>
                                Lock selected box
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
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};
