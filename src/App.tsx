import React, { useState } from "react"


interface Session {
  puzzles: Puzzle[]
}

interface Puzzle {
  prompt: string
  guesses: Guess[]
  score: number
  status: "pending" | "in-progress" | "complete"
}

interface Guess {
  guess: string
  words: Word[]
}

interface Word {
  word: string
  correct: boolean
}

const initialPhrases = [
  "I love tornadoes.",
  "I miss Felix, my dog who lives in Winnipeg.",
]

export function App(props: {}) {
  const [session, setSession] = useState<Session>({
    puzzles: initialPhrases.map(prompt => ({
      prompt,
      guesses: [],
      score: 0,
      status: "pending"
    }))
  })

  return (
    <div className="container">
      <h2 className="text-center my-4">French Learner App</h2>
      {session.puzzles
        .slice(0, session.puzzles.findIndex(puzzle => puzzle.status === "pending" || puzzle.status === "in-progress") + 1)
        .map((puzzle, index) => (
          <PuzzleComponent 
            puzzle={puzzle} 
            onPuzzleChange={puzzle => {
              const puzzles = session.puzzles.slice()
              puzzles[index] = puzzle
              setSession({ puzzles })
            }}
          />
        ))}
    </div>
  )
}

function PuzzleComponent(props: { 
  puzzle: Puzzle
  onPuzzleChange: (puzzle: Puzzle) => void
}) {
  const [guess, setGuess] = useState('')

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      correctGuess()
    }
  }

  function correctGuess() {
    alert("TODO")
  }

  return (
    <div>
      <h5><span className="text-muted">Translate: </span>{props.puzzle.prompt}</h5>
      <GuessesComponent guesses={props.puzzle.guesses} />
      <div className="input-group mb-3">
        <input type="text" className="form-control" placeholder="Enter your guess" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={handleKeyDown} />
        <div className="input-group-append">
          <button className="btn btn-outline-secondary" type="button" onClick={() => { correctGuess() }}>Guess</button>
        </div>
      </div>
    </div>
  )
}

function GuessesComponent(props: { guesses: Guess[] }) {
  return (
    <div>
      {props.guesses.map(guess => (
        <GuessComponent guess={guess} />
      ))}
    </div>
  )
}

function GuessComponent(props: { guess: Guess }) {
  return (
    <div>
      {props.guess.words.map((word, index) => (
        <span style={{ backgroundColor: word.correct ? 'lightgreen' : 'transparent' }}>
          {word.word}{index !== props.guess.words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  )
}

