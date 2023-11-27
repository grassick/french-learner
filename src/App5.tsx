import React, { useEffect, useState } from "react"
import OpenAI from 'openai';
import { useStableCallback } from "./useStableCallback";
import { diffWords } from 'diff'

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

let rapidAPIKey = localStorage.getItem('rapidAPIKey')

if (!rapidAPIKey) {
  rapidAPIKey = prompt('Please enter your RapidAPI key')
  if (!rapidAPIKey) {
    throw new Error('No RapidAPI key provided')
  }
  localStorage.setItem('rapidAPIKey', rapidAPIKey)
}

export interface Session {
  puzzles: Puzzle[]
}

export interface Puzzle {
  /** Translate is written in English, dictate is in French */
  type: "translate" | "dictate"
  prompt: string
  guesses: Guess[]
  score: number
  status: "pending" | "in-progress" | "complete" | "skipped"
  feedback?: string
}

export interface Guess {
  text: string
  errors: Error[]
}

export interface Error {
  offset: number
  length: number
  type: "spelling" | "grammar"
  better?: string
}

const initialPhrases = [
  "Justin et Mario avaient préparé leurs sacs à dos pour une aventure nocturne dans les bois.",
  "Le ciel étoilé était beau tandis qu'ils montaient leur tente près d'un vieux chêne.",
  "Soudain, un cri mystérieux venant de la forêt les fit sursauter.",
  "Armés de lampes de poche, ils décidèrent d'explorer les environs avec prudence.",
  "Ils trouvèrent une carte ancienne cachée sous une pierre luminescente.",
  "La carte indiquait l'emplacement d'un minerai rare à côté d'une cascade oubliée.",
  "Ils entendirent le murmure de l'eau avant même de voir les reflets argentés de la cascade.",
  "Malgré l'obscurité, ils poursuivirent leur chemin en suivant les indications précises.",
  "Au petit matin, après une nuit d'aventures, ils découvrirent le minerai scintillant sous les premiers rayons.",
  "Heureux de leur trouvaille, Justin et Liam promirent de revenir explorer davantag.",
  "Justin et Liam décidaient de construire une maquette d'avion avec Mario le weekend prochain.",
  "Ils passaient des heures à dessiner les plans, inspirés par les avions de chasse.",
  "En cherchant des matériaux, Justin trouva un vieux moteur dans le grenier de son grand-père.",
  "Liam proposait d'utiliser des feuilles d'aluminium pour faire les ailes de l'avion.",
  "Mario avait l'idée de peindre la maquette en rouge et noir, comme un vrai avion de combat.",
  "Ils travaillaient avec attention, veillant à ne pas laisser de colle sur la table.",
  "Après plusieurs jours de travail, leur avion était prêt à être présenté à la foire scientifique.",
  "Le jour de la foire, ils installaient leur stand et expliquaient le fonctionnement de l'avion aux visiteurs.",
  "Ils gagnaient le premier prix pour la créativité et la qualité de leur travail.",
  "Fiers de leur succès, ils rêvaient déjà à leur prochain projet de scienc.",
  "Un soir, Justin observait les étoiles en se demandant s'il y avait de la vie sur Mars.",
  "Liam lui avait prêté un livre sur les fusées et les voyages dans l'espace.",
  "Ils planifiaient de construire une maquette de fusée pour la lancer dans le jardin.",
  "Mario se joignait à eux avec des plans détaillés d'un lanceur spatial qu'il avait dessinés.",
  "Ils collectaient des bouteilles en plastique, du carton et du ruban adhésif pour leur projet.",
  "La construction de la fusée demandait de la précision et beaucoup de patience.",
  "Une fois terminée, la fusée mesurait près d'un mètre de haut et semblait prête pour le décollage.",
  "Ils choisissaient un jour ensoleillé pour le lancement et invitaient toute la classe à venir voir.",
  "La fusée s'élevait dans le ciel, laissant une traînée de fumée, sous les applaudissements.",
  "Impressionnés par leur exploit, Justin et ses amis décidaient de visiter un musée de l'espace.",
]

export function App5(props: {}) {
  const [session, setSession] = usePersistedState<Session>("sessions3", {
    puzzles: initialPhrases.map(prompt => ({
      type: "dictate",
      prompt,
      guesses: [],
      score: 0,
      status: "pending"
    }))
  })

  // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  const [voice, setVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('onyx')

  let lastDisplayedIndex = session.puzzles.findIndex(puzzle => puzzle.status === "pending" || puzzle.status === "in-progress")
  if (lastDisplayedIndex === -1) {
    lastDisplayedIndex = session.puzzles.length - 1
  }

  return (
    <div className="container">
      <h2 className="text-center my-4">Application d'entraînement au français</h2>
      <div className="sticky-top p-3 d-flex justify-content-between mb-3 bg-body">
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
                  type: "dictate",
                  prompt: phrase,
                  guesses: [],
                  score: 0,
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
            allPuzzles={session.puzzles}
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
  const { puzzle, onPuzzleChange } = props

  const [guess, setGuess] = useState(puzzle.guesses[puzzle.guesses.length - 1]?.text || "")

  const [busy, setBusy] = useState(false)

  const [speaking, setSpeaking] = useState(false)

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
          type: "spelling",
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
      status: "in-progress",
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
      getFeedback().catch(err => {
        console.error(err)
      })
    }

    onPuzzleChange(newPuzzle)
  }

  const updateFeedback = useStableCallback((feedback: string) => {
    const newPuzzle: Puzzle = {
      ...puzzle,
      feedback
    }
    onPuzzleChange(newPuzzle)
  })

  async function getFeedback() {
    // Randomly choose true or false that is about 30% true
    const trueOrFalse = Math.random() < 0.3 ? "true" : "false"

    const system = `You are a French tutor to a 10 year old francophone boy. Given his guess and the correct answers for dictation, you provide short, pithy advice in French if he made a mistake. If he got it right, congratulate him. 

    Output should be the raw text of your output to him. Keep it brief and positive. He already figured out the correct answer in later guesses that are not shown to you. He already knows what wasn't correct, so don't repeat that.
    
    Give helpful general rules and tips, not correction of the specific words and ONLY if there is a general rule to learn from his mistake. He already wrote out the correct sentence, so don't tell him about spelling, unless there is a general rule of thumb to learn. The advice should be simple enough for a 10 year old to understand.
    
    ${trueOrFalse ? "Throw in a random cool science fact for fun as well. The fact should be suitable for someone who already has broad scientific knowledge. That is, include only obscure knowledge. Just add the fact, not any exclamations about how fascinating it is. Put the science fact in a new paragraph." : ""}

    Everything should be 3 sentences at most.  Address him as "tu", not "vous"`

    // Create messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: system,
      },
    ]

    for (const puzzle of props.allPuzzles) {
      if (puzzle == props.puzzle) break

      if (puzzle.status === "complete" && puzzle.feedback) {
        messages.push({
          role: "user",
          content: `Guess: ${puzzle.guesses[0].text}\nCorrect: ${puzzle.prompt}`
        })
        messages.push({
          role: "assistant",
          content: puzzle.feedback
        })
      }
    }

    messages.push({
      role: "user",
      content: `Guess: ${puzzle.guesses[0].text}\nCorrect: ${puzzle.prompt}`
    })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      temperature: 1,
      messages: messages,
    })


    // Get response
    const response = completion.choices[0].message?.content || ""

    console.log(response)

    updateFeedback(response)
  }

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
    }
    finally {
      setSpeaking(false)
    }
  }


  function renderPrompt() {
    if (puzzle.type === "translate") {
      return <div className="text-muted" onDoubleClick={() => {
        if (window.confirm('Are you sure you want to delete this item?')) {
          // Delete puzzle
          props.onPuzzleDelete()
        }
      }}>
        <span className="text-muted">Traduire: </span>{props.puzzle.prompt}
      </div>
    }
    else if (puzzle.type === "dictate" && puzzle.status !== "complete") {
      return (
        <div>
          <button className="btn btn-secondary" onClick={() => speak(props.puzzle.prompt)} disabled={speaking}>
            Prononcer l'indice
          </button>
        </div>
      )
    }
    else {
      return null
    }
  }

  return (
    <div className="mt-4" style={{ borderTop: "solid 1px #888", paddingTop: 20 }}>
      <h5>
        {(props.puzzle.status === "in-progress" || props.puzzle.status == "pending") &&
          <button style={{ float: "right" }} className="btn btn-link btn-sm" onClick={() => {
            if (!window.confirm('Voulez-vous vraiment sauter cette énigme ?')) return

            const newPuzzle: Puzzle = {
              ...puzzle,
              status: "skipped"
            }
            onPuzzleChange(newPuzzle)
          }}>
            Sauter
          </button>
        }
        <span style={{ float: 'right' }}>
          {props.puzzle.status === "complete" &&
            <p>Score : {props.puzzle.score}</p>
          }
        </span>
        {renderPrompt()}
      </h5>
      <GuessesComponent guesses={props.puzzle.guesses} />
      {busy &&
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      }

      {/* {props.puzzle.status === "complete" && !props.puzzle.feedback &&
        <div className="mb-3">
          <button className="btn btn-secondary" onClick={() => getFeedback()}>
            Obtenir des commentaires
          </button>
        </div>
      } */}

      {props.puzzle.feedback &&
        <div className="mb-3">
          <div style={{ whiteSpace: "pre-wrap", fontStyle: "italic" }}>
            {props.puzzle.feedback}
          </div>
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
