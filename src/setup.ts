import { ChessBoard } from './class/ChessBoard.ts'
import { Pawn, Rook, Knight, Bishop, Queen, King } from './class/Piece.ts'

export function setup(): ChessBoard {
    setupHTML();
    const board:ChessBoard = setupChessBoard();
    
    return board;
}

function setupHTML(): void {
    const container = document.getElementById('board') as HTMLDivElement;
    for (let y = 8; y > 0; y--) {
        for (let x = 0; x < 8; x++) {
            const div = createDiv(x, y);
            container.appendChild(div);
        }
    }
}

const createDiv = (x:number, y:number): HTMLDivElement => {
    //create a div element
    const div = document.createElement('div');
    
    //set the position of the div
    const data:string =  String.fromCharCode(97 + x) + y.toString();
    div.dataset.position = data;
    
    //set the class of the div
    div.classList.add('square');
    div.classList.add((x + y) % 2 === 0 ? 'white' : 'black');

    return div;
}

function setupChessBoard() :ChessBoard{
    const chessBoard = new ChessBoard();

    //Fill the chessboard with pieces

    // white pieces
    // White Pawns
    for (let x = 0; x < 8; x++) {
        let pawn = new Pawn(x, 1, 'white');
        chessBoard.PutPiece(pawn);
    }
    // White Rooks
    chessBoard.PutPiece(new Rook(0, 0, 'white'));
    chessBoard.PutPiece(new Rook(7, 0, 'white'));
    // White Knights
    chessBoard.PutPiece(new Knight(1, 0, 'white'));
    chessBoard.PutPiece(new Knight(6, 0, 'white'));
    // White Bishops
    chessBoard.PutPiece(new Bishop(2, 0, 'white'));
    chessBoard.PutPiece(new Bishop(5, 0, 'white'));
    // White Queen and King
    chessBoard.PutPiece(new Queen(3, 0, 'white'));
    chessBoard.PutPiece(new King(4, 0, 'white'));

    // black pieces
    // Black Pawns
    for (let x = 0; x < 8; x++) {
        let pawn = new Pawn(x, 6, 'black');
        chessBoard.PutPiece(pawn);
    }
    // Black Rooks
    chessBoard.PutPiece(new Rook(0, 7, 'black'));
    chessBoard.PutPiece(new Rook(7, 7, 'black'));
    // Black Knights
    chessBoard.PutPiece(new Knight(1, 7, 'black'));
    chessBoard.PutPiece(new Knight(6, 7, 'black'));
    // Black Bishops
    chessBoard.PutPiece(new Bishop(2, 7, 'black'));
    chessBoard.PutPiece(new Bishop(5, 7, 'black'));
    // Black Queen and King
    chessBoard.PutPiece(new Queen(3, 7, 'black'));
    chessBoard.PutPiece(new King(4, 7, 'black'));

    return chessBoard;
}

