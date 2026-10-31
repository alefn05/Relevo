/* Pruebas de firestore.rules con el emulador. Correr con: npm run test:reglas */
import { readFileSync } from 'node:fs';
import { test, before, after, beforeEach } from 'node:test';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';

let env;
const ADMIN = 'u202312020@gmail.com';
const ahora = '2026-11-01T15:00:00.000Z';
const paso = (estado, por) => ({ estado, fecha: ahora, por, nota: '' });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-relevo', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
});
after(async () => { await env.cleanup(); });

/* Datos base: una publicación aprobada, una en revisión y un pedido con pago informado. */
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'usuarios/vendedor'), { nombre: 'Vendedor Demo', correo: 'v@upc.edu.pe', aprobadoPorEquipo: false, aceptoTerminos: true });
    await setDoc(doc(db, 'usuarios/comprador'), { nombre: 'Comprador Demo', correo: 'c@ejemplo.com', aprobadoPorEquipo: false, aceptoTerminos: true });
    const base = { vendedorId: 'vendedor', titulo: 'Libro', precio: 35, retirada: false, fotoVerificada: true, pedidoActivo: null };
    await setDoc(doc(db, 'publicaciones/aprobada'), { ...base, revision: 'aprobada' });
    await setDoc(doc(db, 'publicaciones/libre'), { ...base, revision: 'aprobada' });
    await setDoc(doc(db, 'publicaciones/revision'), { ...base, revision: 'en_revision', fotoVerificada: false });
    await setDoc(doc(db, 'publicaciones/aprobada/fotos/0'), { n: 0, src: 'data:', vendedorId: 'vendedor' });
    await setDoc(doc(db, 'publicaciones/revision/fotos/0'), { n: 0, src: 'data:', vendedorId: 'vendedor' });
    await setDoc(doc(db, 'pedidos/p1'), { pubId: 'aprobada', compradorId: 'comprador', vendedorId: 'vendedor', precio: 35, estado: 'pago_informado', operacion: '12345678', montoInformado: 35, reclamoAbierto: false, historial: [paso('pago_pendiente', 'comprador'), paso('pago_informado', 'comprador')], entrega: { punto: '', horario: '' } });
    await setDoc(doc(db, 'reclamos/r1'), { pedidoId: 'p1', motivo: 'otro', detalle: '' });
  });
});

const como = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true }).firestore();
const comprador = () => como('comprador', 'c@ejemplo.com');
const vendedor = () => como('vendedor', 'v@upc.edu.pe');
const extrano = () => como('extrano', 'x@ejemplo.com');
const admin = () => como('admin', ADMIN);
const anonimo = () => env.unauthenticatedContext().firestore();

test('Las publicaciones aprobadas son públicas, las demás no', async () => {
  await assertSucceeds(getDoc(doc(anonimo(), 'publicaciones/aprobada')));
  await assertSucceeds(getDocs(query(collection(anonimo(), 'publicaciones'), where('revision', '==', 'aprobada'))));
  await assertSucceeds(getDoc(doc(anonimo(), 'publicaciones/aprobada/fotos/0')));
  await assertFails(getDoc(doc(anonimo(), 'publicaciones/revision')));
  await assertFails(getDoc(doc(extrano(), 'publicaciones/revision/fotos/0')));
  await assertSucceeds(getDoc(doc(vendedor(), 'publicaciones/revision')));
  await assertSucceeds(getDoc(doc(admin(), 'publicaciones/revision')));
});

test('Cada usuario solo lee sus propias compras y ventas', async () => {
  await assertSucceeds(getDoc(doc(comprador(), 'pedidos/p1')));
  await assertSucceeds(getDoc(doc(vendedor(), 'pedidos/p1')));
  await assertFails(getDoc(doc(extrano(), 'pedidos/p1')));
  await assertFails(getDoc(doc(anonimo(), 'pedidos/p1')));
  await assertSucceeds(getDocs(query(collection(comprador(), 'pedidos'), where('compradorId', '==', 'comprador'))));
  await assertFails(getDocs(collection(comprador(), 'pedidos')));
  await assertSucceeds(getDocs(collection(admin(), 'pedidos')));
});

test('Solo el equipo aprueba publicaciones', async () => {
  await assertFails(updateDoc(doc(vendedor(), 'publicaciones/revision'), { revision: 'aprobada', fotoVerificada: true }));
  await assertFails(updateDoc(doc(extrano(), 'publicaciones/revision'), { revision: 'aprobada' }));
  await assertSucceeds(updateDoc(doc(admin(), 'publicaciones/revision'), { revision: 'aprobada', fotoVerificada: true }));
});

test('Un correo parecido o sin verificar no es del equipo', async () => {
  const falso = env.authenticatedContext('falso', { email: ADMIN, email_verified: false }).firestore();
  await assertFails(updateDoc(doc(falso, 'publicaciones/revision'), { revision: 'aprobada' }));
  const otro = como('otro', 'u202312020@gmail.com.ejemplo.com');
  await assertFails(updateDoc(doc(otro, 'publicaciones/revision'), { revision: 'aprobada' }));
});

test('Solo el equipo confirma pagos y marca transferencias', async () => {
  const confirmar = { estado: 'pago_confirmado', historial: [paso('pago_pendiente'), paso('pago_informado'), paso('pago_confirmado', 'equipo')] };
  await assertFails(updateDoc(doc(comprador(), 'pedidos/p1'), confirmar));
  await assertFails(updateDoc(doc(vendedor(), 'pedidos/p1'), confirmar));
  await assertSucceeds(updateDoc(doc(admin(), 'pedidos/p1'), confirmar));
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'pedidos/p1'), { estado: 'entregado' }));
  await assertFails(updateDoc(doc(vendedor(), 'pedidos/p1'), { estado: 'transferido' }));
  await assertFails(updateDoc(doc(comprador(), 'pedidos/p1'), { estado: 'transferido' }));
  await assertSucceeds(updateDoc(doc(admin(), 'pedidos/p1'), { estado: 'transferido' }));
});

test('Solo el equipo lee los reclamos', async () => {
  await assertFails(getDoc(doc(comprador(), 'reclamos/r1')));
  await assertFails(getDoc(doc(vendedor(), 'reclamos/r1')));
  await assertSucceeds(getDoc(doc(admin(), 'reclamos/r1')));
  await assertSucceeds(getDocs(collection(admin(), 'reclamos')));
});

test('El comprador abre un reclamo y el pedido pasa a reclamo', async () => {
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'pedidos/p1'), { estado: 'en_coordinacion', historial: [paso('pago_pendiente'), paso('pago_informado'), paso('pago_confirmado'), paso('en_coordinacion')] }));
  const db = comprador();
  const lote = writeBatch(db);
  lote.update(doc(db, 'pedidos/p1'), { estado: 'en_reclamo', reclamoAbierto: true, historial: [paso('pago_pendiente'), paso('pago_informado'), paso('pago_confirmado'), paso('en_coordinacion'), paso('en_reclamo', 'comprador')] });
  lote.set(doc(db, 'reclamos/r2'), { pedidoId: 'p1', motivo: 'distinto', detalle: 'No coincide', por: 'comprador' });
  await assertSucceeds(lote.commit());
  const ajeno = extrano();
  await assertFails(setDoc(doc(ajeno, 'reclamos/r3'), { pedidoId: 'p1', motivo: 'otro', detalle: '' }));
});

test('El comprador confirma la entrega solo cuando está en coordinación', async () => {
  const entregado = h => ({ estado: 'entregado', historial: [...h, paso('entregado', 'comprador')] });
  const h = [paso('pago_pendiente'), paso('pago_informado')];
  await assertFails(updateDoc(doc(comprador(), 'pedidos/p1'), entregado(h)));
  const h2 = [...h, paso('pago_confirmado'), paso('en_coordinacion')];
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'pedidos/p1'), { estado: 'en_coordinacion', historial: h2 }));
  await assertFails(updateDoc(doc(vendedor(), 'pedidos/p1'), entregado(h2)));
  await assertSucceeds(updateDoc(doc(comprador(), 'pedidos/p1'), entregado(h2)));
});

test('Comprar: precio igual al publicado, con operación y monto, y reserva la publicación', async () => {
  const db = comprador();
  const pedido = (extra) => ({ pubId: 'libre', compradorId: 'comprador', vendedorId: 'vendedor', precio: 35, estado: 'pago_informado', operacion: '87654321', montoInformado: 35, reclamoAbierto: false, historial: [paso('pago_pendiente'), paso('pago_informado')], entrega: { punto: '', horario: '' }, ...extra });
  const intentar = (id, datos) => { const l = writeBatch(db); l.set(doc(db, 'pedidos/' + id), datos); l.update(doc(db, 'publicaciones/libre'), { pedidoActivo: id }); return l.commit(); };
  await assertFails(intentar('x1', pedido({ precio: 5 })));
  await assertFails(intentar('x2', pedido({ operacion: '' })));
  await assertFails(intentar('x3', pedido({ estado: 'pago_confirmado' })));
  await assertSucceeds(intentar('x4', pedido({})));
  await assertFails(intentar('x5', pedido({})));
});

test('El vendedor no puede comprar lo suyo ni cambiar su precio después', async () => {
  const db = vendedor();
  const l = writeBatch(db);
  l.set(doc(db, 'pedidos/y1'), { pubId: 'libre', compradorId: 'vendedor', vendedorId: 'vendedor', precio: 35, estado: 'pago_informado', operacion: '11112222', montoInformado: 35, reclamoAbierto: false, historial: [paso('pago_pendiente'), paso('pago_informado')] });
  l.update(doc(db, 'publicaciones/libre'), { pedidoActivo: 'y1' });
  await assertFails(l.commit());
  await assertFails(updateDoc(doc(db, 'publicaciones/libre'), { precio: 10 }));
  await assertSucceeds(updateDoc(doc(db, 'publicaciones/libre'), { retirada: true }));
});

test('Publicar: queda en revisión y sin foto verificada', async () => {
  const db = comprador();
  const pub = extra => ({ vendedorId: 'comprador', revision: 'en_revision', fotoVerificada: false, retirada: false, pedidoActivo: null, precio: 20, titulo: 'Bata', descripcion: 'Bata blanca de algodón en buen estado.', fotos: [{}, {}, {}], portada: 'data:', vendedorVerificado: false, ...extra });
  await assertSucceeds(setDoc(doc(db, 'publicaciones/n1'), pub({})));
  await assertFails(setDoc(doc(db, 'publicaciones/n2'), pub({ revision: 'aprobada' })));
  await assertFails(setDoc(doc(db, 'publicaciones/n3'), pub({ fotoVerificada: true })));
  await assertFails(setDoc(doc(db, 'publicaciones/n4'), pub({ precio: 4 })));
  await assertFails(setDoc(doc(db, 'publicaciones/n5'), pub({ fotos: [{}, {}] })));
  await assertFails(setDoc(doc(db, 'publicaciones/n6'), pub({ vendedorVerificado: true })), 'Sin correo institucional no puede marcarse verificado');
  await assertSucceeds(setDoc(doc(vendedor(), 'publicaciones/n7'), pub({ vendedorId: 'vendedor', vendedorVerificado: true })));
});

test('Usuarios: cada uno lee lo suyo y no puede autoaprobarse', async () => {
  await assertSucceeds(getDoc(doc(comprador(), 'usuarios/comprador')));
  await assertFails(getDoc(doc(comprador(), 'usuarios/vendedor')));
  await assertFails(updateDoc(doc(comprador(), 'usuarios/comprador'), { aprobadoPorEquipo: true }));
  await assertSucceeds(updateDoc(doc(comprador(), 'usuarios/comprador'), { aceptoTerminos: true }));
  await assertSucceeds(updateDoc(doc(admin(), 'usuarios/comprador'), { aprobadoPorEquipo: true }));
});

test('Correo universitario: solo con comprobante propio y una cuenta por correo', async () => {
  const univ = como('sesion-univ', 'alumno@cientifica.edu.pe');
  await assertSucceeds(setDoc(doc(univ, 'verificaciones/sesion-univ'), { uid: 'comprador', correo: 'alumno@cientifica.edu.pe', creado: ahora }));
  await assertFails(setDoc(doc(univ, 'verificaciones/sesion-univ'), { uid: 'extrano', correo: 'alumno@cientifica.edu.pe', creado: ahora }));
  const gmail = como('sesion-gmail', 'x@gmail.com');
  await assertFails(setDoc(doc(gmail, 'verificaciones/sesion-gmail'), { uid: 'extrano', correo: 'x@gmail.com', creado: ahora }));
  const cambio = { correoUniversitario: 'alumno@cientifica.edu.pe', universidad: 'Universidad Científica del Sur', verificacionUniversitaria: 'sesion-univ' };
  await assertFails(updateDoc(doc(vendedor(), 'usuarios/vendedor'), cambio));
  await assertSucceeds(updateDoc(doc(comprador(), 'usuarios/comprador'), cambio));
  await assertFails(updateDoc(doc(comprador(), 'usuarios/comprador'), { ...cambio, correoUniversitario: 'otro@upc.edu.pe' }));
});

test('Chat: solo comprador, vendedor y equipo, y solo con el pago confirmado', async () => {
  const msg = (autorId, rol) => ({ autorId, rol, texto: 'Hola', fecha: ahora });
  await assertFails(setDoc(doc(comprador(), 'pedidos/p1/mensajes/a'), msg('comprador', 'comprador')), 'Con pago informado sigue cerrado');
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'pedidos/p1'), { estado: 'pago_confirmado' }));
  await assertSucceeds(setDoc(doc(comprador(), 'pedidos/p1/mensajes/b'), msg('comprador', 'comprador')));
  await assertSucceeds(setDoc(doc(vendedor(), 'pedidos/p1/mensajes/c'), msg('vendedor', 'vendedor')));
  await assertSucceeds(setDoc(doc(admin(), 'pedidos/p1/mensajes/d'), msg('admin', 'equipo')));
  await assertFails(setDoc(doc(comprador(), 'pedidos/p1/mensajes/e'), msg('comprador', 'equipo')), 'No puede fingir ser del equipo');
  await assertFails(setDoc(doc(extrano(), 'pedidos/p1/mensajes/f'), msg('extrano', 'comprador')));
  await assertFails(getDoc(doc(extrano(), 'pedidos/p1/mensajes/b')));
  await assertSucceeds(getDoc(doc(vendedor(), 'pedidos/p1/mensajes/b')));
  await assertSucceeds(getDoc(doc(admin(), 'pedidos/p1/mensajes/b')));
  await assertFails(updateDoc(doc(comprador(), 'pedidos/p1/mensajes/b'), { texto: 'Cambiado' }));
});

test('Las colecciones del MVP anterior quedan cerradas', async () => {
  await assertFails(getDoc(doc(anonimo(), 'products/x')));
  await assertFails(setDoc(doc(comprador(), 'orders/x'), { a: 1 }));
});
