const http = require('http')
const express = require('express')
const socket_io = require('socket.io')
const words = require('./lib/words')
const app = express()
app.use(express.static('public'))
app.use('/picguesso', express.static('public'))

const server = http.Server(app)
const io = socket_io(server)

let players = []

function getNewWord() {
	let wordcount = Math.floor(Math.random() * (words.length))
	return words[wordcount]
}

io.on('connection', function (socket) {
	io.emit('REFRESH_PLAYERS', players)

	socket.on('join', function(name) {
		socket.nickname = name

		// user automatically joins a room under their own name
		socket.join(name)
		console.log(socket.nickname + ' has joined. ID: ' + socket.id)

		// save the name of the user to an array called players
		players.push(socket.nickname)

		let msg = socket.nickname + ' has joined the game!'
		socket.broadcast.emit('NEW_PLAYER_JOINED', msg)

		// if the 'drawer' room has no connections
		if (!io.sockets.adapter.rooms.has('drawer')) {
			// place user into 'drawer' room
			socket.join('drawer')

			// server submits the 'JOINED_AS_DRAWER' event to this user
			io.in(socket.nickname).emit('JOINED_AS_DRAWER', socket.nickname)
			console.log(socket.nickname + ' is a drawer')

			// send the random word to the user inside the 'drawer' room
			let word = getNewWord()
			io.in(socket.nickname).emit('SHOW_WORD', word)
			console.log(socket.nickname + "'s draw word (join event): " + word)
		} 
		else {
			// if there are more than one names in users 
			// or there is a person in drawer room...

			// additional users will join the 'guesser' room
			socket.join('guesser')

			// server submits the 'guesser' event to this user
			io.in(socket.nickname).emit('JOINED_AS_GUESSER', socket.nickname)
			console.log(socket.nickname + ' is a guesser')
		}
	
		// update all clients with the list of users
		io.emit('REFRESH_PLAYERS', players)
		
	})

	// submit drawing on canvas to other clients
	socket.on('PAINT', function(obj) {
		socket.broadcast.emit('PAINT', obj)
	})

	// submit each client's guesses to all clients
	socket.on('GUESS_WORD', function(data) {
		io.emit('GUESS_WORD', { nickname: data.nickname, guessword: data.guessword })
		console.log('guessword event triggered on server from: ' + data.nickname + ' with word: ' + data.guessword)
	})

	socket.on('disconnect', function() {
		for (var i = 0; i < players.length; i++) {
			// remove user from users list
			if (players[i] == socket.nickname) {
				players.splice(i, 1)
			};
		};
		console.log(socket.nickname + ' has disconnected.');

		// submit updated players list to all clients
		io.emit('REFRESH_PLAYERS', players);

		// if 'drawer' room has no connections..
		if (!io.sockets.adapter.rooms.has('drawer')) {
			// generate random number based on length of players list
			let x = Math.floor(Math.random() * (players.length));
			console.log(players[x]);

			// submit new drawer event to the random user in userslist
			io.in(players[x]).emit('new drawer', players[x]);
		};
	});

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

	// initiated from drawer's 'dblclick' event in Player list
	socket.on('swap rooms', function(data) {
		// drawer leaves 'drawer' room and joins 'guesser' room
		socket.leave('drawer')
		socket.join('guesser')

		// submit 'guesser' event to this user
		socket.emit('guesser', socket.nickname)

		// submit 'drawer' event to the name of user that was doubleclicked
		io.in(data.to).emit('drawer', data.to)

		// submit random word to new user drawer
		io.in(data.to).emit('draw word', getNewWord())
	
		io.emit('reset', data.to)

	})

	socket.on('correct answer', function(data) {
		io.emit('correct answer', data)
		console.log(data.nickname + ' guessed correctly with ' + data.guessword)
	})

	socket.on('clear screen', function(name) {
		io.emit('clear screen', name)
	})

})

server.listen(process.env.PORT || 9915, function() {
	console.log('Server started at http://localhost:9915');
});