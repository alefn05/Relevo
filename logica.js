/* Reglas de negocio de Relevo, sin interfaz. Se usan en la app y en tests/pruebas.html.
   Los montos se calculan en céntimos para evitar errores de redondeo. */
(function (raiz) {
  const aCent = n => Math.round(n * 100);
  const deCent = c => c / 100;

  /* "S/ 40.00" */
  function soles(n) {
    const c = aCent(Number(n) || 0);
    const s = (Math.abs(c) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (c < 0 ? '-' : '') + 'S/ ' + s;
  }

  /* Convierte lo que escribe el vendedor ("35", "35.5", "35,50") en número. Devuelve NaN si no es un monto válido. */
  function leerPrecio(texto) {
    const t = String(texto == null ? '' : texto).trim().replace(/^s\/\s*/i, '').replace(',', '.');
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(t)) return NaN;
    return Number(t);
  }

  /* Cálculo de una venta para el vendedor. El comprador paga el precio publicado, sin recargo. */
  function calcularVenta(precio, cfg) {
    const comision = cfg.COMISION_VENDEDOR;
    const p = typeof precio === 'number' ? precio : leerPrecio(precio);
    const base = { precio: p, comision, recibe: null, porcentaje: null, aviso: null, error: null, valido: false };
    if (precio === '' || precio == null) return { ...base, error: 'Escribe el precio.' };
    if (!Number.isFinite(p)) return { ...base, error: 'Escribe un monto válido, por ejemplo 35 o 35.50.' };
    if (aCent(p) <= aCent(comision)) return { ...base, error: 'El precio debe ser mayor que ' + soles(comision) + ', la comisión fija de Relevo.' };
    const recibe = deCent(aCent(p) - aCent(comision));
    const porcentaje = Math.round((comision / p) * 1000) / 10;
    const aviso = p < cfg.UMBRAL_AVISO ? 'La comisión es el ' + porcentaje + ' % de este precio.' : null;
    return { ...base, valido: true, recibe, porcentaje, aviso };
  }

  /* ---------- Estados del pedido ---------- */
  const ESTADOS = {
    pago_pendiente: 'Pago pendiente',
    pago_informado: 'Pago informado',
    pago_confirmado: 'Pago confirmado (retenido)',
    en_coordinacion: 'En coordinación',
    entregado: 'Entregado y confirmado',
    transferido: 'Transferido al vendedor',
    en_reclamo: 'En reclamo',
    cancelado: 'Cancelado'
  };
  /* Camino normal, en orden, para la línea de tiempo. */
  const CAMINO = ['pago_pendiente', 'pago_informado', 'pago_confirmado', 'en_coordinacion', 'entregado', 'transferido'];

  /* Quién puede mover un pedido de un estado a otro. */
  const TRANSICIONES = {
    pago_pendiente: { pago_informado: ['comprador'], cancelado: ['comprador', 'equipo'] },
    pago_informado: { pago_confirmado: ['equipo'], pago_pendiente: ['equipo'], cancelado: ['equipo'] },
    pago_confirmado: { en_coordinacion: ['equipo'], en_reclamo: ['comprador', 'vendedor'], cancelado: ['equipo'] },
    en_coordinacion: { entregado: ['comprador', 'equipo'], en_reclamo: ['comprador', 'vendedor'], cancelado: ['equipo'] },
    entregado: { transferido: ['equipo'], en_reclamo: ['comprador'] },
    en_reclamo: { en_coordinacion: ['equipo'], entregado: ['equipo'], cancelado: ['equipo'] },
    transferido: {},
    cancelado: {}
  };

  function puedeCambiar(pedido, nuevo, rol) {
    const t = TRANSICIONES[pedido.estado] || {};
    return !!(t[nuevo] && t[nuevo].includes(rol));
  }

  /* Devuelve un pedido nuevo con el estado cambiado y la fecha registrada. No modifica el original. */
  function cambiarEstado(pedido, nuevo, rol, extra, ahora) {
    if (!ESTADOS[nuevo]) throw new Error('Estado desconocido: ' + nuevo);
    if (!puedeCambiar(pedido, nuevo, rol)) throw new Error('No se puede pasar de "' + ESTADOS[pedido.estado] + '" a "' + ESTADOS[nuevo] + '".');
    const e = extra || {};
    if (nuevo === 'pago_informado' && !validarOperacion(e.operacion).valido) throw new Error('Falta el número de operación de Yape.');
    if (nuevo === 'en_reclamo' && !e.motivo) throw new Error('Indica qué pasó.');
    if (nuevo === 'pago_pendiente' && !e.motivo) throw new Error('Indica por qué se rechaza el pago.');
    const fecha = (ahora || new Date()).toISOString();
    return {
      ...pedido,
      ...(e.operacion ? { operacion: String(e.operacion).trim() } : {}),
      ...(nuevo === 'en_reclamo' ? { reclamo: { motivo: e.motivo, detalle: e.detalle || '', fecha, por: rol } } : {}),
      estado: nuevo,
      historial: [...(pedido.historial || []), { estado: nuevo, fecha, por: rol, nota: e.motivo || '' }]
    };
  }

  function nuevoPedido(pub, compradorId, operacion, ahora) {
    const fecha = (ahora || new Date()).toISOString();
    const base = {
      id: 'P' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      pubId: pub.id, compradorId, vendedorId: pub.vendedorId, precio: pub.precio,
      estado: 'pago_pendiente', creado: fecha, historial: [{ estado: 'pago_pendiente', fecha, por: 'comprador', nota: '' }],
      entrega: { punto: '', horario: '' }
    };
    return cambiarEstado(base, 'pago_informado', 'comprador', { operacion }, ahora);
  }

  function validarOperacion(texto) {
    const t = String(texto == null ? '' : texto).replace(/\s/g, '');
    if (!t) return { valido: false, error: 'Escribe el número de operación que aparece en Yape.' };
    if (!/^\d{4,20}$/.test(t)) return { valido: false, error: 'El número de operación solo tiene dígitos. Revísalo en el detalle del Yape.' };
    return { valido: true, error: null };
  }

  /* ---------- Usuarios y permisos ---------- */
  const dominio = correo => ((correo || '').trim().toLowerCase().split('@')[1] || '');
  function universidadPorCorreo(correo, cfg) { return cfg.DOMINIOS_INSTITUCIONALES[dominio(correo)] || ''; }
  /* Verificado solo con correo institucional o aprobación del equipo. */
  function vendedorVerificado(u, cfg) { return !!u && (!!universidadPorCorreo(u.correo, cfg) || u.aprobadoPorEquipo === true); }
  function esEquipo(u, cfg) {
    if (!u) return false;
    if (cfg.MODO_DATOS === 'demo' && u.rol === 'equipo') return true;
    return (cfg.CORREOS_ADMIN || []).map(c => c.toLowerCase()).includes((u.correo || '').toLowerCase());
  }
  /* Rol de un usuario frente a un pedido. */
  function rolEnPedido(u, pedido, cfg) {
    if (!u) return null;
    if (u.id === pedido.compradorId) return 'comprador';
    if (u.id === pedido.vendedorId) return 'vendedor';
    if (esEquipo(u, cfg)) return 'equipo';
    return null;
  }

  /* Lo único que la vista del comprador recibe de un pedido: nunca la comisión ni lo que recibe el vendedor. */
  function pedidoParaComprador(p) {
    const { id, pubId, precio, estado, historial, entrega, operacion, reclamo, creado } = p;
    return { id, pubId, precio, estado, historial, entrega, operacion, reclamo, creado };
  }

  /* ---------- Foto verificada ---------- */
  const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  /* Fecha en Lima (UTC-5, sin horario de verano) como AAAA-MM-DD. */
  function fechaLima(d) { return new Date((d || new Date()).getTime() - 5 * 3600e3).toISOString().slice(0, 10); }
  /* Código de 4 caracteres que cambia cada día. Es predecible para quien lea este código: sirve para probar
     que la foto es reciente, no como secreto. */
  function codigoDelDia(d) {
    let h = 2166136261;
    for (const ch of 'relevo:' + fechaLima(d)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    let s = '';
    for (let i = 0; i < 4; i++) { s += ALFABETO[h % ALFABETO.length]; h = Math.floor(h / ALFABETO.length); }
    return s;
  }
  function angulosDe(categoria, cfg) { const c = cfg.CATEGORIAS.find(x => x.id === categoria); return c ? c.angulos : cfg.CATEGORIAS[cfg.CATEGORIAS.length - 1].angulos; }

  /* ---------- Publicación ---------- */
  function validarPublicacion(f, cfg) {
    const e = {};
    if (!(f.titulo || '').trim()) e.titulo = 'Escribe qué material vendes.';
    if (!f.categoria) e.categoria = 'Elige una categoría.';
    if (!f.estado) e.estado = 'Elige el estado del material.';
    if (!(f.curso || '').trim()) e.curso = 'Escribe el curso.';
    if (!f.universidad) e.universidad = 'Elige la universidad.';
    if ((f.descripcion || '').trim().length < 20) e.descripcion = 'Describe el material en al menos 20 caracteres: qué incluye y qué detalles tiene.';
    const v = calcularVenta(f.precio, cfg);
    if (!v.valido) e.precio = v.error;
    const angulos = f.categoria ? angulosDe(f.categoria, cfg) : [];
    const fotos = (f.fotos || []).filter(Boolean);
    if (fotos.length < Math.max(3, angulos.length)) e.fotos = 'Toma una foto por cada ángulo (' + Math.max(3, angulos.length) + ' en total).';
    if (!f.aceptoTerminos) e.terminos = 'Acepta los términos para publicar.';
    return e;
  }

  /* ---------- Exportación CSV del panel del equipo ---------- */
  const COLUMNAS_CSV = ['fecha', 'material', 'precio', 'comision', 'monto_a_transferir', 'estado', 'pago_yape_confirmado', 'entrega_concretada', 'transferencia', 'cancelacion', 'reclamo_diferencia_foto', 'vendedor_mantuvo_publicacion'];
  const pasoPor = (p, est) => (p.historial || []).some(h => h.estado === est);
  function filaCSV(p, pub, cfg) {
    const comision = cfg.COMISION_VENDEDOR;
    return {
      fecha: (p.creado || '').slice(0, 10),
      material: pub ? pub.titulo : '',
      precio: p.precio.toFixed(2),
      comision: comision.toFixed(2),
      monto_a_transferir: deCent(aCent(p.precio) - aCent(comision)).toFixed(2),
      estado: ESTADOS[p.estado],
      pago_yape_confirmado: pasoPor(p, 'pago_confirmado') ? 'sí' : 'no',
      entrega_concretada: pasoPor(p, 'entregado') ? 'sí' : 'no',
      transferencia: pasoPor(p, 'transferido') ? 'sí' : 'no',
      cancelacion: p.estado === 'cancelado' ? 'sí' : 'no',
      reclamo_diferencia_foto: p.reclamo && p.reclamo.motivo === 'distinto' ? 'sí' : 'no',
      vendedor_mantuvo_publicacion: pub && !pub.retirada ? 'sí' : 'no'
    };
  }
  function generarCSV(pedidos, pubs, cfg) {
    const esc = v => { const s = String(v == null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const filas = pedidos.map(p => filaCSV(p, pubs.find(x => x.id === p.pubId), cfg));
    return [COLUMNAS_CSV.join(','), ...filas.map(f => COLUMNAS_CSV.map(c => esc(f[c])).join(','))].join('\n');
  }

  const L = {
    soles, leerPrecio, calcularVenta, ESTADOS, CAMINO, TRANSICIONES, puedeCambiar, cambiarEstado, nuevoPedido, validarOperacion,
    universidadPorCorreo, vendedorVerificado, esEquipo, rolEnPedido, pedidoParaComprador,
    fechaLima, codigoDelDia, angulosDe, validarPublicacion, COLUMNAS_CSV, filaCSV, generarCSV
  };
  raiz.RelevoLogica = L;
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
