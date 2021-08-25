const express = require('express')
const cors = require('cors')
const http = require('http')
const lnService = require('ln-service')
const bodyParser = require('body-parser')
const { execSync } = require('child_process')
require('dotenv').config()

// setup the port our backend app will run on
const PORT = 5001

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const certLocation = process.env.LND_TLS_CERT
const macLocation = process.env.LND_MACAROON
const socket = process.env.LND_SOCKET

// alice
const { lnd } = lnService.authenticatedLndGrpc({
  cert: certLocation,
  macaroon: macLocation,
  socket,
})

app.set('port', process.env.PORT || 5001)

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

app.post('/api/payment', async (req, res) => {
  const { dest, tokens, emoji, message } = req.body
  try {
    const emojiHex = Buffer.from(emoji).toString('hex')
    const messageHex = Buffer.from(message).toString('hex')
    execSync(
      `lncli --rpcserver ${socket} --tlscertpath ${certLocation} --macaroonpath ${macLocation} sendpayment --amt ${tokens} --dest ${dest} --data 65536="${emojiHex}",65537="${messageHex}" --amp`,
    )
    return res.json({ message: 'success' })
  } catch (e) {
    console.log(e)
    return res.status(500).json({ message: 'could not pay destination' })
  }
})

server.listen(PORT, () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
})
