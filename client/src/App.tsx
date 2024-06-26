import './App.css';
import React, { useEffect, useState } from 'react';
import Filter from './menu/Filter';
import { FilterSettings } from './menu/FilterSettings';
import LoadingWindow from './loading/LoadingWindow';
import PlayerDisplay from './data/PlayerDisplay';
import { playerGraphData } from './types';

function App() {
    const [graphData, setGraphData] = useState<playerGraphData>({games: [], rank: []});
    const [summaryData, setSummaryData] = useState<[string, any][]>([]);
    const [filterValues, setFilterValues] = useState({playerName: '', event: 'MS', amount: 1});
    const [filterState, setFilterState] = useState('Player');
    const [pageState, setPageState] = useState('Filter');

    const onSubmit = () => {
        //getPlayerRankData();
        getPlayerGamesData();
        setPageState('Loading');
    }

    const getPlayerRankData = () => {
        fetch('/api/playerrank?' + new URLSearchParams({
            event: filterValues.event,
            player: filterValues.playerName,
            weeks: `${filterValues.amount * 52}`,
        }))
        .then((res) => res.json())
        .then((data) => {
            console.log(JSON.stringify(data));
            let newSummaryData:[string, any][] = [
                ['Name', data.player],
                ['Average Points', data.avgPoints],
                ['Highest Points', data.highestPoints],
                ['Lowest Points', data.lowestPoints],
                ['Average Rank', data.avgRank],
                ['Highest Rank', data.highestRank],
                ['Lowest Rank', data.lowestRank],
            ]
            setSummaryData(newSummaryData);
            setGraphData((oldData) => ({...oldData, rank: data.rankingData}));
        }).then(() => setPageState('Data'));
    }

    const getPlayerGamesData = () => {
        fetch('/api/playerhistory?' + new URLSearchParams({
            event: filterValues.event,
            player: filterValues.playerName,
            years: `${filterValues.amount}`,
        }))
        .then((res) => res.json())
        .then((data) => {
            console.log(JSON.stringify(data));
            // let newSummaryData:[string, any][] = [
            //     ['Name', data.player],
            //     ['Average Points', data.avgPoints],
            //     ['Highest Points', data.highestPoints],
            //     ['Lowest Points', data.lowestPoints],
            //     ['Average Rank', data.avgRank],
            //     ['Highest Rank', data.highestRank],
            //     ['Lowest Rank', data.lowestRank],
            // ]
            // setSummaryData(newSummaryData);
            // setGraphData(data.rankingData)
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
        return (
            <PlayerDisplay
                graphData={graphData}
                summaryData={summaryData}
            />
        );
    }
}

export default App;
