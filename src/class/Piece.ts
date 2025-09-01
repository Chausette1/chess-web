/*
the logical coordinate are like this:
      y
    (0,7) (1,7) (2,7) (3,7) (4,7) (5,7) (6,7) (7,7)
    (0,6) (1,6) (2,6) (3,6) (4,6) (5,6) (6,6) (7,6)
    (0,5) (1,5) (2,5) (3,5) (4,5) (5,5) (6,5) (7,5)
    (0,4) (1,4) (2,4) (3,4) (4,4) (5,4) (6,4) (7,4)
    (0,3) (1,3) (2,3) (3,3) (4,3) (5,3) (6,3) (7,3)
    (0,2) (1,2) (2,2) (3,2) (4,2) (5,2) (6,2) (7,2)
    (0,1) (1,1) (2,1) (3,1) (4,1) (5,1) (6,1) (7,1)
    (0,0) (1,0) (2,0) (3,0) (4,0) (5,0) (6,0) (7,0)   x
*/

import { ChessBoard } from './ChessBoard'

import whitePawn from '/img/white_pawn.svg?url'
import whiteRook from '/img/white_rook.svg?url'
import whiteKnight from '/img/white_knight.svg?url'
import whiteBishop from '/img/white_bishop.svg?url'
import whiteQueen from '/img/white_queen.svg?url'
import whiteKing from '/img/white_king.svg?url'
import blackPawn from '/img/black_pawn.svg?url'
import blackRook from '/img/black_rook.svg?url'
import blackKnight from '/img/black_knight.svg?url'
import blackBishop from '/img/black_bishop.svg?url'
import blackQueen from '/img/black_queen.svg?url'
import blackKing from '/img/black_king.svg?url'
import type { cellule } from './Cellule'

export abstract class Piece {
    protected x: number;
    protected y: number;
    protected color: string;
    protected position: string;
    protected image: string;
    protected isPinnedV: boolean = false;
    protected isPinnedH: boolean = false;
    protected pressure: string[] = [];

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.position = String.fromCharCode(97 + x) + (y + 1).toString();
        this.color = color;
        this.image = '';
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getColor(): string {
        return this.color;
    }

    public getPosition(): string {
        return this.position;
    }

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.position = String.fromCharCode(97 + x) + (y + 1).toString();
    }

    public getImage(): string {
        return this.image;
    }

    public setPinnedV(pinned: boolean): void {
        this.isPinnedV = pinned;
    }

    public setPinnedH(pinned: boolean): void {
        this.isPinnedH = pinned;
    }

    public isPinned(): boolean {
        return this.isPinnedH || this.isPinnedV;
    }

    public getPinnedH(): boolean {
        return this.isPinnedH;
    }

    public getPinnedV(): boolean {
        return this.isPinnedV;
    }

    public abstract getPossibleMoves(gameBoard: ChessBoard): string[];

    public abstract getPossiblePressure(gameBoard: ChessBoard): string[];

    protected getPossiblePressureAlgo(gameBoard: ChessBoard, directions:{dx:number, dy:number}[]): string[]{
        let possiblePressure:string[] = [];
        const cells:cellule[][] = gameBoard.getCells();
        let possiblePinned:Piece | undefined;

        for(const direction of directions){
            let newX = this.x + direction.dx;
            let newY = this.y + direction.dy;

            let pressure:boolean = false;
            while(newX >= 0 && newX < 8 && newY >= 0 && newY < 8)
            {
                const targetCell = cells[newY][newX];
                possiblePressure.push(targetCell.getPosition());
                newX += direction.dx;
                newY += direction.dy;
                if(!(targetCell.getPiece())){
                    continue;
                }

                if(targetCell.getPiece().getColor() === this.color){
                    break;
                }

                if(!(targetCell.getPiece() instanceof King)){
                    if(!pressure){
                        pressure = true;
                        possiblePinned = targetCell.getPiece();
                    }
                    else{
                        break;
                    }
                }
                else{
                    if(pressure)
                    {
                        let pinnedH = direction.dx !== 0;
                        let pinnedV = direction.dy !== 0;
                        if(possiblePinned){
                            possiblePinned.setPinnedH(pinnedH);
                            possiblePinned.setPinnedV(pinnedV);
                        }
                    }
                    break;
                }                
                
            }
            if(pressure && possiblePinned){
                const pinnedIndex = possiblePressure.indexOf(possiblePinned.getPosition());
                possiblePressure = possiblePressure.slice(0, pinnedIndex + 1);
            }
        }
        this.pressure = possiblePressure;
        return possiblePressure;
    
    }

    public getPressure(): string[] {
        return this.pressure;
    }

}

export class Pawn extends Piece {
    private isFirstMove: boolean = true;

    constructor(x: number, y: number, color: string) {
        super(x, y, color);
        this.image = color === 'white' ? whitePawn : blackPawn;
    }

    public setPosition(x: number, y: number): void {
        this.isFirstMove = false;
        super.setPosition(x, y);
    }

    public getPossibleMoves(gameBoard: ChessBoard): string[] {
        if((this.isPinnedH && this.isPinnedV) || this.isPinnedH)
        {
            return [];
        } 
                

        const possibleMoves: string[] = [];
        let cells:cellule[][] = gameBoard.getCells();

        const step = this.color === 'white' ? 1 : -1; // White moves up, black moves down
        let directions:{dx:number, dy:number, type:number}[] = [
            {dx: 0, dy: step, type: 1},   // Forward
            {dx: 0, dy: step * 2, type: 2}, // First possible moves
            {dx: 1, dy: step, type: 3},   // Capture right
            {dx: -1, dy: step, type: 3}   // Capture left
        ];

        if(this.isPinnedV){
            directions = directions.filter(dir => dir.dx === 0);
        }

        for (const direction of directions) {
            let newX = this.x + direction.dx;
            let newY = this.y + direction.dy;

            if(newX >= 0 && newX < 8 && newY >= 0 && newY < 8){
                const targetCell = cells[newY][newX];
                if(direction.type === 1){
                    if (targetCell.isCellEmpty()) {
                        possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                    }
                }
                else if(direction.type ===2){
                    if (this.isFirstMove) {
                        if (targetCell.isCellEmpty() ) {
                            possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                        }
                    }
                }else if(direction.type === 3){
                    if (!targetCell.isCellEmpty() && targetCell.getPiece().getColor() !== this.color) {
                        possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                    }
                }
            }

        }
        
        //en passant
        const lastMove = gameBoard.getLastMove();
        if(lastMove !== null){
            let pawnX = lastMove.charCodeAt(4) - 97;
            if(this.color === 'white' && this.y === 4){
                if(lastMove[0] === 'P' && lastMove[5] === '5'){
                    if(pawnX === this.x - 1 || pawnX === this.x + 1){
                        possibleMoves.push(String.fromCharCode(97 + pawnX) + '6');
                    }
                }
            }
            else if(this.color === 'black' && this.y === 3){
                if(lastMove[0] === 'P' && lastMove[5] === '4'){
                    if(pawnX === this.x - 1 || pawnX === this.x + 1){
                        possibleMoves.push(String.fromCharCode(97 + pawnX) + '3');
                    }
                }
            }
        }
        return possibleMoves;
    }

    public getPossiblePressure(gameBoard: ChessBoard): string[] {
        gameBoard;
        const possiblePressure: string[] = [];
        const step : number = this.color === 'white' ? 1 : -1;

        const directions = [
            {dx: 1, dy: step},   // Diagonal right
            {dx: -1, dy: step},  // Diagonal left
        ];
    
        for(const direction of directions){
            let newX = this.x + direction.dx;
            let newY = this.y + direction.dy;
    
            if(newX >= 0 && newX < 8 && newY >= 0 && newY < 8){
                possiblePressure.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
            }
        }

        this.pressure = possiblePressure;
        return possiblePressure;
    }
}

export class Rook extends Piece {

    private asMove: boolean = false;

    constructor(x: number, y: number, color: string) {
        super(x, y, color);
        this.image = color === 'white' ? whiteRook : blackRook;
    }

    public setPosition(x: number, y: number): void {
        this.asMove = false;
        super.setPosition(x, y);
    }

    public getPossibleMoves(gameBoard: ChessBoard): string[] {
        if(this.isPinnedV && this.isPinnedH)return [];

        let possibleMoves: string[] = [];
        const cells = gameBoard.getCells();

        let directions: {dx:number, dy:number}[] = [
            {dx: 1, dy: 0},   // Right
            {dx: -1, dy: 0},  // Left
            {dx: 0, dy: 1},   // Up
            {dx: 0, dy: -1},  // Down
        ];

        if((this.isPinnedV && !this.isPinnedH) || (this.isPinnedH && this.isPinnedV))
        {
            let king: {x: number, y: number} | undefined = undefined;
            cells.forEach(row=>{
                row.forEach(cell=>{
                    if(cell.getPiece() instanceof King && cell.getPiece().getColor() === this.color){
                        king = {
                            x: cell.getPiece().getX(),
                            y: cell.getPiece().getY()
                        }
                    }
                });
            });
            let deltaX = king!.x - this.x;
            let deltaY = king!.y - this.y;
            directions = directions.filter(direction => {
                const newX = this.x + direction.dx;
                const newY = this.y + direction.dy;
                return (newX - this.x) * deltaY === (newY - this.y) * deltaX;
            });
        }

        for(const direction of directions){
            let newX = this.x + direction.dx;
            let newY = this.y + direction.dy;

            while(newX >= 0 && newX < 8 && newY >= 0 && newY < 8){
                const targetCell = cells[newY][newX];
                if(targetCell.isCellEmpty()){
                    possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                } else {
                    if(targetCell.getPiece().getColor() !== this.color){
                        possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                    }
                    break;
                }
                newX += direction.dx;
                newY += direction.dy;
            }
        }

        return possibleMoves;
    }

    public getAsMove(): boolean {
        return this.asMove;
    }

    public getPossiblePressure(gameBoard: ChessBoard): string[] {
        let directions:{dx:number, dy:number}[] = [
            {dx: 0, dy: 1}, //up
            {dx: 1, dy: 0}, //right
            {dx: 0, dy: -1},  // Down
            {dx: -1, dy: 0},  // Left
        ];

        return this.getPossiblePressureAlgo(gameBoard, directions);
    }
}
export class Knight extends Piece {
    private directions = [
            {dx: -1, dy: 2},   
            {dx: 1, dy: 2},
            {dx: 2, dy: 1},
            {dx: 2, dy: -1},
            {dx: 1, dy: -2},
            {dx: -1, dy: -2},
            {dx: -2, dy: -1},
            {dx: -2, dy: 1}
        ];

    constructor(x: number, y: number, color: string) {
        super(x, y, color);
        this.image = color === 'white' ? whiteKnight : blackKnight;
    }
    public getPossibleMoves(gameBoard: ChessBoard): string[] {
        if(this.isPinnedH || this.isPinnedV) return [];
        let possibleMove:string[] = [];
        
        const cells = gameBoard.getCells();

        for (const direction of this.directions) {
            const newX = this.x + direction.dx;
            const newY = this.y + direction.dy;

            if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                const targetCell = cells[newY][newX];
                if (targetCell.isCellEmpty() || targetCell.getPiece().getColor() !== this.color) {
                    possibleMove.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                }
            }
        }

        return possibleMove;
    }
    
    public getPossiblePressure(gameBoard: ChessBoard): string[] {        
        let possiblePressure:string[] = [];
        const cells = gameBoard.getCells();
        
        for (const direction of this.directions) {
            const newX = this.x + direction.dx;
            const newY = this.y + direction.dy;

            if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                const targetCell = cells[newY][newX];
                possiblePressure.push(targetCell.getPosition());
            }
        }
        this.pressure = possiblePressure;
        return possiblePressure;
    }
}
export class Bishop extends Piece {
    constructor(x: number, y: number, color: string) {
        super(x, y, color);
        this.image = color === 'white' ? whiteBishop : blackBishop;
    }

    public getPossibleMoves(gameBoard: ChessBoard): string[] {
        if((this.isPinnedH && !this.isPinnedV) || (!this.isPinnedH && this.isPinnedV)) return [];
        let possibleMoves: string[] = [];
        const cells = gameBoard.getCells();
        
        let directions: {dx:number, dy:number}[] = [
            {dx: 1, dy: 1},   // Right-Up
            {dx: -1, dy: 1},  // Left-Up
            {dx: 1, dy: -1},  // Right-Down
            {dx: -1, dy: -1}, // Left-Down
        ];
        if(this.isPinnedH && this.isPinnedV)
        {
            let king: {x: number, y: number} | undefined = undefined;
            cells.forEach(row=>{
                row.forEach(cell=>{
                    if(cell.getPiece() instanceof King && cell.getPiece().getColor() === this.color){
                        king = {
                            x: cell.getPiece().getX(),
                            y: cell.getPiece().getY()
                        }
                    }
                });
            });
            let deltaX = king!.x - this.x;
            let deltaY = king!.y - this.y;
            directions = directions.filter(direction => {
                const newX = this.x + direction.dx;
                const newY = this.y + direction.dy;
                return (newX - this.x) * deltaY === (newY - this.y) * deltaX;
            });
        }

        for (const direction of directions) {
            let newX = this.x + direction.dx;
            let newY = this.y + direction.dy;

            while (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                const targetCell = cells[newY][newX];
                if (targetCell.isCellEmpty()) {
                    possibleMoves.push(targetCell.getPosition());
                } else {
                    if (targetCell.getPiece().getColor() !== this.color) {
                        possibleMoves.push(targetCell.getPosition());
                    }
                    break;
                }
                newX += direction.dx;
                newY += direction.dy;
            }
        }

        return possibleMoves;
    }
    
    public getPossiblePressure(gameBoard: ChessBoard): string[] {
        
        let directions:{dx:number, dy:number}[] = [
            {dx: 1, dy: 1}, //up-right
            {dx: 1, dy: -1},  // Right-Down
            {dx: -1, dy: -1},  // Down-Left
            {dx: -1, dy: 1}   // Up-Left
        ];

        return this.getPossiblePressureAlgo(gameBoard, directions);
    }
}
export class Queen extends Piece {
    constructor(x: number, y: number, color: string) {
        super(x, y, color);
        this.image = color === 'white' ? whiteQueen : blackQueen;
    }
    public getPossibleMoves(gameBoard :ChessBoard): string[] {
        let possibleMoves:string[] = [];
        const cells:cellule[][] = gameBoard.getCells();

        let directions:{dx:number, dy:number}[] = [
            {dx: 0, dy: 1}, //up
            {dx: 1, dy: 1}, //up-right
            {dx: 1, dy: 0}, //right
            {dx: 1, dy: -1},  // Right-Down
            {dx: 0, dy: -1},  // Down
            {dx: -1, dy: -1},  // Down-Left
            {dx: -1, dy: 0},  // Left
            {dx: -1, dy: 1}   // Up-Left
        ];

        if(this.isPinnedH || this.isPinnedV)
        {
            let king: {x: number, y: number} | undefined = undefined;
            cells.forEach(row=>{
                row.forEach(cell=>{
                    if(cell.getPiece() instanceof King && cell.getPiece().getColor() === this.color){
                        king = {
                            x: cell.getPiece().getX(),
                            y: cell.getPiece().getY()
                        }
                    }
                });
            });
            let deltaX = king!.x - this.x;
            let deltaY = king!.y - this.y;
            directions = directions.filter(direction => {
                const newX = this.x + direction.dx;
                const newY = this.y + direction.dy;
                return (newX - this.x) * deltaY === (newY - this.y) * deltaX;
            });
        }

        for(const direction of directions){
            let newX = this.x + direction.dx;
            let newY = this.y + direction.dy;

            while(newX >= 0 && newX < 8 && newY >= 0 && newY < 8)
            {
                const targetCell = cells[newY][newX];
                if(targetCell.isCellEmpty()){
                    possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                }else {
                    if (targetCell.getPiece().getColor() !== this.color) {
                        possibleMoves.push(String.fromCharCode(97 + newX) + (newY + 1).toString());
                    }
                    break;
                }
                newX += direction.dx;
                newY += direction.dy;
 
            }
        }

        return possibleMoves;
    }
    
    public getPossiblePressure(gameBoard: ChessBoard): string[] {
        let directions:{dx:number, dy:number}[] = [
            {dx: 0, dy: 1}, //up
            {dx: 1, dy: 1}, //up-right
            {dx: 1, dy: 0}, //right
            {dx: 1, dy: -1},  // Right-Down
            {dx: 0, dy: -1},  // Down
            {dx: -1, dy: -1},  // Down-Left
            {dx: -1, dy: 0},  // Left
            {dx: -1, dy: 1}   // Up-Left
        ];

        return this.getPossiblePressureAlgo(gameBoard, directions);
    }
}
export class King extends Piece {
    
    private asMove: boolean = false;
    private directions = [
        {dx: 1, dy: 0},   // Right
        {dx: -1, dy: 0},  // Left
        {dx: 0, dy: 1},   // Up
        {dx: 0, dy: -1},  // Down
        {dx: 1, dy: 1},   // Up-Right
        {dx: -1, dy: 1},  // Up-Left
        {dx: 1, dy: -1},  // Down-Right
        {dx: -1, dy: -1}  // Down-Left
    ];

    constructor(x: number, y: number, color: string) {
        super(x, y, color);
        this.image = color === 'white' ? whiteKing : blackKing;
    }

    public setPosition(x: number, y: number): void {
        this.asMove = false;
        super.setPosition(x, y);
    }

    public getPossibleMoves(gameBoard: ChessBoard): string[] {
        let possibleMove:string[] = [];
        
        const cells = gameBoard.getCells();
        const enemyPressure : string[] = gameBoard.getPressure(this.color === 'white' ? false : true);
        this.directions.forEach((direction)=>{
            const newX = this.x + direction.dx;
            const newY = this.y + direction.dy;

            if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                const targetCell = cells[newY][newX];
                const empty = targetCell.isCellEmpty();
                const isSameColor = !empty && targetCell.getPiece().getColor() === this.color;
                const isOnEnemyPressure = enemyPressure.includes(targetCell.getPosition());
                if ((empty && !isOnEnemyPressure) ||
                    (!empty && !isSameColor && !isOnEnemyPressure)
                ) {
                    possibleMove.push(targetCell.getPosition());
                }
            }
        });

        if(this.asMove === false){

            if(this.color === 'white'){
                if(gameBoard.getCellAt(0, 0).getPiece() instanceof Rook){
                    let rook:Rook = gameBoard.getCellAt(0, 0).getPiece() as Rook;
                    if(rook.getColor() === 'white' && rook.getAsMove() === false){
                        if(gameBoard.getCellAt(1, 0).isCellEmpty() && gameBoard.getCellAt(2, 0).isCellEmpty() && gameBoard.getCellAt(3, 0).isCellEmpty()){
                            possibleMove.push('c1');
                        }
                    }
                }
                if(gameBoard.getCellAt(7, 0).getPiece() instanceof Rook){
                    let rook:Rook = gameBoard.getCellAt(7, 0).getPiece() as Rook;
                    if(rook.getColor() === 'white' && rook.getAsMove() === false){
                        if(gameBoard.getCellAt(6, 0).isCellEmpty() && gameBoard.getCellAt(5, 0).isCellEmpty()){
                            possibleMove.push('g1');
                        }
                    }
                }
            }else{
                if(gameBoard.getCellAt(0, 7).getPiece() instanceof Rook){
                    let rook:Rook = gameBoard.getCellAt(0, 7).getPiece() as Rook;
                    if(rook.getColor() === 'black' && rook.getAsMove() === false){
                        if(gameBoard.getCellAt(1, 7).isCellEmpty() && gameBoard.getCellAt(2, 7).isCellEmpty() && gameBoard.getCellAt(3, 7).isCellEmpty()){
                            possibleMove.push('c8');
                        }
                    }
                }
                if(gameBoard.getCellAt(7, 7).getPiece() instanceof Rook){
                    let rook:Rook = gameBoard.getCellAt(7, 7).getPiece() as Rook;
                    if(rook.getColor() === 'black' && rook.getAsMove() === false){
                        if(gameBoard.getCellAt(6, 7).isCellEmpty() && gameBoard.getCellAt(5, 7).isCellEmpty()){
                            possibleMove.push('g8');
                        }
                    }
                }
            }
        }
        let pressure = gameBoard.getPressure(this.color === 'white' ? false : true);
        possibleMove = possibleMove.filter(move => !pressure.includes(move));

        return possibleMove;
    }
    
    public getPossiblePressure(gameBoard: ChessBoard): string[] {
        let possiblePressure:string[] = [];

        const cells = gameBoard.getCells();
        const enemyPressure : string[] = gameBoard.getPressure(this.color === 'white' ? false : true);

        this.directions.forEach((move)=>{
            const newX = this.x + move.dx;
            const newY = this.y + move.dy;

            if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                const targetCell = cells[newY][newX];
                const empty = targetCell.isCellEmpty();
                const isSameColor = !empty && targetCell.getPiece().getColor() === this.color;
                const isOnEnemyPressure = enemyPressure.includes(targetCell.getPosition());
                if ((empty && !isOnEnemyPressure) ||
                    (!empty && !isSameColor && !isOnEnemyPressure) ||
                    (!empty && isSameColor)
                ) {
                    possiblePressure.push(targetCell.getPosition());
                }
            }
        });

        this.pressure = possiblePressure;
        return possiblePressure;
    }

    public getAsMove(): boolean {
        return this.asMove;
    }
}
