import socketIOClient from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import {
  AppBar,
  Avatar,
  Card,
  CardContent,
  Chip,
  Container,
  Fab,
  Grid,
  List,
  ListItem,
  makeStyles,
  TextField,
  Toolbar,
  Typography,
} from '@material-ui/core'
import { Add, HighlightOffOutlined } from '@material-ui/icons'
import axios from 'axios'
import './App.css'
import clsx from 'clsx'

const trimString = (str) => {
  if (str.length > 20) {
    return str.substr(0, 5) + '...' + str.substr(str.length - 5, str.length)
  }
  return str
}

const donationAmounts = [
  {
    amount: 200,
    emoji: '⚡️',
  },
  {
    amount: 500,
    emoji: '❤️',
  },
  {
    amount: 1000,
    emoji: '💎',
  },
]

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  title: {
    flexGrow: 1,
  },

  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
}))

function App() {
  const socketRef = useRef()
  const [subscriptions, setSubscriptions] = useState([])
  const [newPubkey, setNewpubkey] = useState('')
  const [subscriptionTime, setNewSubscriptionTime] = useState(30)
  const [subscriptionAmount, setNewSubscriptionAmount] = useState(0)
  const [subscriptionEmoji, setSubscriptionEmoji] = useState('')
  const [message, setNewMessage] = useState('')

  useEffect(() => {
    socketRef.current = socketIOClient('http://localhost:3001')
    return () => {
      socketRef.current.disconnect()
      subscriptions.forEach((sub) => clearInterval(sub.intervalId))
    }
  }, [])

  const canSubmit = () => subscriptionAmount > 0 && newPubkey.length && subscriptionTime > 1

  const resetForm = () => {
    setNewpubkey('')
    setNewSubscriptionTime(30)
    setSubscriptionEmoji('')
    setNewMessage('')
    setNewSubscriptionAmount(0)
  }

  const sendPayment = async (dest, tokens, emoji, message) => {
    console.log('sending payment ', emoji)
    await axios.post('http://localhost:5001/api/payment', { dest, tokens, emoji, message })
  }
  const handleAddSubscription = () => {
    const intervalId = setInterval(
      () => sendPayment(newPubkey, subscriptionAmount, subscriptionEmoji, message),
      subscriptionTime * 1000,
    )

    setSubscriptions([
      ...subscriptions,
      {
        renewal: subscriptionTime,
        amount: subscriptionAmount,
        pubkey: newPubkey,
        intervalId,
        emoji: subscriptionEmoji,
      },
    ])
    resetForm()
  }

  const handleDeleteSubscription = (index) => {
    const subToDelete = subscriptions[index]
    console.log('deleting subscription ', subToDelete.pubkey)
    clearInterval(subToDelete.intervalId)
    subscriptions.splice(index, 1)
    setSubscriptions([...subscriptions])
  }

  const handleSetSubscriptionAmount = (value, emoji) => {
    console.log('emoji in set amoutn:', emoji)
    setNewSubscriptionAmount(value)
    setSubscriptionEmoji(emoji)
  }

  const classes = useStyles()
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight)

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="absolute" className={clsx(classes.appBar)}>
        <Toolbar className={classes.toolbar}>
          <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
            Lit Fans
          </Typography>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="lg" className={classes.container}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={8}>
              <TextField
                style={{ width: '100%' }}
                value={newPubkey}
                label="Destination to donate to"
                placeholder="Pubkey to subscribe to"
                onChange={(e) => setNewpubkey(e.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                type="number"
                value={subscriptionTime}
                label="Frequency (seconds)"
                onChange={(e) => setNewSubscriptionTime(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Grid container justifyContent="center">
                <Grid item xs={8}>
                  <TextField
                    time="text"
                    fullWidth
                    value={message}
                    label="Message (optional)"
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid container alignItems="center" justifyContent="space-evenly">
              {donationAmounts.map((donation, index) => (
                <Grid item key={`${index}-${donation.amount}`}>
                  <Chip
                    avatar={<Avatar>{donation.emoji}</Avatar>}
                    label={`${donation.amount} sats`}
                    onClick={() => handleSetSubscriptionAmount(donation.amount, donation.emoji)}
                    clickable
                    color={subscriptionAmount === donation.amount ? 'primary' : 'default'}
                  />
                </Grid>
              ))}

              <Grid item>
                <Fab color="primary" onClick={handleAddSubscription} disabled={!canSubmit()}>
                  <Add />
                </Fab>
              </Grid>
            </Grid>
          </Grid>
          <Grid container>
            <List>
              {subscriptions.map(({ pubkey, renewal, amount }, index) => (
                <ListItem key={`${pubkey}-${index}`}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item>
                          <Typography>
                            pay {trimString(pubkey)} {amount} sats every {renewal} seconds{' '}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <HighlightOffOutlined
                            color="error"
                            onClick={() => handleDeleteSubscription(index)}
                            style={{ cursor: 'pointer' }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Container>
      </main>
    </div>
  )
}

export default App
