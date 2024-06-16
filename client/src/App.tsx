import './App.css';
import { useEffect, useState } from 'react';
import Filter from './menu/Filter';

function App() {
    const [data, setData] = useState(null);
    const [filterValues, setFilterValues] = useState({playerName: '', event: '', weeks: 0, years: 0});
    const [pageState, setPageState] = useState('Filter');
    const navOptions = ['Overall Ranking History', 'Player Tournament History', 'Player Ranking History'];
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
            weeks: '3'
        }))
        .then((res) => res.json())
        .then((data) => {
            setData(data)
        });
    }

    if (pageState == 'Filter') {
        return (
            <Filter
                include={{}}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
                onSubmit={onSubmit}
            ></Filter>
        )
    } else if (pageState == 'Data') {
        return (
            <div>
                <div className='navigation-container'>
                    {navOptions.map((option) => {
                        return <div>{option}</div>
                    })}
                </div>
                <div> {(data === null)? getLoader() : JSON.stringify(data)} </div>
            </div>
        );
    }
}

export default App;
