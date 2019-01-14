'use strict'

const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const users = require('./users')

const { PORT = '3000' } = process.env

const app = express()
const server = http.createServer(app)

app.use(bodyParser.json())

app.post('/users', (req, res, next) => {
  console.log(req.body)
  users
    .registerUser(req.body.email, req.body.password)
    .then(() => res.sendStatus(201))
    .catch(next)
})

app.post('/login', (req, res, next) => {
  res.sendStatus(501)
})

server
  .listen(PORT)
  .on('listening', () => console.log(`Server started on port ${PORT}`))
