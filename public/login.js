window.onload = () => {

    const btn = document.querySelector('#btn');
    const loginField = document.querySelector('#login');
    const passwordField = document.querySelector('#password');

    btn.addEventListener('click', event => {
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: loginField.value,
                password: passwordField.value
            })
        }).then(res => {
            res.json().then(body => {
                console.log(body);
                if (body.auth) {
                    localStorage.setItem('jwt', body.token);
                    location.replace('/chat');
                } else {
                    console.log('auth failed');
                }
            })
        }).catch(err => {
            console.log('request went wrong');
        })
    });
}