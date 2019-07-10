const express = require('express');
const router = express.Router();
const app = express();
const jwt = require('jsonwebtoken');

const users = require('./users.json');
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

router.get('/game', /*passport.authenticate('jwt'),*/ (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

router.post('/login', (req, res) => {
    console.log('---------')
    const userFromReq = req.body;
    const userInDB = users.find(user => user.login === userFromReq.login);
    if (userInDB && userInDB.password === userFromReq.password) {
        const token = jwt.sign(userFromReq, 'secret');
        res.status(200).json({ auth: true, token });
    } else {
        res.status(401).json({ auth: false });
    }
});

module.exports = router;