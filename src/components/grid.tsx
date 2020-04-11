import React from 'react';

interface GridProps {
    size: number;
}

export const Grid: React.FC<GridProps> = (props) => {
    return (
        <div className={`sudoku-grid size-${props.size}`}>
            {[...Array(props.size)].map((_x, rowIndex) => (
                <div className="sudoku-row">
                    {[...Array(props.size)].map((_y, cellIndex) => (
                        <div className="sudoku-cell">1</div>
                    ))}
                </div>
            ))}
        </div>
    );
};
