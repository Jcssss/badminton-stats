import React from 'react';
import Chart from './Chart';
import { PlayerGraphData, PlayerSummaryData } from '../types';

type PropTypes = {
    graphData: PlayerGraphData,
    summaryData: PlayerSummaryData
}

const PlayerDisplay = ({graphData, summaryData}: PropTypes) => {
    return (
        <div className='data-container player'>
            <div>{JSON.stringify(graphData)}</div>
            <Chart graphData={graphData.rank}/>
        </div>
    );
}

export default PlayerDisplay;