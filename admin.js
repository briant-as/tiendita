// Archivo: admin.js (VERSIÓN FINAL COMPLETA CON AUTENTICACIÓN)

// --- 1. VERIFICACIÓN DE ACCESO ---
const token = localStorage.getItem('admin-token');
if (!token) {
    // Si no hay token guardado, redirigimos al login INMEDIATAMENTE
    window.location.href = 'login.html';
} else {
    // (Opcional) Podríamos añadir una verificación aquí para ver si el token aún es válido
    console.log("Token encontrado, permitiendo acceso al panel.");
}

// --- FUNCIÓN PRINCIPAL QUE SE EJECUTA AL CARGAR LA PÁGINA ADMIN ---
document.addEventListener('DOMContentLoaded', () => {

    // Variable para saber si estamos editando un producto o creando uno nuevo
    let editandoId = null;

    // --- LÓGICA PARA AÑADIR O EDITAR PRODUCTOS ---
    const form = document.getElementById('form-nuevo-producto');
    const mensajeRespuesta = document.getElementById('mensaje-respuesta');
    const formTitulo = document.querySelector('.panel-admin h2'); // Asegúrate de que este selector sea correcto para tu h2
    const formBoton = document.getElementById('btn-agregar-producto');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Verificamos si estamos en modo "Edición" o "Creación"
        const esModoEdicion = !!editandoId;

        // 1. Creamos el FormData
        const formData = new FormData();
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('precio', document.getElementById('precio').value);
        formData.append('categoria', document.getElementById('categoria').value);
        formData.append('descripcion', document.getElementById('descripcion').value);

        const imagenInput = document.getElementById('imagen');
        if (imagenInput.files[0]) {
            formData.append('imagen', imagenInput.files[0]);
        }

        try {
            // 2. Decidimos la URL y el Método
            const url = esModoEdicion
                ? `http://localhost:3000/api/productos/${editandoId}` // URL para Editar (PUT)
                : 'http://localhost:3000/api/productos';             // URL para Crear (POST)

            const method = esModoEdicion ? 'PUT' : 'POST';

            // 3. Enviamos los datos CON el token
            const respuesta = await fetch(url, {
                method: method,
                headers: {
                    // Importante: NO ponemos 'Content-Type' aquí con FormData
                    'Authorization': `Bearer ${token}` // Enviamos el token para autenticar
                },
                body: formData,
            });

            const resultado = await respuesta.json();

            // 4. Mostramos el resultado
            if (respuesta.ok) {
                mensajeRespuesta.textContent = esModoEdicion
                    ? '¡Producto actualizado con éxito!'
                    : `¡Producto añadido con éxito!`; // Usamos un mensaje más genérico o el nombre si el backend lo devuelve correctamente
                mensajeRespuesta.style.color = 'green';

                form.reset(); // Limpiamos el formulario
                cargarProductosAdmin(); // Recargamos la lista

                // Reseteamos el formulario al modo "Añadir"
                formTitulo.textContent = 'Añadir Nuevo Producto';
                formBoton.textContent = 'Añadir Producto';
                editandoId = null;

            } else {
                // Si el token expiró o es inválido, el servidor responderá 401 o 403
                if (respuesta.status === 401 || respuesta.status === 403) {
                    mensajeRespuesta.textContent = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
                    mensajeRespuesta.style.color = 'red';
                    // Opcional: Redirigir al login después de un tiempo
                    setTimeout(() => window.location.href = 'login.html', 3000);
                } else {
                    mensajeRespuesta.textContent = `Error: ${resultado.message || 'No se pudo completar la operación'}`;
                    mensajeRespuesta.style.color = 'red';
                }
            }
        } catch (error) {
            mensajeRespuesta.textContent = 'Error de conexión con el servidor.';
            mensajeRespuesta.style.color = 'red';
            console.error("Error en submit:", error);
        }
    });

    // --- LÓGICA PARA CARGAR LA LISTA DE PRODUCTOS AL INICIO ---
    cargarProductosAdmin();
});


// --- FUNCIÓN PARA CARGAR Y MOSTRAR LA LISTA DE PRODUCTOS ---
async function cargarProductosAdmin() {
    const listaContenedor = document.getElementById('lista-productos-admin');
    if (!listaContenedor) return;

    try {
        // No necesitamos token para LEER productos (GET)
        const respuesta = await fetch('http://localhost:3000/api/productos');
        if (!respuesta.ok) throw new Error('No se pudieron cargar los productos');

        const productos = await respuesta.json();

        listaContenedor.innerHTML = '';

        if (productos.length === 0) {
            listaContenedor.innerHTML = '<p>No hay productos en la base de datos.</p>';
            return;
        }

        productos.forEach(producto => {
            // Mostramos la imagen usando la ruta relativa al servidor
            const imagenSrc = producto.imagen ? `${producto.imagen.replace(/\\/g, '/')}` : ''; // Asegura barras correctas
            const productoHTML = `
                <div class="item-admin" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                    <img src="${imagenSrc}" alt="${producto.nombre || 'Producto sin nombre'}" width="50" height="50" style="object-fit: cover; border: 1px solid #eee;">
                    <span style="flex-grow: 1; margin-left: 15px;">${producto.nombre || 'Sin Nombre'}</span>
                    <button class="btn-editar" data-id="${producto.id}" style="background-color: #007bff; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px;">Editar</button>
                    <button class="btn-borrar" data-id="${producto.id}" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer;">Borrar</button>
                </div>
            `;
            listaContenedor.innerHTML += productoHTML;
        });

        // Asignamos los eventos a los botones recién creados
        asignarEventosBorrar();
        asignarEventosEditar(productos);

    } catch (error) {
        listaContenedor.textContent = 'Error al cargar los productos.';
        console.error("Error cargando productos:", error);
    }
}

// --- FUNCIÓN PARA ASIGNAR LOS CLICS DE "BORRAR" ---
function asignarEventosBorrar() {
    const botonesBorrar = document.querySelectorAll('.btn-borrar');
    botonesBorrar.forEach(boton => {
        boton.onclick = async () => {
            const id = boton.dataset.id;

            if (confirm('¿Estás seguro de que quieres borrar este producto?')) {
                try {
                    const respuesta = await fetch(`http://localhost:3000/api/productos/${id}`, {
                        method: 'DELETE',
                        headers: { // <-- Añadimos el token aquí también
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (respuesta.ok) {
                        alert('¡Producto borrado!');
                        cargarProductosAdmin(); // Recargamos la lista
                    } else {
                        const resultado = await respuesta.json();
                        alert(`Error al borrar: ${resultado.message || 'Error desconocido'}`);
                        if (respuesta.status === 401 || respuesta.status === 403) {
                            window.location.href = 'login.html'; // Redirigir si no está autorizado
                        }
                    }
                } catch (error) {
                    alert('Error de conexión al intentar borrar.');
                    console.error("Error borrando:", error);
                }
            }
        };
    });
}

// --- FUNCIÓN PARA ASIGNAR LOS CLICS DE "EDITAR" ---
function asignarEventosEditar(productos) {
    const botonesEditar = document.querySelectorAll('.btn-editar');
    botonesEditar.forEach(boton => {
        boton.onclick = async () => {
            const id = boton.dataset.id;

            // Buscamos el producto en la lista que ya cargamos
            const producto = productos.find(p => p.id === id);

            if (!producto) {
                alert('No se encontró el producto para editar.');
                return;
            }

            // 1. Rellenamos el formulario con los datos del producto
            document.getElementById('nombre').value = producto.nombre || '';
            document.getElementById('precio').value = producto.precio || '';
            document.getElementById('categoria').value = producto.categoria || '';
            document.getElementById('descripcion').value = producto.descripcion || '';

            // Limpiamos el campo de imagen (no se puede pre-rellenar)
            document.getElementById('imagen').value = '';

            // 2. Cambiamos el modo del formulario
            document.querySelector('.panel-admin h2').textContent = `Editando: ${producto.nombre}`;
            document.getElementById('btn-agregar-producto').textContent = 'Guardar Cambios';
            // Guardamos el ID en una variable global para el submit
            // (La variable editandoId se declara dentro de DOMContentLoaded)
            document.getElementById('form-nuevo-producto').dataset.editandoId = id; // O usar la variable global directamente


            // 3. Movemos la vista al formulario
            window.scrollTo(0, 0);
        };
    });
}

// --- Pequeña corrección para la variable global editandoId ---
// La necesitamos fuera de DOMContentLoaded para que asignarEventosEditar pueda accederla
let editandoId = null;