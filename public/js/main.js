const socket = io()
let user = null
let context = null
let canvas = null
let click = false

let toastContain = null
let musicIsPlaying = true

//const socket = io({ autoConnect: false })

const players = []

const ME = {
    name: '',
    score: 0,
    status: ''
}

const sndBackground1 = new Howl({ src: ['../audio/BanjosUnite-320bit.mp3'], html5: true })
const sndBackground2 = new Howl({ src: ['../audio/Monkeys-Spinning-Monkeys.mp3'], html5: true })
const sndBackground3 = new Howl({ src: ['../audio/Pixelland.mp3'], html5: true })

let sndBackground = sndBackground3

$(document).ready(function() {
    document.querySelector('#modal_nick').classList.remove('hidden')

    let canvasWidth = document.querySelector('#canvas-box').offsetWidth
    let canvasHeight = document.querySelector('#canvas-box').offsetHeight

    canvas = $('#canvas') //document.getElementById('canvas')
    context = canvas[0].getContext('2d')
    canvas[0].width = canvasWidth
    canvas[0].height = canvasHeight

    socket.on('REFRESH_PLAYERS', buildPlayerList)

    socket.on('NEW_PLAYER_JOINED', function(msg) {
        showToast(msg, 'joined')
    })

    socket.on('GUESS_WORD', guessword)

    socket.on('JOINED_AS_DRAWER', joinAsDrawer)
    socket.on('JOINED_AS_GUESSER', joinAsGuesser)
    socket.on('SHOW_WORD', showWord)

    socket.on('PAINT', paint)
    
    socket.on('new drawer', newDrawer)
    socket.on('correct answer', correctAnswer)
    socket.on('reset', reset)
    socket.on('clear screen', clearScreen)

    // hide the name error box when name input is in focus
    document.querySelector('#player_name').addEventListener('focus', function() {
        document.querySelector('#error_name').style.display = 'none'  
        document.querySelector('#player_name').value = ''
    })
})

/* ************************************************************************************
______                _   _                 ___                  _   _             
|  ___|              | | (_)               |_  |                | | (_)            
| |_ _   _ _ __   ___| |_ _  ___  _ __       | |_   _ _ __   ___| |_ _  ___  _ __  
|  _| | | | '_ \ / __| __| |/ _ \| '_ \      | | | | | '_ \ / __| __| |/ _ \| '_ \ 
| | | |_| | | | | (__| |_| | (_) | | | | /\__/ / |_| | | | | (__| |_| | (_) | | | |
\_|  \__,_|_| |_|\___|\__|_|\___/|_| |_| \____/ \__,_|_| |_|\___|\__|_|\___/|_| |_|                                                                                  
                                                                                   
************************************************************************************ */

// ****************************************************************
function clearScreen() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height)
}

// ****************************************************************
function showWord(word) {
    document.querySelector('.draw').classList.remove('hidden')
    document.querySelector('#secret-word').innerHTML = word 
}

// ****************************************************************
function sendGuess(event) {
    //event.preventDefault()

    if (!$('#player_guess_text').val()) {
        return false
    }

    let guess = document.querySelector('#player_guess_text').value

    socket.emit('GUESS_WORD', { playerName: ME.name, playerGuess: guess })
    document.querySelector('#player_guess_text').value = ''
}

// ****************************************************************
function startGame() {
    ME.name = (document.querySelector('#player_name').value).trim()
    if (!ME.name) return false
    
    // make sure the name doesn't exist already
    if (players) {
        if (players.includes(ME.name)) {
            document.querySelector('#error_name').style.display = 'block'
            return false
        }
    }

    socket.emit('join', ME.name)
    document.querySelector('#modal_nick').classList.add('hidden')
    //sndBackground.play()
}

// ****************************************************************
function toggleMusic() {
    if (musicIsPlaying) {
        sndBackground.stop()
        document.querySelector('#speaker-button').src = '../images/music-off.svg'
        musicIsPlaying = false
    }
    else {
        sndBackground.play()
        document.querySelector('#speaker-button').src = '../images/music-on.svg'
        musicIsPlaying = true
    }
}

// ****************************************************************
function paint(obj) {
    context.fillStyle = obj.color
    context.beginPath()
    context.arc(obj.position.x, obj.position.y, 3, 0, 2 * Math.PI)
    context.fill()
}

// ****************************************************************
function joinAsGuesser() {
    document.querySelector('#canvas').classList.add('no-pointer-events')
    document.querySelector('#guess-word-box').classList.remove('hidden')
    document.querySelector('#secret-word-box').classList.add('hidden')

    ME.status = 'Guessing'

    clearScreen()
    click = false
    console.log('draw status: ' + click)
    $('#guesses').empty()

    // console.log('You are a guesser');

    //$('#guess').show();
    $('#player_guess_text').focus()

    $('#guess').on('submit', function() {
        // event.preventDefault();
        // var guess = $('#player_guess_text').val();

        // if (guess == '') {
        //     return false
        // };

        // console.log(nickname + "'s guess: " + guess);
        // socket.emit('guessword', { nickname: nickname, guessword: guess })
        // $('#player_guess_text').val('');
    })
}

// ****************************************************************
function buildPlayerList(names) {
    const emojis = ['🥳', '🤠', '🥸', '😎', '🤓', '🧐', '💀', '💩', '🤡', '😼', '🙀', '🤖']
    const table = document.querySelector('#players')

    for (let i=0; i<names.length; i++) {
        if (!document.getElementById('plyr-' + names[i])) {
            players.push(names[i])

            let random_emoji = emojis[Math.floor(Math.random() * emojis.length)]   

            let row = table.insertRow(i+1)         

            let cell1 = row.insertCell(0)
            cell1.id = 'plyr-' + names[i]
            let cell2 = row.insertCell(1)
            let cell3 = row.insertCell(2)

            cell1.innerHTML = random_emoji + ' ' + names[i]
            cell2.innerHTML = ME.status
            cell3.innerHTML = ME.score

            row.addEventListener('click', function(e) {
                alert(e.target.innerHTML.slice(2))
            })
        }
    }
}

// ****************************************************************
function shareGame() {
    if (navigator.share) {
        navigator.share({
          title: 'Play Picguesso',
          text: `${ME.name} wants you to play!`,
          url: 'https://picguesso.mrmonster.me',
        })
          .then(() => console.log('Successful share'))
          .catch((error) => console.log('Error sharing', error));
      }
}

let guessword = function(data) {
    
    showToast(data.nickname + "'s guess: " + data.guessword, 'guessed')

    if (click == true && data.guessword == $('span.word').text() ) {
        socket.emit('correct answer', { nickname: data.nickname, guessword: data.guessword })
        socket.emit('swap rooms', { from: user, to: data.nickname })
        click = false
    }
}

let newDrawer = function() {
    socket.emit('new drawer', user);
    clearScreen();
    $('#guesses').empty();
}

let correctAnswer = function(data) {
    $('#guesses').html('<p>' + data.nickname + ' guessed correctly!' + '</p>');
};

let reset = function(name) {
    clearScreen();
    $('#guesses').empty();
    console.log('New drawer: ' + name);
    showToast(`${name} is drawing now!`)
    //$('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
};



// ****************************************************************
function joinAsDrawer() {
    document.querySelector('#canvas').classList.remove('no-pointer-events')
    document.querySelector('#guess-word-box').classList.add('hidden')
    document.querySelector('#secret-word-box').classList.remove('hidden')

    ME.status = 'Drawing'

    let drawing = null,
        color = '#000000',
        obj = {}

    clearScreen()
    click = true

    //$('#guess').hide();
    $('#guesses').empty()
    // $('.draw').show()

    $('#color-box').on('click', 'button', function() {
        obj.color = $(this).attr('value')

        if (obj.color === '0') {
            socket.emit('clear screen', user)
            context.fillStyle = 'white'
            return
        }
    })

    $('.user-emoji').on('dblclick', function() {
        if (click == true) {
            var target = $(this).text();
            socket.emit('swap rooms', { from: user, to: target })
        };
    })

    canvas.on('touchstart', function(event) { 
        event.preventDefault()
        drawing = true 
    })

    canvas.on('touchmove', function(event) {
        event.preventDefault()
        draw(event)
    })

    canvas.on('mousedown', function(event) { 
        drawing = true;   
    });

    canvas.on('mouseup', function(event) {
        drawing = false;
    })

    canvas.on('mousemove', function(event) {
        draw(event)
    })

    function draw(event) {
        let offset = canvas.offset();
        obj.position = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        
        if (drawing && click) {
            context.fillStyle = obj.color
            context.beginPath()
            context.arc(obj.position.x, obj.position.y, 3, 0, 2 * Math.PI);
            context.fill()

            socket.emit('PAINT', obj)
        }
    }

}

// ****************************************************************
function showToast(msg, style) {
    const FADE_DUR = 700
    let duration = Math.max(6000, msg.length * 80)

    if (!toastContain) {
        toastContain = document.createElement('div')
        toastContain.classList.add('toast-container')
        document.body.appendChild(toastContain)
    }

    const el = document.createElement('div')
    el.classList.add('toast')

    if (style) {
        el.classList.add(style)
    }
    
    el.innerText = msg
    toastContain.prepend(el)

    setTimeout(function() { el.classList.add('open') })
    setTimeout(function() { el.classList.remove('open') }, duration)
    setTimeout( function() { toastContain.removeChild(el) }, duration + FADE_DUR )
}
