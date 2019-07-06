window.onload = () => {
    const jwt = localStorage.getItem('jwt');

    if (!jwt) {
        location.replace('/login');
    } else {
        const trace = document.querySelector('#trace');
        const ratingList = document.querySelector('#rating');
        const winnersList = document.querySelector('#winners');
        const timerIn = document.querySelector('#timerIn');
        const timerOut = document.querySelector('#timerOut');
        let text;

        const socket = io.connect('http://localhost:3000');
        socket.emit('enrollToRace', { token: jwt });

        let keyboardHandler = () => {}; 
        document.addEventListener('keypress', event => keyboardHandler(event));

        socket.on('timerInGame', payload => {
            timerIn.innerHTML = payload.countdown;
            if (payload.countdown === 1) {
                keyboardHandler = () => {};
            }
        });

        socket.on('timerOutGame', payload => {
            timerOut.innerHTML = payload.countdown;
        });

        socket.on('clearTrace', () => {
            trace.innerHTML = '';
        });

        socket.on('clearRating', () => {
            ratingList.innerHTML = '';
            winnersList.innerHTML = '';
        });

        socket.on('addWinner', payload => {
            createRatingList(payload.rating, winnersList);
            winnersList.classList.add('winners');
        });

        socket.on('newRating', payload => {
            createRatingList(payload.rating, ratingList);
        });
        
        socket.on('getTrace', payload => {
            text = payload.text;
        });

        socket.on('game', payload => {
            
            let counter = 0;
            let currentLetter = text[counter];
            const maxScore = text.length;
            const rating = payload.rating;

            createRatingList(rating, ratingList);

            displayTrace(text);

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
                        } else {
                            document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');
                        }
                    } else {
                        console.log(currentLetter, pressedLetter, false);
                    }
                    currentLetter = text[counter];
            };
        });

        function displayTrace(text) {
            text.split('').forEach(char => {
                const newSpan = document.createElement('span');
                newSpan.innerText = char;
                trace.appendChild(newSpan);
            });
        }

        function createRatingList(array, list) {
            // console.log(array, list);
            list.innerHTML = '';

            array.forEach(gamer => {
                const newLi = document.createElement('li');

                const name = document.createElement('span');
                name.classList.add('name');
                name.innerHTML = gamer.user;
                
                const score = document.createElement('span');
                score.classList.add('score');
                score.innerHTML = gamer.score;

                newLi.appendChild(name);
                newLi.appendChild(score);

                list.appendChild(newLi);
            });
        }

    }
};