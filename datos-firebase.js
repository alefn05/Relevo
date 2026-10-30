/* Capa de datos del piloto (Fase B): Firestore e inicio de sesión con Google.
   Ofrece la misma interfaz que crearDatosDemo en datos.js, así las pantallas no cambian.
   La seguridad real está en firestore.rules: este archivo solo es la interfaz. */
(function (raiz) {
  const L = raiz.RelevoLogica;

  /* Reduce una imagen (URL local de la cámara) a JPEG de lado máximo `lado`. */
  function reducir(src, lado, calidad) {
    return new Promise((ok, mal) => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, lado / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', calidad));
      };
      im.onerror = () => mal(new Error('No se pudo leer una de las fotos. Vuelve a tomarla.'));
      im.src = src;
    });
  }

  const traducir = e => {
    const m = {
      'permission-denied': 'No tienes permiso para hacer esto.',
      'unavailable': 'No hay conexión. Revisa tu internet e intenta de nuevo.',
      'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes e intenta de nuevo.',
      'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (Authentication, Configuración, Dominios autorizados).',
      'auth/operation-not-allowed': 'El acceso con Google no está activado en Firebase.',
      'auth/network-request-failed': 'No hay conexión a internet. Intenta de nuevo.',
      'auth/internal-error': 'Error de Google. Si abriste el enlace dentro de una app, ábrelo en Chrome o Safari.'
    };
    return new Error(m[e && e.code] || (e && e.message) || 'Algo salió mal. Intenta de nuevo.');
  };

  function crearDatosFirebase(cfg) {
    if (!raiz.firebase) throw new Error('No cargó Firebase. Revisa tu conexión y recarga.');
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg.FIREBASE);
    const db = app.firestore(); const auth = app.auth(); auth.languageCode = 'es';
    const servidor = () => firebase.firestore.FieldValue.serverTimestamp();
    const enApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Snapchat|LinkedInApp/i.test(navigator.userAgent);

    const f = { aprobadas: null, mias: [], revision: [], compras: [], ventas: [], todos: [], usuarios: [], reclamos: [], yo: null };
    let estado = { listo: false, sesionId: null, usuarios: [], publicaciones: [], pedidos: [] };
    let authListo = false;
    const oyentes = new Set();
    const porId = (...listas) => { const m = new Map(); listas.flat().forEach(x => m.set(x.id, { ...(m.get(x.id) || {}), ...x })); return [...m.values()]; };
    const recalcular = () => {
      /* Un pedido puede tener varios reclamos en el tiempo: se muestra el más reciente. */
      const reclamo = {};
      f.reclamos.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')).forEach(r => { reclamo[r.pedidoId] = r; });
      estado = {
        ...estado,
        listo: authListo && f.aprobadas !== null,
        publicaciones: porId(f.aprobadas || [], f.mias, f.revision).sort((a, b) => (b.creado || '').localeCompare(a.creado || '')),
        pedidos: porId(f.compras, f.ventas, f.todos).map(p => reclamo[p.id] ? { ...p, reclamo: reclamo[p.id] } : p).sort((a, b) => (b.creado || '').localeCompare(a.creado || '')),
        usuarios: porId(f.usuarios, f.yo ? [f.yo] : [])
      };
      oyentes.forEach(fn => fn(estado));
    };
    const docs = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
    const mirar = (q, clave) => q.onSnapshot(s => { f[clave] = docs(s); recalcular(); }, e => { console.warn(clave, e.code); f[clave] = f[clave] || []; recalcular(); });

    /* Publicaciones aprobadas: visibles para todos, con o sin sesión. */
    mirar(db.collection('publicaciones').where('revision', '==', 'aprobada'), 'aprobadas');

    /* Crea el perfil si todavía no existe (por ejemplo, si al ingresar las reglas aún no lo permitían). */
    async function asegurarPerfil(u) {
      const ref = db.collection('usuarios').doc(u.uid);
      const d = await ref.get();
      if (!d.exists) await ref.set({ nombre: u.displayName || 'Estudiante', correo: (u.email || '').toLowerCase(), universidad: L.universidadPorCorreo(u.email, cfg), aceptoTerminos: false, aprobadoPorEquipo: false, creado: new Date().toISOString(), creadoServidor: servidor() });
    }

    let quitar = [];
    auth.onAuthStateChanged(async u => {
      quitar.forEach(q => q()); quitar = [];
      Object.assign(f, { mias: [], revision: [], compras: [], ventas: [], todos: [], usuarios: [], reclamos: [], yo: null });
      if (!u) { estado = { ...estado, sesionId: null }; authListo = true; recalcular(); return; }
      const ref = db.collection('usuarios').doc(u.uid);
      try { await asegurarPerfil(u); } catch (e) { console.warn('usuario', e.code); }
      /* Perfil mínimo a partir de Google: la sesión funciona aunque el perfil de Firestore no se pueda leer. */
      const basico = { id: u.uid, nombre: u.displayName || 'Estudiante', correo: (u.email || '').toLowerCase(), universidad: L.universidadPorCorreo(u.email, cfg), aceptoTerminos: false, aprobadoPorEquipo: false, foto: u.photoURL || '' };
      const rol = L.esEquipo({ correo: u.email }, cfg) ? 'equipo' : 'estudiante';
      f.yo = { ...basico, rol };
      quitar.push(ref.onSnapshot(d => {
        f.yo = { ...basico, ...(d.exists ? d.data() : {}), id: u.uid, correo: basico.correo, foto: basico.foto, rol };
        recalcular();
      }, e => { console.warn('perfil', e.code); recalcular(); }));
      quitar.push(mirar(db.collection('publicaciones').where('vendedorId', '==', u.uid), 'mias'));
      quitar.push(mirar(db.collection('pedidos').where('compradorId', '==', u.uid), 'compras'));
      quitar.push(mirar(db.collection('pedidos').where('vendedorId', '==', u.uid), 'ventas'));
      if (L.esEquipo({ correo: u.email }, cfg)) {
        quitar.push(mirar(db.collection('publicaciones').where('revision', '==', 'en_revision'), 'revision'));
        quitar.push(mirar(db.collection('pedidos'), 'todos'));
        quitar.push(mirar(db.collection('usuarios'), 'usuarios'));
        quitar.push(mirar(db.collection('reclamos'), 'reclamos'));
      }
      estado = { ...estado, sesionId: u.uid }; authListo = true; recalcular();
    });

    const sesion = () => (f.yo && auth.currentUser) ? f.yo : null;
    const exigirSesion = () => { const u = sesion(); if (!u) throw new Error('Inicia sesión para continuar.'); return u; };
    const exigirEquipo = () => { const u = exigirSesion(); if (!L.esEquipo(u, cfg)) throw new Error('Solo el equipo de Relevo puede hacer esto.'); return u; };
    const pedidoDe = id => { const p = estado.pedidos.find(x => x.id === id); if (!p) throw new Error('No encontramos ese pedido.'); return p; };
    const accion = fn => async (...a) => { try { return await fn(...a); } catch (e) { throw e.campos ? e : traducir(e); } };
    const primerNombre = n => (n || '').split(' ')[0];

    return {
      modo: 'firebase',
      leer: () => estado,
      escuchar: fn => { oyentes.add(fn); return () => oyentes.delete(fn); },
      sesion,
      iniciarSesion: accion(async () => {
        if (enApp) throw new Error('Google no permite ingresar desde Instagram, Facebook o TikTok. Abre Relevo en Chrome o Safari.');
        const pv = new firebase.auth.GoogleAuthProvider(); pv.setCustomParameters({ prompt: 'select_account' });
        try { await auth.signInWithPopup(pv); } catch (e) { if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return; throw e; }
      }),
      cerrarSesion: () => auth.signOut(),
      aceptarTerminos: () => { const u = exigirSesion(); return db.collection('usuarios').doc(u.id).update({ aceptoTerminos: true }); },
      disponible: pubId => { const p = estado.publicaciones.find(x => x.id === pubId); return !!p && !p.pedidoActivo; },
      cargarFotos: async pubId => {
        const s = await db.collection('publicaciones').doc(pubId).collection('fotos').orderBy('n').get();
        return s.docs.map(d => d.data());
      },

      publicar: accion(async form => {
        const u = exigirSesion();
        const datos = { ...form, aceptoTerminos: form.aceptoTerminos || u.aceptoTerminos };
        const errores = L.validarPublicacion(datos, cfg);
        if (Object.keys(errores).length) { const e = new Error('Revisa los campos marcados.'); e.campos = errores; throw e; }
        await asegurarPerfil(auth.currentUser);
        const fotos = await Promise.all(form.fotos.map(async x => ({ angulo: x.angulo, fecha: x.fecha, src: await reducir(x.src, 1000, 0.62) })));
        const portada = await reducir(form.fotos[0].src, 480, 0.6);
        const ref = db.collection('publicaciones').doc();
        const lote = db.batch();
        if (!u.aceptoTerminos) lote.update(db.collection('usuarios').doc(u.id), { aceptoTerminos: true });
        lote.set(ref, {
          titulo: form.titulo.trim(), categoria: form.categoria, estado: form.estado, curso: form.curso.trim(), universidad: form.universidad,
          precio: L.leerPrecio(form.precio), descripcion: form.descripcion.trim(), codigo: form.codigo,
          vendedorId: u.id, vendedorNombre: primerNombre(u.nombre), vendedorVerificado: L.vendedorVerificado(u, cfg),
          revision: 'en_revision', fotoVerificada: false, retirada: false, pedidoActivo: null, motivoRechazo: '',
          portada, fotos: fotos.map(x => ({ angulo: x.angulo, fecha: x.fecha })),
          creado: new Date().toISOString(), creadoServidor: servidor()
        });
        fotos.forEach((x, n) => lote.set(ref.collection('fotos').doc(String(n)), { n, ...x, vendedorId: u.id }));
        await lote.commit();
        return { id: ref.id };
      }),
      retirarPublicacion: accion(async id => { exigirSesion(); await db.collection('publicaciones').doc(id).update({ retirada: true }); }),

      comprar: accion(async (pubId, operacion, monto) => {
        const u = exigirSesion();
        const p = estado.publicaciones.find(x => x.id === pubId);
        if (!p || p.revision !== 'aprobada' || p.retirada) throw new Error('Este material ya no está disponible.');
        if (p.vendedorId === u.id) throw new Error('No puedes comprar tu propia publicación.');
        if (p.pedidoActivo) throw new Error('Otra persona ya está comprando este material.');
        await asegurarPerfil(auth.currentUser);
        const ref = db.collection('pedidos').doc();
        const base = L.nuevoPedido({ id: pubId, precio: p.precio, vendedorId: p.vendedorId }, u.id, operacion, null, monto);
        const pedido = {
          pubId, titulo: p.titulo, universidad: p.universidad, compradorId: u.id, vendedorId: p.vendedorId,
          compradorNombre: u.nombre, vendedorNombre: p.vendedorNombre || '', precio: p.precio,
          estado: base.estado, operacion: base.operacion, montoInformado: base.montoInformado, historial: base.historial,
          entrega: { punto: '', horario: '' }, reclamoAbierto: false, creado: base.creado, creadoServidor: servidor()
        };
        const lote = db.batch();
        if (!u.aceptoTerminos) lote.update(db.collection('usuarios').doc(u.id), { aceptoTerminos: true });
        lote.set(ref, pedido);
        lote.update(db.collection('publicaciones').doc(pubId), { pedidoActivo: ref.id });
        await lote.commit();
        return { id: ref.id, ...pedido };
      }),

      moverPedido: accion(async (id, nuevo, extra) => {
        const u = exigirSesion(); const p = pedidoDe(id);
        const rol = L.rolEnPedido(u, p, cfg);
        if (!rol) throw new Error('Este pedido no es tuyo.');
        const n = L.cambiarEstado(p, nuevo, rol, extra);
        const cambios = { estado: n.estado, historial: n.historial };
        if (n.operacion !== p.operacion) cambios.operacion = n.operacion;
        if (n.montoInformado !== p.montoInformado && n.montoInformado != null) cambios.montoInformado = n.montoInformado;
        const lote = db.batch();
        const ref = db.collection('pedidos').doc(id);
        if (nuevo === 'en_reclamo') {
          cambios.reclamoAbierto = true;
          lote.set(db.collection('reclamos').doc(), { pedidoId: id, compradorId: p.compradorId, vendedorId: p.vendedorId, ...n.reclamo, creadoServidor: servidor() });
        }
        if (p.estado === 'en_reclamo' && nuevo !== 'en_reclamo') cambios.reclamoAbierto = false;
        lote.update(ref, cambios);
        if (nuevo === 'cancelado') lote.update(db.collection('publicaciones').doc(p.pubId), { pedidoActivo: null });
        await lote.commit();
      }),
      proponerEntrega: accion(async (id, punto, horario) => {
        const u = exigirSesion(); const p = pedidoDe(id);
        if (!L.rolEnPedido(u, p, cfg)) throw new Error('Este pedido no es tuyo.');
        if (!punto) throw new Error('Elige un punto de entrega.');
        await db.collection('pedidos').doc(id).update({ entrega: { punto, horario: horario || '', propuestoPor: u.id, fecha: new Date().toISOString() } });
      }),

      aprobarPublicacion: accion(async id => { exigirEquipo(); await db.collection('publicaciones').doc(id).update({ revision: 'aprobada', fotoVerificada: true, motivoRechazo: '' }); }),
      rechazarPublicacion: accion(async (id, motivo) => {
        exigirEquipo(); if (!(motivo || '').trim()) throw new Error('Escribe el motivo del rechazo.');
        await db.collection('publicaciones').doc(id).update({ revision: 'rechazada', motivoRechazo: motivo.trim() });
      }),
      aprobarVendedor: accion(async uid => {
        exigirEquipo();
        const lote = db.batch();
        lote.update(db.collection('usuarios').doc(uid), { aprobadoPorEquipo: true });
        estado.publicaciones.filter(p => p.vendedorId === uid).forEach(p => lote.update(db.collection('publicaciones').doc(p.id), { vendedorVerificado: true }));
        await lote.commit();
      })
    };
  }

  raiz.RelevoDatosFirebase = { crearDatosFirebase };
})(typeof window !== 'undefined' ? window : globalThis);
