import React, { useEffect, useState } from 'react';
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
    resetLetters = 'resetLetters',
    resetGame = 'resetGame',
    joinRoom = 'joinRoom',
}

const socket = io('http://192.168.11.145:4000');

function App() {
    const [letter, setLetter] = useState<string>('');
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string>('1');
    const [roomName, setRoomName] = useState<string | null>(null);

    const [userScore, setUserScore] = useState<number>(0);
    const [winningScore, setWinningScore] = useState<number>(2);

    const [userList, setUserList] = useState<User[]>([]);

    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [isNicknameConfirmed, setNicknameConfirmed] = useState<boolean>(false);
    const [resetting, setResetting] = useState<boolean>(false);
    useEffect(() => {
        console.log({ winnerId, nickname, roomName, userScore, userList, gameStarted, isNicknameConfirmed })
    });

    useEffect(() => {
        socket.on(Events.sentInitialLetter, (initialLetter: string) => {
            console.error('sentInitialLetter')
            setLetter(initialLetter);
        });

        socket.on(Events.setUserScore, (score: number) => {
            console.error('setUserScore')
            setUserScore(score);
        });

        socket.on(Events.showWinnerAlert, (winnerId: string) => {
            console.error('showWinnerAlert')
            setWinnerId(winnerId);
        });

        socket.on(Events.updateScoreToWin, (score: number) => {
            setWinningScore(score);
        });

        socket.on(Events.updateUserList, (userList: { score: number; nickname: string }[]) => {
            console.error('updateUserList')
            setUserList(userList);
        });

        socket.on(Events.resetGame, () => {
            setResetting(false);
            setUserScore(0);
            setWinnerId(null);
        });

        socket.on(Events.setRoomGame, (receivedRoomName: string) => {
            console.error('setRoomGame')
            setRoomName(receivedRoomName);
        });

        socket.on(Events.resetScores, () => {
            console.error('resetScores')
            setResetting(false);
            setUserScore(0);
            setWinnerId(null);
        });

        socket.on(Events.resetLetters, (letters: string[]) => {
            console.error('resetLetters')
            setLetter(letters[0]);
            setWinnerId(null);
        });

        socket.on(Events.setGameStatus, (isGameStarted: boolean) => {
            console.error('setGameStatus')
            setGameStarted(isGameStarted);
        });

        return () => {
            for (const eventName in Events) {
                socket.off(eventName)
            }
        }

    }, []);

    const handleWinningScoreChange = (newWinningScore: number) => {
        setWinningScore(newWinningScore);
        socket.emit(Events.updateScoreToWin, newWinningScore);
    };

    const handleKeyPress = (event: KeyboardEvent) => {
        console.log('0000')
        socket.emit(Events.checkLetter, event.key);
    };

    const selectRoom = () => {
        if (roomName) {
            socket.emit(Events.startGame, nickname, roomName, winningScore);
            setNicknameConfirmed(true);
        }
    };

    const resetGame = () => {
        socket.emit(Events.resetScores, roomName);
        setResetting(true);
        setUserScore(0);
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
        socket.emit(Events.joinRoom, roomName);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    return (
        <div className="App">
            {!gameStarted ? (
                <div className="start-screen">
                    <button className="start-screen__button" onClick={startGame}>Start</button>
                </div>
            ) : (
                <div>
                    {!isNicknameConfirmed ? (
                        <div className="waiting-room">
                            <h1 className='waiting-title'>Hello dear, good luck! <br />
                                This game is for the fastest!
                            </h1>
                            <div className='waiting-input'>
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
                                    Create New Room
                                </button>
                                <input
                                    type="text"
                                    placeholder="Enter room"
                                    className="nickname-input"
                                    onChange={(e) => setRoomName(e.target.value)}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter') {
                                            handleJoinRoomClick();
                                        }
                                    }}
                                />
                                <button className="start-button" onClick={handleJoinRoomClick} disabled={!nickname.trim()} >
                                    Join Room
                                </button>
                            </div>
                            <span>Choose score to win</span>
                            <div className="winning-score-options">
                                <label className="radio-input__label">
                                    <input
                                        className="radio-input"
                                        type="radio"
                                        name="winningScore"
                                        value="2"
                                        onChange={() => {
                                            handleWinningScoreChange(2);
                                        }}
                                    />
                                    2
                                </label>
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
                                {roomName} <br />
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
                                    <button className='winner-button' onClick={resetGame}>Reset Game</button>
                                </div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;