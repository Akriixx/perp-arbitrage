import React from 'react';

const AlertBadge = ({ isAlerting }) => {
    if (!isAlerting) return null;

    return (
        <div className="absolute top-0 right-0 p-2">
            <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
        </div>
    );
};

export default React.memo(AlertBadge);
