"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(board: number[][]): number[][] {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return board;
}

function cloneBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]): number[][] {
  return board.map(row => [...row].reverse());
}

function slideAndMerge(row: number[]): number[] {
  const filtered = row.filter(v => v !== 0);
  const merged = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) { skip = false; continue; }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function move(
  board: number[][],
  direction: "up" | "down" | "left" | "right"
): { board: number[][]; moved: boolean } {
  let newBoard = cloneBoard(board);
  let moved = false;
  if (direction === "up") {
    newBoard = transpose(newBoard);
    for (let r = 0; r < SIZE; r++) {
      const merged = slideAndMerge(newBoard[r]);
      if (!moved && merged.some((v, i) => v !== newBoard[r][i])) moved = true;
      newBoard[r] = merged;
    }
    newBoard = transpose(newBoard);
  } else if (direction === "down") {
    newBoard = transpose(newBoard);
    newBoard = reverseRows(newBoard);
    for (let r = 0; r < SIZE; r++) {
      const merged = slideAndMerge(newBoard[r]);
      if (!moved && merged.some((v, i) => v !== newBoard[r][i])) moved = true;
      newBoard[r] = merged;
    }
    newBoard = reverseRows(newBoard);
    newBoard = transpose(newBoard);
  } else if (direction === "left") {
    for (let r = 0; r < SIZE; r++) {
      const merged = slideAndMerge(newBoard[r]);
      if (!moved && merged.some((v, i) => v !== newBoard[r][i])) moved = true;
      newBoard[r] = merged;
    }
  } else if (direction === "right") {
    newBoard = reverseRows(newBoard);
    for (let r = 0; r < SIZE; r++) {
      const merged = slideAndMerge(newBoard[r]);
      if (!moved && merged.some((v, i) => v !== newBoard[r][i])) moved = true;
      newBoard[r] = merged;
    }
    newBoard = reverseRows(newBoard);
  }
  return { board: newBoard, moved };
}

function hasMoves(board: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(() => addRandomTile(addRandomTile(createEmptyBoard())));
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const handleMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, moved } = move(board, direction);
    if (!moved) return;
    const addedBoard = addRandomTile(newBoard);
    const newScore = addedBoard.flat().reduce((a, b) => a + b, 0);
    setBoard(addedBoard);
    setScore(newScore);
    if (!hasMoves(addedBoard)) setGameOver(true);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") handleMove("up");
      if (e.key === "ArrowDown") handleMove("down");
      if (e.key === "ArrowLeft") handleMove("left");
      if (e.key === "ArrowRight") handleMove("right");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, gameOver, handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((value, idx) => (
          <div
            key={idx}
            className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xl font-bold"
          >
            {value !== 0 ? value : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleMove("up")}>↑</Button>
        <Button variant="outline" onClick={() => handleMove("down")}>↓</Button>
        <Button variant="outline" onClick={() => handleMove("left")}>←</Button>
        <Button variant="outline" onClick={() => handleMove("right")}>→</Button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-semibold">Game Over</div>
          <Share text={`I scored ${score} points in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
