const Timer = require('./timer');
const CommentsFactory = require('./commentsFactory');

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
    () => { return isEndGame }
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

function actionHandler(type, context) {
    switch (type) {
        case 'startGame':
            gamers = [...onlineUsers];
            rating = createStartRating(gamers);
            invitedSockets.forEach(invitedSocket => {
                invitedSocket.join('gameRoom');
                console.log('i am in game room');
            });
            proxyActionHandler('hello');
            proxyActionHandler('start', rating)

            gameStartTime = new Date().getTime();
            io.to('gameRoom').emit('game', { rating });
            break;
            
        case 'clearTrace':
            console.log('endgame :(')
            proxyActionHandler('finish', ratingWinners);
            io.to('gameRoom').emit('clearTrace');
            break;

        case 'clearGame':
            io.to('gameRoom').emit('clearRating');
            resetGame();
            break;

        case 'gameTimer':
            if (context % 10 === 0) proxyActionHandler('current', rating);
            if ((context - 5) % 10 === 0) proxyActionHandler('joke');
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
}
const SPECIAL_ACTIONS = ['hello', 'start', 'disconnect', 'winner', 'current', 'finish', 'joke'];
// Proxy
const proxyActionHandler = new Proxy(actionHandler,  {
    apply(target, context, args) {
        console.log(target,args);
        let [type, data] = args;
        let comment;
        if (SPECIAL_ACTIONS.includes(type)) {
            comment = CommentsFactory.createComment(type, data);
            console.log(comment);
            io.to('gameRoom').emit('newComment', {comment});
        }
        return target(...args);
    }
});

timer.start(proxyActionHandler);

function sortRatingList(array) {
    return array.sort((a, b) => a.score - b.score);
}

function deleteUserFromRating(user, rating) {
    return rating.filter((ratingItem) => ratingItem.user !== user);
}

function updateRating(socket, rating) {
    socket.broadcast.to('gameRoom').emit('newRating', { rating });
    socket.emit('newRating', { rating });
}

function updateWinnersRating(socket, ratingWinners) {
    socket.broadcast.to('gameRoom').emit('newWinnersRating', { rating: ratingWinners });
    socket.emit('newWinnersRating', { rating: ratingWinners });
}

function updateDisconnectedRating(socket, ratingDisconnected) {
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

            proxyActionHandler('Connect', currentUser);

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
        rating = sortRatingList(rating).reverse();
        updateRating(socket, rating)
    });
    
    socket.on('gameFinish', () => {
        let gameFinishTime = new Date().getTime();
        let gameDuration = Math.floor((gameFinishTime - gameStartTime) / 1000);

        if (rating.length < 1) isEndGame = true;

        updateRating(socket, rating);
        let winner = { user: currentUser, score: gameDuration };
        proxyActionHandler('winner', winner);
        ratingWinners.push(winner);
        ratingWinners = sortRatingList(ratingWinners);
        updateWinnersRating(socket, ratingWinners);
    });

    socket.on('disconnect', () => {
        if (currentUser === undefined) return;
     
        proxyActionHandler('Disconnect', currentUser);
   
        onlineUsers.splice( onlineUsers.indexOf(currentUser), 1 );
        
        if (!gamers.includes(currentUser)) return;
        gamers.splice( onlineUsers.indexOf(currentUser), 1 );
        proxyActionHandler('disconnect', currentUser);


        if (gamers.length < 1) {
            isEndGame = true;
            return;
        }

        rating = deleteUserFromRating(currentUser, rating);
        ratingWinners = deleteUserFromRating(currentUser, ratingWinners);

        updateRating(socket, rating);
        updateWinnersRating(socket,ratingWinners);

        ratingDisconnected.push({ user: currentUser });

        updateDisconnectedRating(socket, ratingDisconnected);
    });
});
