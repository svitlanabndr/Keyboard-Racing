window.onload = () => {

    const jwt = localStorage.getItem('jwt');

    if (!jwt) {
        location.replace('/login');
    } else {
        const btn = document.querySelector('#btn');
        const text = document.querySelector('#text');
        const list = document.querySelector('#list');

        const timer = document.querySelector('#timer');
        const trace = document.querySelector('#trace');
        const ratingList = document.querySelector('#rating');

        const socket = io.connect('http://localhost:3000');
        socket.emit('enrollToRace', { token: jwt });

        socket.on('timer', payload => {
            document.querySelector(payload.div).innerHTML = payload.countdown;
        });
        
        socket.on('game', payload => {

            // display rating list
            const gamers = payload.gamers;
            gamers.forEach(gamer => {
                const newLi = document.createElement('li');
                newLi.innerHTML = gamer;
                ratingList.appendChild(newLi);

                const score = document.createElement('span');
                score.innerHTML = 0;
                newLi.appendChild(score);
            });

            //display trace
            let text = 'Love'
            text.split('').forEach((char) => {
                const newSpan = document.createElement('span');
                newSpan.innerText = char;
                trace.appendChild(newSpan);
            });

            counter = 0;
            let currentLetter = text[counter];

            document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');
            let previousSpan;

            document.addEventListener('keypress', (event) => {
                const pressedLetter = event.key;
                if (pressedLetter === currentLetter) {
                    document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('done');
                    console.log(currentLetter, pressedLetter, true);
                    counter++;
                    document.querySelector(`#trace span:nth-of-type( ${counter+1} )`).classList.add('current');
                    currentLetter = text[counter];
                } else {
                    console.log(currentLetter, pressedLetter, false);
                }
            });


        });

        btn.addEventListener('click', event => {
            socket.emit('submitMessage', { message: text.value, token: jwt });
        });

        socket.on('newMessage', payload => {
            const newLi = document.createElement('li');
            newLi.innerHTML = `${payload.message} - ${payload.user}`;
            list.appendChild(newLi);
        });

    }
};