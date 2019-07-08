const Timer = require('./timer');

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

app.get('/game', /*passport.authenticate('jwt'),*/ (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    const userFromReq = req.body;
    const userInDB = users.find(user => user.login === userFromReq.login);
    if (userInDB && userInDB.password === userFromReq.password) {
        const token = jwt.sign(userFromReq, 'secret');
        res.status(200).json({ auth: true, token });
    } else {
        res.status(401).json({ auth: false });
    }
});

const timer = new Timer(
    () => { return onlineUsers },
    () => { return isEndGame }, 20,20
);

const onlineUsers = [];
let invitedSockets = [];
let rating = [];
let ratingWinners = [];
let ratingDisconnected = [];
let isEndGame = false;
let text;
let gamers = [];
const cars = ['Ferrari', 'BMW', 'Porsche', 'Bugatti', 'Audi'];
let gameStartTime;
let timeToGame;

function createStartRating(gamers) {
    let startRating = [];
    gamers.forEach((gamer, i) => {
        startRating.push({ id: i+1, user: gamer, score: 0, car: getCar() });
    });
    return startRating;
}

function getCar() {
    return cars[Math.floor(Math.random() * cars.length)];
}

function chooseTrace() {
    return traces[Math.floor(Math.random() * traces.length)].text;  
}

function resetGame() {
    invitedSockets.forEach(invitedSocket => {
        invitedSocket.leave('gameRoom');
    });
    isEndGame = false;
    gamers = [];
    rating = [];
    ratingWinners = [];
    ratingDisconnected = [];
}

timer.start((type, context) => {
    switch (type) {
        case 'startGame':
            console.log('Game start gamers:', onlineUsers); 
            gamers = [...onlineUsers];
            rating = createStartRating(gamers);
            invitedSockets.forEach(invitedSocket => {
                invitedSocket.join('gameRoom');
            });
            gameStartTime = new Date().getTime();
            io.to('gameRoom').emit('game', { rating });
            break;
            
        case 'clearTrace':
            console.log('endgame :(')
            io.to('gameRoom').emit('clearTrace');
            break;

        case 'clearGame':
            io.to('gameRoom').emit('clearRating');
            resetGame();
            break;

        case 'gameTimer':
            io.emit('timerInGame', { countdown: context });
            break;

        case 'preGame':
            text = chooseTrace();
            if (onlineUsers.length >= 1) io.emit('getTrace', { text });
            break;

        case 'breakTimer':
            timeToGame = context
            io.emit('timerOutGame', { countdown: context });
            break;
    
        default:
            break;
    }
});

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
        const verified = jwt.verify(payload.token, 'secret');
        if (verified) {
            currentUser = verified.login;
            onlineUsers.push(currentUser);

            console.log('i am connected', currentUser);
            console.log('online users', onlineUsers);
            console.log('gamers', gamers);

            if (timeToGame <= 5 && timeToGame >= 0) {
                socket.emit('getTrace', { text });
                socket.join('gameRoom');
            }
        }
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

        if (rating.length < 1) isEndGame = true;

        updateRating(socket);
        ratingWinners.push({ user: currentUser, score: gameDuration });
        sortRatingList(ratingWinners);
        updateWinnersRating(socket);
    });

    socket.on('disconnect', () => {
        if (currentUser === undefined) return;
        console.log('i am disconnected', currentUser);
        console.log('online users', onlineUsers);
        console.log('gamers', gamers);
   
        onlineUsers.splice( onlineUsers.indexOf(currentUser), 1 );
        
        if (!gamers.includes(currentUser)) return;
        gamers.splice( onlineUsers.indexOf(currentUser), 1 );

        if (gamers.length < 1) {
            isEndGame = true;
            return;
        }

        deleteUserFromRating(currentUser, rating);
        deleteUserFromRating(currentUser, ratingWinners);

        updateRating(socket);
        updateWinnersRating(socket);

        ratingDisconnected.push({ user: currentUser });

        updateDisconnectedRating(socket);
    });
});
