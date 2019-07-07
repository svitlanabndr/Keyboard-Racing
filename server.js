const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bodyParser = require('body-parser');
const users = require('./users.json');
const traces = require('./traces.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(bodyParser.json());

require('./passport.config.js');

server.listen(3000);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat', /*passport.authenticate('jwt'),*/ (req, res) => {
    res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    const userFromReq = req.body;
    const userInDB = users.find(user => user.login === userFromReq.login);
    if (userInDB && userInDB.password === userFromReq.password) {
        const token = jwt.sign(userFromReq, 'secret', { expiresIn: '24h' });
        res.status(200).json({ auth: true, token });
    } else {
        res.status(401).json({ auth: false });
    }
});

const onlineUsers = [];
let invitedSockets = [];
let rating = [];
let ratingWinners = [];
let ratingDisconnected = [];
let isEndGame = false;

let gamers = [];
let gameStartTime;
const gameTime = 20;
const waitTime = 20;
let timeToGame = waitTime;
let timeToEndGame = gameTime;

function createStartRating(gamers) {
    let startRating = [];
    gamers.forEach(gamer => {
        startRating.push({ user: gamer, score: 0 });
    });
    return startRating;
}
function chooseTrace() {
    return traces[Math.floor(Math.random() * traces.length)].text;  
}
function reset() {
    invitedSockets.forEach(invitedSocket => {
        invitedSocket.leave('gameRoom');
    });
    isEndGame = false;
    gamers = [];
    rating = [];
    ratingWinners = [];
    ratingDisconnected = [];
}
setTimeout(function timeOut() {
    
    if (timeToGame === 0) {
        if (onlineUsers.length >= 1) {
            console.log('gamers:', onlineUsers); 
            gamers = onlineUsers;
            rating = createStartRating(gamers);
            
            gameStartTime = new Date().getTime();
            io.to('gameRoom').emit('game', { rating });
            setTimeout(function gameTimer() {    
                if (timeToEndGame == 0 || isEndGame) {
                    console.log('endgame :(')
                    // hide timerInGame
                    io.to('gameRoom').emit('clearTrace');
                    setTimeout(() => { 
                        io.to('gameRoom').emit('clearRating');
                        timeToGame = waitTime;
                        timeToEndGame = gameTime;
                        reset();
                        setTimeout(timeOut, 1000);
                    }, 5000)
                } else {

                    io.emit('timerInGame', { countdown: timeToEndGame });
                    setTimeout(gameTimer, 1000);
                }
                timeToEndGame--;
            }, 1000);
        } else {
            console.log('no game :(');
            timeToGame = waitTime;
            setTimeout(timeOut, 1000);
        }
    } else  {
        if (timeToGame === 5) {
            invitedSockets.forEach(invitedSocket => {
                invitedSocket.join('gameRoom');
            });
            io.to('gameRoom').emit('getTrace', { text: chooseTrace() });
        }

        io.emit('timerOutGame', { countdown: timeToGame });
        setTimeout(timeOut, 1000);
    }
    timeToGame--;
}, 1000);

function sortRatingList(array, mode = 'asc') {
    let compare;
    mode === 'desc'? 
        compare = (a,b) => (a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0) : 
        compare = (a,b) => (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0); 
    array.sort(compare);
}

function deleteUserFromRating(user, rating) {
    let ratingItem = rating.find(ratingItem => ratingItem.user === user);
    if (ratingItem) rating.splice( rating.indexOf(ratingItem), 1 );
}

function updateRating(socket) {
    socket.broadcast.to('gameRoom').emit('newRating', { rating });
        socket.emit('newRating', { rating });
}
function updateWinnersRating(socket) {
    socket.broadcast.to('gameRoom').emit('newWinnersRating', { rating: ratingWinners });
    socket.emit('newWinnersRating', { rating: ratingWinners });
}
function updateDisconnectedRating(socket) {
    socket.broadcast.to('gameRoom').emit('newDisconnectedRating', { rating: ratingDisconnected });
}

io.on('connection', socket => {
    invitedSockets.push(socket);
    let currentUser;

    socket.on('enrollToRace', payload => {
        currentUser = jwt.decode(payload.token).login;
        onlineUsers.push(currentUser);
        console.log('i am connected', currentUser);
        console.log('all users:', onlineUsers);
    });

    socket.on('updateScore', payload => {
        let currentScore = payload.score;
        let ratingItem = rating.find(ratingItem => ratingItem.user === currentUser);
        if (ratingItem) ratingItem.score = currentScore;
        sortRatingList(rating, 'desc');

        updateRating(socket)
    });
    
    socket.on('gameFinish', () => {
        let gameFinishTime = new Date().getTime();
        let gameDuration = Math.floor((gameFinishTime - gameStartTime) / 1000);

        deleteUserFromRating(currentUser, rating);

        if (rating.length < 1) {
            isEndGame = true;
        }

        updateRating(socket);

        console.log('winners before', ratingWinners);
        ratingWinners.push({ user: currentUser, score: gameDuration });
        console.log('winners after', ratingWinners);
        sortRatingList(ratingWinners);

        updateWinnersRating(socket);
 
    });

    socket.on('disconnect', () => {
        if (currentUser === undefined) return;
        console.log('before', onlineUsers);
        console.log('i am disconnected', currentUser);

        onlineUsers.splice( onlineUsers.indexOf(currentUser), 1 );

        if (!gamers.includes(currentUser)) {
            return;
        } 
        gamers = onlineUsers;
        if (gamers.length < 1) {
            isEndGame = true;
        }

        deleteUserFromRating(currentUser, rating);
        deleteUserFromRating(currentUser, ratingWinners);

        updateRating(socket);
        updateWinnersRating(socket);

        ratingDisconnected.push({ user: currentUser });

        updateDisconnectedRating(socket);

        console.log('after:', onlineUsers);
    });
});

