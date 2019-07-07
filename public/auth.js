window.onload = () => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        // fetch('/chat', {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': 'Bearer ' + jwt,
        //     }
        // }).then(res => {
        //     res.text()
        // });
        location.replace('/chat');
    } else {
        location.replace('/login');
    }
};