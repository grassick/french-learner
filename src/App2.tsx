import React, { useEffect, useState } from "react"

let rapidAPIKey = localStorage.getItem('rapidAPIKey')

if (!rapidAPIKey) {
  rapidAPIKey = prompt('Please enter your RapidAPI key')
  if (!rapidAPIKey) {
    throw new Error('No RapidAPI key provided')
  }
  localStorage.setItem('rapidAPIKey', rapidAPIKey)
}

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
  text: string
  errors: Error[]
}

interface Error {
  offset: number
  length: number
  type: "spelling" | "grammar"
  better?: string
}

const initialPhrases = [
  "I love tornadoes.",
  "I miss Felix.",
  "My grandfather lives in Winnipeg.",
]

export function App2(props: {}) {
  const [session, setSession] = usePersistedState<Session>("sessions2", {
    puzzles: initialPhrases.map(prompt => ({
      prompt,
      guesses: [],
      score: 0,
      status: "pending"
    }))
  })

  let lastDisplayedIndex = session.puzzles.findIndex(puzzle => puzzle.status === "pending" || puzzle.status === "in-progress")
  if (lastDisplayedIndex === -1) {
    lastDisplayedIndex = session.puzzles.length - 1
  }

  return (
    <div className="container">
      <h2 className="text-center my-4">Application d'entraînement au français</h2>
      <div className="sticky-top p-3 d-flex justify-content-between mb-3">
        <div>
          <h5>Score Total : {session.puzzles.reduce((total, puzzle) => total + puzzle.score, 0)}</h5>
          <h5>Score Le Plus Élevé : {Math.max(...session.puzzles.map(puzzle => puzzle.score))}</h5>
        </div>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const phrase = window.prompt("Enter a phrase")
            if (phrase) {
              setSession(prevState => ({
                puzzles: [...prevState.puzzles, {
                  prompt: phrase,
                  guesses: [],
                  score: 0,
                  status: "pending"
                }]
              }))
            }
          }}>Ajouter une phrase</button>
        </div>
      </div>

      {session.puzzles
        .slice(0, lastDisplayedIndex + 1)
        .map((puzzle, index) => (
          <PuzzleComponent
            puzzle={puzzle}
            onPuzzleChange={puzzle => {
              const puzzles = session.puzzles.slice()
              puzzles[index] = puzzle
              setSession({ puzzles })
            }}
            onPuzzleDelete={() => {
              const puzzles = session.puzzles.slice()
              puzzles.splice(index, 1)
              setSession({ puzzles })
            }}
          />
        ))}

      <div style={{ marginTop: 100 }}>
        {session.puzzles
          .slice(lastDisplayedIndex + 1)
          .map((puzzle, index) => (
            <div key={index} className="mb-2">
              <span>{puzzle.prompt}</span>
              <button className="btn btn-sm btn-link" onClick={() => {
                const puzzles = session.puzzles.slice()
                puzzles.splice(lastDisplayedIndex + 1 + index, 1)
                setSession({ puzzles })
              }}>X</button>
            </div>
          ))}
      </div>
    </div>
  )
}

function PuzzleComponent(props: {
  puzzle: Puzzle
  onPuzzleChange: (puzzle: Puzzle) => void
  onPuzzleDelete: () => void
}) {
  const { puzzle, onPuzzleChange } = props

  const [guess, setGuess] = useState(puzzle.guesses[puzzle.guesses.length - 1]?.text || "")

  const [busy, setBusy] = useState(false)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      correctGuess()
    }
  }

  function correctGuess() {
    const encodedParams = new URLSearchParams()
    encodedParams.set('text', guess)
    encodedParams.set('language', 'fr-FR')

    const url = 'https://textgears-textgears-v1.p.rapidapi.com/grammar'
    const options = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': rapidAPIKey as string,
        'X-RapidAPI-Host': 'textgears-textgears-v1.p.rapidapi.com'
      },
      body: encodedParams
    }

    fetch(url, options).then((response) => {
      return response.json()
    }).then((data) => {
      console.log(data)

      const errors: Error[] = data.response.errors.map((error: any) => ({
        offset: error.offset,
        length: error.length,
        type: error.type,
        better: error.better.join(", ")
      }))

      // Update the puzzle
      const newPuzzle: Puzzle = {
        ...puzzle,
        guesses: [
          ...puzzle.guesses,
          {
            text: guess,
            errors
          }
        ]
      }

      if (errors.length === 0) {
        newPuzzle.status = "complete"

        const numWords = newPuzzle.prompt.split(' ').length
        const numInitialErrors = newPuzzle.guesses[0].errors.length

        let score = numWords - numInitialErrors
        if (numInitialErrors === 0) {
          score *= 2
        } else {
          score -= (newPuzzle.guesses.length - 1)
        }
        newPuzzle.score = score
        setGuess("")
      }

      onPuzzleChange(newPuzzle)

    }).catch((err) => {
      alert("Error: " + err.message)
    }).finally(() => {
      setBusy(false)
    })
  }


  return (
    <div className="mt-5">
      <h5>
        <span className="text-muted" onDoubleClick={() => {
          if (window.confirm('Are you sure you want to delete this item?')) {
            // Delete puzzle
            props.onPuzzleDelete()
          }
        }}>Traduire: </span>{props.puzzle.prompt}
        <span style={{ float: 'right' }}>
          {props.puzzle.status === "complete" &&
            <p>Score : {props.puzzle.score}</p>
          }
        </span>
      </h5>
      <GuessesComponent guesses={props.puzzle.guesses} />
      {busy &&
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      }

      {props.puzzle.status !== "complete" &&
        <div className="input-group mb-3">
          <input type="text" className="form-control" placeholder="Entrez votre supposition" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={handleKeyDown} disabled={busy} />
          <button className="btn btn-primary" type="button" onClick={() => { correctGuess() }} disabled={busy}>
            Deviner
          </button>
        </div>
      }
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
    <div style={{ fontSize: 18, margin: 15 }}>
      {props.guess.text.split('').map((char, index) => {
        const error = props.guess.errors.find(e => index >= e.offset && index < e.offset + e.length)
        return (
          <span
            style={error ? { backgroundColor: '#ff000060' } : { backgroundColor: '#00ff0060' }}
            onDoubleClick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              if (error) {
                alert(error.better || "No suggestion available")
              }
            }}
          >
            {char}
          </span>
        )
      })}
    </div>
  )
}

/**
 * A TypeScript version of useState that persists the value to localStorage in the key specified.
 * @param key - The key to use when storing the value in localStorage.
 * @param defaultValue - The default value to use when the key is not found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const storedValue = window.localStorage.getItem(key)
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}
