class CheckersLogic {
    constructor() {
        this.board = this.initializeBoard();
        this.turn = 'w'; // 'w' - белые начинают первыми, 'b' - черные
    }

    initializeBoard() {
        // Создаем доску 8x8, пустые клетки = null
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Шашки стоят только на черных (темных) клетках
                if ((row + col) % 2 !== 0) {
                    if (row < 3) board[row][col] = 'b'; // Черные сверху
                    if (row > 4) board[row][col] = 'w'; // Белые снизу
                }
            }
        }
        return board;
    }

    move(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        
        // 1. Защита: есть ли фигура и ее ли сейчас ход?
        if (!piece || piece.toLowerCase() !== this.turn) return false;

        // 2. Защита: целевая клетка должна быть абсолютно пустой
        if (this.board[toRow][toCol] !== null) return false;

        // Считаем разницу координат
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        // 3. Защита: ход должен быть строго по диагонали
        if (absRowDiff !== absColDiff) return false;

        // 4. Защита направления (обычные шашки не могут ходить назад)
        const isKing = piece === 'W' || piece === 'B';
        if (!isKing) {
            if (piece === 'w' && rowDiff > 0) return false; // Белые ('w') идут только вверх
            if (piece === 'b' && rowDiff < 0) return false; // Черные ('b') идут только вниз
        }

        // 5. Разбираем тип хода: обычный (на 1 клетку) или рубка (на 2 клетки)
        if (absRowDiff === 1) {
            // Обычный ход — ничего дополнительно делать не нужно
        } 
        else if (absRowDiff === 2) {
            // Прыжок (взятие) — находим координаты клетки между ними
            const midRow = fromRow + rowDiff / 2;
            const midCol = fromCol + colDiff / 2;
            const midPiece = this.board[midRow][midCol];

            // Проверяем, что перепрыгиваем именно через врага, а не пустоту или своего
            if (!midPiece || midPiece.toLowerCase() === this.turn) return false;

            // Успешная рубка: убираем сбитую шашку
            this.board[midRow][midCol] = null;
        } 
        else {
            // Ходить больше чем на 2 клетки за раз нельзя (для текущей логики)
            return false; 
        }

        // 6. Применяем ход на доске
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // 7. Превращение в Дамку, если шашка дошла до противоположного края
        if (piece === 'w' && toRow === 0) this.board[toRow][toCol] = 'W';
        if (piece === 'b' && toRow === 7) this.board[toRow][toCol] = 'B';

        // 8. Передаем ход оппоненту
        this.turn = this.turn === 'w' ? 'b' : 'w';
        
        return true;
    }
}

module.exports = CheckersLogic;