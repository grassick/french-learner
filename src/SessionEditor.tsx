import React, { useState } from 'react';
import { Session, Puzzle, Guess, usePersistedState } from './App3';

export function SessionEditorApp(props: {}) {
  const [session, setSession] = usePersistedState<Session>("sessions3", {
    puzzles: []
  })

  return (
    <SessionEditor session={session} setSession={setSession} />
  )
}

function SessionEditor({ session, setSession }: { session: Session, setSession: (session: Session) => void }) {
  const [selectedPuzzleIndex, setSelectedPuzzleIndex] = useState<number | null>(null);
  const [selectedGuessIndex, setSelectedGuessIndex] = useState<number | null>(null);

  const selectedPuzzle = selectedPuzzleIndex !== null ? session.puzzles[selectedPuzzleIndex] : null;
  const selectedGuess = selectedGuessIndex !== null && selectedPuzzle ? selectedPuzzle.guesses[selectedGuessIndex] : null;

  const handlePuzzleChange = (index: number, puzzle: Puzzle) => {
    const newPuzzles = [...session.puzzles];
    newPuzzles[index] = puzzle;
    setSession({ ...session, puzzles: newPuzzles });
  };

  const handleGuessChange = (puzzleIndex: number, guessIndex: number, guess: Guess) => {
    const newPuzzles = [...session.puzzles];
    newPuzzles[puzzleIndex].guesses[guessIndex] = guess;
    setSession({ ...session, puzzles: newPuzzles });
  };

  const handleAddPuzzle = () => {
    const newPuzzles: Puzzle[] = [...session.puzzles, { type: 'translate', prompt: '', guesses: [], score: 0, status: 'pending' }];
    setSession({ ...session, puzzles: newPuzzles });
  };

  const handleRemovePuzzle = (index: number) => {
    const newPuzzles = [...session.puzzles];
    newPuzzles.splice(index, 1);
    setSession({ ...session, puzzles: newPuzzles });
  };

  const handleAddGuess = (puzzleIndex: number) => {
    const newPuzzles = [...session.puzzles];
    newPuzzles[puzzleIndex].guesses.push({ text: '', errors: [] });
    setSession({ ...session, puzzles: newPuzzles });
  };

  const handleRemoveGuess = (puzzleIndex: number, guessIndex: number) => {
    const newPuzzles = [...session.puzzles];
    newPuzzles[puzzleIndex].guesses.splice(guessIndex, 1);
    setSession({ ...session, puzzles: newPuzzles });
  };

  return (
    <div className="container">
      <h2 className="mb-3">Session Editor</h2>
      <button className="btn btn-primary mb-3" onClick={handleAddPuzzle}>Add Puzzle</button>
      {session.puzzles.map((puzzle, index) => (
        <div key={index} className="card mb-3">
          <div className="card-header">
            <h3>Puzzle {index + 1}: {puzzle.prompt} ({puzzle.score ?? ""})</h3>
          </div>
          <div className="card-body">
            <button className="btn btn-danger me-2" onClick={() => handleRemovePuzzle(index)}>Remove Puzzle</button>
            <button className="btn btn-secondary" onClick={() => setSelectedPuzzleIndex(index)}>Edit Puzzle</button>
            {selectedPuzzle && selectedPuzzleIndex === index && (
              <PuzzleEditor
                puzzle={selectedPuzzle}
                onChange={(puzzle) => handlePuzzleChange(index, puzzle)}
                onAddGuess={() => handleAddGuess(index)}
                onRemoveGuess={(guessIndex) => handleRemoveGuess(index, guessIndex)}
                onSelectGuess={(guessIndex) => setSelectedGuessIndex(guessIndex)}
                selectedGuessIndex={selectedGuessIndex}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PuzzleEditor({
  puzzle,
  onChange,
  onAddGuess,
  onRemoveGuess,
  onSelectGuess,
  selectedGuessIndex,
}: {
  puzzle: Puzzle;
  onChange: (puzzle: Puzzle) => void;
  onAddGuess: () => void;
  onRemoveGuess: (index: number) => void;
  onSelectGuess: (index: number) => void;
  selectedGuessIndex: number | null;
}) {
  const handleFieldChange = (field: keyof Puzzle, value: any) => {
    onChange({ ...puzzle, [field]: value });
  };

  return (
    <div className="container">
      <div className="mb-3">
        <label className="form-label">Type:</label>
        <input type="text" className="form-control" value={puzzle.type} onChange={(e) => handleFieldChange('type', e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Prompt:</label>
        <input type="text" className="form-control" value={puzzle.prompt} onChange={(e) => handleFieldChange('prompt', e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Score:</label>
        <input type="number" className="form-control" value={puzzle.score} onChange={(e) => handleFieldChange('score', Number(e.target.value))} />
      </div>
      <div className="mb-3">
        <label className="form-label">Status:</label>
        <select className="form-select" value={puzzle.status} onChange={(e) => handleFieldChange('status', e.target.value)}>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>
      <button className="btn btn-primary mb-3" onClick={onAddGuess}>Add Guess</button>
      {puzzle.guesses.map((guess, index) => (
        <div key={index} className="mb-3">
          <p>{guess.text}</p>
          <button className="btn btn-danger me-2" onClick={() => onRemoveGuess(index)}>Remove Guess</button>
          <button className="btn btn-secondary" onClick={() => onSelectGuess(index)}>Edit Guess</button>
          {selectedGuessIndex === index && <GuessEditor guess={guess} onChange={(guess) => handleFieldChange('guesses', [...puzzle.guesses.slice(0, index), guess, ...puzzle.guesses.slice(index + 1)])} />}
        </div>
      ))}
    </div>
  );
}

function GuessEditor({ guess, onChange }: { guess: Guess; onChange: (guess: Guess) => void }) {
  const handleFieldChange = (field: keyof Guess, value: any) => {
    onChange({ ...guess, [field]: value });
  };

  return (
    <div>
      <label>Text: <input type="text" value={guess.text} onChange={(e) => handleFieldChange('text', e.target.value)} /></label>
      {/* You can add more fields for the errors here */}
    </div>
  );
}

export default SessionEditor;