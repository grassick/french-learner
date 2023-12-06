import React, { useEffect, useMemo, useState } from "react"
import OpenAI from 'openai';
import { useStableCallback } from "./useStableCallback";
import { diffWords } from 'diff'
import { v4 } from 'uuid'

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

export interface Session {
  puzzles: Puzzle[]
}

export interface Puzzle {
  id: string
  type: "speed"
  prompt: string
  guesses: Guess[]
  time?: number
  status: "pending" | "complete"
}

export interface Guess {
  text: string
  errors: Error[]
}

export interface Error {
  offset: number
  length: number
  better?: string
}

const initialPhrases = [
  "Il est souvent impatient.",
  "Son talent est important.",
  "Tu sembles inattentif.",
  "C'est très inhabituel.",
  "L'infirmier voyage souvent.",
  "Le patinage est amusant.",
  "J'ai une inspiration.",
  "Joue des instruments.",
  "L'intervention est rapide.",
  "Il reste immobile.",
  "C'est mon intention.",
  "Ainsi commence l'histoire.",
  "J'ai l'information nécessaire.",
  "C'est imprudent de courir.",
  "L'incendie est effrayant.",
  "Chaque individu est unique.",
  "L'indifférence blesse parfois.",
  "La table est inutile.",
  "Elle s'est installée ici.",
  "C'était imprévu!",
  "Ton dessin est joli.",
  "Le médecin examine.",
  "C'est un jeu enfantin.",
  "Ce geste semble mesquin.",
  "Le destin nous surprend.",
  "La robe est féminine.",
  "Le style est masculin.",
  "Un clin d'oeil amical.",
  "Le chat rouquin dort.",
  "L'examen commence demain.",
  "Un détail anodin.",
  "J'aime ce bouquin.",
  "Il retrouve son copain.",
  "Le verre est cristallin.",
  "Le soleil décline.",
  "Le festin commence.",
  "Regarde ce gamin.",
  "L'orphelin sourit.",
  "Le parchemin est vieux.",
  "Le venin est dangereux.",
  "J'aime dessiner.",
  "Allez, on joue!",
  "J'ai beaucoup à avoir.",
  "Être ou ne pas être.",
  "Je finis mes devoirs.",
  "Nous commençons maintenant.",
  "Je mange une pomme.",
  "Il dit la vérité.",
  "De voir est croire.",
  "Je fais mes devoirs.",
  "Mettez vos chaussures.",
  "J'ouvre la fenêtre.",
  "Nous partons demain.",
  "Je peux aider.",
  "Je prends un livre.",
  "Je rends le livre.",
  "Je sais nager.",
  "Je tiens la main.",
  "Je viens de là.",
  "Venez voir ça!",
  "Je veux jouer.",
]

export function AppSpeed(props: {}) {
  const [session, setSession] = usePersistedState<Session>("sessions_speed", {
    puzzles: initialPhrases.map(prompt => ({
      id: v4(),
      type: "speed",
      prompt,
      guesses: [],
      status: "pending"
    }))
  })

  // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  const [voice, setVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('onyx')

  let lastDisplayedIndex = session.puzzles.findIndex(puzzle => puzzle.status === "pending")
  if (lastDisplayedIndex === -1) {
    lastDisplayedIndex = session.puzzles.length - 1
  }

  return (
    <div className="container">
      <h2 className="text-center my-4">Application d'entraînement au français</h2>
      <div className="sticky-top p-3 d-flex justify-content-between mb-3 bg-body">
        {/* <div>
          <h5>Score Total : {session.puzzles.reduce((total, puzzle) => total + puzzle.score, 0)}</h5>
          <h5>Score Le Plus Élevé : {Math.max(...session.puzzles.map(puzzle => puzzle.score))}</h5>
        </div> */}
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const phrase = window.prompt("Enter a phrase")
            if (phrase) {
              setSession(prevState => ({
                puzzles: [...prevState.puzzles, {
                  id: v4(),
                  type: "speed",
                  prompt: phrase,
                  guesses: [],
                  status: "pending"
                }]
              }))
            }
          }}>Ajouter une phrase</button>
          <div>
            <select className="form-select" value={voice} onChange={(e) => setVoice(e.target.value as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer')}>
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </select>
          </div>
        </div>
      </div>

      {session.puzzles
        .slice(0, lastDisplayedIndex + 1)
        .map((puzzle, index) => (
          <PuzzleComponent
            key={puzzle.id}
            allPuzzles={session.puzzles.slice(0, index + 1)}
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
            voice={voice}
          />
        ))}

      {/* <div style={{ marginTop: 100 }}>
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
      </div> */}
    </div>
  )
}

function PuzzleComponent(props: {
  allPuzzles: Puzzle[]
  puzzle: Puzzle
  onPuzzleChange: (puzzle: Puzzle) => void
  onPuzzleDelete: () => void
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
}) {
  const { puzzle, onPuzzleChange, allPuzzles } = props

  const [guess, setGuess] = useState(puzzle.guesses[puzzle.guesses.length - 1]?.text || "")

  const [busy, setBusy] = useState(false)

  const [speaking, setSpeaking] = useState(false)

  const [elapsedTime, setElapsedTime] = useState<number | undefined>(undefined)

  // Determine the current characters per second
  const charsPerSecond = useMemo(() => {
    let cps = 1.1

    for (const p of allPuzzles) {
      if (p.status != "complete") {
        continue
      }

      // Determine expected time for puzzle
      const numChars = p.prompt.length
      const expectedTime = numChars / cps

      if (p.time! > expectedTime) {
        cps *= Math.pow(1.1, 1/5)
      }
      else {
        cps *= Math.pow(1.1, -1)
      }
    }

    return cps
  }, [allPuzzles])

  const expectedTime = useMemo(() => {
    // Determine time allowed for this puzzle
    const numChars = puzzle.prompt.length
    const expectedTime = numChars / charsPerSecond
    return expectedTime
  }, [puzzle.prompt, charsPerSecond])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      correctGuess()
    }
  }

  function correctGuess() {
    const result = diffWords(guess, puzzle.prompt)

    let offset = 0
    const errors: Error[] = []

    for (let i = 0; i < result.length; i++) {
      const change = result[i]

      if (change.removed) {
        errors.push({
          offset,
          length: change.value.length,
          better: undefined
        })
      }

      if (change.added && i > 0) {
        // Check if previous was a removed
        const prevChange = result[i - 1]
        if (prevChange.removed) {
          errors[errors.length - 1].better = change.value
        }
        continue
      }

      offset += change.value.length
    }

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
      newPuzzle.time = elapsedTime
      setElapsedTime(undefined)
      setGuess("")
    }

    onPuzzleChange(newPuzzle)
  }

  useEffect(() => {
    if (elapsedTime === undefined || puzzle.status === "complete") {
      return
    }

    const timer = setTimeout(() => {
      setElapsedTime(elapsedTime + 0.1)
    }, 100)

    return () => clearTimeout(timer)
  }, [elapsedTime])

  async function speak(text: string) {
    try {
      setSpeaking(true)
      const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: props.voice,
        input: text,
      })

      console.log(speech)
      let audio = new Audio(URL.createObjectURL(await speech.blob()))
      await audio.play()

      // Wait a second before starting timer
      await new Promise(resolve => setTimeout(resolve, 1000))

      setElapsedTime(elapsedTime => elapsedTime || 0)
    }
    finally {
      setSpeaking(false)
    }
  }

  function renderPrompt() {
    if (puzzle.status === "complete") {
      return null
    }

    return (
      <div>
        <button className="btn btn-secondary" onClick={() => speak(props.puzzle.prompt)} disabled={speaking}>
          Prononcer l'indice
        </button>
      </div>
    )
  }

  const finalElapsed = elapsedTime !== undefined ? elapsedTime : puzzle.time

  const fractionElapsed = finalElapsed !== undefined ? finalElapsed / expectedTime : 0
  const fractionRemaining = 1 - fractionElapsed

  return (
    <div className="mt-4" style={{ borderTop: "solid 1px #888", paddingTop: 20 }}>
      <h5>
        {renderPrompt()}
      </h5>
      { finalElapsed != null &&
        <div className="progress" style={{ marginBottom: 10, marginTop: 10 }}>
          { fractionRemaining < 0 ?
          <div key="full" className="progress-bar bg-warning" style={{ width: `100%` }}></div>
          :
          <div key="going" className="progress-bar" style={{ width: `${fractionRemaining * 100}%` }}></div>
          }
        </div>
      }
      <GuessesComponent guesses={props.puzzle.guesses} />

      {/* {props.puzzle.status === "complete" && !props.puzzle.feedback &&
        <div className="mb-3">
          <button className="btn btn-secondary" onClick={() => getFeedback()}>
            Obtenir des commentaires
          </button>
        </div>
      } */}

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
    <div style={{ fontSize: 18, margin: 15, lineHeight: 2 }}>
      {props.guess.text.split('').map((char, index) => {
        const error = props.guess.errors.find(e => index >= e.offset && index < e.offset + e.length)
        const prevError = props.guess.errors.find(e => index - 1 >= e.offset && index - 1 < e.offset + e.length)
        const currentError = char.trim() ? error : prevError

        return (
          <span
            style={{
              //            backgroundColor: error ? '#ff000060' : '#00ff0060', 
              backgroundColor: currentError ? undefined : '#00ff0060',
              padding: index === 0 ? "5px 0px 5px 5px" : index === props.guess.text.length - 1 ? "5px 5px 5px 0px" : "5px 0px",
              userSelect: 'none'
            }}
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
