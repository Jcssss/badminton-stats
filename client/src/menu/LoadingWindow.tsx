import React, {useState, useEffect} from 'react';

const LoadingWindow = () => {
    
    const [loadCounter, setLoadCounter] = useState(0);
    const loadMessages = ['Loading Data...', 'Scouring Badminton Databases...', 'Working Hard...'];

    useEffect(() => {
        let delay = setTimeout(() => {
            setLoadCounter((oldCount) => oldCount + 1)
        }, 4000);

        return () => clearTimeout(delay);
    }, [loadCounter]);

    if (loadCounter == 0) {
        setLoadCounter(1);
    }

    return (
        <div className='loading-container'>
            <div>{loadMessages[loadCounter % loadMessages.length]}</div>
            <div className='loader'></div>
        </div>
    );
}

export default LoadingWindow;