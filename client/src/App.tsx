import './App.css';
import React, { useEffect, useState } from 'react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import Filter from './menu/Filter';
import { FilterSettings } from './menu/FilterSettings';

function App() {
    const [data, setData] = useState(null);
    const [filterValues, setFilterValues] = useState({playerName: '', event: 'MS', amount: 1});
    const [pageState, setPageState] = useState('Filter');
    const onSubmit = () => {
        getPlayerRankData();
        setPageState('Data');
    }

    const getLoader = () => {
        return <>
            <div>Loading...</div>
            <div className='loader'></div>
        </>
    }

    const getPlayerRankData = () => {
        fetch('/api/playerrank?' + new URLSearchParams({
            event: filterValues.event,
            player: filterValues.playerName,
            weeks: `${filterValues.amount}`,
        }))
        .then((res) => res.json())
        .then((data) => {
            setData(data.rankingData)
        });
    }
    
    if (pageState == 'Filter') {
        return (
            <Filter
                include={{
                    amount: 'Years',
                    playerName: true,
                    event: true,
                }}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
                onSubmit={onSubmit}
            ></Filter>
        )
    } else if (pageState == 'Data') {
        return (
            <div>
                <div className='navigation-container'>
                    {Object.keys(FilterSettings).map((option) => {
                        return <div>{option}</div>
                    })}
                </div>
                <div> {(data === null)? 
                    getLoader() : 
                    <>
                        <LineChart width={400} height={400} data={data}>
                            <XAxis dataKey="date"/>
                            <YAxis reversed={true}/>
                            <Line type="monotone" dataKey="rank" stroke="#8884d8" />
                        </LineChart>
                        <div>{JSON.stringify(data)}</div>
                    </>
                } </div>
            </div>
        );
    }
}

export default App;
