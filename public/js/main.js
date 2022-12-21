const socket = io()
let user = null
let toastContain = null
let musicIsPlaying = true


let players = []
const ME = {}

const sndBackground1 = new Howl({ src: ['../audio/BanjosUnite-320bit.mp3'], html5: true })
const sndBackground2 = new Howl({ src: ['../audio/Monkeys-Spinning-Monkeys.mp3'], html5: true })
const sndBackground3 = new Howl({ src: ['../audio/Pixelland.mp3'], html5: true })

let sndBackground = sndBackground3

const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
let lastX = 0,
    lastY = 0,
    penColor = '#000000',
    drawing = false

let canvasWidth = document.getElementById('canvas-box').offsetWidth
let canvasHeight = document.getElementById('canvas-box').offsetHeight
canvas.width = canvasWidth
canvas.height = canvasHeight  

document.addEventListener("DOMContentLoaded", function(event) {
    //ME.name = getCookie('Picguesso::playerName')
    //if (!ME.name) {
    document.getElementById('modal_nick').classList.remove('hidden')
    //}

	//canvas.addEventListener("click", draw)  // fires after mouse left btn is released
    canvas.addEventListener("mousedown", handle_touchstart)  // fires before mouse left btn is released
    canvas.addEventListener("mousemove", handle_touchmove)
    canvas.addEventListener("mouseup", handle_touchend)
    canvas.addEventListener('touchstart', handle_touchstart)
    canvas.addEventListener('touchmove', handle_touchmove)
    canvas.addEventListener('touchend', handle_touchend)

    socket.on('JOINED_AS_DRAWER', joinAsDrawer)
    socket.on('JOINED_AS_GUESSER', joinAsGuesser)
    socket.on('REFRESH_PLAYERS', buildPlayerList)
    socket.on('SHOW_WORD', showWord)
    socket.on('PAINT', paint)
    socket.on('CORRECT_ANSWER', correctAnswer)

    socket.on('GUESS_WORD', function(data) {
        showToast(data.playerName + "'s guess: " + data.playerGuess, 'guessed')

        if (click == true && data.playerGuess == $('span.word').text() ) {
            socket.emit('correct answer', { nickname: data.playerName, guessword: data.playerGuess })
            socket.emit('swap rooms', { from: user, to: data.playerName })
            click = false
        }     
    })

    socket.on('NEW_PLAYER_JOINED', function(playerName) {
        showToast(playerName + ' has joined the game!', 'joined')
    })
 
    

    

    socket.on('CLEAR_CANVAS', function(name) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = 'white'
    })

    socket.on('QUIT_NOTIFICATION', function(player) {
        // delete player from the player list
        document.querySelector('#plyr-' + player).parentElement.remove()

        showToast(`${player} has quit the game!`)
    })

    socket.on('new drawer', function() {
        socket.emit('new drawer', user)
        clearScreen()
        $('#guesses').empty()
    })

    socket.on('reset', function(name) {
        clearScreen()
        $('#guesses').empty()
        console.log('New drawer: ' + name)
        showToast(`${name} is drawing now!`)
        //$('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
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

function handle_touchstart(e) {
    e.preventDefault()
    drawing = true

    const {x, y} = canvas.getBoundingClientRect()
    lastX = e.clientX - x
    lastY = e.clientY - y
}

function handle_touchmove(e) {
    e.preventDefault()
    //draw(e)

    if (drawing) {
        const {x, y} = canvas.getBoundingClientRect()
        const newX = e.clientX - x
        const newY = e.clientY - y
        
        context.beginPath()
        context.lineWidth = 5
        context.moveTo(lastX, lastY)
        context.lineTo(newX, newY)
        context.strokeStyle = penColor
        context.stroke()
        context.closePath()
        
        let pen = {color: penColor, lastX: lastX, lastY: lastY, newX: newX, newY: newY}
    
        lastX = newX
        lastY = newY
    
        socket.emit('PAINT', pen)
    }
}

function handle_touchend(e) {
    e.preventDefault()
    drawing = false
}

function handle_mouseup(e) {
    e.preventDefault()
    drawing = false
}

// ****************************************************************
function setPenColor(color) {
    penColor = color
    return
}

// ****************************************************************
// function setLastCoords(e) {
//    //e.preventDefault()
//    drawing = true
//     const {x, y} = canvas.getBoundingClientRect()
//     lastX = e.clientX - x
//     lastY = e.clientY - y
// }

// ****************************************************************
// function freeForm(e) {
//     e.preventDefault()
//     drawing = true
//     //if (e.buttons !== 1) return   // left button is not pushed yet
//     draw(e)
// }

// ****************************************************************
// function draw(e) {
//     if (drawing) {
//         const {x, y} = canvas.getBoundingClientRect()
//         const newX = e.clientX - x
//         const newY = e.clientY - y
        
//         context.beginPath()
//         context.lineWidth = 5
//         context.moveTo(lastX, lastY)
//         context.lineTo(newX, newY)
//         context.strokeStyle = penColor
//         context.stroke()
//         context.closePath()
        
//         let pen = {color: penColor, lastX: lastX, lastY: lastY, newX: newX, newY: newY}
    
//         lastX = newX
//         lastY = newY
    
//         socket.emit('PAINT', pen)
//     }
// }

// ****************************************************************
function paint(pen) {
    context.beginPath()
    context.lineWidth = 5
    context.moveTo(pen.lastX, pen.lastY)
    context.lineTo(pen.newX, pen.newY)
    context.strokeStyle = pen.color
    context.stroke()
    context.closePath()   
}

// ****************************************************************
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'white'
    socket.emit('CLEAR_CANVAS', ME.name)
}

// ****************************************************************
function quit() {
    socket.emit('QUIT', { playerName: ME.name })
    players.length = 0
   
    document.querySelector('#modal_nick').classList.remove('hidden')
    document.exitFullscreen()
}

// ****************************************************************
function showWord(word) {
    document.querySelector('.draw').classList.remove('hidden')
    document.querySelector('#secret-word').innerHTML = word 
}

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
        document.getElementById('error_name').style.display = 'block'
        return false
    }

    //setCookie('Picguesso::playerName', ME.name, 24 * 3600)
    //setCookie('Picguesso::playerName', ME.name, 30)

    socket.emit('join', ME.name)
    document.getElementById('modal_nick').classList.add('hidden')
    //sndBackground.play()

    // request full screen
    //document.documentElement.requestFullscreen()
}

// ****************************************************************
function toggleMusic() {
    if (musicIsPlaying) {
        sndBackground.stop()
        document.getElementById('speaker-button').src = '../images/music-off.svg'
        musicIsPlaying = false
    }
    else {
        sndBackground.play()
        document.getElementById('speaker-button').src = '../images/music-on.svg'
        musicIsPlaying = true
    }
}

// ****************************************************************
function joinAsGuesser() {
    document.getElementById('canvas').classList.add('no-pointer-events')
    document.getElementById('guess-word-box').classList.remove('hidden')
    document.getElementById('secret-word-box').classList.add('hidden')

    ME.isDrawing = false

    $('#guesses').empty()
    $('#player_guess_text').focus()
}

// ****************************************************************
function buildPlayerList(__players) {
    players = __players
    const table = document.querySelector('#players')

    for (let i=0; i<players.length; i++) {
        if (!document.getElementById('plyr-' + players[i].name)) {
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
// function clearPlayerTable() {
//     const table = document.querySelector('#players')

// }

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

let correctAnswer = function(data) {
    $('#guesses').html('<p>' + data.nickname + ' guessed correctly!' + '</p>');
};

// let reset = function(name) {
//     clearScreen();
//     $('#guesses').empty();
//     console.log('New drawer: ' + name);
//     showToast(`${name} is drawing now!`)
//     //$('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
// };



// ****************************************************************
function joinAsDrawer() {
    ME.isDrawing = true
    document.querySelector('#canvas').classList.remove('no-pointer-events')
    document.querySelector('#guess-word-box').classList.add('hidden')
    document.querySelector('#secret-word-box').classList.remove('hidden')

    //$('#guess').hide();
    $('#guesses').empty()


    // $('.user-emoji').on('dblclick', function() {
    //     if (click == true) {
    //         var target = $(this).text();
    //         socket.emit('swap rooms', { from: user, to: target })
    //     };
    // })

    // canvas.on('touchstart', function(event) { 
    //     event.preventDefault()
    //     drawing = true 
    // })

    // canvas.on('touchmove', function(event) {
    //     event.preventDefault()
    //     draw(event)
    // })

    // canvas.on('mousedown', function(event) { 
    //     event.preventDefault()
    //     drawing = true;   
    // });

    // canvas.on('mouseup', function(event) {
    //     event.preventDefault()
    //     drawing = false;
    // })

    // canvas.on('mousemove', function(event) {
    //     event.preventDefault()
    //     draw(event)
    // })

    // function draw(event) {
    //     let offset = canvas.offset();
    //     obj.position = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        
    //     if (drawing && click) {
    //         context.fillStyle = obj.color
    //         context.beginPath()
    //         context.arc(obj.position.x, obj.position.y, 3, 0, 2 * Math.PI);
    //         context.fill()

    //         socket.emit('PAINT', obj)
    //     }
    // }

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
