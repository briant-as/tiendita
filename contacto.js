// Archivo: contacto.js

// Esperamos a que todo el contenido HTML se cargue.
window.addEventListener('DOMContentLoaded', () => {

    // 1. Seleccionamos los elementos del formulario que necesitamos.
    const formulario = document.getElementById('formulario-contacto');
    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const mensajeInput = document.getElementById('mensaje');
    const errorContainer = document.getElementById('mensaje-error');

    // 2. Escuchamos el evento 'submit' del formulario.
    // Esto se activa cuando el usuario hace clic en el botón "Enviar Mensaje".
    formulario.addEventListener('submit', (event) => {

        // 3. Prevenimos el comportamiento por defecto del formulario.
        // Por defecto, un formulario recarga la página al enviarse. No queremos eso.
        event.preventDefault();

        // 4. Limpiamos cualquier mensaje de error anterior.
        errorContainer.textContent = '';
        let errores = []; // Un array para guardar los mensajes de error.

        // 5. Realizamos las validaciones.
        if (nombreInput.value.trim() === '') {
            errores.push('El campo Nombre es obligatorio.');
        }

        if (emailInput.value.trim() === '') {
            errores.push('El campo Correo Electrónico es obligatorio.');
        }

        if (mensajeInput.value.trim() === '') {
            errores.push('El campo Mensaje es obligatorio.');
        }

        // 6. Mostramos los errores si los hay.
        if (errores.length > 0) {
            errorContainer.textContent = errores.join(' ');
        } else {
            // 7. Si no hay errores, simulamos un envío exitoso.
            alert('¡Mensaje enviado con éxito! Gracias por contactarnos.');
            formulario.reset(); // Limpia los campos del formulario.
        }
    });
});