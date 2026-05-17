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
                // Шашки стоят только на черных клетках
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
        
        // Базовая защита от читеров: проверяем, что фигура существует и сейчас ее ход
        if (!piece || piece.toLowerCase() !== this.turn) return false;

        // Если это прыжок (взятие фигуры), очищаем клетку между ними
        const rowDiff = Math.abs(toRow - fromRow);
        if (rowDiff === 2) {
            const midRow = (fromRow + toRow) / 2;
            const midCol = (fromCol + toCol) / 2;
            this.board[midRow][midCol] = null; // Убираем сбитую шашку
        }

        // Применяем ход
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Превращение в Дамку (корону), если дошли до края
        if (piece === 'w' && toRow === 0) this.board[toRow][toCol] = 'W';
        if (piece === 'b' && toRow === 7) this.board[toRow][toCol] = 'B';

        // Передаем ход оппоненту
        this.turn = this.turn === 'w' ? 'b' : 'w';
        
        return true;
    }
}

module.exports = CheckersLogic;
