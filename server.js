const http = require('http')
const express = require('express')
const socket_io = require('socket.io')
const words = require('./lib/words')
const app = express()
app.use(express.static('public'))
app.use('/picguesso', express.static('public'))

const server = http.Server(app)
const io = socket_io(server)

const players = []

function getNewWord() {
	let wordcount = Math.floor(Math.random() * (words.length))
	return words[wordcount]
}

function getDrawer() {
	for (let index=0; index<players.length; index++) {
		if (players[index].isDrawing ) {
			return index
		}
	}

	return false
}

function clearDrawer() {
	for (let index=0; index<players.length; index++) {
		players[index].isDrawing = false
	}
}

function setDrawer(index) {
	clearDrawer()
	players[index].isDrawing = true
}

io.on('connection', function(socket) {
	// send a list of players upon connection
	io.emit('REFRESH_PLAYERS', players)

	socket.on('join', function(playerName) {
		// init player object
		const player = {}
		player.id = socket.id
		player.name = playerName
		player.score = 0
		player.guesses = 0
		player.drawings = 0

		const emojis = ['🥳', '🤠', '🥸', '😎', '🤓', '🧐', '💀', '💩', '🤡', '😼', '🙀', '🤖', '🦊', '🦄', '🐷']
		let random_emoji = emojis[Math.floor(Math.random() * emojis.length)]  
		player.emoji = random_emoji
		
		socket.playerName = playerName

		// user automatically joins a room under their own name
		socket.join(playerName)
		console.log(playerName + ' has joined. ID: ' + player.id)

		socket.broadcast.emit('NEW_PLAYER_JOINED', playerName)

		// if no one is drawing, make this player the drawer
		if (getDrawer() === false) {
			player.isDrawing = true
			io.in(socket.playerName).emit('JOINED_AS_DRAWER', playerName)
			let word = getNewWord()
			io.in(socket.playerName).emit('SHOW_WORD', word)
		}
		else {
			player.isDrawing = false
			io.in(socket.playerName).emit('JOINED_AS_GUESSER', playerName)
		}

		// if the 'drawer' room has no connections
		if (!io.sockets.adapter.rooms.has('drawer')) {
			// player.isDrawing = true
			// socket.join('drawer')

			// // server submits the 'JOINED_AS_DRAWER' event to this user
			// io.in(socket.playerName).emit('JOINED_AS_DRAWER', playerName)
			// console.log(playerName + ' is a drawer')

			// // send the random word to the user inside the 'drawer' room
			// let word = getNewWord()
			// io.in(socket.playerName).emit('SHOW_WORD', word)
			// console.log(playerName + "'s draw word (join event): " + word)
		} 
		else {
			// player.isDrawing = false
			// socket.join('guesser')

			// // server submits the 'guesser' event to this user
			// io.in(socket.playerName).emit('JOINED_AS_GUESSER', playerName)
			// console.log(playerName + ' is a guesser')
		}
	
		players.push(player)
		console.log(players)

		// update all clients with the list of users
		io.emit('REFRESH_PLAYERS', players)	
	})

	// ****************************************************************
	// submit drawing on canvas to other clients
	socket.on('PAINT', function(obj) {
		socket.broadcast.emit('PAINT', obj)
	})

	// ****************************************************************
	// submit each client's guesses to all clients
	socket.on('GUESS_WORD', function(data) {
		socket.broadcast.emit('GUESS_WORD', { playerName: data.playerName, playerGuess: data.playerGuess })
		//io.emit('GUESS_WORD', { playerName: data.playerName, playerGuess: data.playerGuess })
		console.log('guessword event triggered on server from: ' + data.playerName + ' with word: ' + data.playerGuess)
	})

	// ****************************************************************
	socket.on('QUIT', function(data) {
		for (let i = 0; i < players.length; i++) {
			// remove user from players list
			if (players[i].name === data.playerName) {
				players.splice(i, 1)
			}
		}

		io.emit('QUIT_NOTIFICATION', data.playerName)
	})

	// ****************************************************************
	socket.on('disconnect', function(reason) {
		for (let i = 0; i < players.length; i++) {
			// remove user from users list
			if (players[i].name === socket.playerName) {
				players.splice(i, 1)
			}
		}
		console.log(socket.playerName + ' has disconnected.')

		// submit updated players list to all clients
		io.emit('REFRESH_PLAYERS', players)

		// if 'drawer' room has no connections..
		if (!io.sockets.adapter.rooms.has('drawer')) {
			// generate random number based on length of players list
			let x = Math.floor(Math.random() * (players.length))
			console.log(players[x])

			// submit new drawer event to the random user in userslist
			io.in(players[x]).emit('new drawer', players[x])
		};
	});

	// ****************************************************************
	socket.on('new drawer', function(name) {
		// remove user from 'guesser' room
		socket.leave('guesser')

		// place user into 'drawer' room
		socket.join('drawer')
		console.log('new drawer emit: ' + name)

		// submit 'drawer' event to the same user
		socket.emit('drawer', name)
		
		// send a random word to the user connected to 'drawer' room
		io.in('drawer').emit('draw word', getNewWord())
	})

	// ****************************************************************
	// initiated from drawer's 'dblclick' event in Player list
	socket.on('swap rooms', function(data) {
		// drawer leaves 'drawer' room and joins 'guesser' room
		socket.leave('drawer')
		socket.join('guesser')

		// submit 'guesser' event to this user
		socket.emit('guesser', socket.playerName)

		// submit 'drawer' event to the name of user that was doubleclicked
		io.in(data.to).emit('drawer', data.to)

		// submit random word to new user drawer
		io.in(data.to).emit('draw word', getNewWord())
	
		io.emit('reset', data.to)
	})

	// ****************************************************************
	socket.on('correct answer', function(data) {
		io.emit('correct answer', data)
		console.log(data.playerName + ' guessed correctly with ' + data.playerGuess)
	})

	// ****************************************************************
	socket.on('CLEAR_CANVAS', function(name) {
		io.emit('CLEAR_CANVAS', name)
	})

})

server.listen(process.env.PORT || 9915, function() {
	console.log('Server started at http://localhost:9915')
})