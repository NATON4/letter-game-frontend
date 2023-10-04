import React, {useEffect, useState} from 'react';
import './App.css';
import io from 'socket.io-client';
import Clipboard from 'react-clipboard.js';

type User = {
    score: number;
    nickname: string;
};

enum Events {
    startGame = 'startGame',
    updateScoreToWin = 'updateScoreToWin',
    updateUserList = 'updateUserList',
    setUserScore = 'userScore',
    setGameStatus = 'gameStatus',
    setRoomGame = 'roomName',
    sentInitialLetter = 'initialLetter',
    resetScores = 'resetScores',
    showWinnerAlert = 'showWinnerAlert',
    checkLetter = 'checkLetter',
}

const socket = io('http://192.168.10.10:4000');

function App() {
    const [letter, setLetter] = useState<string>('');
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string>('');
    const [roomName, setRoomName] = useState<string | null>(null);

    const [userScore, setUserScore] = useState<number>(0);
    const [winningScore, setWinningScore] = useState(20);

    const [userList, setUserList] = useState<User[]>([]);

    const [gameStarted, setGameStarted] = useState(false);
    const [isNicknameConfirmed, setNicknameConfirmed] = useState(false)

    useEffect(() => {
        const setupSocketListeners = () => {
            socket.on(Events.sentInitialLetter, (initialLetter: string) => {
                setLetter(initialLetter);
            });

            socket.on(Events.setUserScore, (score: number) => {
                setUserScore(score);
            });

            socket.on(Events.showWinnerAlert, (winnerId: string) => {
                setWinnerId(winnerId);
            });

            socket.on(Events.resetScores, () => {
                setUserScore(0);
                setWinnerId(null);
            });

            socket.on(Events.updateUserList, (userList: { score: number; nickname: string }[]) => {
                setUserList(userList);
            });

            socket.on(Events.setRoomGame, (receivedRoomName: string) => {
                setRoomName(receivedRoomName);
            });
        };
        setupSocketListeners();

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };

    }, []);

    const handleWinningScoreChange = (newWinningScore: number) => {
        setWinningScore(newWinningScore);
        socket.emit(Events.updateScoreToWin, newWinningScore);
    };

    const handleKeyPress = (event: KeyboardEvent) => {
        socket.emit(Events.checkLetter, event.key);
    };

    useEffect(() => {
        socket.on(Events.setGameStatus, (isGameStarted: boolean) => {
            setGameStarted(isGameStarted);
        });
    }, []);

    const selectRoom = () => {
        if (roomName) {
            socket.emit(Events.startGame, nickname, roomName);
            setNicknameConfirmed(true);
        }
    };

    const startGame = () => {
        socket.emit(Events.startGame);
    };

    const saveNickname = () => {
        socket.emit(Events.startGame, nickname);
        setNicknameConfirmed(true);
    };

    const handleJoinRoomClick = () => {
        saveNickname();
        selectRoom();
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
                        <div className="start-screen">
                            <input
                                type="text"
                                placeholder="Enter your nickname"
                                value={nickname}
                                className="nickname-input"
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyUp={(e) => {
                                    if (e.key === 'Enter' && nickname.trim()) {
                                        saveNickname();
                                    }
                                }}
                            />
                            <button className="start-button" onClick={saveNickname} disabled={!nickname.trim()}>
                                Submit Nickname And Create New Room
                            </button>
                            <input
                                type="text"
                                placeholder="Enter room"
                                className="nickname-input"
                                onChange={(e) => setRoomName(e.target.value)}
                                onKeyUp={(e) => {
                                    if (e.key === 'Enter') {
                                        saveNickname();
                                        selectRoom();
                                    }
                                }}
                            />
                            <button className="start-button" onClick={handleJoinRoomClick} disabled={!nickname.trim()} >
                                Join Room
                            </button>
                            <span>Choose score to win</span>
                            <div className="winning-score-options">
                                <label className="radio-input__label">
                                    <input
                                        className="radio-input"
                                        type="radio"
                                        name="winningScore"
                                        value="10"
                                        onChange={() => {
                                            handleWinningScoreChange(10);
                                        }}
                                    />
                                    10
                                </label>
                                <label className="radio-input__label">
                                    <input
                                        className="radio-input"
                                        type="radio"
                                        name="winningScore"
                                        value="20"
                                        checked={winningScore === 20}
                                        onChange={() => {
                                            handleWinningScoreChange(20);
                                        }}
                                    />
                                    20
                                </label>
                                <label className="radio-input__label">
                                    <input
                                        className="radio-input"
                                        type="radio"
                                        name="winningScore"
                                        value="50"
                                        onChange={() => {
                                            handleWinningScoreChange(50);
                                        }}
                                    />
                                    50
                                </label>
                            </div>

                        </div>
                    ) : (
                        <div className="main-content">
                            <span className="simple-main-content-label">You are in room:</span>
                            <Clipboard className="room-id" data-clipboard-text={roomName}>
                                {roomName} <br/>
                                <span className="button-small-text">Press to copy</span>
                            </Clipboard>
                            <div className="cell">
                                <svg width="100%" height="100%" viewBox="0 0 90 90">
                                    <text className="cell-text" x="50%" y="55%" textAnchor="middle"
                                          dominantBaseline="middle"
                                          fontSize="300%" fill="white">
                                          {letter}
                                    </text>
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
                                        .sort((a, b) => b.score - a.score)
                                        .map((user, index) => (
                                            <li key={index} className="online-list_user">
                                               {user.nickname === nickname
                                                ? `You - Score: ${user.score}`
                                                : `${user.nickname} - Score: ${user.score}`}
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                            {winnerId &&
                                <div className="winner-alert">
                                    <span>Player</span>
                                    <span
                                        className="winner__id">  {userList.find(user => user.nickname === winnerId)?.nickname}</span>
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
