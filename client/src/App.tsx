import './App.css';
import { useEffect, useState } from 'react';

function App() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        fetch('/api?' + new URLSearchParams({
            foo: 'Kiana',
            bar: 'Gallagher'
        }))
        .then((res) => res.json())
        .then((data) => setData(data.message));
    }, []);

    return (
        <div> {data} </div>
    );
}

export default App;
