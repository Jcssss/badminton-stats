import React, { ReactElement } from 'react';
import Chart from './Chart';
import { PlayerGraphData, PlayerSummaryData } from '../types';
import Tooltip from './Tooltip';

type PropTypes = {
    graphData: PlayerGraphData,
    summaryData: PlayerSummaryData
}

const PlayerDisplay = ({graphData, summaryData}: PropTypes) => {
    const getAggregateItem = (label: string, value: number): ReactElement => {
        return <ul className='aggregate-item'>
            <div className='aggregate-label'>{label}</div>
            <div className='aggregate-data'>{value}</div>
        </ul>
    }

    return (
        <div className='data-container player'>
            <div className='aggregate-container'>
                <div className='player-name'>{summaryData.name}</div>
                <div className='player-country'>{`(${summaryData.country})`}</div>
                {/* <Tooltip>text</Tooltip> */}
                <li className='aggregate-list'>
                    {summaryData.points && getAggregateItem('Average Points', summaryData.points.avg)}
                    {summaryData.rank && getAggregateItem('Average Rank', summaryData.rank.avg)}
                    {summaryData.overallWinLoss && getAggregateItem('Career Wins', summaryData.overallWinLoss.wins)}
                    {summaryData.overallWinLoss && getAggregateItem('Career Losses', summaryData.overallWinLoss.losses)}
                </li>
            </div>
            <Chart graphData={graphData}/>
            {/* <div>{JSON.stringify(summaryData)}</div> */}
        </div>
    );
}

export default PlayerDisplay;