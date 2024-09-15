import React from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
    let tooltipPositionClasses = '';
    let arrowPositionClasses = '';
    let arrowStyles = {};

    switch (position) {
        case 'top':
            tooltipPositionClasses =
                'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
            arrowPositionClasses = 'left-1/2 transform -translate-x-1/2';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid black',
                bottom: '-5px',
            };
            break;
        case 'bottom':
            tooltipPositionClasses =
                'top-full left-1/2 transform -translate-x-1/2 mt-2';
            arrowPositionClasses = 'left-1/2 transform -translate-x-1/2';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid black',
                top: '-5px',
            };
            break;
        case 'left':
            tooltipPositionClasses =
                'right-full top-1/2 transform -translate-y-1/2 mr-2';
            arrowPositionClasses = 'top-1/2 transform -translate-y-1/2';
            arrowStyles = {
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '5px solid black',
                right: '-5px',
            };
            break;
        case 'right':
            tooltipPositionClasses =
                'left-full top-1/2 transform -translate-y-1/2 ml-2';
            arrowPositionClasses = 'top-1/2 transform -translate-y-1/2';
            arrowStyles = {
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '5px solid black',
                left: '-5px',
            };
            break;
        case 'top-left':
            tooltipPositionClasses = 'bottom-full left-0 mb-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid black',
                bottom: '-5px',
                left: '10px',
            };
            break;
        case 'top-right':
            tooltipPositionClasses = 'bottom-full right-0 mb-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid black',
                bottom: '-5px',
                right: '10px',
            };
            break;
        case 'bottom-left':
            tooltipPositionClasses = 'top-full left-0 mt-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid black',
                top: '-5px',
                left: '10px',
            };
            break;
        case 'bottom-right':
            tooltipPositionClasses = 'top-full right-0 mt-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid black',
                top: '-5px',
                right: '10px',
            };
            break;
        case 'left-top':
            tooltipPositionClasses = 'right-full top-0 mr-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '5px solid black',
                right: '-5px',
                top: '10px',
            };
            break;
        case 'left-bottom':
            tooltipPositionClasses = 'right-full bottom-0 mr-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '5px solid black',
                right: '-5px',
                bottom: '10px',
            };
            break;
        case 'right-top':
            tooltipPositionClasses = 'left-full top-0 ml-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '5px solid black',
                left: '-5px',
                top: '10px',
            };
            break;
        case 'right-bottom':
            tooltipPositionClasses = 'left-full bottom-0 ml-2';
            arrowPositionClasses = '';
            arrowStyles = {
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '5px solid black',
                left: '-5px',
                bottom: '10px',
            };
            break;
        default:
            tooltipPositionClasses =
                'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
            arrowPositionClasses = 'left-1/2 transform -translate-x-1/2';
            arrowStyles = {
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid black',
                bottom: '-5px',
            };
            break;
    }

    return (
        <div className="relative group inline-block">
            {children}
            <div
                onMouseEnter={(e) => e.stopPropagation()}
                className={`absolute z-10 whitespace-nowrap pointer-events-none bg-black text-white text-xs px-2 py-1 rounded scale-50 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ${tooltipPositionClasses} hidden sm:block`}
            >
                {content}
                <div
                    className={`absolute w-0 h-0 ${arrowPositionClasses}`}
                    style={arrowStyles}
                ></div>
            </div>
        </div>
    );
};

export default Tooltip;