class CheckersLogic {
    constructor() {
        this.board = this.initializeBoard();
        this.turn = 'w'; 
        // Если идет серия рубок, сюда запишем координаты шашки, которая обязана бить дальше
        this.mandatoryPiece = null; 
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    if (row < 3) board[row][col] = 'b';
                    if (row > 4) board[row][col] = 'w';
                }
            }
        }
        return board;
    }

    // Вспомогательная функция: враг ли это?
    isOpponent(piece, player) {
        if (!piece) return false;
        return piece.toLowerCase() !== player.toLowerCase();
    }

    // УМНЫЙ ДВИЖОК: вычисляет абсолютно все легальные ходы для текущего игрока
    getValidMoves(player) {
        let moves = [];
        let captures = [];

        // Векторы направлений (row, col)
        const directions = {
            'w': [[-1, -1], [-1, 1]], // Белые идут вверх
            'b': [[1, -1], [1, 1]],   // Черные идут вниз
            'capture': [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Рубят все и всегда во все стороны
        };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this.board[r][c];
                if (!piece || piece.toLowerCase() !== player) continue;

                // Если мы в процессе цепной рубки, игнорируем все остальные шашки!
                if (this.mandatoryPiece && (this.mandatoryPiece.r !== r || this.mandatoryPiece.c !== c)) {
                    continue;
                }

                const isKing = piece === 'W' || piece === 'B';
                const moveDirs = isKing ? directions['capture'] : directions[piece.toLowerCase()];
                const capDirs = directions['capture']; // И простые, и дамки рубят во все стороны

                // 1. Ищем возможные РУБКИ
                for (let [dr, dc] of capDirs) {
                    let midR = r + dr, midC = c + dc;
                    let endR = r + dr * 2, endC = c + dc * 2;
                    
                    if (endR >= 0 && endR < 8 && endC >= 0 && endC < 8) {
                        let midPiece = this.board[midR][midC];
                        // Если посередине враг, а за ним пустая клетка — это легальная рубка
                        if (midPiece && this.isOpponent(midPiece, player) && this.board[endR][endC] === null) {
                            captures.push({ from: {r, c}, to: {r: endR, c: endC}, mid: {r: midR, c: midC} });
                        }
                    }
                }

                // 2. Ищем ОБЫЧНЫЕ ХОДЫ (только если нет обязательных рубок)
                if (!this.mandatoryPiece && captures.length === 0) {
                    for (let [dr, dc] of moveDirs) {
                        let endR = r + dr, endC = c + dc;
                        if (endR >= 0 && endR < 8 && endC >= 0 && endC < 8) {
                            if (this.board[endR][endC] === null) {
                                moves.push({ from: {r, c}, to: {r: endR, c: endC} });
                            }
                        }
                    }
                }
            }
        }
        return { moves, captures };
    }

    move(fromRow, fromCol, toRow, toCol) {
        // Запрашиваем у движка все доступные ходы
        const { moves, captures } = this.getValidMoves(this.turn);

        let isCapture = false;
        let validMove = null;

        // ПРАВИЛО 1: БИТЬ ОБЯЗАТЕЛЬНО
        if (captures.length > 0) {
            // Если есть рубки, игрок ДОЛЖЕН выбрать одну из них
            validMove = captures.find(m => m.from.r === fromRow && m.from.c === fromCol && m.to.r === toRow && m.to.c === toCol);
            if (!validMove) return false; // Игрок пытается сделать обычный ход или схитрить — отклоняем!
            isCapture = true;
        } else {
            // Рубить некого, проверяем обычные ходы
            if (this.mandatoryPiece) return false; // Защита от багов при цепной рубке
            validMove = moves.find(m => m.from.r === fromRow && m.from.c === fromCol && m.to.r === toRow && m.to.c === toCol);
            if (!validMove) return false; // Недопустимый ход (не по диагонали, на занятую клетку и т.д.)
        }

        // Применяем ход на доске
        const piece = this.board[fromRow][fromCol];
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Если это была рубка — удаляем врага
        if (isCapture) {
            this.board[validMove.mid.r][validMove.mid.c] = null; 
        }

        // Превращение в дамку
        let becameKing = false;
        if (piece === 'w' && toRow === 0) { this.board[toRow][toCol] = 'W'; becameKing = true; }
        if (piece === 'b' && toRow === 7) { this.board[toRow][toCol] = 'B'; becameKing = true; }

        // ПРАВИЛО 2: ЦЕПНАЯ РУБКА
        if (isCapture && !becameKing) {
            // Временно фиксируем шашку и смотрим, есть ли для нее еще жертвы с новой клетки
            this.mandatoryPiece = { r: toRow, c: toCol };
            const nextMoves = this.getValidMoves(this.turn);
            
            if (nextMoves.captures.length > 0) {
                // Ход не заканчивается! Этот же игрок должен рубить дальше
                return true; 
            }
        }

        // Завершение хода: сбрасываем обязаловку и передаем ход сопернику
        this.mandatoryPiece = null;
        this.turn = this.turn === 'w' ? 'b' : 'w';
        return true;
    }
}

module.exports = CheckersLogic;