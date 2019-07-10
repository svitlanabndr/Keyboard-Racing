window.onload = () => {
    const jwt = localStorage.getItem('jwt');

    if (!jwt) {
        location.replace('/login');
    } else {
        const trace = document.querySelector('#trace');
        const ratingList = document.querySelector('#rating');
        const winnersList = document.querySelector('#winners');
        const disconnectedList = document.querySelector('#disconnected');
        const timerIn = document.querySelector('#timerIn');
        const timerOut = document.querySelector('#timerOut');
        const timerOutDiv = document.querySelector('.wrp-timer-out');
        const timerInDiv = document.querySelector('.wrp-timer-in');
        const messageDiv = document.querySelector('.notification-wrp');
        const messageWrp = document.querySelector('.notification-msg-wrp');
        let text;

        const socket = io.connect('http://localhost:3000');
        socket.emit('enrollToRace', { token: jwt });

        let keyboardHandler = () => {}; 
        document.addEventListener('keypress', event => keyboardHandler(event));

        socket.on('timerInGame', payload => {
            timerOutDiv.classList.add('hidden-timer');
            timerInDiv.classList.remove('hidden-timer');

            timerIn.innerHTML = payload.countdown;
            if (payload.countdown === 1) {
                keyboardHandler = () => {};
            }
        });

        socket.on('timerOutGame', payload => {
            timerInDiv.classList.add('hidden-timer');
            timerOutDiv.classList.remove('hidden-timer');
            timerOut.innerHTML = payload.countdown;
        });

        socket.on('clearTrace', () => {
            trace.innerHTML = '';
        });

        socket.on('newComment', payload => {
            let newComment = document.createElement('div');
            newComment.classList.add('message');
            newComment.innerHTML = payload.comment;
            messageWrp.appendChild(newComment);
        });

        socket.on('clearRating', () => {

            messageDiv.classList.add('hidden');
            messageWrp.innerHTML = '';

            ratingList.innerHTML = '';
            winnersList.innerHTML = '';
            disconnectedList.innerHTML = '';
        });

        socket.on('newDisconnectedRating', payload => {
            createRatingList(payload.rating, disconnectedList);
        });

        socket.on('newWinnersRating', payload => {
            createRatingList(payload.rating, winnersList);
        });

        socket.on('newRating', payload => {
            createRatingList(payload.rating, ratingList);
        });
        
        socket.on('getTrace', payload => {
            text = payload.text;
            displayTrace(text);
        });

        socket.on('newMessage', payload => {
            let message = payload.message;
            displayMessage(message);
        });

        socket.on('game', payload => {
            let counter = 0;
            let currentLetter = text[counter];
            const maxScore = text.length;
            const rating = payload.rating;

            createRatingList(rating, ratingList);
            messageDiv.classList.remove('hidden');
            document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');

            keyboardHandler = (event) => {
                const pressedLetter = event.key;
                    if (pressedLetter === currentLetter) {
                        document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('done');
                        console.log(currentLetter, pressedLetter, true);
                        counter++;
                        socket.emit('updateScore', { score: counter });
                        if (counter === maxScore) {
                            console.log('win');
                            socket.emit('gameFinish');
                            keyboardHandler = () => {}; 
                        } else if (maxScore - counter === 5) {
                            socket.emit('beforeFinish');
                        } else {
                            document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');
                        }
                    } else {
                        console.log(currentLetter, pressedLetter, false);
                    }
                    currentLetter = text[counter];
            };
        });


        function displayMessage(message) {

        }

        function displayTrace(text) {
            trace.innerHTML ='';
            text.split('').forEach(char => {
                const newSpan = document.createElement('span');
                newSpan.innerText = char;
                trace.appendChild(newSpan);
            });
        }

        function createRatingList(array, list) {
            list.innerHTML = '';
            array.forEach(gamer => {
                const newLi = document.createElement('li');
                const name = document.createElement('span');
                name.classList.add('name');
                name.innerHTML = gamer.user;
                newLi.appendChild(name);
                if (gamer.score || gamer.score === 0) {
                    const score = document.createElement('span');
                    score.classList.add('score');
                    score.innerHTML = gamer.score;
                    newLi.appendChild(score);
                }
                list.appendChild(newLi);
            });
        }
    }
};
