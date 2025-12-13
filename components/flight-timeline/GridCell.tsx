'use client';

interface GridCellProps {
    isDayMode?: boolean;
    isHoverHighlight?: boolean;
    item?: {
        position: {
            top: number;
            left: number;
            width: number;
            height: number;
        };
        [key: string]: any;
    };
    index?: number;
    timelineDividerArray?: number[];
    gridDividerProps?: {
        props: {
            onItemClick: (item: any, index: number) => () => void;
            [key: string]: any;
        };
        styles: {
            left: (index: number) => number;
            width?: number;
            [key: string]: any;
        };
    };
    gridItemClickProps?: Record<string, any>;
    [key: string]: any;
}

export function GridCell(props: GridCellProps) {
    const {
        isDayMode,
        isHoverHighlight,
        item,
        index,
        timelineDividerArray = [],
        gridDividerProps,
        gridItemClickProps,
    } = props;

    // If no item, don't render
    if (!item || !item.position) {
        return null;
    }

    const { top, left, width, height } = item.position;

    return (
        <div
            style={{
                position: 'absolute',
                top,
                left,
                width,
                height,
                boxSizing: 'border-box',
            }}
            className={`
                border-b border-slate-200 dark:border-slate-700/50
                ${isHoverHighlight ? 'hover:bg-slate-100/30 dark:hover:bg-slate-800/30' : ''}
            `}
            {...gridItemClickProps}
        >
            {/* Render dividers for day mode */}
            {isDayMode && gridDividerProps &&
                timelineDividerArray.map((_, dividerIndex) => {
                    const { styles, props: dividerComponentProps } = gridDividerProps;
                    const { onItemClick } = dividerComponentProps;
                    const dividerWidth = styles.width || 50;

                    return (
                        <div
                            key={dividerIndex}
                            style={{
                                position: 'absolute',
                                left: styles.left(dividerIndex),
                                top: 0,
                                width: dividerWidth,
                                height: '100%',
                                boxSizing: 'border-box',
                            }}
                            className="border-r border-slate-200 dark:border-slate-700/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors"
                            onClick={onItemClick?.(item, dividerIndex)}
                        />
                    );
                })
            }
        </div>
    );
}
