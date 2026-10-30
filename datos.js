/* Capa de datos de Relevo.
   Fase A ('demo'): todo vive en la memoria del navegador con datos de ejemplo claramente falsos.
   Nada se envía a ningún servidor y todo se borra al recargar la página.
   Fase B ('firebase'): esta misma interfaz se implementará con Firestore e inicio de sesión con Google. */
(function (raiz) {
  const L = raiz.RelevoLogica;

  function crearDatosDemo(cfg, opciones) {
    const espera = (opciones && opciones.espera != null) ? opciones.espera : 350;
    const ahora = Date.now();
    const hace = (dias, horas) => new Date(ahora - (dias * 24 + (horas || 0)) * 3600e3).toISOString();
    const fotosDe = (cat, dias) => L.angulosDe(cat, cfg).map(a => ({ angulo: a, src: null, fecha: hace(dias) }));

    const usuarios = [
      { id: 'u-comprador', nombre: 'Camila Demo', correo: 'camila.demo@ejemplo.com', universidad: 'UPC', rol: 'estudiante', aceptoTerminos: false },
      { id: 'u-vendedor', nombre: 'Diego Demo', correo: 'vendedor.demo@upc.edu.pe', universidad: 'UPC', rol: 'estudiante', aceptoTerminos: true },
      { id: 'u-vendedora', nombre: 'Lucía Demo', correo: 'lucia.demo@ejemplo.com', universidad: 'PUCP', rol: 'estudiante', aceptoTerminos: true, aprobadoPorEquipo: false },
      { id: 'u-equipo', nombre: 'Equipo Relevo (demo)', correo: 'equipo.demo@ejemplo.com', universidad: '', rol: 'equipo', aceptoTerminos: true }
    ];

    const pub = (id, titulo, categoria, estado, curso, universidad, precio, vendedorId, extra) => ({
      id, titulo, categoria, estado, curso, universidad, precio, vendedorId,
      descripcion: (extra && extra.descripcion) || 'Material de ejemplo para la demostración. Completo y revisado, con los detalles visibles en las fotos.',
      fotos: fotosDe(categoria, (extra && extra.dias) ?? 3), codigo: 'DEMO',
      revision: 'aprobada', fotoVerificada: true, retirada: false, creado: hace((extra && extra.dias) ?? 3), ...(extra || {})
    });

    const publicaciones = [
      pub('m1', 'Cálculo de una variable, 8.a edición', 'libro', 'Buen estado', 'Cálculo 1', 'UPC', 35, 'u-vendedor', { descripcion: 'Libro completo, con subrayado leve en los capítulos 2 y 3. Sin páginas sueltas ni hojas rotas.' }),
      pub('m2', 'Calculadora científica fx-991', 'calculadora', 'Como nuevo', 'Cálculo 2', 'UPC', 52, 'u-vendedor', { descripcion: 'Funciona perfecto. Incluye tapa protectora. Pantalla sin rayones.' }),
      pub('m3', 'Bata de laboratorio talla M', 'bata', 'Buen estado', 'Química General', 'PUCP', 25, 'u-vendedora', { fotoVerificada: false, descripcion: 'Bata blanca de algodón, lavada. Tiene una pequeña mancha en el puño izquierdo.' }),
      pub('m4', 'Física para ciencias e ingeniería, volumen 1', 'libro', 'Uso visible', 'Física 1', 'Universidad de Lima', 18, 'u-vendedora', { fotoVerificada: false, dias: 6, descripcion: 'Lomo gastado y esquinas dobladas. Todas las páginas están completas.' }),
      pub('m5', 'Escalímetro triangular y juego de escuadras', 'instrumento', 'Buen estado', 'Dibujo Técnico', 'UPC', 12, 'u-vendedor', { descripcion: 'Escalímetro de 30 cm y escuadras de 45 y 60 grados. Marcas legibles.' }),
      pub('m6', 'Calculadora graficadora', 'calculadora', 'Buen estado', 'Estadística', 'Universidad del Pacífico', 95, 'u-vendedora', { descripcion: 'Funciona bien. La tapa posterior tiene rayones. Usa pilas AAA, no incluidas.' }),
      pub('m7', 'Contabilidad general, libro del curso', 'libro', 'Como nuevo', 'Contabilidad General', 'UPC', 70, 'u-vendedor', { dias: 9 }),
      pub('m8', 'Química, 12.a edición', 'libro', 'Buen estado', 'Química General', 'PUCP', 45, 'u-vendedora', { dias: 2 }),
      pub('m9', 'Bata de laboratorio talla S', 'bata', 'Como nuevo', 'Biología Celular', 'UNMSM', 30, 'u-vendedora', { fotoVerificada: false, dias: 4 }),
      pub('m10', 'Kit de instrumentos de dibujo', 'instrumento', 'Uso visible', 'Geometría Descriptiva', 'UNI', 22, 'u-vendedor', { dias: 5 }),
      pub('m11', 'Estadística para administración', 'libro', 'Buen estado', 'Estadística', 'UPC', 28, 'u-vendedor', { dias: 1 }),
      pub('m12', 'Calculadora financiera', 'calculadora', 'Buen estado', 'Matemática Financiera', 'Universidad de Lima', 60, 'u-vendedora', { dias: 1 }),
      /* En revisión: las ve el equipo, no el público. */
      pub('m13', 'Kit de disección', 'instrumento', 'Como nuevo', 'Anatomía', 'UPC', 40, 'u-vendedora', { revision: 'en_revision', fotoVerificada: false, dias: 0, codigo: L.codigoDelDia() }),
      pub('m14', 'Álgebra lineal, 5.a edición', 'libro', 'Buen estado', 'Álgebra Lineal', 'UPC', 38, 'u-vendedor', { revision: 'en_revision', fotoVerificada: false, dias: 0, codigo: L.codigoDelDia() })
    ];

    /* Pedidos en distintos estados para mostrar el flujo completo. */
    const paso = (estado, dias, horas, por, nota) => ({ estado, fecha: hace(dias, horas), por, nota: nota || '' });
    const pedidos = [
      { id: 'P-DEMO1', pubId: 'm3', compradorId: 'u-comprador', vendedorId: 'u-vendedora', precio: 25, estado: 'pago_informado', operacion: '00112233', creado: hace(0, 3), entrega: { punto: '', horario: '' },
        historial: [paso('pago_pendiente', 0, 3, 'comprador'), paso('pago_informado', 0, 3, 'comprador')] },
      { id: 'P-DEMO2', pubId: 'm4', compradorId: 'u-comprador', vendedorId: 'u-vendedora', precio: 18, estado: 'en_coordinacion', operacion: '00445566', creado: hace(2), entrega: { punto: 'Patio de comidas del centro comercial más cercano al campus', horario: '' },
        historial: [paso('pago_pendiente', 2), paso('pago_informado', 2, 0, 'comprador'), paso('pago_confirmado', 1, 20, 'equipo'), paso('en_coordinacion', 1, 19, 'equipo')] },
      { id: 'P-DEMO3', pubId: 'm6', compradorId: 'u-comprador', vendedorId: 'u-vendedora', precio: 95, estado: 'entregado', operacion: '00778899', creado: hace(5), entrega: { punto: 'Cafetería frente a la puerta principal', horario: '' },
        historial: [paso('pago_pendiente', 5), paso('pago_informado', 5, 0, 'comprador'), paso('pago_confirmado', 4, 22, 'equipo'), paso('en_coordinacion', 4, 21, 'equipo'), paso('entregado', 3, 0, 'comprador')] },
      { id: 'P-DEMO4', pubId: 'm5', compradorId: 'u-comprador', vendedorId: 'u-vendedor', precio: 12, estado: 'en_reclamo', operacion: '00990011', creado: hace(4), entrega: { punto: 'Exterior de la garita principal, en horario de clases', horario: '' },
        reclamo: { motivo: 'distinto', detalle: 'Faltaba la escuadra de 60 grados que aparecía en la foto.', fecha: hace(1), por: 'comprador' },
        historial: [paso('pago_pendiente', 4), paso('pago_informado', 4, 0, 'comprador'), paso('pago_confirmado', 3, 22, 'equipo'), paso('en_coordinacion', 3, 21, 'equipo'), paso('en_reclamo', 1, 0, 'comprador', 'distinto')] },
      { id: 'P-DEMO5', pubId: 'm7', compradorId: 'u-comprador', vendedorId: 'u-vendedor', precio: 70, estado: 'transferido', operacion: '00223344', creado: hace(9), entrega: { punto: 'Cafetería frente a la puerta principal', horario: '' },
        historial: [paso('pago_pendiente', 9), paso('pago_informado', 9, 0, 'comprador'), paso('pago_confirmado', 8, 22, 'equipo'), paso('en_coordinacion', 8, 21, 'equipo'), paso('entregado', 7, 0, 'comprador'), paso('transferido', 6, 0, 'equipo')] },
      { id: 'P-DEMO6', pubId: 'm9', compradorId: 'u-comprador', vendedorId: 'u-vendedora', precio: 30, estado: 'cancelado', operacion: '', creado: hace(4), entrega: { punto: '', horario: '' },
        historial: [paso('pago_pendiente', 4), paso('cancelado', 4, -1, 'comprador', 'Cancelado por el comprador')] }
    ];

    let estado = { listo: false, sesionId: null, usuarios, publicaciones, pedidos };
    const oyentes = new Set();
    const emitir = () => oyentes.forEach(f => f(estado));
    const poner = cambios => { estado = { ...estado, ...cambios }; emitir(); };
    const tarda = () => new Promise(r => setTimeout(r, espera));
    setTimeout(() => poner({ listo: true }), espera);

    const sesion = () => estado.usuarios.find(u => u.id === estado.sesionId) || null;
    const exigirSesion = () => { const u = sesion(); if (!u) throw new Error('Inicia sesión para continuar.'); return u; };
    const exigirEquipo = () => { const u = exigirSesion(); if (!L.esEquipo(u, cfg)) throw new Error('Solo el equipo de Relevo puede hacer esto.'); return u; };
    const ponerPub = (id, f) => poner({ publicaciones: estado.publicaciones.map(p => p.id === id ? { ...p, ...f(p) } : p) });
    const ponerUsuario = (id, f) => poner({ usuarios: estado.usuarios.map(u => u.id === id ? { ...u, ...f(u) } : u) });
    const pedidoDe = id => { const p = estado.pedidos.find(x => x.id === id); if (!p) throw new Error('No encontramos ese pedido.'); return p; };
    const reemplazar = nuevo => poner({ pedidos: estado.pedidos.map(p => p.id === nuevo.id ? nuevo : p) });

    function moverPedido(id, nuevo, extra) {
      const u = exigirSesion(); const p = pedidoDe(id);
      const rol = L.rolEnPedido(u, p, cfg);
      if (!rol) throw new Error('Este pedido no es tuyo.');
      reemplazar(L.cambiarEstado(p, nuevo, rol, extra));
    }
    /* Ejecuta una acción con la espera simulada de una red real. Los errores salen como promesa rechazada. */
    const accion = fn => async (...args) => { await tarda(); return fn(...args); };

    return {
      modo: 'demo',
      leer: () => estado,
      escuchar: f => { oyentes.add(f); return () => oyentes.delete(f); },
      sesion,
      iniciarSesion: accion(id => { if (!estado.usuarios.some(u => u.id === id)) throw new Error('Usuario de prueba desconocido.'); poner({ sesionId: id }); }),
      cerrarSesion: () => poner({ sesionId: null }),
      aceptarTerminos: () => { const u = exigirSesion(); ponerUsuario(u.id, () => ({ aceptoTerminos: true })); },
      disponible: pubId => !estado.pedidos.some(p => p.pubId === pubId && p.estado !== 'cancelado'),

      publicar: accion(form => {
        const u = exigirSesion();
        const errores = L.validarPublicacion({ ...form, aceptoTerminos: form.aceptoTerminos || u.aceptoTerminos }, cfg);
        if (Object.keys(errores).length) { const e = new Error('Revisa los campos marcados.'); e.campos = errores; throw e; }
        if (!u.aceptoTerminos) ponerUsuario(u.id, () => ({ aceptoTerminos: true }));
        const nueva = {
          id: 'm' + Math.random().toString(36).slice(2, 7), titulo: form.titulo.trim(), categoria: form.categoria, estado: form.estado,
          curso: form.curso.trim(), universidad: form.universidad, precio: L.leerPrecio(form.precio), vendedorId: u.id,
          descripcion: form.descripcion.trim(), fotos: form.fotos, codigo: form.codigo, revision: 'en_revision', fotoVerificada: false,
          retirada: false, creado: new Date().toISOString()
        };
        poner({ publicaciones: [nueva, ...estado.publicaciones] });
        return nueva;
      }),
      retirarPublicacion: accion(id => { const u = exigirSesion(); const p = estado.publicaciones.find(x => x.id === id); if (!p || p.vendedorId !== u.id) throw new Error('Esta publicación no es tuya.'); ponerPub(id, () => ({ retirada: true })); }),

      comprar: accion((pubId, operacion) => {
        const u = exigirSesion(); const p = estado.publicaciones.find(x => x.id === pubId);
        if (!p || p.revision !== 'aprobada' || p.retirada) throw new Error('Este material ya no está disponible.');
        if (p.vendedorId === u.id) throw new Error('No puedes comprar tu propia publicación.');
        if (estado.pedidos.some(x => x.pubId === pubId && x.estado !== 'cancelado')) throw new Error('Otra persona ya está comprando este material.');
        if (!u.aceptoTerminos) ponerUsuario(u.id, () => ({ aceptoTerminos: true }));
        const nuevo = L.nuevoPedido(p, u.id, operacion);
        poner({ pedidos: [nuevo, ...estado.pedidos] });
        return nuevo;
      }),
      moverPedido: accion(moverPedido),
      proponerEntrega: accion((id, punto, horario) => {
        const u = exigirSesion(); const p = pedidoDe(id);
        if (!L.rolEnPedido(u, p, cfg)) throw new Error('Este pedido no es tuyo.');
        if (!punto) throw new Error('Elige un punto de entrega.');
        reemplazar({ ...p, entrega: { punto, horario: horario || '', propuestoPor: u.id, fecha: new Date().toISOString() } });
      }),

      /* Acciones del equipo: se rechazan si la sesión no es del equipo. */
      aprobarPublicacion: accion(id => { exigirEquipo(); ponerPub(id, () => ({ revision: 'aprobada', fotoVerificada: true, motivoRechazo: '' })); }),
      rechazarPublicacion: accion((id, motivo) => { exigirEquipo(); if (!(motivo || '').trim()) throw new Error('Escribe el motivo del rechazo.'); ponerPub(id, () => ({ revision: 'rechazada', motivoRechazo: motivo.trim() })); }),
      aprobarVendedor: accion(id => { exigirEquipo(); ponerUsuario(id, () => ({ aprobadoPorEquipo: true })); })
    };
  }

  function crearDatos(cfg) {
    if (cfg.MODO_DATOS === 'demo') return crearDatosDemo(cfg);
    throw new Error('El modo "' + cfg.MODO_DATOS + '" se conecta en la Fase B. Usa MODO_DATOS: \'demo\' en config.js.');
  }

  raiz.RelevoDatos = { crearDatos, crearDatosDemo };
})(typeof window !== 'undefined' ? window : globalThis);
