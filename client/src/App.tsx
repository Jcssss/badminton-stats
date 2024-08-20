import './App.css';
import React, { useEffect, useState } from 'react';
import Filter from './menu/Filter';
import { FilterSettings } from './menu/FilterSettings';
import LoadingWindow from './menu/LoadingWindow';
import PlayerDisplay from './data/PlayerDisplay';
import { PlayerGraphData, PlayerSummaryData } from './types';

function App() {
    const [graphData, setGraphData] = useState<PlayerGraphData>({games: [], rank: []});
    const [summaryData, setSummaryData] = useState<PlayerSummaryData>({});
    const [filterValues, setFilterValues] = useState({playerName: '', event: 'MS', amount: 1});
    const [filterState, setFilterState] = useState('Player');
    const [pageState, setPageState] = useState('Filter');

    const onSubmit = () => {
        setPageState('Loading');
        //getPlayerRankData();
        //getPlayerGamesData();
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
            let newSummaryData: PlayerSummaryData = {
                name: data.player,
                points: {
                    avg: data.avgPoints,
                    max: data.highestPoints,
                    min: data.lowestPoints
                },
                rank: {
                    avg: data.avgRank,
                    max: data.highestRank,
                    min: data.lowestRank
                }
            }
            setSummaryData((oldSummary) => ({...oldSummary, ...newSummaryData}));
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
            let newSummaryData:PlayerSummaryData = {
                name: data.player,
                country: data.country,
                overallWinLoss: data.overallWinLoss,
                yearlyWinLoss: data.yearlyWinLoss,
            }
            setSummaryData((oldSummary) => ({...oldSummary, ...newSummaryData}));
            setGraphData((oldData) => ({...oldData, games: data.tournamentData}));
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
                    getPlayerData={onSubmit}
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
