function register() {
    const displayName = document.getElementById('reg-displayName').value;
    const NIS = document.getElementById('reg-NIS').value;
    const password = document.getElementById('reg-password').value;

    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, NIS, password })
    })
        .then(response => {
            if (response.status === 400) {
                return response.json().then(data => {
                    document.getElementById('response').innerHTML = `Gagal mendaftar: ${data.message}`;
                });
            } else if (response.status === 200) {
                return response.json().then(data => {
                    document.getElementById('response').innerHTML = data.message;
                });
            } else {
                throw new Error('Respons tidak valid dari server.');
            }
        })
        .catch(error => console.error('Error:', error));
}



function login() {
    const NIS = document.getElementById('login-NIS').value;
    const password = document.getElementById('login-password').value;

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NIS, password })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('response').innerHTML = `Token: ${data.token}`;
        })
        .catch(error => console.error('Error:', error));
}

function checkToken() {
    const token = document.getElementById('token').value;

    fetch('http://localhost:3000/check-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('response').innerHTML = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error('Error:', error));
}

function logout() {
    const token = document.getElementById('logout-token').value;

    fetch('http://localhost:3000/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('response').innerHTML = data.message;
        })
        .catch(error => console.error('Error:', error));
}

function nextPage(nextPageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const nextPage = document.getElementById(nextPageId);
    nextPage.classList.add('active');
}
