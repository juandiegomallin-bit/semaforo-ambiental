/* ================================================================
   ARCHIVO: script.js
   PROYECTO: Semáforo Ambiental de la Huerta
   INSTITUCIÓN: I.E. República de Uruguay – Medellín, Antioquia
   DESCRIPCIÓN: Lógica principal de la página de Login y Registro
                (html/index.html). Maneja:
                  - Validación de formularios
                  - Autenticación de usuarios
                  - Registro y almacenamiento en localStorage
                  - Medidor de fortaleza de contraseña
                  - Alternancia entre pestañas Login/Registro
                  - Panel visual de usuarios registrados
   DEPENDENCIAS: Ninguna (JavaScript puro, sin librerías externas)
   USO: Enlazado desde html/index.html al final del <body>
   ÚLTIMA ACTUALIZACIÓN: 2026
================================================================ */


/* ════════════════════════════════════════════════════════════
   PARTE 1 — REFERENCIAS DEL DOM
   Se obtienen los elementos HTML que se manipularán
════════════════════════════════════════════════════════════ */

// -- Elementos del formulario de LOGIN --
const form        = document.getElementById('loginForm');     // Formulario principal de login
const emailInput  = document.getElementById('email');         // Campo de correo del login
const passInput   = document.getElementById('password');      // Campo de contraseña del login
const loginAlert  = document.getElementById('loginAlert');    // Alerta general del login
const emailError  = document.getElementById('emailError');    // Error específico del correo
const passError   = document.getElementById('passError');     // Error específico de la contraseña
const toggleBtn   = document.getElementById('togglePass');    // Botón ojo para contraseña login

// -- Elementos del formulario de REGISTRO --
const registerForm      = document.getElementById('registerForm');      // Formulario de registro
const regNombre         = document.getElementById('regNombre');         // Campo nombre
const regEmail          = document.getElementById('regEmail');          // Campo correo
const regPassword       = document.getElementById('regPassword');       // Campo nueva contraseña
const regPasswordConf   = document.getElementById('regPasswordConf');   // Campo confirmación
const registerAlert     = document.getElementById('registerAlert');     // Alerta del registro
const nombreError       = document.getElementById('nombreError');       // Error del nombre
const regEmailError     = document.getElementById('regEmailError');     // Error del correo
const regPassError      = document.getElementById('regPassError');      // Error de contraseña
const regPassConfError  = document.getElementById('regPassConfError');  // Error de confirmación
const toggleRegBtn      = document.getElementById('toggleRegPass');     // Botón ojo contraseña
const toggleRegConfBtn  = document.getElementById('toggleRegPassConf'); // Botón ojo confirmación


/* ════════════════════════════════════════════════════════════
   PARTE 2 — USUARIOS PREDETERMINADOS
   Cuentas de prueba siempre disponibles (no en localStorage)
════════════════════════════════════════════════════════════ */
const USUARIOS_DEFAULT = [
    { nombre: 'Admin',      email: 'elprofe@gmail.com',      password: 'Admin123' },
    { nombre: 'Estudiante', email: 'estudiante@correo.com',  password: 'Pass456'  }
];


/* ════════════════════════════════════════════════════════════
   PARTE 3 — FUNCIONES DE LOCALSTORAGE
   Gestión de usuarios guardados en el navegador
════════════════════════════════════════════════════════════ */

/**
 * Obtiene TODOS los usuarios disponibles:
 * los predeterminados + los registrados en localStorage.
 * @returns {Array} Array de objetos {nombre, email, password}
 */
function obtenerUsuarios() {
    const guardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
    return [...USUARIOS_DEFAULT, ...guardados]; // Combina ambas listas
}

/**
 * Guarda un nuevo usuario en localStorage.
 * No sobreescribe los existentes, solo agrega al array.
 * @param {Object} nuevoUsuario - {nombre, email, password}
 */
function guardarUsuario(nuevoUsuario) {
    const guardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
    guardados.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(guardados));
}

/**
 * Verifica si un correo ya está registrado.
 * Busca en usuarios predeterminados y en localStorage.
 * @param {string} email - Correo a verificar
 * @returns {boolean} true si ya existe, false si no
 */
function emailExiste(email) {
    return obtenerUsuarios().some(u => u.email === email.toLowerCase());
}


/* ════════════════════════════════════════════════════════════
   PARTE 4 — FUNCIONES DE VALIDACIÓN REUTILIZABLES
════════════════════════════════════════════════════════════ */

/**
 * Valida el formato de un correo electrónico.
 * Usa una expresión regular básica.
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida la fortaleza de una contraseña.
 * Reglas: mínimo 8 caracteres, 1 mayúscula, 1 número.
 * @param {string} pass - Contraseña a evaluar
 * @returns {string[]} Array de mensajes de error (vacío si es válida)
 */
function validarPassword(pass) {
    const errores = [];
    if (pass.length < 8)       errores.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(pass))   errores.push('Al menos una mayúscula');
    if (!/[0-9]/.test(pass))   errores.push('Al menos un número');
    return errores;
}


/* ════════════════════════════════════════════════════════════
   PARTE 5 — FUNCIONALIDAD MOSTRAR / OCULTAR CONTRASEÑA
════════════════════════════════════════════════════════════ */

/**
 * Asocia un botón de tipo ojo con un campo de contraseña.
 * Al hacer clic alterna entre type="password" y type="text".
 * @param {HTMLButtonElement} btn   - Botón de ojo
 * @param {HTMLInputElement}  input - Campo de contraseña
 */
function crearToggle(btn, input) {
    btn.addEventListener('click', () => {
        if (input.type === 'password') {
            input.type = 'text';   // Mostrar contraseña
            btn.textContent = '🙈';
        } else {
            input.type = 'password'; // Ocultar contraseña
            btn.textContent = '👁️';
        }
    });
}

// Aplica el toggle a los tres campos de contraseña
crearToggle(toggleBtn,       passInput);      // Login
crearToggle(toggleRegBtn,    regPassword);    // Registro - contraseña
crearToggle(toggleRegConfBtn, regPasswordConf); // Registro - confirmación


/* ════════════════════════════════════════════════════════════
   PARTE 6 — MEDIDOR DE FORTALEZA DE CONTRASEÑA
   Actualiza la barra y el texto en tiempo real
════════════════════════════════════════════════════════════ */
const barraFuerza = document.getElementById('barraFuerza');
const textoFuerza = document.getElementById('textoFuerza');

// Se ejecuta cada vez que el usuario escribe en el campo de contraseña
regPassword.addEventListener('input', () => {
    const errores = validarPassword(regPassword.value);
    const puntaje = 3 - errores.length; // 0=vacío, 1=débil, 2=regular, 3=fuerte

    // Configuración visual según el puntaje
    const config = [
        { pct: '0%',   color: '#e0e0e0', label: '' },          // Sin contraseña
        { pct: '33%',  color: '#e53935', label: '😬 Débil' },  // Puntaje 1
        { pct: '66%',  color: '#ffb300', label: '😐 Regular' },// Puntaje 2
        { pct: '100%', color: '#43a047', label: '💪 Fuerte' }, // Puntaje 3
    ][puntaje];

    // Actualiza la barra y el texto
    barraFuerza.style.width      = config.pct;
    barraFuerza.style.background = config.color;
    textoFuerza.textContent      = config.label;
});


/* ════════════════════════════════════════════════════════════
   PARTE 7 — ALTERNAR ENTRE PESTAÑA LOGIN Y REGISTRO
════════════════════════════════════════════════════════════ */

/**
 * Muestra el panel indicado y oculta el otro.
 * También actualiza el estado activo de las pestañas.
 * @param {string} tab - 'login' o 'registro'
 */
function mostrarTab(tab) {
    const panelLogin    = document.getElementById('panelLogin');
    const panelRegistro = document.getElementById('panelRegistro');
    const tabLogin      = document.getElementById('tabLogin');
    const tabRegister   = document.getElementById('tabRegister');

    if (tab === 'login') {
        panelLogin.style.display    = 'block';
        panelRegistro.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        panelLogin.style.display    = 'none';
        panelRegistro.style.display = 'block';
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }

    limpiarAlertas(); // Limpia errores al cambiar de panel
}

/**
 * Limpia todos los mensajes de error y alertas visibles.
 * Se llama al cambiar de pestaña o antes de re-validar.
 */
function limpiarAlertas() {
    // Limpia mensajes de error campo por campo
    [emailError, passError, nombreError, regEmailError, regPassError, regPassConfError]
        .forEach(el => { el.textContent = ''; });

    // Resetea las alertas generales
    loginAlert.className    = 'alert';
    loginAlert.textContent  = '';
    registerAlert.className = 'alert';
    registerAlert.textContent = '';
}


/* ════════════════════════════════════════════════════════════
   PARTE 8 — LÓGICA DEL FORMULARIO DE LOGIN
   Valida credenciales y redirige si son correctas
════════════════════════════════════════════════════════════ */
form.addEventListener('submit', function(e) {
    e.preventDefault(); // Evita recargar la página

    // Limpia errores anteriores
    emailError.textContent   = '';
    passError.textContent    = '';
    loginAlert.className     = 'alert';
    loginAlert.textContent   = '';

    const email    = emailInput.value.trim().toLowerCase();
    const password = passInput.value;
    let hayError   = false;

    // -- Validar correo --
    if (!email) {
        emailError.textContent = '⚠️ El correo es obligatorio';
        hayError = true;
    } else if (!validarEmail(email)) {
        emailError.textContent = '⚠️ El formato del correo no es válido';
        hayError = true;
    }

    // -- Validar contraseña (solo que no esté vacía en login) --
    if (!password) {
        passError.textContent = '⚠️ La contraseña es obligatoria';
        hayError = true;
    }

    if (hayError) return; // Detiene si hay errores de formato

    // -- Buscar usuario en la lista combinada (default + localStorage) --
    const usuario = obtenerUsuarios().find(
        u => u.email === email && u.password === password
    );

    if (usuario) {
        // ✅ Credenciales correctas → Muestra bienvenida y redirige
        loginAlert.className    = 'alert success';
        loginAlert.textContent  = `✅ ¡Bienvenido, ${usuario.nombre}! Redirigiendo...`;

        // Redirige a la página principal después de 1.5 segundos
        setTimeout(() => {
            window.location.href = 'indexprincipal.html';
        }, 1500);
    } else {
        // ❌ Credenciales incorrectas
        loginAlert.className   = 'alert error';
        loginAlert.textContent = '❌ Correo o contraseña incorrectos';
    }
});


/* ════════════════════════════════════════════════════════════
   PARTE 9 — LÓGICA DEL FORMULARIO DE REGISTRO
   Valida todos los campos y guarda el nuevo usuario
════════════════════════════════════════════════════════════ */
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Limpia errores anteriores
    [nombreError, regEmailError, regPassError, regPassConfError]
        .forEach(el => el.textContent = '');
    registerAlert.className   = 'alert';
    registerAlert.textContent = '';

    // Obtiene valores del formulario
    const nombre    = regNombre.value.trim();
    const email     = regEmail.value.trim().toLowerCase();
    const password  = regPassword.value;
    const passwordC = regPasswordConf.value;

    let hayError = false;

    // -- Validar nombre --
    if (!nombre) {
        nombreError.textContent = '⚠️ El nombre es obligatorio';
        hayError = true;
    } else if (nombre.length < 2) {
        nombreError.textContent = '⚠️ El nombre es demasiado corto';
        hayError = true;
    }

    // -- Validar correo electrónico --
    if (!email) {
        regEmailError.textContent = '⚠️ El correo es obligatorio';
        hayError = true;
    } else if (!validarEmail(email)) {
        regEmailError.textContent = '⚠️ El formato del correo no es válido';
        hayError = true;
    } else if (emailExiste(email)) {
        // Verifica que el correo no esté ya registrado
        regEmailError.textContent = '⚠️ Este correo ya está registrado';
        hayError = true;
    }

    // -- Validar contraseña con las reglas de fortaleza --
    const erroresPass = validarPassword(password);
    if (!password) {
        regPassError.textContent = '⚠️ La contraseña es obligatoria';
        hayError = true;
    } else if (erroresPass.length > 0) {
        regPassError.textContent = '⚠️ ' + erroresPass.join(' · ');
        hayError = true;
    }

    // -- Validar que las contraseñas coincidan --
    if (!passwordC) {
        regPassConfError.textContent = '⚠️ Confirma tu contraseña';
        hayError = true;
    } else if (password !== passwordC) {
        regPassConfError.textContent = '⚠️ Las contraseñas no coinciden';
        hayError = true;
    }

    if (hayError) return; // Detiene si hay errores

    // ✅ Todo válido → Guardar nuevo usuario en localStorage
    guardarUsuario({ nombre, email, password });

    // Muestra mensaje de éxito
    registerAlert.className   = 'alert success';
    registerAlert.textContent = `✅ ¡Cuenta creada! Bienvenido, ${nombre}. Ahora puedes iniciar sesión.`;

    // Limpia el formulario de registro
    registerForm.reset();
    barraFuerza.style.width = '0%';
    textoFuerza.textContent = '';

    // Actualiza la lista de usuarios en el panel
    renderizarUsuarios();

    // Redirige al panel de login después de 2 segundos
    setTimeout(() => mostrarTab('login'), 2000);
});


/* ════════════════════════════════════════════════════════════
   PARTE 10 — PANEL DE USUARIOS REGISTRADOS
   Muestra visualmente los usuarios guardados en localStorage
   (Solo con fines educativos / de práctica)
════════════════════════════════════════════════════════════ */

/**
 * Genera dinámicamente la lista de usuarios registrados.
 * Cada ítem tiene nombre, correo y un botón para eliminar.
 */
function renderizarUsuarios() {
    const lista    = document.getElementById('listaUsuarios');
    const guardados = JSON.parse(localStorage.getItem('usuarios') || '[]');

    lista.innerHTML = ''; // Limpia la lista antes de re-renderizar

    if (guardados.length === 0) {
        // Muestra mensaje cuando no hay usuarios
        lista.innerHTML = '<li class="no-users">Sin usuarios registrados aún 🌱</li>';
        return;
    }

    // Crea un <li> por cada usuario guardado
    guardados.forEach((u, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="user-info">
                <strong>${u.nombre}</strong>
                <small>${u.email}</small>
            </span>
            <!-- Botón para eliminar este usuario específico -->
            <button class="btn-del" data-index="${i}" title="Eliminar">✕</button>
        `;
        lista.appendChild(li);
    });

    // Asigna el evento de eliminación a cada botón ✕
    lista.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx      = parseInt(btn.dataset.index); // Índice del usuario a eliminar
            const guardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
            guardados.splice(idx, 1); // Elimina el usuario del array
            localStorage.setItem('usuarios', JSON.stringify(guardados));
            renderizarUsuarios(); // Re-renderiza la lista actualizada
        });
    });
}

// -- Botón para limpiar TODOS los usuarios registrados --
document.getElementById('btnLimpiar').addEventListener('click', () => {
    if (confirm('¿Eliminar todos los usuarios registrados?')) {
        localStorage.removeItem('usuarios'); // Borra la clave del localStorage
        renderizarUsuarios();                // Re-renderiza la lista vacía
    }
});

// -- Inicializa el panel al cargar la página --
renderizarUsuarios();
