import React, { useState, useEffect, ReactElement } from 'react';
import Tooltip from '../data/Tooltip';

type includeType = {
    playerName?: boolean,
    event?: boolean,
    amount?: string,
}

type filterType = {
    playerName: string,
    event: string,
}

type propTypes = {
    include: includeType,
    getPlayerData: Function,
}

const Filter = ({include, getPlayerData}: propTypes) => {
    const events = ['MS', 'WS', 'MD', 'WD', 'XD'];
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string|null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchValid, setSearchValid] = useState(false);
    const [filterValues, setFilterValues] = useState({playerName: '', event: 'MS'});
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (filterValues.playerName.length < 3) {
            setSearchValid(false);
        } else {
            setSearchValid(true);
        }
    }, [filterValues.playerName])

    const searchForPlayer = (searchString: string) => {
        fetch('/api/playersearch?' + new URLSearchParams({
            player: searchString,
        }))
        .then((res) => res.json())
        .then((data) => {
            setSearchResults(data.data.players);
        })
        .then(() => setIsSearching(false))
        .catch((error) => {
            console.log(error);
        });;
    }

    // Creates the input bar for the player's name
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

    // Creates the event dropdown for the 5 diciplines 
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

    // const getAmount = (): ReactElement => {
    //     return (include.amount)? 
    //         <input 
    //             className='filter-option'
    //             type='number'
    //             placeholder={include.amount + '...'}
    //             min='1'
    //             onChange={(e) => {
    //                 setFilterValues((old: filterType) => ({...old, amount: e.target.value}))
    //             }}
    //         ></input> : <></>
    // }

    // Displays a message to users depending on whether a search
    // is being performed and the number of search results
    const displayResultsHeader = () => {

        // A search is being performed
        if (isSearching) {
            return <div className='results-loading-container'>
                <div>Searching for player...</div>
                <div className='loader'></div>
            </div>

        // A search has been performed with 1 result
        } else if (searchTerm && searchResults.length == 1) {
            return <>
                <div>{`1 player with name containing '${searchTerm}'.`}</div>
                <div>Select a player to view their data.</div>
            </>
        
        // A search has been performed with 2+ results
        } else if (searchTerm && searchResults.length != 0) {
            return <>
                <div>{`${searchResults.length} players with name containing '${searchTerm}'.`}</div>
                <div>Select a player to view their data.</div>
            </>

        // A search has been performed with 0 results
        } else if (searchTerm) {
            return <>
                <div>{`No players with name containing '${searchTerm}'.`}</div>
                <div>Please try another search.</div>
            </>
        } else {
            return <div>Enter a player's name to perform a search.</div>
        }
    }

    return (
        <div className='container'>
            <div className='filter-container'>
                <div className='error'>{errorMessage}</div>
                <div className='filter-option-container'>
                    <Tooltip>Data is scraped from the BWF Official Tournament Software. Select search criteria to find a player, and then select said player to scrape their data.</Tooltip>
                    {getEvent()}
                    {getPlayerName()}
                    {/* {getAmount()} */}
                </div>
                {/* <div>{JSON.stringify(filterValues)}</div> */}
                <button 
                    className='filter-submit' 
                    onClick={() => {
                        if (searchValid) {
                            setErrorMessage('');
                            setIsSearching(true)
                            setSearchTerm(filterValues.playerName)
                            searchForPlayer(filterValues.playerName)
                        } else {
                            setErrorMessage('**Search terms must be atleast 3 characters long. Please try again**')
                        }
                    }}
                >Search</button>
            </div>
            <div className='results-header'>
                {displayResultsHeader()}
            </div>
            <div className='results-container'>
                {searchResults.map((playerName) => {
                    return !isSearching && (
                        <div
                            className='results-player'
                            key={playerName}
                            onClick={() => {
                                getPlayerData(filterValues.event, playerName)
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