// Archivo: login.js (Actualizado para Render)

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // ACTUALIZADO: URL del backend desplegado
            const respuesta = await fetch('https://tiendita-zulr.onrender.com/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, password: password })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                localStorage.setItem('admin-token', resultado.token);
                window.location.href = 'admin.html';
            } else {
                mensajeLogin.textContent = resultado.message;
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            mensajeLogin.textContent = "Error al conectar con el servidor.";
        }
    });
});