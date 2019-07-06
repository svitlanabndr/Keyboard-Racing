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

        const socket = io.connect('http://localhost:3000');
        socket.emit('enrollToRace', { token: jwt });

        socket.on('timerInGame', payload => {
            timerIn.innerHTML = payload.countdown;
        });

        socket.on('timerOutGame', payload => {
            timerOut.innerHTML = payload.countdown;
        });
        
        let keyboardHandler = () => {}; 
        document.addEventListener('keypress', event => keyboardHandler(event));

        function createRatingList(array) {
            ratingList.innerHTML = '';

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

                ratingList.appendChild(newLi);
            });
        }

        socket.on('clearTrace', () => {
            trace.innerHTML = '';
        });
        socket.on('clearRating', () => {
            ratingList.innerHTML = '';
        });
        socket.on('addWinner', payload => {
            // showWinner(payload.user);
            const newWinner = document.createElement('li');
            newWinner.innerHTML = payload.user;
            winnersList.appendChild(newWinner);

        });

        socket.on('game', payload => {

            const rating = payload.rating;
            createRatingList(rating);

            //display trace
            let text = 'Love'
            text.split('').forEach(char => {
                const newSpan = document.createElement('span');
                newSpan.innerText = char;
                trace.appendChild(newSpan);
            });

            counter = 0;
            let currentLetter = text[counter];
            const maxScore = text.length;

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
                        }
                        else {
                            document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');
                        }

                    } else {
                        console.log(currentLetter, pressedLetter, false);
                    }
                    currentLetter = text[counter];
                
            };
            // clearGame();
        });

        socket.on('newRating', payload => {
            createRatingList(payload.rating);
        });

    }
};