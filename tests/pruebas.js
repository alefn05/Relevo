/* Pruebas de la lógica de Relevo. Corren en el navegador (tests/pruebas.html), sin instalar nada. */
(async function () {
  const L = window.RelevoLogica;
  const cfg = { ...window.RELEVO_CONFIG, MODO_DATOS: 'demo', CORREOS_ADMIN: ['admin@ejemplo.com'] };
  const resultados = [];
  const prueba = async (nombre, fn) => {
    try { await fn(); resultados.push({ nombre, ok: true }); }
    catch (e) { resultados.push({ nombre, ok: false, error: e.message }); }
  };
  const igual = (a, b, msg) => { if (a !== b) throw new Error((msg || '') + ' esperado ' + JSON.stringify(b) + ', recibido ' + JSON.stringify(a)); };
  const lanza = async (fn, texto) => {
    try { await fn(); } catch (e) { if (texto && !e.message.includes(texto)) throw new Error('Mensaje inesperado: ' + e.message); return; }
    throw new Error('Debía lanzar un error');
  };

  /* ---------- Comisión ---------- */
  await prueba('La configuración define la comisión en S/ 4.00 y el umbral en S/ 15.00', () => {
    igual(cfg.COMISION_VENDEDOR, 4); igual(cfg.UMBRAL_AVISO, 15);
  });
  await prueba('Formato de montos: S/ 40.00', () => {
    igual(L.soles(40), 'S/ 40.00'); igual(L.soles(4.5), 'S/ 4.50'); igual(L.soles(1250), 'S/ 1,250.00');
  });
  for (const [precio, recibe] of [[12, 8], [18, 14], [25, 21], [35, 31], [52, 48], [70, 66], [95, 91], [40.5, 36.5], [4.01, 0.01]]) {
    await prueba('Precio ' + precio + ': el vendedor recibe ' + recibe, () => {
      const v = L.calcularVenta(precio, cfg);
      igual(v.valido, true); igual(v.recibe, recibe); igual(v.precio, precio);
    });
  }
  await prueba('Precio igual a la comisión no es válido', () => {
    const v = L.calcularVenta(4, cfg); igual(v.valido, false); if (!v.error.includes('mayor que S/ 4.00')) throw new Error(v.error);
  });
  await prueba('Precio menor a la comisión no es válido', () => { igual(L.calcularVenta(3.99, cfg).valido, false); igual(L.calcularVenta(0, cfg).valido, false); });
  await prueba('Precio vacío, negativo o con texto no es válido', () => {
    for (const p of ['', null, '-10', 'abc', '10.999', '1e3']) igual(L.calcularVenta(p, cfg).valido, false, 'Precio ' + p + ':');
  });
  await prueba('Acepta precio escrito con coma o con S/', () => {
    igual(L.calcularVenta('35,50', cfg).recibe, 31.5); igual(L.calcularVenta('S/ 20', cfg).recibe, 16);
  });
  await prueba('Sin errores de redondeo con decimales', () => { igual(L.calcularVenta(10.1, cfg).recibe, 6.1); igual(L.calcularVenta(4.3, cfg).recibe, 0.3); });
  await prueba('Aviso de porcentaje solo debajo del umbral', () => {
    igual(L.calcularVenta(12, cfg).aviso, 'La comisión es el 33.3 % de este precio.');
    igual(L.calcularVenta(14.99, cfg).aviso !== null, true);
    igual(L.calcularVenta(15, cfg).aviso, null);
    igual(L.calcularVenta(40, cfg).porcentaje, 10);
  });
  await prueba('La comisión sale de la configuración', () => {
    const otra = { ...cfg, COMISION_VENDEDOR: 5 };
    igual(L.calcularVenta(20, otra).recibe, 15); igual(L.calcularVenta(5, otra).valido, false);
  });

  /* ---------- Estados del pedido ---------- */
  const pub = { id: 'm1', precio: 35, vendedorId: 'v' };
  const t0 = new Date('2026-10-01T15:00:00Z');
  await prueba('Un pedido nuevo queda en "pago informado" con número de operación y fechas', () => {
    const p = L.nuevoPedido(pub, 'c', '12345678', t0);
    igual(p.estado, 'pago_informado'); igual(p.operacion, '12345678'); igual(p.precio, 35);
    igual(p.historial.length, 2); igual(p.historial[1].fecha, t0.toISOString());
  });
  await prueba('El monto informado de Yape se guarda y se valida', async () => {
    const p = L.nuevoPedido(pub, 'c', '12345678', t0, '35,00');
    igual(p.montoInformado, 35);
    await lanza(() => L.nuevoPedido(pub, 'c', '12345678', t0, 'abc'), 'monto');
    igual(L.validarMonto('').valido, false); igual(L.validarMonto('0').valido, false); igual(L.validarMonto('34.5').monto, 34.5);
  });
  await prueba('No se crea pedido sin número de operación válido', async () => {
    await lanza(() => L.nuevoPedido(pub, 'c', '', t0), 'operación');
    await lanza(() => L.nuevoPedido(pub, 'c', 'abc123', t0), 'operación');
  });
  await prueba('Camino completo hasta transferido, guardando la fecha de cada cambio', () => {
    let p = L.nuevoPedido(pub, 'c', '12345678', t0);
    const pasos = [['pago_confirmado', 'equipo'], ['en_coordinacion', 'equipo'], ['entregado', 'comprador'], ['transferido', 'equipo']];
    pasos.forEach(([e, rol], i) => { p = L.cambiarEstado(p, e, rol, {}, new Date(t0.getTime() + (i + 1) * 3600e3)); });
    igual(p.estado, 'transferido'); igual(p.historial.length, 6);
    igual(p.historial[5].fecha, new Date(t0.getTime() + 4 * 3600e3).toISOString());
  });
  await prueba('El comprador no puede confirmar su propio pago', async () => {
    const p = L.nuevoPedido(pub, 'c', '12345678', t0);
    await lanza(() => L.cambiarEstado(p, 'pago_confirmado', 'comprador'), 'No se puede');
  });
  await prueba('El vendedor no puede marcar la transferencia', async () => {
    let p = L.nuevoPedido(pub, 'c', '12345678', t0);
    p = L.cambiarEstado(p, 'pago_confirmado', 'equipo'); p = L.cambiarEstado(p, 'en_coordinacion', 'equipo'); p = L.cambiarEstado(p, 'entregado', 'comprador');
    await lanza(() => L.cambiarEstado(p, 'transferido', 'vendedor'));
  });
  await prueba('No se puede saltar de pago informado a entregado', async () => {
    const p = L.nuevoPedido(pub, 'c', '12345678', t0);
    await lanza(() => L.cambiarEstado(p, 'entregado', 'equipo'));
  });
  await prueba('Reclamo exige motivo y deja el pedido en reclamo', async () => {
    let p = L.cambiarEstado(L.nuevoPedido(pub, 'c', '12345678', t0), 'pago_confirmado', 'equipo');
    await lanza(() => L.cambiarEstado(p, 'en_reclamo', 'comprador', {}), 'qué pasó');
    p = L.cambiarEstado(p, 'en_reclamo', 'comprador', { motivo: 'distinto', detalle: 'No coincide' });
    igual(p.estado, 'en_reclamo'); igual(p.reclamo.motivo, 'distinto');
  });
  await prueba('Rechazar un pago exige motivo y vuelve a pago pendiente', async () => {
    const p = L.nuevoPedido(pub, 'c', '12345678', t0);
    await lanza(() => L.cambiarEstado(p, 'pago_pendiente', 'equipo', {}));
    igual(L.cambiarEstado(p, 'pago_pendiente', 'equipo', { motivo: 'Monto distinto' }).estado, 'pago_pendiente');
  });
  await prueba('Transferido y cancelado son estados finales', async () => {
    for (const e of ['transferido', 'cancelado']) for (const n of Object.keys(L.ESTADOS)) igual(L.puedeCambiar({ estado: e }, n, 'equipo'), false);
  });
  await prueba('cambiarEstado no modifica el pedido original', () => {
    const p = L.nuevoPedido(pub, 'c', '12345678', t0); const n = L.cambiarEstado(p, 'pago_confirmado', 'equipo');
    igual(p.estado, 'pago_informado'); igual(n.estado, 'pago_confirmado');
  });

  /* ---------- Permisos ---------- */
  await prueba('Vista del equipo: solo rol equipo (demo) o correo administrador', () => {
    igual(L.esEquipo(null, cfg), false);
    igual(L.esEquipo({ rol: 'estudiante', correo: 'x@upc.edu.pe' }, cfg), false);
    igual(L.esEquipo({ rol: 'equipo', correo: 'z@ejemplo.com' }, cfg), true);
    igual(L.esEquipo({ rol: 'estudiante', correo: 'Admin@Ejemplo.com' }, cfg), true);
    igual(L.esEquipo({ rol: 'equipo', correo: 'z@ejemplo.com' }, { ...cfg, MODO_DATOS: 'firebase' }), false, 'Fuera de la demo el rol no basta:');
  });
  await prueba('Vendedor verificado solo con correo institucional o aprobación del equipo', () => {
    igual(L.vendedorVerificado({ correo: 'a@upc.edu.pe' }, cfg), true);
    igual(L.vendedorVerificado({ correo: 'a@gmail.com' }, cfg), false);
    igual(L.vendedorVerificado({ correo: 'a@gmail.com', aprobadoPorEquipo: true }, cfg), true);
    igual(L.vendedorVerificado({ correo: 'a@upc.edu.pe.falso.com' }, cfg), false);
  });
  await prueba('La vista del comprador nunca recibe la comisión', () => {
    const p = L.pedidoParaComprador({ ...L.nuevoPedido(pub, 'c', '12345678', t0), comision: 4, recibe: 31 });
    igual('comision' in p, false); igual('recibe' in p, false); igual('vendedorId' in p, false);
  });

  /* ---------- Foto verificada y publicación ---------- */
  await prueba('El código del día tiene 4 caracteres y cambia cada día', () => {
    const a = L.codigoDelDia(new Date('2026-10-30T15:00:00Z')), b = L.codigoDelDia(new Date('2026-10-31T15:00:00Z'));
    igual(a.length, 4); igual(/^[A-Z2-9]{4}$/.test(a), true); igual(a !== b, true);
    igual(L.codigoDelDia(new Date('2026-10-30T06:00:00Z')), L.codigoDelDia(new Date('2026-10-31T04:00:00Z')), 'Mismo día en Lima:');
  });
  await prueba('Ángulos guiados por categoría', () => {
    igual(L.angulosDe('libro', cfg).length, 5); igual(L.angulosDe('calculadora', cfg).length, 3); igual(L.angulosDe('otra', cfg).length >= 3, true);
  });
  await prueba('Publicación incompleta muestra cada error', () => {
    const e = L.validarPublicacion({ precio: '3' }, cfg);
    for (const k of ['titulo', 'categoria', 'estado', 'curso', 'universidad', 'descripcion', 'precio', 'fotos', 'terminos']) igual(!!e[k], true, k + ':');
  });
  await prueba('Publicación completa no tiene errores', () => {
    const f = { titulo: 'Libro', categoria: 'calculadora', estado: 'Buen estado', curso: 'Cálculo', universidad: 'UPC', descripcion: 'Completo y sin marcas, con tapa.', precio: '30', fotos: [1, 2, 3], aceptoTerminos: true };
    igual(Object.keys(L.validarPublicacion(f, cfg)).length, 0);
    igual(!!L.validarPublicacion({ ...f, fotos: [1, 2] }, cfg).fotos, true, 'Con 2 fotos:');
    igual(!!L.validarPublicacion({ ...f, categoria: 'libro' }, cfg).fotos, true, 'Libro con 3 de 5 ángulos:');
  });

  /* ---------- CSV ---------- */
  await prueba('CSV con las columnas pedidas y montos calculados', () => {
    let p = L.cambiarEstado(L.nuevoPedido(pub, 'c', '12345678', t0), 'pago_confirmado', 'equipo');
    const csv = L.generarCSV([p], [{ id: 'm1', titulo: 'Libro, "edición" 8', retirada: false }], cfg).split('\n');
    igual(csv[0], L.COLUMNAS_CSV.join(','));
    igual(csv[1], '2026-10-01,"Libro, ""edición"" 8",35.00,4.00,31.00,Pago confirmado (retenido),sí,no,no,no,no,sí');
  });

  /* ---------- Datos de demostración ---------- */
  const D = window.RelevoDatos.crearDatosDemo(cfg, { espera: 0 });
  await prueba('Acciones del equipo se rechazan sin sesión de equipo', async () => {
    await lanza(() => D.aprobarPublicacion('m13'), 'Inicia sesión');
    await D.iniciarSesion('u-comprador');
    await lanza(() => D.aprobarPublicacion('m13'), 'Solo el equipo');
    await lanza(() => D.aprobarVendedor('u-vendedora'), 'Solo el equipo');
  });
  await prueba('El equipo aprueba una publicación y aparece con foto verificada', async () => {
    await D.iniciarSesion('u-equipo'); await D.aprobarPublicacion('m13');
    const m = D.leer().publicaciones.find(p => p.id === 'm13'); igual(m.revision, 'aprobada'); igual(m.fotoVerificada, true);
    await lanza(() => D.rechazarPublicacion('m14', ' '), 'motivo');
  });
  await prueba('Comprar crea un pedido y reserva el material', async () => {
    await D.iniciarSesion('u-comprador');
    const p = await D.comprar('m1', '55667788');
    igual(p.estado, 'pago_informado'); igual(D.disponible('m1'), false);
    await lanza(() => D.comprar('m1', '55667788'), 'ya está comprando');
  });
  await prueba('Un estudiante no puede mover pedidos ajenos ni confirmar pagos', async () => {
    await D.iniciarSesion('u-vendedor');
    await lanza(() => D.moverPedido('P-DEMO1', 'pago_confirmado'), 'no es tuyo');
    await D.iniciarSesion('u-comprador');
    await lanza(() => D.moverPedido('P-DEMO1', 'pago_confirmado'), 'No se puede');
  });

  const ok = resultados.filter(r => r.ok).length;
  window.__resultados = { total: resultados.length, ok, fallas: resultados.filter(r => !r.ok) };
  const lista = document.getElementById('resultados');
  document.getElementById('resumen').textContent = ok + ' de ' + resultados.length + ' pruebas pasan.';
  resultados.forEach(r => { const li = document.createElement('li'); li.textContent = (r.ok ? 'Pasa: ' : 'Falla: ') + r.nombre + (r.error ? '. ' + r.error : ''); if (!r.ok) li.className = 'falla'; lista.appendChild(li); });
})();
