import React, { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://192.168.10.10:4000');

function App() {
    const [letter, setLetter] = useState<string>('');
    const [userScore, setUserScore] = useState<number>(0);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    useEffect(() => {
        const setupSocketListeners = () => {
            socket.on('initialLetter', (initialLetter: string) => {
                setLetter(initialLetter);
            });

            socket.on('userScore', (score: number) => {
                setUserScore(score);
            });

            socket.on('showWinnerAlert', (winnerId: string) => {
                setWinnerId(winnerId);
            });

            socket.on('resetScores', () => {
                setUserScore(0);
                setWinnerId(null);
            });
        };
        setupSocketListeners();

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };

    }, []);

    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === letter) {
            console.log('Ви натиснули на правильну букву!');
            socket.emit('correctKeyPress');
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [letter]);

    return (
        <div className="App">
            <div className="cell">
                <svg width="100%" height="100%" viewBox="0 0 90 90">
                    <text className="cell-text" x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="300%" fill="white">{letter}</text>
                </svg>
            </div>
            <div className="score">
                <span className="score__label"> Score: </span> <span className="score__number">{userScore}</span>
            </div>
            {winnerId && <div className="winner-alert"><span>Player with ID</span> <span className="winner__id">{winnerId}</span> <span>has won!</span></div>}
        </div>
    );
}

export default App;
