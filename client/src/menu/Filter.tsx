import React, { useEffect, ReactElement } from 'react';

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
    onSubmit: Function,
}

const Filter = ({include, filterValues, setFilterValues, onSubmit}: propTypes) => {
    const events = ['MS', 'WS', 'MD', 'WD', 'XD'];

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

    return (
        <div className='filter-container'>
            <div className='filter-option-container'>
                {getEvent()}
                {getPlayerName()}
                {getAmount()}
            </div>
            {/* <div>{JSON.stringify(filterValues)}</div> */}
            <button className='filter-submit' onClick={() => {onSubmit()}}>Submit</button>
        </div>
    );
}

export default Filter;