import React from 'react'
import ReactDOM from 'react-dom'

import "bootstrap/dist/css/bootstrap.min.css"
import { App } from './App'
import { App2 } from './App2'
import { App3 } from './App3'
import { AppTest } from './AppTest'
import { SessionEditorApp } from './SessionEditor'
import { Misc } from './Misc'
import { App4 } from './App4'

// Open Session Editor if the URL hash is #edit
if (window.location.hash === '#edit') {
  ReactDOM.render(<SessionEditorApp />, document.getElementById('root'))
}
else if (window.location.hash === '#misc') {
  ReactDOM.render(<Misc />, document.getElementById('root'))
}
else {
  ReactDOM.render(<App4 />, document.getElementById('root'))
}
