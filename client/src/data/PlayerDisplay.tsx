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
            <div className='aggregate-container'>
                <div className='player-name'>{summaryData.name}</div>
                <div className='player-country'>{summaryData.country}</div>
                <li className='aggregate-list'>
                    {summaryData.points && <ul className='aggregate-item'>
                        <div className='aggregate-label'>Avg Points</div>
                        <div className='aggregate-data'>{summaryData.points.avg}</div>
                    </ul>}
                    {summaryData.rank && <ul className='aggregate-item'>
                        <div className='aggregate-label'>Avg Rank</div>
                        <div className='aggregate-data'>{summaryData.rank.avg}</div>
                    </ul>}
                    {summaryData.overallWinLoss && <ul className='aggregate-item'>
                        <div className='aggregate-label'>Total Matches Won</div>
                        <div className='aggregate-data'>{summaryData.overallWinLoss.wins}</div>
                    </ul>}
                    {summaryData.overallWinLoss && <ul className='aggregate-item'>
                        <div className='aggregate-label'>Total Matches Lost</div>
                        <div className='aggregate-data'>{summaryData.overallWinLoss.losses}</div>
                    </ul>}
                </li>
            </div>
            <Chart graphData={graphData}/>
            {/* <div>{JSON.stringify(summaryData)}</div> */}
        </div>
    );
}

export default PlayerDisplay;