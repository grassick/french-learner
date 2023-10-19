import React, { useEffect, useState } from "react"
import OpenAI from 'openai';

let openAIKey = localStorage.getItem('openAIKey')

if (!openAIKey) {
  openAIKey = prompt('Please enter your OpenAI key')
  if (!openAIKey) {
    throw new Error('No OpenAI key provided')
  }
  localStorage.setItem('openAIKey', openAIKey)
}

const openai = new OpenAI({
  apiKey: openAIKey,
  dangerouslyAllowBrowser: true
})

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
  correction?: string
}

const initialPhrases = [
  "I love tornadoes.",
  "I miss Felix, my dog who lives in Winnipeg.",
]

export function App(props: {}) {
  const [session, setSession] = usePersistedState<Session>("sessions", {
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
      <div className="sticky-top bg-light p-3 d-flex justify-content-between mb-3">
        <h3>Total Score: {session.puzzles.reduce((total, puzzle) => total + puzzle.score, 0)}</h3>
        <h3>Highest Score: {Math.max(...session.puzzles.map(puzzle => puzzle.score))}</h3>
      </div>

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
  const { puzzle, onPuzzleChange } = props

  const [guess, setGuess] = useState("")

  const [busy, setBusy] = useState(false)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      correctGuess()
    }
  }

  function correctGuess() {
      // Create the prompt
      const system = `You are a French tutor for a grade 5 student. You will be provided with a French sentence that you should correct for grammar and spelling. 
    First break it into words and return a result for each word as to whether it is correct or not. "J'aime" is one word.
    If the word is incorrect, provide a correction. If the word is correct, leave the correction blank.
    Do not worry about punctuation.
    
    Output JSON in the following format:

    [
      { "word": "Je", "correct": true },
      { "word": "va", "correct": false, "correction": "vais" },
      ... 
    ]
    
    Only output the JSON and nothing else.`

      // Create messages
      const messages: OpenAI.Chat.Completions.ChatCompletionMessage[] = [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: guess,
        }
      ]

      setBusy(true)

      // Call OpenAI
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        messages: messages,
      }).then((completion) => {
        // Get response
        const response = completion.choices[0].message?.content || ""

        // Parse response into JSON
        const words = JSON.parse(response) as Word[]

        console.log(words)

        // Update the puzzle
        const newPuzzle: Puzzle = {
          ...puzzle,
          guesses: [
            ...puzzle.guesses,
            {
              guess,
              words
            }
          ]
        }

        if (words.every(word => word.correct)) {
          newPuzzle.status = "complete"
          let score = newPuzzle.guesses[0].words.filter(word => word.correct).length
          if (newPuzzle.guesses[0].words.length === score) {
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
    <div>
      <h5>
        <span className="text-muted">Translate: </span>{props.puzzle.prompt}
        {props.puzzle.status === "complete" &&
          <p>Score: {props.puzzle.score}</p>
        }
      </h5>
      <GuessesComponent guesses={props.puzzle.guesses} />
      {busy &&
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        }

      { props.puzzle.status !== "complete" &&
        <div className="input-group mb-3">
          <input type="text" className="form-control" placeholder="Enter your guess" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={handleKeyDown} disabled={busy} />
          <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="button" onClick={() => { correctGuess() }} disabled={busy}>
              Guess
            </button>
          </div>
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
    <div style={{ fontSize: 18, margin: 10 }}>
      {props.guess.words.map((word, index) => (
        <span style={{ backgroundColor: word.correct ? '#00ff0060' : '#ff000060', padding: 3 }}>
          {word.word}{index !== props.guess.words.length - 1 ? ' ' : ''}
        </span>
      ))}
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
