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

let nextGameTimer = 20;
setTimeout(function run() {
    nextGameTimer --;
    if (nextGameTimer >= 0) {
        io.emit('timer', { countdown: nextGameTimer });
        setTimeout(run, 1000);
    } else {
        // начало игры
    }
  }, 1000);

io.on('connection', socket => {

    let currentUser;
    socket.on('enrollToRace', payload =>{
        currentUser = jwt.decode(payload.token).login;
        console.log('i am connected', currentUser);
    });
    socket.on('submitMessage', payload => {
        const { token, message } = payload;
        const user = jwt.decode(token).login;
        socket.broadcast.emit('newMessage', { message, user });
        socket.emit('newMessage', { message, user });
    });
    socket.on('disconnect', () => {
        console.log('i am disconnected', currentUser);
    });
});