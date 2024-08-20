import React, { useState, ReactElement } from 'react';

type includeType = {
    playerName?: boolean,
    event?: boolean,
    amount?: string,
}

type filterType = {
    playerName: string,
    event: string,
    amount: number,
}

type propTypes = {
    include: includeType,
    filterValues: filterType,
    setFilterValues: Function,
    getPlayerData: Function,
}

const Filter = ({include, filterValues, setFilterValues, getPlayerData}: propTypes) => {
    const events = ['MS', 'WS', 'MD', 'WD', 'XD'];
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string|null>(null);

    const searchForPlayer = (searchString: string) => {
        fetch('/api/playersearch?' + new URLSearchParams({
            player: searchString,
        }))
        .then((res) => res.json())
        .then((data) => {
            setSearchResults(data.data.players);
        });
    }

    const getPlayerName = (): ReactElement => {
        return (include.playerName)? 
            <input 
                className='filter-option'
                type='text' 
                value={filterValues.playerName} 
                placeholder='Player Name...'
                onChange={(e) => {
                    setFilterValues((old: filterType) => ({...old, playerName: e.target.value}))
                }}
            ></input> : <></>
    }

    const getEvent = (): ReactElement => {
        return (include.event)? 
            <select
                className='filter-option'
                onChange={(e) => {
                    setFilterValues((old: filterType) => ({...old, event: e.target.value}))
                }}
            >
                {events.map((event) => {
                    return <option key={event} value={event}>{event}</option>
                })}
            </select> : <></>
    }

    const getAmount = (): ReactElement => {
        return (include.amount)? 
            <input 
                className='filter-option'
                type='number'
                placeholder={include.amount + '...'}
                min='1'
                onChange={(e) => {
                    setFilterValues((old: filterType) => ({...old, amount: e.target.value}))
                }}
            ></input> : <></>
    }

    const displayResultsHeader = () => {
        if (searchTerm && searchResults.length != 0) {
            return <>
                <div>{`${searchResults.length} players with name containing '${searchTerm}'.`}</div>
                <div>Select a player to view their data.</div>
            </>
        } else if (searchTerm) {
            return <>
                <div>{`No players with name containing '${searchTerm}'.`}</div>
                <div>Please try another search.</div>
            </>
        } else {
            return <div>Enter a players name to perform a search.</div>
        }
    }

    return (
        <div className='container'>
            <div className='filter-container'>
                <div className='filter-option-container'>
                    {getEvent()}
                    {getPlayerName()}
                    {getAmount()}
                </div>
                {/* <div>{JSON.stringify(filterValues)}</div> */}
                <button 
                    className='filter-submit' 
                    onClick={() => {
                        setSearchTerm(filterValues.playerName)
                        searchForPlayer(filterValues.playerName)
                    }}
                >Search</button>
            </div>
            <div className='results-header'>
                {displayResultsHeader()}
            </div>
            <div className='results-container'>
                {searchResults.map((playerName) => {
                    return (
                        <div
                            className='results-player'
                            key={playerName}
                            onClick={() => {
                                setFilterValues((old: filterType) => ({...old, player: playerName}),
                                    getPlayerData()
                                )
                            }}
                        >
                            {playerName}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default Filter;