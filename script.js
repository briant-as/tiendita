// Archivo: script.js (VERSIÓN ACTUALIZADA)

// --- FUNCIÓN PARA AGREGAR PRODUCTOS AL CARRITO ---
function agregarAlCarrito(productoId) {
    // 1. Obtenemos el carrito actual desde localStorage.
    // Si no existe, creamos un array vacío. JSON.parse() convierte el texto a un array.
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // 2. Añadimos el nuevo ID de producto al array.
    carrito.push(productoId);

    // 3. Guardamos el array actualizado de vuelta en localStorage.
    // JSON.stringify() convierte el array de vuelta a texto para poder guardarlo.
    localStorage.setItem('carrito', JSON.stringify(carrito));

    // 4. Actualizamos el contador visual del carrito.
    actualizarContadorCarrito();

    console.log('Producto añadido:', productoId, 'Carrito actual:', carrito); // Para depurar
}


// --- FUNCIÓN PARA ACTUALIZAR EL NÚMERO EN EL ÍCONO DEL CARRITO ---
function actualizarContadorCarrito() {
    const contadorElement = document.getElementById('contador-carrito');
    if (contadorElement) {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        contadorElement.textContent = carrito.length; // El número de items es la longitud del array.
    }
}


// --- CÓDIGO QUE SE EJECUTA CUANDO LA PÁGINA SE CARGA ---
window.addEventListener('DOMContentLoaded', () => {
    // Siempre actualizamos el contador al cargar cualquier página.
    actualizarContadorCarrito();

    // El siguiente código solo se debe ejecutar si estamos en la página de producto.
    if (document.getElementById('producto-nombre')) {

        // --- 1. LEER EL ID DEL PRODUCTO DESDE LA URL ---
        const params = new URLSearchParams(window.location.search);
        const productoId = parseInt(params.get('id'));

        // --- 2. ENCONTRAR EL PRODUCTO CORRECTO ---
        const producto = productos.find(p => p.id === productoId);

        // --- 3. INYECTAR LA INFORMACIÓN EN EL HTML ---
        if (producto) {
            const imgElement = document.getElementById('producto-img');
            const nombreElement = document.getElementById('producto-nombre');
            const descripcionElement = document.getElementById('producto-descripcion');
            const precioElement = document.getElementById('producto-precio');

            imgElement.src = producto.imagen;
            imgElement.alt = producto.nombre;
            nombreElement.textContent = producto.nombre;
            descripcionElement.textContent = producto.descripcion;
            precioElement.textContent = `$${producto.precio}`;

            // --- 4. CONFIGURAR EL BOTÓN "AÑADIR AL CARRITO" ---
            const btnAgregar = document.getElementById('btn-agregar');
            if (btnAgregar) {
                btnAgregar.addEventListener('click', () => {
                    agregarAlCarrito(producto.id);
                    // Opcional: Dar una señal visual al usuario.
                    btnAgregar.textContent = '¡Añadido!';
                    setTimeout(() => { btnAgregar.textContent = 'Añadir al carrito'; }, 2000);
                });
            }
        } else {
            document.querySelector('.producto-detalle').innerHTML = '<h2>Producto no encontrado</h2>';
        }
    }
});