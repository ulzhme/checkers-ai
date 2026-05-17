require('dotenv').config(); // Подключаем переменные окружения (для ключа Gemini)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const CheckersLogic = require('./gameLogic');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] } // Разрешаем подключение с фронтенда
});

// Инициализируем ИИ (ключ будет браться из файла .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "ВСТАВЬ_СЮДА_СВОЙ_КЛЮЧ_ЕСЛИ_НЕТ_ENV");

// Хранилище всех активных игр
const rooms = {}; 

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    // Игрок создает комнату
    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 7); // Генерируем ID
        rooms[roomId] = { players: [socket.id], game: new CheckersLogic() };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
        console.log(`✅ Создана комната: ${roomId}`);
    });

    // Второй игрок присоединяется по коду
    socket.on('joinRoom', (roomId) => {
        const cleanRoomId = roomId.toLowerCase().trim(); // Защита от лишних пробелов и заглавных букв
        console.log(`Попытка входа в: ${cleanRoomId}. Существуют комнаты:`, Object.keys(rooms));

        if (rooms[cleanRoomId] && rooms[cleanRoomId].players.length === 1) {
            rooms[cleanRoomId].players.push(socket.id);
            socket.join(cleanRoomId);
            // Уведомляем обоих, что игра началась, и отправляем начальную доску
            io.to(cleanRoomId).emit('gameStarted', {
                board: rooms[cleanRoomId].game.board,
                turn: rooms[cleanRoomId].game.turn
            });
            console.log(`🚀 Игрок успешно зашел в комнату ${cleanRoomId}`);
        } else {
            socket.emit('error', 'Комната заполнена или не существует');
        }
    });

    // Обработка хода
    socket.on('makeMove', ({ roomId, from, to }) => {
        const room = rooms[roomId];
        if (room) {
            const success = room.game.move(from.row, from.col, to.row, to.col);
            if (success) {
                // Рассылаем обновленную доску обоим игрокам
                io.to(roomId).emit('boardUpdate', {
                    board: room.game.board,
                    turn: room.game.turn
                });
            }
        }
    });

    // Запрос совета от AI Coach
    socket.on('askAICoach', async ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Используем быструю модель
            const turnName = room.game.turn === 'w' ? 'Белых' : 'Черных';
            const prompt = `Ты AI-тренер по шашкам. Идет игра. Вот текущее состояние доски в виде массива: ${JSON.stringify(room.game.board)}. Сейчас ход ${turnName}. Дай короткий стратегический совет игроку на 1-2 предложения. Не пиши конкретные координаты, просто общую идею (например, "Держи центр" или "Осторожно на левом фланге").`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            socket.emit('aiAdvice', text);
        } catch (error) {
            console.error("AI Error:", error);
            socket.emit('aiAdvice', "Тренер сейчас недоступен, подумайте сами!");
        }
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
        
        // Ищем комнату, в которой был этот игрок
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.includes(socket.id)) {
                // Оповещаем второго игрока, что соперник сбежал
                io.to(roomId).emit('error', 'Соперник отключился. Игра окончена.');
                delete rooms[roomId]; // Удаляем комнату с сервера
                console.log(`🗑️ Комната ${roomId} удалена.`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`✅ Сервер шашек запущен на порту ${PORT}`);
});