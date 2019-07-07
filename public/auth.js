window.onload = () => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        // fetch('/game', {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': 'Bearer ' + jwt,
        //     }
        // }).then(res => {
        //     res.text()
        // });
        location.replace('/game');
    } else {
        location.replace('/login');
    }
};