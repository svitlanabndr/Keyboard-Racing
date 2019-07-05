const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bodyParser = require('body-parser');
const users = require('./users.json');

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
        const token = jwt.sign(userFromReq, 'someSecret', { expiresIn: '24h' });
        res.status(200).json({ auth: true, token });
    } else {
        res.status(401).json({ auth: false });
    }
});
const onlineUsers = [];
let invitedSockets = [];

const gameTime = 20;
const waitTime = 20;

let timeToGame = waitTime;
let timeToEndGame = gameTime;

setTimeout(function timeOut() {
    // console.log("time to Game: "+timeToGame);
    
    if (timeToGame === 0) {
        if (onlineUsers.length >= 1) {
            console.log('gamers:', onlineUsers); //not unique users

            invitedSockets.forEach(invitedSocket => {
                invitedSocket.join('gameRoom');
            });
            io.to('gameRoom').emit('game', { gamers: onlineUsers }); // only for rooms
            setTimeout(function gameTimer() {
                
                // console.log("time to EndGame: " + timeToEndGame);
                if (timeToEndGame == 0) {
                    timeToGame = waitTime;
                    timeToEndGame = gameTime;
                    setTimeout(timeOut, 1000);

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

    } else {
        io.emit('timerOutGame', { countdown: timeToGame });
        setTimeout(timeOut, 1000);
    }
    timeToGame--;
}, 1000);

let rating = [];
io.on('connection', socket => {
    invitedSockets.push(socket);

    let currentUser;
    socket.on('enrollToRace', payload => {
        currentUser = jwt.decode(payload.token).login;
        onlineUsers.push(currentUser);
        console.log('i am connected', currentUser);
        console.log('all users:', onlineUsers);
    });

    socket.on('score', payload => {
        let currentScore = payload.score;
        let ratingItem = rating.find(ratingItem => ratingItem.user === currentUser);
        if (ratingItem) {
            ratingItem.score = currentScore;
        } else {
            rating.push({ user: currentUser, score: currentScore });
        }
        socket.broadcast.to('gameRoom').emit('newRating', { rating });
        socket.emit('newRating', { rating });
    });

    socket.on('disconnect', () => {
        if (currentUser === undefined) {
            return;
        }
        console.log('before', onlineUsers);
        onlineUsers.splice( onlineUsers.indexOf(currentUser), 1 );
        console.log('i am disconnected', currentUser);
        console.log('after:', onlineUsers);

    });
});

