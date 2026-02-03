document.getElementById('audience-join-btn').addEventListener('click', () => {
    const code = document.getElementById('audience-session-code').value.toUpperCase();
    if (code) window.location.href = `/pages/audience.html?session=${code}`;
});
document.getElementById('shower-login-btn').addEventListener('click', () => window.location.href = '/pages/admin.html?role=shower');
document.getElementById('presenter-login-btn').addEventListener('click', () => window.location.href = '/pages/admin.html?role=presenter');