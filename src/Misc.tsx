import React, { useState } from 'react';
import { Session, Puzzle, Guess, usePersistedState } from './App3';

export function Misc(props: {}) {
  const [session, setSession] = usePersistedState<Session>("sessions3", {
    puzzles: []
  })

  let text = ""

  for (const puzzle of session.puzzles) {
    if (puzzle.status === "complete") {
      text += `Prompt: ${puzzle.prompt}\n`
      text += `Guess: ${puzzle.guesses[0].text}\n`
      // text += `Correct: ${puzzle.guesses[puzzle.guesses.length - 1].text}\n`
      text += "\n"
    }
  }

  return <div>
    <div style={{ whiteSpace: "pre" }}>
      {text}
    </div>
  </div>
}
