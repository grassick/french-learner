import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import "bootstrap/dist/css/bootstrap.min.css"
import { App } from './App'
import { App2 } from './App2'
import { App3 } from './App3'
import { AppTest } from './AppTest'
import { SessionEditorApp } from './SessionEditor'
import { Misc } from './Misc'
import { App4 } from './App4'
import { App5 } from './App5'
import { HashHistory } from './HashHistory'
import { AppSpeed } from './AppSpeed'

// // Open Session Editor if the URL hash is #edit
// if (window.location.hash === '#edit') {
//   ReactDOM.render(<SessionEditorApp />, document.getElementById('root'))
// }
// else if (window.location.hash === '#misc') {
//   ReactDOM.render(<Misc />, document.getElementById('root'))
// }
// else {
//   ReactDOM.render(<App5 />, document.getElementById('root'))
// }

const hashHistory = new HashHistory()

function MainApp(props: {}) {
  const [location, setLocation] = useState(hashHistory.location)

  useEffect(() => {
    return hashHistory.addLocationListener(setLocation)
  }, [])
  
  if (location.pathname === '/edit') {
    return <SessionEditorApp />
  }

  if (location.pathname === '/misc') {
    return <Misc />
  }

  if (location.pathname === '/speed') {
    return <AppSpeed />
  }

  if (location.pathname === '/') {
    return <App5 />
  }
}

ReactDOM.render(<MainApp />, document.getElementById('root'))