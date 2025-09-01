//all import

import "./style.css";
import { setup } from "./setup.ts";
import { Piece, Queen, Rook, Knight, Bishop } from "./class/Piece.ts";
import { ChessBoard } from "./class/ChessBoard.ts";

//setup the html and the button

const boardContainer: HTMLDivElement = document.getElementById(
  "boardContainer"
) as HTMLDivElement;
const divBoard: HTMLDivElement = document.getElementById(
  "board"
) as HTMLDivElement;
const resetButton: HTMLButtonElement = document.getElementById(
  "resetButton"
) as HTMLButtonElement;
const turnIndicator: HTMLHeadingElement = document.getElementById(
  "turnIndicator"
) as HTMLHeadingElement;
const whiteCaptured: HTMLHeadingElement = document.getElementById(
  "whiteCaptured"
) as HTMLHeadingElement;
const blackCaptured: HTMLHeadingElement = document.getElementById(
  "blackCaptured"
) as HTMLHeadingElement;
const moveHistory: HTMLUListElement = document.getElementById(
  "moveList"
) as HTMLUListElement;

resetButton.addEventListener("click", () => {
  setupGame();
});

// Variables to manage the game state

let chessBoard: ChessBoard = setup();
let isPieceSelected: boolean = false;
let possibleMove: string[] | null = null;
let turn: string = "white"; // Track whose turn it is
let turnCount: number = 0; // Track the number of turns taken
let isPawnUpgrading: boolean = false;
let check: { white: boolean; black: boolean } = { white: false, black: false };
let potentielCheckmate: { white: boolean; black: boolean } = {
  white: false,
  black: false,
};
let pat: { white: boolean; black: boolean } = { white: false, black: false };
let checkmate: boolean = false;

setupGame();

function setupGame(): void {
  clearPossibleMoves();
  isPieceSelected = false;
  possibleMove = null;
  turn = "black"; // Reset turn to black
  turnCount = 0; // Reset turn count
  isPawnUpgrading = false;
  divBoard.innerHTML = ""; // Clear the board
  check.white = false;
  check.black = false;
  potentielCheckmate.white = false;
  potentielCheckmate.black = false;
  pat.white = false;
  pat.black = false;
  checkmate = false;
  chessBoard = setup(); // Re-setup the board
  updateTurnIndicator(); // Update the turn indicator (it will set to white)
  chessBoard.UpdatePressurePiece();
  setupEventListeners(); // Re-setup event listeners
  UpdateBoard(); // Update the board display
  clearHistoryIndicator(); // Clear move history display
}

function UpdateBoard() {
  const cells = chessBoard!.getCells();
  cells.forEach((row) => {
    row.forEach((cell) => {
      const div = divBoard.querySelector(
        'div[data-position="' + cell.getPosition() + '"]'
      ) as HTMLDivElement;
      if (!cell.isCellEmpty()) {
        const piece = cell.getPiece();
        putPieceInDiv(div, piece);
      } else {
        div.innerHTML = ""; // Clear the div if no piece is present
        div.classList.remove("check");
      }
    });
  });
}

function putPieceInDiv(div: HTMLDivElement, piece: Piece): void {
  div.innerHTML = ""; // Clear any existing content
  const img = document.createElement("img");
  img.src = piece.getImage();
  img.alt = piece.getColor() + " " + piece.constructor.name;
  img.classList.add("piece");
  div.appendChild(img);
}

function setupEventListeners(): void {
  const cells = chessBoard!.getCells();
  cells.forEach((row) => {
    row.forEach((cell) => {
      const div = divBoard.querySelector(
        'div[data-position="' + cell.getPosition() + '"]'
      ) as HTMLDivElement;
      div.addEventListener("click", () => handleClick(div));
    });
  });
}

function handleClick(div: HTMLDivElement): void {
  if (isPawnUpgrading || checkmate) {
    return;
  }

  const position = div.dataset.position!;

  if (!isPieceSelected) {
    if (chessBoard.isPiecePlayable(position)) {
      let possibleMoves = chessBoard.selectPieceAndGetPossibleMove(position);
      isPieceSelected = true;
      div.classList.add("selected");
      possibleMove = possibleMoves;
      highlightPossibleMoves();
    }
  } else if (possibleMove!.includes(position)) {
    let possiblePawn = chessBoard.movePiece(position);

    if (possiblePawn) {
      const pawnCoord = { x: possiblePawn.getX(), y: possiblePawn.getY() };
      upgradePawn(pawnCoord, possiblePawn.getColor());
    }

    chessBoard.releaseBadPinnedPieces();
    chessBoard.UpdatePressurePiece();

    chessBoard.checkForCheck(check, potentielCheckmate, pat);

    clearPossibleMoves();
    UpdateBoard();
    updateHistoryIndicator();
    updateTurnIndicator();
    updateCheck(check, potentielCheckmate, pat);
  } else {
    clearPossibleMoves();
  }
}

function highlightPossibleMoves(): void {
  if (!possibleMove) return;
  possibleMove!.forEach((move) => {
    const div: HTMLDivElement = divBoard.querySelector(
      'div[data-position="' + move + '"]'
    ) as HTMLDivElement;
    const cell = chessBoard!.getCellAt(move);
    if (cell.isCellEmpty()) {
      div.classList.add("possible-move");
    } else {
      div.classList.add("possible-attack");
    }
  });
}

function hidePossibleMoves(): void {
  const cells = chessBoard!.getCells();
  cells.forEach((row) => {
    row.forEach((cell) => {
      const div = divBoard.querySelector(
        'div[data-position="' + cell.getPosition() + '"]'
      ) as HTMLDivElement;
      div.classList.remove("selected");
      div.classList.remove("possible-move");
      div.classList.remove("possible-attack");
    });
  });
}

function clearPossibleMoves(): void {
  isPieceSelected = false;
  possibleMove = null;
  hidePossibleMoves();
}

function updateTurnIndicator(): void {
  turn = turn === "white" ? "black" : "white"; // Switch turn
  turnIndicator.textContent = `Current Turn: ${
    turn.charAt(0).toUpperCase() + turn.slice(1)
  }`;
  if (turn === "white") {
    turnCount++;
  }
  let nbWhitePiece = chessBoard!.getPieceCount("white");
  let nbBlackPiece = chessBoard!.getPieceCount("black");
  whiteCaptured.textContent = `White Captured: ${Math.abs(-16 + nbWhitePiece)}`;
  blackCaptured.textContent = `Black Captured: ${Math.abs(-16 + nbBlackPiece)}`;
}

function updateHistoryIndicator(
  bis: boolean = false,
  ter: boolean = false,
  check: boolean = true
): void {
  if (!bis && !ter) {
    updateHistoryIndicatorNormal();
  } else if (!ter) {
    updateHistoryIndicatorBis();
  } else {
    updateHistoryIndicatorTer(check);
  }
  moveHistory.scrollTop = moveHistory.scrollHeight;
}

function updateHistoryIndicatorNormal(): void {
  if (turn === "white") {
    const li = document.createElement("li");
    li.innerHTML = `${turnCount}. <p class="whitemove">${chessBoard.getLastMove()}</p>`;
    moveHistory.appendChild(li);
  } else if (turn === "black") {
    const lastLi = moveHistory.lastElementChild as HTMLLIElement;
    if (lastLi) {
      lastLi.innerHTML += `<p class="blackmove">${chessBoard.getLastMove()}</p>`;
    }
  }
}

function updateHistoryIndicatorBis(): void {
  turn = turn === "white" ? "black" : "white";

  let li = moveHistory.lastElementChild as HTMLLIElement;
  if (turn === "white") {
    li.innerHTML = `${turnCount}. <p class="whitemove">${chessBoard.getLastMove()}</p>`;
  } else if (turn === "black") {
    li.removeChild(li.lastElementChild!);
    li.innerHTML += `<p class="blackmove">${chessBoard.getLastMove()}</p>`;
  }

  turn = turn === "white" ? "black" : "white";
}

function updateHistoryIndicatorTer(check: boolean): void {
  let symbol = check ? "+" : "#";
  turn = turn === "white" ? "black" : "white";

  let li = moveHistory.lastElementChild as HTMLLIElement;
  if (turn === "white") {
    li.innerHTML = `${turnCount}. <p class="whitemove">${chessBoard.getLastMove()}${symbol}</p>`;
    moveHistory.appendChild(li);
  } else if (turn === "black") {
    li.removeChild(li.lastElementChild!);
    li.innerHTML += `<p class="blackmove">${chessBoard.getLastMove()}${symbol}</p>`;
  }

  turn = turn === "white" ? "black" : "white";
}

function clearHistoryIndicator(): void {
  moveHistory.innerHTML = "";
}

function promotePawn(newPiece: Piece): void {
  chessBoard!.evolvePawn(newPiece);
  isPawnUpgrading = false;
  let upgradeDiv: HTMLDivElement | null = document.getElementById(
    "upgrade-pawn"
  ) as HTMLDivElement;
  if (upgradeDiv) {
    upgradeDiv.remove();
  }
  chessBoard.changeHistoryPawnPromotion(newPiece);
  chessBoard.UpdatePressurePiece();
  chessBoard.checkForCheck(check, potentielCheckmate, pat);
  updateHistoryIndicator(true);
  UpdateBoard();
}

function upgradePawn(
  coordinates: { x: number; y: number },
  color: string
): void {
  isPawnUpgrading = true;
  // Handle pawn promotion (e.g., show a dialog to choose a piece)
  let upgradeDiv: HTMLDivElement = document.createElement("div");
  upgradeDiv.classList.add("upgrade-pawn");
  upgradeDiv.id = "upgrade-pawn";
  boardContainer.insertBefore(upgradeDiv, divBoard);
  upgradeDiv.innerHTML = "<p>Promote your pawn to: </p>";
  let ul = document.createElement("ul");
  upgradeDiv.appendChild(ul);

  let piecePossible: Piece[] = [
    new Queen(coordinates.x, coordinates.y, color),
    new Rook(coordinates.x, coordinates.y, color),
    new Bishop(coordinates.x, coordinates.y, color),
    new Knight(coordinates.x, coordinates.y, color),
  ];

  piecePossible.forEach((piece) => {
    const li = document.createElement("li");
    li.classList.add("upgrade-piece-choice");
    const button = document.createElement("button");
    const img = document.createElement("img");
    img.src = piece.getImage();
    button.appendChild(img);
    button.addEventListener("click", () => promotePawn(piece));
    li.appendChild(button);
    ul.appendChild(li);
  });
}

function updateCheck(
  check: { white: boolean; black: boolean },
  potentielCheckmate: { white: boolean; black: boolean },
  pat: { white: boolean; black: boolean }
): void {
  const wKing = chessBoard!.findKing(true)!;
  const bKing = chessBoard!.findKing(false)!;
  const wKingDiv = divBoard.querySelector(
    'div[data-position="' + wKing.getPosition() + '"]'
  ) as HTMLDivElement;
  const bKingDiv = divBoard.querySelector(
    'div[data-position="' + bKing.getPosition() + '"]'
  ) as HTMLDivElement;

  checkForCheck(true, check.white, potentielCheckmate.white, wKingDiv);
  checkForCheck(false, check.black, potentielCheckmate.black, bKingDiv);

  if (pat.white) {
    alert("Stalemate! It's a draw.");
  }
  if (pat.black) {
    alert("Stalemate! It's a draw.");
  }
}

function checkForCheck(
  white: boolean,
  checkArg: boolean,
  potentielCheckmateArg: boolean,
  kingDiv: HTMLDivElement
): void {
  if (checkArg) {
    //king in check
    if (potentielCheckmateArg) {
      const isCheckmate = chessBoard.checkForCheckmate(white);
      if (isCheckmate.check) {
        updateHistoryIndicator(false, true, false);
        alert("Checkmate! " + (white ? "Black" : "White") + " wins!");
        checkmate = true;
        return;
      } else {
        highlightPossibleSavior(isCheckmate.positions);
        putInCheck(white, kingDiv);
      }
    } else {
      putInCheck(white, kingDiv);
    }
  } else kingDiv.classList.remove("check");
}

function putInCheck(white: boolean, kingDiv: HTMLDivElement): void {
  alert("Check! " + (white ? "White" : "Black") + " is in trouble!");
  kingDiv.classList.add("check");
  updateHistoryIndicator(false, true);
}

function highlightPossibleSavior(positions: string[]): void {
  positions.forEach((pos) => {
    const div = divBoard.querySelector(
      'div[data-position="' + pos + '"]'
    ) as HTMLDivElement;
    if (div) {
      div.classList.add("possible-savior");
    }
  });
}
