'use strict'

const { promisify } = require('util')
const bcrypt = require('bcrypt')
const natsStreaming = require('node-nats-streaming')

const SALT_ROUNDS = 10

const stan = natsStreaming.connect(
  'test-cluster',
  'users'
)
const waitForStan = new Promise((resolve, reject) => {
  stan.on('connect', () => resolve(stan))
  stan.on('error', reject)
})
const publishAsync = promisify(stan.publish.bind(stan))

const emailIndex = new Map()

exports.registerUser = async (email, password) => {
  await waitForStan
  if (typeof email !== 'string' || !email) {
    throw new TypeError('Email must be a string')
  }
  // TODO validate that email is a string and looks like an email
  if (emailIndex.has(email)) throw new Error('Email is already taken')
  const newUser = {
    email,
    password: await bcrypt.hash(password, SALT_ROUNDS)
  }
  emailIndex.set(email, newUser)

  const guid = await publishAsync(
    'events',
    JSON.stringify({
      type: 'USER_REGISTERED',
      payload: newUser
    })
  )
  return guid
}

const users = []

waitForStan.then(() => {
  const opts = stan.subscriptionOptions().setStartAtSequence(0)
  const subscription = stan.subscribe('events', opts)
  subscription.on('message', msg => {
    const data = JSON.parse(msg.getData())
    if (data.type === 'USER_REGISTERED') {
      const user = {
        email: data.payload.email,
        password: data.payload.password
      }
      emailIndex.set(user.email, user)
      users.push(user)
    }
  })
})
