const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIO = require('socket.io')
const lnService = require('ln-service')
require('dotenv').config()

// setup the port our backend app will run on
const PORT = 3001

const app = express()
const server = http.createServer(app)

const io = socketIO(server, {
  cors: true,
  origins: ['localhost:3000'],
})

app.use(cors())

const certLocation = process.env.LND_TLS_CERT
const macLocation = process.env.LND_MACAROON
const socket = process.env.LND_SOCKET

const { lnd } = lnService.authenticatedLndGrpc({
  cert: certLocation,
  macaroon: macLocation,
  socket,
})

app.set('port', process.env.PORT || 3001)

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'))
}

app.get('/api/pubkey', async (_req, res) => {
  try {
    const pubkey = (await lnService.getWalletInfo({ lnd })).public_key
    return res.json({ pubkey })
  } catch (e) {
    console.error(e)
  }
})

const messageTypes = {
  EMOJI: '65536',
  MESSAGE: '65537',
}

io.on('connection', (socket) => {
  console.log('socket connected')

  const sub = lnService.subscribeToInvoices({ lnd })
  const paymentIndexes = new Set()

  sub.on('invoice_updated', (lastUpdatedInvoice) => {
    const { is_confirmed, payments, index, payment } = lastUpdatedInvoice
    try {
      if (is_confirmed && !paymentIndexes.has(index)) {
        paymentIndexes.add(index)
        const raw = payments[0].messages
        let message, emoji
        if (raw && raw.length) {
          for (const { type, value } of raw) {
            if (type === messageTypes.EMOJI) emoji = Buffer.from(value, 'hex').toString()
            else if (type === messageTypes.MESSAGE) message = Buffer.from(value, 'hex').toString()
          }

          console.log('got a message:', message)
          console.log('emoji:', emoji)
        }

        socket.broadcast.emit('INVOICE_UPDATED', {
          amount: lastUpdatedInvoice.received,
          message,
          emoji,
          payment,
        })
      }
    } catch (e) {
      console.error(e)
    }
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

server.listen(PORT, () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
})
