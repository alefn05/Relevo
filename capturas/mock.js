// Firebase simulado con datos de ejemplo. Solo se usa para generar las capturas de la encuesta;
// la web real (index.html) sigue usando Firebase.
(function () {
  const now = Math.floor(Date.now() / 1000), ts = d => ({ seconds: now - d * 86400 });
  const P = window.__PH;
  const U = (uid, name, carrera, ciclo) => ({ uid, name, carrera, ciclo, inst: true, uni: 'UPC' });
  const users = {
    me: U('me', 'Valeria Quispe', 'Ingeniería Industrial', 'V'),
    s1: U('s1', 'Diego Ramírez', 'Ingeniería Civil', 'VII'),
    s2: U('s2', 'Lucía Torres', 'Ingeniería Industrial', 'VI'),
    s3: U('s3', 'Marco Salas', 'Ingeniería Mecatrónica', 'VIII'),
    s4: U('s4', 'Ana Paredes', 'Arquitectura', 'VI'),
  };
  const prod = (id, o) => Object.assign({ id, uni: 'UPC', ciclo: 'I', status: 'activo', ownerInst: true }, o);
  const products = [
    prod('p1', { title: 'Calculadora Casio fx-991', cat: 'Calculadoras', cond: 'Bueno', price: 60, newPrice: 100, course: 'Cálculo 1', carrera: 'Ingeniería Civil', ownerId: 's1', ownerName: 'Diego Ramírez', photos: [P.calc1, P.calc2, P.calc3, P.calc4], desc: 'Funciona perfecto. Incluye tapa protectora y pilas nuevas. Rayones leves en la parte trasera.', createdAt: ts(1) }),
    prod('p2', { title: 'Cálculo de una variable, 8.ª edición', cat: 'Libros', cond: 'Bueno', price: 65, newPrice: 140, course: 'Cálculo 1', carrera: 'Ingeniería Industrial', ownerId: 's2', ownerName: 'Lucía Torres', photos: [P.book1], createdAt: ts(2) }),
    prod('p3', { title: 'Escalímetro y juego de escuadras', cat: 'Útiles', cond: 'Bueno', price: 25, newPrice: 60, course: 'Dibujo Arquitectónico', carrera: 'Arquitectura', ownerId: 's4', ownerName: 'Ana Paredes', photos: [P.util1], createdAt: ts(3) }),
    prod('p4', { title: 'Física Universitaria, volumen 1', cat: 'Libros', cond: 'Excelente', price: 85, newPrice: 150, course: 'Física 2', carrera: 'Ingeniería Mecatrónica', ownerId: 's3', ownerName: 'Marco Salas', photos: [P.book2], createdAt: ts(4) }),
    prod('p5', { title: 'Apuntes resueltos de Estática', cat: 'Apuntes PDF', cond: 'Digital', price: 12, course: 'Estática', carrera: 'Ingeniería Civil', ownerId: 's1', ownerName: 'Diego Ramírez', photos: [P.pdf1], createdAt: ts(5) }),
    prod('p6', { title: 'Maqueta base para Taller de Urbanismo', cat: 'Maquetas', cond: 'Desgastado', price: 30, course: 'Taller de Urbanismo', carrera: 'Arquitectura', ownerId: 's4', ownerName: 'Ana Paredes', photos: [P.maq1], createdAt: ts(6) }),
    prod('p7', { title: 'Cálculo, trascendentes tempranas', cat: 'Libros', cond: 'Desgastado', price: 40, course: 'Cálculo 1', carrera: 'Ingeniería Civil', ownerId: 's3', ownerName: 'Marco Salas', photos: [P.book2], createdAt: ts(9) }),
    prod('p8', { title: 'Cálculo y geometría analítica', cat: 'Libros', cond: 'Excelente', price: 85, course: 'Cálculo 1', carrera: 'Ingeniería Industrial', ownerId: 's2', ownerName: 'Lucía Torres', photos: [P.book1], createdAt: ts(12) }),
  ];
  const R = (id, sellerId, stars, match, onTime, buyerName, title, comment, d, reply) => ({ id, sellerId, buyerId: 'x' + id, stars, match, onTime, buyerName, title, comment, createdAt: ts(d), ...(reply ? { reply } : {}) });
  const reviews = [
    R('o1', 's1', 5, true, true, 'Camila', 'Calculadora Casio fx-82', 'Todo tal cual las fotos. Muy puntual en la cafetería frente al campus.', 6),
    R('o2', 's1', 5, true, true, 'Renzo', 'Estática, 14.ª edición', 'El libro estaba incluso mejor de lo que se veía en las fotos.', 15),
    R('o3', 's1', 4, true, false, 'Sofía', 'Compás y escuadras', 'Llegó unos minutos tarde, pero avisó antes. Material en buen estado.', 24, 'Gracias, Sofía. Disculpa la demora.'),
    R('o4', 's2', 5, true, true, 'Bruno', 'Microeconomía', 'Rápido y amable.', 10),
    R('o5', 's2', 5, true, true, 'Daniela', 'Calculadora gráfica', 'Coincidió con lo publicado.', 20),
    R('o6', 's4', 4, true, true, 'Joaquín', 'Escalímetro', 'Bien, tal cual.', 8),
  ];
  const sales = reviews.map(r => ({ id: r.id, sellerId: r.sellerId }));
  const DATA = { products, reviews, sales, orders: [], users };
  const snapOf = arr => ({ docs: arr.map(d => ({ id: d.id, data: () => d, exists: true, metadata: { hasPendingWrites: false } })) });
  function coll(name, filt) {
    const q = {
      orderBy: () => q, limit: () => q,
      where: (f, op, v) => coll(name, [f, v]),
      onSnapshot: (a, b) => { const cb = typeof a === 'function' ? a : b; let d = Array.isArray(DATA[name]) ? DATA[name] : []; if (filt) d = d.filter(x => x[filt[0]] === filt[1]); setTimeout(() => cb(snapOf(d)), 0); return () => {}; },
      get: () => Promise.resolve(snapOf([])),
      add: x => Promise.resolve({}),
      doc: id => docRef(name, id),
    };
    return q;
  }
  function docRef(name, id) {
    const val = () => (DATA[name] && !Array.isArray(DATA[name]) ? DATA[name][id] : undefined);
    return {
      collection: c => coll(name + '/' + id + '/' + c),
      get: () => Promise.resolve({ exists: !!val(), data: () => val() }),
      onSnapshot: cb => { setTimeout(() => cb({ exists: !!val(), data: () => val() || {} }), 0); return () => {}; },
      set: () => Promise.resolve(), update: () => Promise.resolve(), delete: () => Promise.resolve(),
    };
  }
  const user = { uid: 'me', displayName: 'Valeria Quispe', photoURL: '', email: 'u20231x000@upc.edu.pe', emailVerified: true, reload: () => Promise.resolve(), getIdToken: () => Promise.resolve('t') };
  const auth = { languageCode: 'es', currentUser: user, onIdTokenChanged: cb => { setTimeout(() => cb(user), 0); return () => {}; }, signOut: () => Promise.resolve(), signInWithPopup: () => Promise.resolve() };
  const mockDb = { collection: n => coll(n), batch: () => ({ update() {}, set() {}, commit: () => Promise.resolve() }), runTransaction: async fn => {} };
  window.firebase = { initializeApp: () => {}, auth: Object.assign(() => auth, { GoogleAuthProvider: function () { this.setCustomParameters = () => {}; } }), firestore: Object.assign(() => mockDb, { FieldValue: { serverTimestamp: () => ({ seconds: now }) } }) };
})();
