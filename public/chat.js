window.onload = () => {

    const jwt = localStorage.getItem('jwt');

    if (!jwt) {
        location.replace('/login');
    } else {
        const trace = document.querySelector('#trace');
        const ratingList = document.querySelector('#rating');
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
                newLi.innerHTML = gamer.user;
                ratingList.appendChild(newLi);
                const score = document.createElement('span');
                score.innerHTML = gamer.score;
                newLi.appendChild(score);
            });
        }


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

                if (counter === maxScore) {
                    console.log('win');
                    trace.innerHTML = '';
                    return;
                } else {
                    document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');
                    if (pressedLetter === currentLetter) {
                        document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('done');
                        console.log(currentLetter, pressedLetter, true);
                        counter++;
                        socket.emit('updateScore', { score: counter });
                    } else {
                        console.log(currentLetter, pressedLetter, false);
                    }
                    currentLetter = text[counter];
                }
            };
            // clearGame();
        });

        socket.on('newRating', payload => {
            createRatingList(payload.rating);
        });

    }
};