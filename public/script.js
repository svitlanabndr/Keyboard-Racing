window.onload = () => {

    const btn = document.querySelector('#btn');
    const text = document.querySelector('#text');
    const list = document.querySelector('#list');

    const socket = io.connect('http://localhost:3000');

    btn.addEventListener('click', event => {
        socket.emit('submitMessage', { message: text.value });
    });

    socket.on('newMessage', payload => {
        const newLi = document.createElement('li');
        newLi.innerHTML = payload.message;
        list.appendChild(newLi);
    });
};