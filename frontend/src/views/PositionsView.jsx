import React from 'react';
import PositionsTab from '../components/positions/PositionsTab';

export default function PositionsView({ positions, dynamicPairs, removePosition, updatePosition }) {
    return (
        <PositionsTab
            positions={positions}
            pairs={dynamicPairs}
            onRemove={removePosition}
            onUpdate={updatePosition}
        />
    );
}
