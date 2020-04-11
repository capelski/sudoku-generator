import React from 'react';

interface GridProps {
    size: number;
}

export const Grid: React.FC<GridProps> = (props) => {
    return (
        <div className={`sudoku-grid size-${props.size}`}>
            {[...Array(props.size)].map((_x, rowIndex) => (
                <div className="sudoku-row">
                    {[...Array(props.size)].map((_y, boxIndex) => (
                        <div className="sudoku-box">
                            {[...Array(props.size)].map((_z, candidateIndex) => (
                                <div className="sudoku-candidate">{candidateIndex + 1}</div>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
