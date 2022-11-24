let socket = io()
let user = null
let context = null
let canvas = null
let click = false
let users = []
let nickname = null
let toastContain = null
let musicIsPlaying = true

const sndBackground = new Howl({ src: ['../audio/BanjosUnite-320bit.mp3'], html5: true })

$(document).ready(function() {
    document.getElementById('modal_nick').classList.remove('hidden')

    let canvasWidth = document.getElementById('canvas-box').offsetWidth
    let canvasHeight = document.getElementById('canvas-box').offsetHeight

    canvas = $('#canvas') //document.getElementById('canvas')
    context = canvas[0].getContext('2d')
    canvas[0].width = canvasWidth
    canvas[0].height = canvasHeight

    socket.on('playerlist', userlist)
    socket.on('guesser', guesser)
    socket.on('guessword', guessword)
    socket.on('draw', draw)
    socket.on('draw word', drawWord)
    socket.on('drawer', pictionary)
    socket.on('new drawer', newDrawer)
    socket.on('correct answer', correctAnswer)
    socket.on('reset', reset)
    socket.on('clear screen', clearScreen)

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
function guessWord(event) {
    //event.preventDefault()

    if (!$('#player_guess_text').val()) {
        return false
    }

    var guess = $('#player_guess_text').val();


    socket.emit('guessword', { nickname: nickname, guessword: guess })
    $('#player_guess_text').val('')
}

// ****************************************************************
function playClicked() {
    nickname = (document.getElementById('nickname').value).trim()

    if (!nickname) {
        return false
    }

    socket.emit('join', nickname.trim())
    document.getElementById('modal_nick').classList.add('hidden')
    sndBackground.play();
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
/* function getNickname() {
    //$('#modal_nick').fadeIn(500)
    //$('#nickname').focus()

    $('#form_nickname').submit(function() {
        event.preventDefault();
        user = $('#nickname').val().trim()

        if (user == '') {
            return false
        }

        let index = users.indexOf(user)

        if (index > -1) {
            $('#alert_nickname').fadeIn(500);
            return false
        };
        
        socket.emit('join', user);
        $('.nickname').fadeOut(300);
        //$('#modal_nick').fadeOut(300);
        $('input.guess-input').focus();
    });
}; */



let guesser = function() {
    document.getElementById('canvas').classList.add('no-pointer-events')

    clearScreen();
    click = false;
    console.log('draw status: ' + click);
    $('.draw').hide();
    $('#guesses').empty();

    console.log('You are a guesser');

    $('#guess').show();
    $('#player_guess_text').focus();

    $('#guess').on('submit', function() {
        // event.preventDefault();
        // var guess = $('#player_guess_text').val();

        // if (guess == '') {
        //     return false
        // };

        // console.log(nickname + "'s guess: " + guess);
        // socket.emit('guessword', { nickname: nickname, guessword: guess })
        // $('#player_guess_text').val('');
    });
};

let guessword = function(data){
    $('#guesses').text(data.nickname + "'s guess: " + data.guessword);

    if (click == true && data.guessword == $('span.word').text() ) {
        console.log('guesser: ' + data.nickname + ' draw-word: ' + $('span.word').text())
        socket.emit('correct answer', { nickname: data.nickname, guessword: data.guessword })
        socket.emit('swap rooms', { from: user, to: data.nickname })
        click = false
    }
};

let drawWord = function(word) {
    $('span.word').text(word)
    console.log('Your word to draw is: ' + word)
};

let userlist = function(names) {
    users = names;
    let html = '<p class="chatbox-header"></p>';

    for (var i = 0; i < names.length; i++) {
        html += '<li>' + names[i] + '</li>';
    };

    $('ul').html(html);
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

let draw = function(obj) {
    context.fillStyle = obj.color;
    context.beginPath();
    context.arc(obj.position.x, obj.position.y,
                     3, 0, 2 * Math.PI);
    context.fill();
};

let pictionary = function() {
    clearScreen();
    click = true;
    console.log('draw status: ' + click);
    $('#guess').hide();
    $('#guesses').empty();
    $('.draw').show();

    var drawing;
    var color;
    var obj = {};

    $('#color-box').on('click', 'button', function() {
        obj.color = $(this).attr('value');
        console.log(obj.color);

        if (obj.color === '0') {
            socket.emit('clear screen', user);
            context.fillStyle = 'white';
            return;
        };
    });

    console.log('You are the drawer');

    $('.players').on('dblclick', 'li', function() {
        if (click == true) {
            var target = $(this).text();
            socket.emit('swap rooms', { from: user, to: target })
        };
    });

    canvas.on('touchstart', function(event) { 
        event.preventDefault()
        drawing = true 
    })

    canvas.on('touchmove', function(event) {
        event.preventDefault()
        let offset = canvas.offset();
        obj.position = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        
        if (drawing == true && click == true) {
            draw(obj);
            socket.emit('draw', obj);
        };
    })

    canvas.on('mousedown', function(event) { 
        drawing = true;   
    });

    canvas.on('mouseup', function(event) {
        drawing = false;
    })

    canvas.on('mousemove', function(event) {
        let offset = canvas.offset();
        obj.position = { x: event.pageX - offset.left, y: event.pageY - offset.top }
        
        if (drawing == true && click == true) {
            draw(obj);
            socket.emit('draw', obj)
        }
    })

}

// ****************************************************************
function showToast(str) {
    const FADE_DUR = 700
    let duration = Math.max(6000, str.length * 80)

    if (!toastContain) {
        toastContain = document.createElement('div')
        toastContain.classList.add('toast-container')
        document.body.appendChild(toastContain)
    }

    const el = document.createElement('div')
    el.classList.add('toast')
    el.innerText = str
    toastContain.prepend(el)

    setTimeout(function() { 
        el.classList.add('open')
    })

    setTimeout(function() {
            el.classList.remove('open')
        },
        duration
    )

    setTimeout(
        () => toastContain.removeChild(el),
        duration + FADE_DUR
    )
}
