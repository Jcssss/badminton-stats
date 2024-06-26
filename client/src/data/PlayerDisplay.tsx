import React from 'react';
import Chart from './Chart';
import { playerGraphData } from '../types';

type propTypes = {
    graphData: playerGraphData,
    summaryData: [string, any][]
}

const PlayerDisplay = ({graphData, summaryData}: propTypes) => {
    return (
        <div className='data-container player'>
            <Chart graphData={graphData.rank}/>
        </div>
    );
}

export default PlayerDisplay;