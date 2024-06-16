import React from 'react';

type includeType = {
    playerName?: boolean,
    event?: boolean,
    weeks?: boolean,
    years?: boolean,
}

type filterType = {
    playerName: string,
    event: string,
    weeks: number,
    years: number,
}

type propTypes = {
    include: includeType,
    filterValues: filterType,
    setFilterValues: Function,
    onSubmit: Function,
}

const Filter = ({include, filterValues, setFilterValues, onSubmit}: propTypes) => {
    const events = ['MS', 'WS', 'MD', 'WD', 'XD'];

    return (
        <div className='filter-container'>
            <input 
                type='text' 
                value={filterValues.playerName} 
                placeholder='Player Name...'
                onChange={(e) => {
                    setFilterValues((old: filterType) => ({...old, playerName: e.target.value}))
                }}
            ></input>
            <select
                onChange={(e) => {
                    setFilterValues((old: filterType) => ({...old, event: e.target.value}))
                }}
            >
                {events.map((event) => {
                    return <option value={event}>{event}</option>
                })}
            </select>
            <button
                onClick={() => {
                    onSubmit()
                }}
            >Submit</button>
        </div>
    );
}

export default Filter;