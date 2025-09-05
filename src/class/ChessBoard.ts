/*
the logical coordinate are like this:

    (0,7) (1,7) (2,7) (3,7) (4,7) (5,7) (6,7) (7,7)
    (0,6) (1,6) (2,6) (3,6) (4,6) (5,6) (6,6) (7,6)
    (0,5) (1,5) (2,5) (3,5) (4,5) (5,5) (6,5) (7,5)
    (0,4) (1,4) (2,4) (3,4) (4,4) (5,4) (6,4) (7,4)
    (0,3) (1,3) (2,3) (3,3) (4,3) (5,3) (6,3) (7,3)
    (0,2) (1,2) (2,2) (3,2) (4,2) (5,2) (6,2) (7,2)
    (0,1) (1,1) (2,1) (3,1) (4,1) (5,1) (6,1) (7,1)
    (0,0) (1,0) (2,0) (3,0) (4,0) (5,0) (6,0) (7,0)
*/

import {cellule} from './Cellule.ts';
import {Bishop, King, Pawn, Piece, Queen, Rook} from './Piece.ts';

export class ChessBoard {
  private cells: cellule[][];
  private history: string[] = [];
  private whitePressureCases: Set<string> = new Set();
  private blackPressureCases: Set<string> = new Set();
  private turn: 'white'|'black' = 'white';
  private selectedPiece: Piece|null = null;
  private isKingCheckWithoutEscape: boolean = false;
  private piecesCanSaveHim: Piece[] = [];
  private moveCanSaveHim: string[] = [];

  constructor() {
    this.cells = new Array(8);
    for (let y = 0; y < 8; y++) {
      this.cells[y] = new Array(8);
      for (let x = 0; x < 8; x++) {
        this.cells[y][x] = new cellule(x, y);
      }
    }
  }

  public getCellAt(x: number, y: number): cellule;
  public getCellAt(position: string): cellule;
  public getCellAt(x: number|string, y?: number): cellule {
    if (typeof x === 'string') {
      const {x: posX, y: posY} = this.translatePosition(x);
      return this.getCellAt(posX, posY);
    } else {
      return this.cells[y!][x!];
    }
  }

  public getCells(): cellule[][] {
    return this.cells;
  }

  public PutPiece(piece: Piece): void {
    const x = piece.getX();
    const y = piece.getY();
    const cell = this.getCellAt(x, y);

    if (cell.isCellEmpty()) {
      cell.setPiece(piece);
    } else {
      throw new Error(`Cell at (${x}, ${y}) is not empty.`);
    }
  }

  public removePiece(piece: Piece): void {
    const x = piece.getX();
    const y = piece.getY();
    const cell = this.getCellAt(x, y);

    if (!cell.isCellEmpty() && cell.getPiece() === piece) {
      cell.clearPiece();
    } else {
      throw new Error(`Cell at (${x}, ${
          y}) is empty or does not contain the specified piece.`);
    }
  }

  public movePiece(position: string): Piece|null {
    if (!this.selectedPiece) throw new Error('No piece selected to move.');

    const {x: oldX, y: oldY} =
        this.translatePosition(this.selectedPiece!.getPosition());
    const {x: newX, y: newY} = this.translatePosition(position);
    const oldCell = this.getCellAt(oldX, oldY);
    const newCell = this.getCellAt(newX, newY);

    this.updateHistory(oldCell.getPosition(), newCell.getPosition());

    if (!oldCell.isCellEmpty() && oldCell.getPiece() === this.selectedPiece) {
      if (newCell.isCellEmpty() ||
          newCell.getPiece().getColor() !== this.selectedPiece.getColor()) {
        this.Casteling(oldCell, newCell, this.selectedPiece);
        this.enPassant(oldCell, newCell, this.selectedPiece);

        this.removePiece(this.selectedPiece);  // pop old piece from his cell
        if (!newCell.isCellEmpty()) {
          this.removePiece(newCell.getPiece());  // pop piece from his cell
        }
        this.selectedPiece.setPosition(
            newX, newY);  // change position of selected piece
        this.PutPiece(
            this.selectedPiece);  // put the selected piece in the new cellule
      } else {
        throw new Error(`Target cell at (${newX}, ${newY}) is not empty.`);
      }
    } else {
      throw new Error(`No piece found at (${oldX}, ${
          oldY}) or it does not match the specified piece.`);
    }

    this.turn = this.turn === 'white' ? 'black' : 'white';

    let isPawnUpgraded = this.checkIfPawnUpgrade(this.selectedPiece!);
    let pawn = null;

    if (isPawnUpgraded) {
      pawn = this.selectedPiece!;
    }

    if (this.isKingCheckWithoutEscape) {
      this.piecesCanSaveHim = [];
      this.moveCanSaveHim = [];
      this.isKingCheckWithoutEscape = false;
    }

    this.selectedPiece = null;

    return pawn;
  }
  private Casteling(oldCell: cellule, newCell: cellule, piece: Piece): void {
    if ((oldCell.getPosition() === 'e1' && piece instanceof King &&
         newCell.getPosition() === 'g1') ||
        (oldCell.getPosition() === 'e1' && piece instanceof King &&
         newCell.getPosition() === 'c1') ||
        (oldCell.getPosition() === 'e8' && piece instanceof King &&
         newCell.getPosition() === 'g8') ||
        (oldCell.getPosition() === 'e8' && piece instanceof King &&
         newCell.getPosition() === 'c8')) {
      // Castling logic can be added here
      switch (newCell.getPosition()) {
        case 'g1':
          // Move the rook to f1
          this.movePieceTo(this.getCellAt(7, 0).getPiece(), 5, 0);
          this.history.pop();
          this.history.push('0-0');
          break;
        case 'c1':
          // Move the rook to d1
          this.movePieceTo(this.getCellAt(0, 0).getPiece(), 3, 0);
          this.history.pop();
          this.history.push('0-0-0');
          break;
        case 'g8':
          // Move the rook to f8
          this.movePieceTo(this.getCellAt(7, 7).getPiece(), 5, 7);
          this.history.pop();
          this.history.push('0-0');
          break;
        case 'c8':
          // Move the rook to d8
          this.movePieceTo(this.getCellAt(0, 7).getPiece(), 3, 7);
          this.history.pop();
          this.history.push('0-0-0');
          break;
      }
    }
  }
  private enPassant(oldCell: cellule, newCell: cellule, piece: Piece): void {
    const lastMove: string|null = this.getLastMove();
    if (!lastMove) return;

    const pawnX = lastMove.charCodeAt(4) - 97;
    if (newCell.isCellEmpty() && piece instanceof Pawn &&
        oldCell.getX() !== newCell.getX()) {
      let pawnDied: Piece = this.getCellAt(pawnX, oldCell.getY()).getPiece();
      this.removePiece(pawnDied);
      this.history.pop();
      this.history.push('e.p.');
    }
  }

  public updateHistory(oldPosition: string, newPosition: string): void {
    const oldCell = this.getCellAt(oldPosition);
    const newCell = this.getCellAt(newPosition);

    const pieceType: string = this.getPieceType(oldCell.getPiece());
    const isEating: boolean = !newCell.isCellEmpty();

    const moveNotation = `${pieceType}${oldCell.getPosition()}${
        isEating ? 'x' : '-'}${newCell.getPosition()}`;
    this.history.push(moveNotation);
  }

  public getLastMove(): string|null {
    if (this.history.length === 0) {
      return null;
    }
    return this.history[this.history.length - 1];
  }

  private getPieceType(piece: Piece): string {
    const constructorName = piece.constructor.name;
    switch (constructorName) {
      case 'Pawn':
        return 'P';
      case 'Rook':
        return 'R';
      case 'Knight':
        return 'N';
      case 'Bishop':
        return 'B';
      case 'Queen':
        return 'Q';
      case 'King':
        return 'K';
      default:
        throw new Error(`Unknown piece type: ${constructorName}`);
    }
  }

  private checkIfPawnUpgrade(piece: Piece): boolean {
    if (piece instanceof Pawn) {
      const y = piece.getY();
      if ((y === 7 && piece.getColor() === 'white') ||
          (y === 0 && piece.getColor() === 'black')) {
        return true;
      }
    }
    return false;
  }

  public evolvePawn(newPiece: Piece): void {
    const x = newPiece.getX();
    const y = newPiece.getY();
    const cell = this.getCellAt(x, y);
    if (!cell.isCellEmpty() && cell.getPiece() instanceof Pawn) {
      cell.clearPiece();
      cell.setPiece(newPiece);
    } else {
      throw new Error(`No pawn found at (${x}, ${y}) to evolve.`);
    }
  }

  public changeHistoryPawnPromotion(newPiece: Piece): void {
    const lastMove = this.getLastMove();
    if (!lastMove) {
      return;
    }
    const newNotation = lastMove + `=${this.getPieceType(newPiece)}`;
    this.history.push(newNotation);
  }

  public UpdatePressurePiece(): void {
    this.whitePressureCases = new Set();
    this.blackPressureCases = new Set();

    this.cells.forEach((row) => {
      row.forEach((cell) => {
        const piece = cell.getPiece();
        if (piece) {
          let buffer = piece.getPossiblePressure(this);
          if (piece.getColor() === 'white') {
            buffer.forEach((move) => this.whitePressureCases.add(move));
          }
          if (piece.getColor() === 'black') {
            buffer.forEach((move) => this.blackPressureCases.add(move));
          }
        }
      });
    });
  }

  public getPressure(white: boolean): string[] {
    return white ? Array.from(this.whitePressureCases) :
                   Array.from(this.blackPressureCases);
  }

  public getPieceCount(color: string): number {
    return this.cells.flat()
        .filter((cell) => cell.getPiece()?.getColor() === color)
        .length;
  }

  public checkForCheck(
      check: {white: boolean; black: boolean},
      checkmate: {white: boolean; black: boolean},
      pat: {white: boolean; black: boolean}): void {
    // Check for check
    const whiteKing = this.findKing(true)!;
    const blackKing = this.findKing(false)!;

    const wEscape = this.doesKingHaveNoEscape(true, whiteKing);
    const bEscape = this.doesKingHaveNoEscape(false, blackKing);

    pat.white = this.doesKingHaveNoEscape(true, whiteKing, true);
    pat.black = this.doesKingHaveNoEscape(false, blackKing, true);

    if (this.blackPressureCases.has(whiteKing.getPosition())) {
      check.white = true;
      checkmate.white = wEscape;
      if (wEscape) {
        this.isKingCheckWithoutEscape = true;
      }
    } else {
      check.white = false;
    }
    if (this.whitePressureCases.has(blackKing.getPosition())) {
      check.black = true;
      checkmate.black = bEscape;
      if (bEscape) {
        this.isKingCheckWithoutEscape = true;
      }
    } else {
      check.black = false;
    }
  }

  public findKing(white: boolean): Piece|null {
    return (
        this.cells.flat()
            .find((cell) => {
              const piece = cell.getPiece();
              return (
                  piece instanceof King &&
                  piece.getColor() === (white ? 'white' : 'black'));
            })
            ?.getPiece() ||
        null);
  }

  private doesKingHaveNoEscape(
      white: boolean, king: Piece, pat: boolean = false): boolean {
    const direction = [
      {dx: 0, dy: 1},    // Up
      {dx: 1, dy: 1},    // Up-Right
      {dx: 1, dy: 0},    // Right
      {dx: 1, dy: -1},   // Down-Right
      {dx: 0, dy: -1},   // Down
      {dx: -1, dy: -1},  // Down-Left
      {dx: -1, dy: 0},   // Left
      {dx: -1, dy: 1},   // Up-Left
    ];

    let allCells: number = 0;
    let unplayableCellsCount: number = 0;
    direction.forEach((dir) => {
      const newX = king.getX() + dir.dx;
      const newY = king.getY() + dir.dy;
      if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
        allCells++;
        const pos = this.getCellAt(newX, newY).getPosition();
        if (white) {
          if (pat && this.blackPressureCases.has(pos)) {
            unplayableCellsCount++;
          } else if (
              !pat &&
              (this.getCellAt(newX, newY).getPiece()?.getColor() === 'white' ||
               this.blackPressureCases.has(pos))) {
            unplayableCellsCount++;
          }
        } else {
          if (pat && this.whitePressureCases.has(pos)) {
            unplayableCellsCount++;
          } else if (
              !pat &&
              (this.getCellAt(newX, newY).getPiece()?.getColor() === 'black' ||
               this.whitePressureCases.has(pos))) {
            unplayableCellsCount++;
          }
        }
      }
    });
    return unplayableCellsCount === allCells;
  }

  private checkIfPiecesArePinned(): boolean {
    const pinnedPieces = this.cells.flat().filter((cell) => {
      const piece = cell.getPiece();
      return piece && piece.isPinned();
    });
    return pinnedPieces.length > 0;
  }

  private UnpinPiece(piece: Piece): void {
    piece.setPinnedV(false);
    piece.setPinnedH(false);
  }

  private getAllWrongPinnedPieces(): Piece[] {
    const wrongPinnedPieces: Piece[] = [];
    this.cells.flat().forEach((cell) => {
      const piece = cell.getPiece();
      if (piece && piece.isPinned()) {
        if (this.checkIfPieceAtIsPinnedWrong(piece.getPosition())) {
          wrongPinnedPieces.push(piece);
        }
      }
    });
    return wrongPinnedPieces;
  }

  private checkIfPieceAtIsPinnedWrong(position: string): boolean {
    const cell = this.getCellAt(position);
    const piece = cell.getPiece();
    let direction: {dx: number; dy: number}[];

    if (piece.getPinnedH() && piece.getPinnedV()) {
      direction = [
        {dx: 1, dy: 1},
        {dx: -1, dy: -1},
        {dx: 1, dy: -1},
        {dx: -1, dy: 1},
      ];
    } else if (piece.getPinnedH()) {
      direction = [
        {dx: 1, dy: 0},
        {dx: -1, dy: 0},
      ];
    } else if (piece.getPinnedV()) {
      direction = [
        {dx: 0, dy: 1},
        {dx: 0, dy: -1},
      ];
    }

    let pinnerPiece: Piece|null = null;
    let king: Piece|null = null;

    for (const dir of direction!) {
      let newX = piece.getX() + dir.dx;
      let newY = piece.getY() + dir.dy;
      while (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
        const targetCell = this.getCellAt(newX, newY);
        if (targetCell.isCellEmpty()) {
          newX += dir.dx;
          newY += dir.dy;
          continue;
        }
        if (targetCell.getPiece().getColor() === piece.getColor()) {
          break;
        }
        if (targetCell.getPiece().getColor() !== piece.getColor()) {
          const targetPiece = targetCell.getPiece();
          if (targetPiece instanceof Rook || targetPiece instanceof Bishop ||
              targetPiece instanceof Queen) {
            if (targetPiece instanceof King) {
              king = targetPiece;
            }
            pinnerPiece = targetPiece;
          }
        }
        newX += dir.dx;
        newY += dir.dy;
      }
    }
    return pinnerPiece === null || king === null;
  }

  public checkForCheckmate(white: boolean):
      {check: boolean; positions: string[];} {
    const king = this.findKing(white);
    if (!king) throw new Error('King should not be null');

    const piecesCanProtect = this.checkIfPiecesCanProtect(white, king);
    this.piecesCanSaveHim = piecesCanProtect.piece;

    let positions: string[] = [];
    piecesCanProtect.piece.forEach((piece) => {
      positions.push(piece.getPosition());
    });

    return {check: !piecesCanProtect.canProtect, positions};
  }

  private checkIfPiecesCanProtect(white: boolean, king: Piece):
      {canProtect: boolean; piece: Piece[]} {
    const pieces = this.getAllPieces(white);
    const attackingPiece: Piece =
        this.findAttackingPiece(king, this.getAllPieces(!white))!;

    let possibleProtectingPiece: Piece[] = [];
    for (const piece of pieces) {
      if (this.canProtectKing(attackingPiece, piece, king)) {
        possibleProtectingPiece.push(piece);
      }
    }

    return {
      canProtect: possibleProtectingPiece.length > 0,
      piece: possibleProtectingPiece,
    };
  }

  private getAllPieces(white: boolean): Piece[] {
    return this.cells.flatMap(
        (row) => row.filter((cell) => {
                      const piece = cell.getPiece();
                      return piece &&
                          piece.getColor() === (white ? 'white' : 'black');
                    })
                     .map((cell) => cell.getPiece()));
  }

  private findAttackingPiece(king: Piece, attackingPieces: Piece[]): Piece
      |null {
    const kingPosition = king.getPosition();
    for (const piece of attackingPieces) {
      const attackersMoves = piece.getPressure();
      if (attackersMoves.includes(kingPosition)) {
        return piece;
      }
    }
    throw new Error('An attacking piece should be found');
  }

  private canProtectKing(
      attackingPiece: Piece, potentialProtectingPiece: Piece,
      king: Piece): boolean {
    const moves = potentialProtectingPiece.getPossibleMoves(this);

    let line: {dx: number; dy: number} = {
      dx: attackingPiece.getX() - king.getX(),
      dy: attackingPiece.getY() - king.getY(),
    };
    line = {dx: line.dx / Math.abs(line.dx), dy: line.dy / Math.abs(line.dy)};

    let possibleProtectingPositions: string[] = [];

    let newX = king.getX();
    let newY = king.getY();
    while (newX !== attackingPiece.getX() || newY !== attackingPiece.getY()) {
      newX += line.dx;
      newY += line.dy;
      possibleProtectingPositions.push(
          String.fromCharCode(97 + newX) + (newY + 1).toString());
    }

    let buffer: boolean = false;
    for (const move of moves) {
      if (possibleProtectingPositions.includes(move)) {
        this.moveCanSaveHim.push(move);
        buffer = true;
      }
    }

    return buffer;
  }

  public isPiecePlayable(position: string): boolean {
    const {x, y} = this.translatePosition(position);
    const cell = this.getCellAt(x, y);
    if (!cell || cell.isCellEmpty()) return false;

    const piece = cell.getPiece();
    return piece && piece.getColor() === this.turn;
  }

  private translatePosition(position: string): {x: number; y: number} {
    const x = position.charCodeAt(0) - 97;       // 'a' is 97 in ASCII
    const y = parseInt(position.charAt(1)) - 1;  // Convert to zero-based index
    return {x, y};
  }

  public selectPieceAndGetPossibleMove(position: string): string[] {
    const cell = this.getCellAt(position);
    const piece = cell.getPiece();
    this.selectedPiece = piece;

    if (this.isKingCheckWithoutEscape) {
      if (this.piecesCanSaveHim.includes(piece)) {
        const possibleMove = piece.getPossibleMoves(this);
        let moves: string[] = [];
        this.moveCanSaveHim.forEach((move) => {
          if (possibleMove.includes(move)) {
            moves.push(move);
          }
        });
        return moves;
      } else {
        return [];
      }
    }

    return piece.getPossibleMoves(this);
  }

  private movePieceTo(piece: Piece, newX: number, newY: number): void {
    // use the movePiece method while buffering selected piece

    const buffer = this.selectedPiece;
    this.selectedPiece = piece;
    const position = `${String.fromCharCode(97 + newX)}${newY + 1}`;
    this.movePiece(position);
    this.selectedPiece = buffer;

    this.turn = this.turn === 'white' ? 'black' : 'white';
    // we need to do that to don't fuck the game state
  }

  public releaseBadPinnedPieces(): void {
    if (this.checkIfPiecesArePinned()) {
      const wrongPinnedPieces = this.getAllWrongPinnedPieces();
      wrongPinnedPieces.forEach((piece) => {
        this.UnpinPiece(piece);
      });
    }
  }
}
