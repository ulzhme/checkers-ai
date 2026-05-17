'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001', { autoConnect: false });

export default function Home() {
  const [board, setBoard] = useState<string[][] | null>(null);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [turn, setTurn] = useState('');
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  
  // Новые состояния для ИИ-тренера
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('roomCreated', (id: string) => setRoomId(id));

    socket.on('gameStarted', (data: { board: string[][], turn: string }) => {
      setBoard(data.board);
      setTurn(data.turn);
    });

    socket.on('boardUpdate', (data: { board: string[][], turn: string }) => {
      setBoard(data.board);
      setTurn(data.turn);
      setSelected(null);
      setAiAdvice(''); // Очищаем старый совет при новом ходе
    });

    // Слушаем ответ от ИИ
    socket.on('aiAdvice', (text: string) => {
      setAiAdvice(text);
      setIsAiLoading(false);
    });

    socket.on('error', (msg: string) => alert(msg));

    return () => {
      socket.off('roomCreated');
      socket.off('gameStarted');
      socket.off('boardUpdate');
      socket.off('aiAdvice');
      socket.off('error');
    };
  }, []);

  const createRoom = () => socket.emit('createRoom');
  const joinRoom = () => {
    if (inputRoomId) {
      const fixedId = inputRoomId.toLowerCase().trim();
      setRoomId(fixedId);
      socket.emit('joinRoom', fixedId);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!board) return;
    if (!selected) {
      if (board[row][col]) setSelected({ row, col });
    } else {
      socket.emit('makeMove', { roomId, from: selected, to: { row, col } });
      setSelected(null);
    }
  };

  // Функция вызова ИИ
  const askAI = () => {
    setIsAiLoading(true);
    setAiAdvice('');
    socket.emit('askAICoach', { roomId });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-12 font-sans">
      <h1 className="text-5xl font-extrabold text-emerald-400 mb-10 tracking-tight">Checkers.AI</h1>

      {!board ? (
        <div className="flex flex-col gap-6 bg-slate-800 p-10 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md">
          <button onClick={createRoom} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20">
            Создать новую игру
          </button>
          
          <div className="flex items-center gap-4 text-slate-400">
            <div className="h-px bg-slate-600 flex-1"></div><span>или присоединиться</span><div className="h-px bg-slate-600 flex-1"></div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Код комнаты"
              className="px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:border-emerald-500 flex-1 uppercase"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
            />
            <button onClick={joinRoom} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
              Войти
            </button>
          </div>
          
          {roomId && !inputRoomId && (
            <div className="mt-4 text-center p-4 bg-slate-900 rounded-xl border border-emerald-500/30">
              <p className="text-slate-400 mb-2">Твой код комнаты:</p>
              <p className="text-3xl font-mono text-emerald-400 tracking-widest">{roomId}</p>
              <p className="text-sm text-slate-500 mt-3 animate-pulse">Ожидаем подключения оппонента...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4">
          <div className="flex justify-between w-full items-center">
            <div className="text-xl font-bold bg-slate-800 px-6 py-3 rounded-full shadow-xl border border-slate-700">
              Ходят: <span className={turn === 'w' ? 'text-white' : 'text-red-500'}>{turn === 'w' ? 'Белые' : 'Черные'}</span>
            </div>
            
            {/* КНОПКА AI COACH */}
            <button 
              onClick={askAI} 
              disabled={isAiLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
            >
              {isAiLoading ? '🤖 Думает...' : '🤖 Совет от ИИ'}
            </button>
          </div>

          {/* Блок для вывода совета от ИИ */}
          {aiAdvice && (
            <div className="w-full bg-purple-900/30 border border-purple-500/50 p-4 rounded-xl text-purple-200 text-center animate-fade-in">
              <span className="font-bold">AI Coach:</span> {aiAdvice}
            </div>
          )}
          
          <div className="p-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
            <div className="border-4 border-slate-900 rounded-lg overflow-hidden">
              {board.map((rowArr, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {rowArr.map((cell, colIndex) => {
                    const isDark = (rowIndex + colIndex) % 2 !== 0;
                    const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
                    return (
                      <div
                        key={colIndex}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center cursor-pointer transition-all duration-200
                          ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-300'}
                          ${isSelected ? 'ring-inset ring-4 ring-emerald-400 bg-slate-600' : ''}
                        `}
                      >
                        {cell && (
                          <div className={`w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105
                            ${cell.toLowerCase() === 'w' ? 'bg-gradient-to-br from-white to-slate-200' : 'bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-900'}
                          `}>
                            {(cell === 'W' || cell === 'B') && <span className="text-2xl filter drop-shadow-md">👑</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-500 font-mono">Room: {roomId}</p>
        </div>
      )}
    </div>
  );
}