import { Piece } from './Piece.ts'

export class cellule {

    private x: number;
    private y: number;
    private position: string;
    private isEmpty: boolean;
    private piece: Piece | null = null;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.position = String.fromCharCode(97 + x) + (y+1).toString();
        this.isEmpty = true; // Initially, the cell is empty
    }

    public getPosition(): string {
        return this.position;
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    private setEmpty(): void {
        this.isEmpty = true;
    }

    private setNotEmpty(): void {
        this.isEmpty = false;
    }

    public isCellEmpty(): boolean {
        return this.isEmpty;
    }

    public setPiece(piece: Piece): void {
        this.piece = piece;
        this.setNotEmpty();
    }

    public clearPiece(): void {
        this.piece = null;
        this.setEmpty();
    }

    public getPiece(): Piece {
        return this.piece as Piece;
    }
}