import './App.css';
import React, { useEffect, useState } from 'react';
import Filter from './menu/Filter';
import { FilterSettings } from './menu/FilterSettings';
import LoadingWindow from './menu/LoadingWindow';
import PlayerDisplay from './data/PlayerDisplay';
import { PlayerGraphData, PlayerSummaryData, EventType } from './types';

function App() {
    const [graphData, setGraphData] = useState<PlayerGraphData>({games: [], rank: []});
    const [summaryData, setSummaryData] = useState<PlayerSummaryData>({});
    const [filterState, setFilterState] = useState('Player');
    const [pageState, setPageState] = useState('Filter');

    const onSubmit = (event: EventType, playerName: string) => {
        setPageState('Loading');
        getPlayerRankData(event, playerName);
        getPlayerGamesData(event, playerName);
    }

    const getPlayerRankData = (event: EventType, playerName: string) => {
        fetch('/api/playerrank?' + new URLSearchParams({
            event: event,
            player: playerName,
            weeks: '10',
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
        })
        .then(() => setPageState('Data'))
        .catch((error) => {
            console.log(error);
        });
    }

    const getPlayerGamesData = (event: EventType, playerName: string) => {
        fetch('/api/playerhistory?' + new URLSearchParams({
            event: event,
            player: playerName,
            years: '1',
        }))
        .then((res) => res.json())
        .then((data) => {
            console.log(JSON.stringify(data));
            let newSummaryData: PlayerSummaryData = {
                name: data.player,
                country: data.country,
                overallWinLoss: data.overallWinLoss,
                yearlyWinLoss: data.yearlyWinLoss,
            }
            setSummaryData((oldSummary) => ({...oldSummary, ...newSummaryData}));
            setGraphData((oldData) => ({...oldData, games: data.tournaments}));
        })
        .then(() => setPageState('Data'))
        .catch((error) => {
            console.log(error);
        });
    }
    
    if (pageState == 'Filter') {
        return (
            <div>
                <li className='nav-container'>
                    {Object.keys(FilterSettings).map((option) => {
                        return (
                            <ul 
                                key={option}
                                className={`nav-option ${(filterState == option)? 'active':''}`}
                                onClick={() => {
                                    setFilterState(option)
                                }}
                            >{option}</ul>
                        )
                    })}
                </li>
                <Filter
                    include={FilterSettings[filterState].filterSettings}
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
