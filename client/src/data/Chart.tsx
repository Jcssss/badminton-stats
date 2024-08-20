import React from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GraphData } from '../types';

type PropTypes = {
    graphData: GraphData,
}

const Chart = ({graphData}: PropTypes) => {
    return (
        <div> 
            <LineChart 
                width={400} 
                height={400} 
                data={graphData} 
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" fill='white'/>
                <XAxis allowDecimals={false} dataKey="week" stroke='white' height={40} padding={{right: 10, left: 10}} angle={15} tick={{dy: 10}} textAnchor='middle'/>
                <YAxis allowDecimals={false} domain={[1, 'dataMax + 2']} reversed={true} stroke='white' padding={{top: 10, bottom: 10}}/>
                <Line type="monotone" dataKey="rank" stroke="#8884d8" />
            </LineChart>
            {/* <div>{JSON.stringify(graphData)}</div> */}
        </div>
    );
}

export default Chart;