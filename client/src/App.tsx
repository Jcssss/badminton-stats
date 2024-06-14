import './App.css';
import { useEffect, useState } from 'react';

function App() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        fetch('/api/playerrank?' + new URLSearchParams({
            event: 'XD',
            player: 'Yuta Watan',
            weeks: '3'
        }))
        .then((res) => res.json())
        .then((data) => setData(data.message));
    }, []);

    return (
        <div> {(data === null)? 'Loading...' : data} </div>
    );
}

export default App;
