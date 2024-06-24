import './App.css';
import React, { useEffect, useState } from 'react';
import Filter from './menu/Filter';
import { FilterSettings } from './menu/FilterSettings';
import LoadingWindow from './loading/LoadingWindow';
import Chart from './data/Chart';

type graphDataType = Object[]

function App() {
    const [graphData, setGraphData] = useState<graphDataType>([{}]);
    const [filterValues, setFilterValues] = useState({playerName: '', event: 'MS', amount: 1});
    const [filterState, setFilterState] = useState('Player');
    const [pageState, setPageState] = useState('Filter');

    const onSubmit = () => {
        getPlayerRankData();
        setPageState('Loading');
    }

    const getPlayerRankData = () => {
        fetch('/api/playerrank?' + new URLSearchParams({
            event: filterValues.event,
            player: filterValues.playerName,
            weeks: `${filterValues.amount}`,
        }))
        .then((res) => res.json())
        .then((data) => {
            console.log(JSON.stringify(data));
            setGraphData(data.rankingData)
        }).then(() => setPageState('Data'));
    }
    
    if (pageState == 'Filter') {
        return (
            <div>
                <div className='nav-container'>
                    {Object.keys(FilterSettings).map((option) => {
                        return (
                            <div 
                                key={option}
                                className={`nav-option ${(filterState == option)? 'active':''}`}
                                onClick={() => {
                                    setFilterState(option)
                                }}
                            >{option}</div>
                        )
                    })}
                </div>
                <Filter
                    include={FilterSettings[filterState].filterSettings}
                    filterValues={filterValues}
                    setFilterValues={setFilterValues}
                    onSubmit={onSubmit}
                ></Filter>
            </div>
        )
    } else if (pageState == 'Loading') {
        return <LoadingWindow/>
    } else {
        return <Chart graphData={graphData}/>;
    }
}

export default App;
