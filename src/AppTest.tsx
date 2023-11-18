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

export function AppTest(props: {}) {
  const handleClick = async () => {
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: "Je suis vraiment curieux de savoir si cela va bien fonctionner pour la dictée.",   
    })

    console.log(speech)
    let audio = new Audio(URL.createObjectURL(await speech.blob()))
    audio.play()
  }

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
    </div>
  )
}