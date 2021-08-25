import socketIOClient from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'
import { Avatar, Box, Typography } from '@material-ui/core'
import floating from 'floating.js'
import axios from 'axios'

import './App.css'

function App() {
  const socketRef = useRef()
  const [pubkey, setPubkey] = useState('')
  const payments = new Set()

  useEffect(() => {
    const getPubkey = async () => {
      const { data } = await axios.get('http://localhost:3001/api/pubkey')
      setPubkey(data.pubkey)
    }

    getPubkey()
  }, [])

  const setFloatingMessage = (content, paymentId) => {
    if (!payments.has(paymentId)) {
      payments.add(paymentId)
      floating({
        content,
        duration: 5,
        repeat: 1,
        size: 1,
      })
    }
  }

  useEffect(() => {
    socketRef.current = socketIOClient('http://localhost:3001')
    socketRef.current.on('INVOICE_UPDATED', ({ amount, message, emoji, payment }) => {
      let label = `${amount}`
      if (emoji) label = `${emoji} ${label} ${emoji}`
      let content = `<div style="width: 300px; text-align: center;"><p style="color:white; width: 100%;">${label}</p>`
      if (message && message.length) {
        content += `<p style="color: white; text-align: center; width: 100%;"}>${message}</p>`
      }
      content += '</div>'
      setFloatingMessage(content, payment)
    })
    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <Avatar style={{ width: '100px', height: '100px' }} />
        <Box my={2}>
          <Typography component="h3">
            Would you like to donate? Here's my node's public key:
          </Typography>
        </Box>
        <Typography>{pubkey}</Typography>
      </header>
    </div>
  )
}

export default App
