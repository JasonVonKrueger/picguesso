const socket = io()
let user = null
let context = null
let canvas = null
let click = false

let toastContain = null
let musicIsPlaying = true

//const socket = io({ autoConnect: false })

let players = []
const ME = {}

const sndBackground1 = new Howl({ src: ['../audio/BanjosUnite-320bit.mp3'], html5: true })
const sndBackground2 = new Howl({ src: ['../audio/Monkeys-Spinning-Monkeys.mp3'], html5: true })
const sndBackground3 = new Howl({ src: ['../audio/Pixelland.mp3'], html5: true })

let sndBackground = sndBackground3

$(document).ready(function() {
    //ME.name = getCookie('Picguesso::playerName')
    //if (!ME.name) {
      document.querySelector('#modal_nick').classList.remove('hidden')
    //}

    let canvasWidth = document.querySelector('#canvas-box').offsetWidth
    let canvasHeight = document.querySelector('#canvas-box').offsetHeight

    canvas = $('#canvas') //document.getElementById('canvas')
    context = canvas[0].getContext('2d')
    canvas[0].width = canvasWidth
    canvas[0].height = canvasHeight

    socket.on('REFRESH_PLAYERS', buildPlayerList)

    socket.on('GUESS_WORD', function(data) {
        showToast(data.playerName + "'s guess: " + data.playerGuess, 'guessed')

        if (click == true && data.playerGuess == $('span.word').text() ) {
            socket.emit('correct answer', { nickname: data.playerName, guessword: data.playerGuess })
            socket.emit('swap rooms', { from: user, to: data.playerName })
            click = false
        }     
    })

    socket.on('JOINED_AS_DRAWER', joinAsDrawer)
    socket.on('JOINED_AS_GUESSER', joinAsGuesser)

    // ****************************************************************
    socket.on('CLEAR_CANVAS', function(name) {
        context.clearRect(0, 0, canvas[0].width, canvas[0].height)
        context.fillStyle = 'white'
    })

    // ****************************************************************
    socket.on('QUIT_NOTIFICATION', function(msg) {
        showToast(msg)
    })

    // ****************************************************************
    socket.on('PAINT', paint)

    // ****************************************************************
    socket.on('SHOW_WORD', function(word) {
        document.querySelector('.draw').classList.remove('hidden')
        document.querySelector('#secret-word').innerHTML = word 
    })

    // ****************************************************************
    socket.on('new drawer', function() {
        socket.emit('new drawer', user)
        clearScreen()
        $('#guesses').empty()
    })

    // ****************************************************************
    socket.on('correct answer', function(data) {
        $('#guesses').html('<p>' + data.nickname + ' guessed correctly!' + '</p>')      
    })

    // ****************************************************************
    socket.on('reset', function(name) {
        clearScreen()
        $('#guesses').empty()
        console.log('New drawer: ' + name)
        showToast(`${name} is drawing now!`)
        //$('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
    })

    // ****************************************************************
    socket.on('NEW_PLAYER_JOINED', function(msg) {
        showToast(msg, 'joined')
    })

    // ****************************************************************
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
// function clearScreen() {
//     context.clearRect(0, 0, canvas[0].width, canvas[0].height)
// }

// ****************************************************************
function clearCanvas() {
    alert('yo ' + ME.isDrawing)
    if (!ME.isDrawing) {
        return false
    }

    // context.clearRect(0, 0, canvas[0].width, canvas[0].height)
    // context.fillStyle = 'white'
    socket.emit('CLEAR_CANVAS', ME.name)
    return
}

// ****************************************************************
function quit() {
    socket.emit('QUIT', { playerName: ME.name })
    players.length = 0
   
    document.querySelector('#modal_nick').classList.remove('hidden')
}

// ****************************************************************
// function showWord(word) {
//     document.querySelector('.draw').classList.remove('hidden')
//     document.querySelector('#secret-word').innerHTML = word 
// }

// ****************************************************************
function sendGuess(event) {
    //event.preventDefault()
    let guessBox = document.querySelector('#player_guess_text')
    if (!guessBox.value) {
        return false
    }

    socket.emit('GUESS_WORD', { playerName: ME.name, playerGuess: guessBox.value })
    guessBox.value = ''
}

// ****************************************************************
function startGame() {
    ME.name = (document.querySelector('#player_name').value).trim()
    if (!ME.name) return false

    if (document.getElementById('plyr-' + ME.name)) {
        document.querySelector('#error_name').style.display = 'block'
        return false
    }

    //setCookie('Picguesso::playerName', ME.name, 24 * 3600)
    //setCookie('Picguesso::playerName', ME.name, 30)

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

    ME.isDrawing = false

    //clearScreen()
    click = false
    $('#guesses').empty()


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
function buildPlayerList(__players) {
    players = __players
    //const emojis = ['🥳', '🤠', '🥸', '😎', '🤓', '🧐', '💀', '💩', '🤡', '😼', '🙀', '🤖', '🦊', '🦄', '🐷']
    const table = document.querySelector('#players')

    for (let i=0; i<players.length; i++) {
        if (!document.getElementById('plyr-' + players[i].name)) {
            // players.push(names[i])
            //let random_emoji = emojis[Math.floor(Math.random() * emojis.length)]   

            let row = table.insertRow(i+1)         

            let cell1 = row.insertCell(0)
            cell1.id = 'plyr-' + players[i].name
            let cell2 = row.insertCell(1)
            let cell3 = row.insertCell(2)

            cell1.innerHTML = players[i].emoji + ' ' + players[i].name
            cell2.innerHTML = (players[i].isDrawing) ? 'Drawing' : 'Guessing'
            cell3.innerHTML = players[i].score

            row.addEventListener('click', function(e) {
                alert(e.target.innerHTML.slice(2))
            })
        }
    }
}

// ****************************************************************
function clearPlayerTable() {
    const table = document.querySelector('#players')
    
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

// let newDrawer = function() {
//     socket.emit('new drawer', user);
//     clearScreen();
//     $('#guesses').empty();
// }

// let correctAnswer = function(data) {
//     $('#guesses').html('<p>' + data.nickname + ' guessed correctly!' + '</p>');
// };

// let reset = function(name) {
//     clearScreen();
//     $('#guesses').empty();
//     console.log('New drawer: ' + name);
//     showToast(`${name} is drawing now!`)
//     //$('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
// };



// ****************************************************************
function joinAsDrawer() {
    document.querySelector('#canvas').classList.remove('no-pointer-events')
    document.querySelector('#guess-word-box').classList.add('hidden')
    document.querySelector('#secret-word-box').classList.remove('hidden')

    let drawing = null,
        color = '#000000',
        obj = {}

    //clearScreen()
    click = true

    //$('#guess').hide();
    $('#guesses').empty()
    // $('.draw').show()

    $('#color-box').on('click', 'button', function() {
        obj.color = $(this).attr('value')

        // if (obj.color === '0') {
        //     socket.emit('CLEAR_CANVAS', user)
        //     context.fillStyle = 'white'
        //     return
        // }
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

// ****************************************************************
function setCookie(name, value, seconds) {
    let date = new Date()
    date.setTime(date.getTime() + (seconds * 1000))
    let expires = "expires=" + date.toUTCString()
    document.cookie = name + "=" + value + ";" + expires + ";path=/"
}

// ****************************************************************
function getCookie(name) {
    name += "="
    let cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1)
        }
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length)
        }
    }

    return null
}
