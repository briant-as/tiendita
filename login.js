// Archivo: login.js

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitamos que la página se recargue

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // 1. Enviamos los datos del formulario al backend
            const respuesta = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, password: password })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                // 2. ¡Éxito! Guardamos el "pase" (token) en el navegador
                localStorage.setItem('admin-token', resultado.token);

                // 3. Redirigimos al usuario al panel de administración
                window.location.href = 'admin.html';
            } else {
                // 4. Mostramos el mensaje de error del servidor
                mensajeLogin.textContent = resultado.message;
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            mensajeLogin.textContent = "Error al conectar con el servidor.";
        }
    });
});