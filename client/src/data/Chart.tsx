import React, {useState} from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PlayerGraphData, GraphData } from '../types';

type PropTypes = {
    graphData: PlayerGraphData,
}

const Chart = ({graphData}: PropTypes) => {
    const [displayState, setDisplayState] = useState('Rank');
    const displayOptions = ['Rank', 'Win Rate'];

    const displayRankGraph = () => {
        return <LineChart 
            width={600} 
            height={600} 
            data={graphData.rank} 
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" fill='white'/>
            <XAxis allowDecimals={false} dataKey="week" stroke='white' height={40} padding={{right: 10, left: 10}} angle={15} tick={{dy: 10}} textAnchor='middle'/>
            <YAxis allowDecimals={false} domain={[1, 'dataMax + 30']} reversed={true} stroke='white' padding={{top: 10, bottom: 10}}/>
            <Line type="monotone" dataKey="rank" stroke="#8884d8" />
            <Tooltip 
                labelFormatter={value => {
                    return `Date: ${value}`;
                }}
                formatter={(value, name) => {
                    return [`${value}`, 'Rank'];
                }}
            />
        </LineChart>
    }

    const displayWinRateGraph = () => {
        return <LineChart 
            width={600} 
            height={600} 
            data={graphData.games} 
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" fill='white'/>
            <XAxis dataKey="sdate" stroke='white' height={40} padding={{right: 10, left: 10}} angle={15} tick={{dy: 10}} textAnchor='middle'/>
            <YAxis 
                allowDecimals={true} 
                ticks={Array(11).fill(0).map((_, index) => index / 10)}
                stroke='white' 
                padding={{top: 10, bottom: 10}}
            />
            <Line type="monotone" dataKey="winRate" stroke="#8884d8" />
            <Tooltip 
                labelFormatter={value => {
                    return `Date: ${value}`;
                }}
                formatter={(value, name) => {
                    return [`${value}`, 'Win Rate'];
                }}
            />
        </LineChart>
    }

    return (
        <div className='graph-container'> 
            <li className='graph-options'>
                {displayOptions.map((option) => {
                    return <ul
                        className='graph-option-button'
                        onClick={() => setDisplayState(option.replace(' ', ''))}
                    >{option}</ul>
                })}
            </li>
            {(displayState == 'Rank')? displayRankGraph() : ''}
            {(displayState == 'WinRate')? displayWinRateGraph() : ''}
        </div>
    );
}

export default Chart;