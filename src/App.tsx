import React, {useEffect, useState} from 'react';
import './App.css';
import io from 'socket.io-client';

type User = {
    score: number;
    nickname: string;
};

const socket = io('http://192.168.10.10:4000');

function App() {
    const [letter, setLetter] = useState<string>('');
    const [userScore, setUserScore] = useState<number>(0);
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [nickname, setNickname] = useState<string>('');
    const [userList, setUserList] = useState<User[]>([]);
    const [isNicknameConfirmed, setNicknameConfirmed] = useState(false)

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

            socket.on('updateUserList', (userList: { score: number; nickname: string }[]) => {
                setUserList(userList);
            });
        };
        setupSocketListeners();

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };

    }, []);

    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === letter) {
            socket.emit('correctKeyPress', {nickname: nickname, score: userScore});
        }
    };

    useEffect(() => {
        socket.on('gameStatus', (isGameStarted: boolean) => {
            setGameStarted(isGameStarted);
        });
    }, []);

    const startGame = () => {
        socket.emit('startGame');
    };

    const saveNickname = () => {
        socket.emit('startGame', nickname);
        setNicknameConfirmed(true);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [letter]);

    return (
        <div className="App">
            {!gameStarted ? (
                <div className="start-screen">
                    <button className="start-screen__button" onClick={startGame}>Start</button>
                </div>
            ) : (
                <div>
                    {!isNicknameConfirmed ? (
                        <div>
                            <input
                                type="text" placeholder="Enter your nickname" value={nickname} className="nickname-input"
                                onChange={(e) => setNickname(e.target.value)}
                            />
                            <button className="start-button" onClick={saveNickname} disabled={!nickname.trim()}>
                                Submit Nickname
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="cell">
                                <svg width="100%" height="100%" viewBox="0 0 90 90">
                                    <text className="cell-text" x="50%" y="55%" textAnchor="middle"
                                          dominantBaseline="middle"
                                          fontSize="300%" fill="white">{letter}</text>
                                </svg>
                            </div>
                            <div className="score">
                                <span className="score__label"> Score: </span> <span
                                className="score__number">{userScore}</span>
                            </div>
                            <div className="user-list">
                                <span className="online-users-label">Online Users:</span>
                                <ul className="online-list">
                                    {userList
                                        .filter((user) => user.nickname !== "undefined")
                                        .map((user, index) => (
                                            <li key={index}>{user.nickname} - Score: {user.score}</li>
                                        ))
                                    }
                                </ul>
                            </div>
                            {winnerId &&
                                <div className="winner-alert">
                                    <span>Player</span>
                                    <span className="winner__id">  {userList.find(user => user.nickname === winnerId)?.nickname}</span>
                                    <span>has won!</span>
                                </div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
