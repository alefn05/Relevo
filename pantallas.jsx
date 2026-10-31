/* Pantallas de Relevo. Cada una resuelve sus estados: carga (arco), vacío, error y éxito. */

/* ---------- Inicio ---------- */
function Inicio() {
  const [busca, setBusca] = useState('');
  const ref = useRef();
  const progreso = useProgreso(ref);
  const ventajas = [
    ['shield', 'Foto verificada', 'Cada foto se toma con el código del día y el equipo la revisa antes de publicar.'],
    ['lock', 'Pago protegido', 'Pagas con Yape y Relevo guarda el dinero hasta que confirmes que recibiste el material.'],
    ['pin', 'Entrega en lugar público', 'Cerca de tu campus, con gente y vigilancia. Revisas el material antes de confirmar.']
  ];
  const pasos = [
    ['Publica con foto verificada', 'Toma las fotos con el código del día. El equipo las revisa antes de publicar.'],
    ['Paga con Yape', 'Relevo guarda el dinero hasta que confirmes que recibiste el material.'],
    ['Recibe en un lugar público', 'Elige un punto concurrido cerca de tu universidad y revisa el material antes de confirmar.']
  ];
  return <div className="pantalla">
    <section className="contenedor grilla" style={{ paddingTop: 'clamp(48px, 8vw, 112px)', alignItems: 'center', rowGap: 48 }}>
      <div style={{ gridColumn: '1 / span 7' }}>
        <h1 className="display">
          <span className="mascara"><span style={retraso(1)}>Lo que ya usaste,</span></span>
          <span className="mascara"><span style={retraso(3)}>le sirve a quien sigue.</span></span>
        </h1>
        <p className="texto secundario aparecer" style={{ marginTop: 28, fontSize: 20, lineHeight: '32px', ...retraso(5) }}>Compra y vende libros, calculadoras, batas e instrumentos con estudiantes de Lima. Pagas con Yape y recibes en un lugar público cerca de tu campus.</p>
        <form className="buscador aparecer" style={{ marginTop: 36, ...retraso(6) }} role="search" onSubmit={e => { e.preventDefault(); ir('/explorar' + (busca.trim() ? '?q=' + encodeURIComponent(busca.trim()) : '')); }}>
          <Icono n="search" c="secundario" />
          <label className="oculto" htmlFor="busca-inicio">Buscar</label>
          <input id="busca-inicio" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Busca por curso, carrera o material" />
          <button className="boton boton-principal">Buscar</button>
        </form>
        <div className="aparecer" style={{ marginTop: 20, ...retraso(7) }}><A a="/publicar" className="enlace">Publicar mi material</A></div>
      </div>
      <aside className="panel-ventajas aparecer" style={{ gridColumn: '9 / span 4', ...retraso(5) }} aria-label="Por qué Relevo">
        {ventajas.map(([n, t, d]) => <div key={t} className="ventaja">
          <span className="ficha-icono"><Icono n={n} /></span>
          <div><p className="ventaja-titulo">{t}</p><p className="secundario pequeno" style={{ margin: '2px 0 0' }}>{d}</p></div>
        </div>)}
      </aside>
    </section>
    <section className="contenedor" style={{ marginTop: 'clamp(72px, 10vw, 136px)' }} aria-labelledby="t-categorias">
      <h2 className="h2 revelar" id="t-categorias">Categorías</h2>
      <div className="categorias" style={{ marginTop: 24 }}>{CFG.CATEGORIAS.map((c, i) =>
        <A key={c.id} a={'/explorar?cat=' + c.id} className="categoria revelar" style={retraso(i)}>
          <span className="ficha-icono ficha-cuadrada"><Icono n={ICONO_CATEGORIA[c.id] || 'box'} /></span>
          <span className="categoria-nombre">{c.nombre}</span>
        </A>)}</div>
    </section>
    <section className="contenedor grilla" style={{ marginTop: 'clamp(96px, 12vw, 176px)' }}>
      <div style={{ gridColumn: '1 / span 4' }}><h2 className="h2 revelar" style={{ position: 'sticky', top: 128 }}>Así funciona.</h2></div>
      <ol ref={ref} className="recorrido" style={{ gridColumn: '6 / span 7', '--progreso': progreso }}>
        <span className="testigo-viajero" aria-hidden="true" />
        {pasos.map(([t, d], i) =>
        <li key={t} className={progreso >= i / pasos.length + 0.02 || progreso >= 0.98 ? 'activo' : ''}>
          <p className="etiqueta">Paso {i + 1}</p>
          <p className="h2" style={{ marginTop: 8 }}>{t}</p><p className="texto secundario" style={{ marginTop: 12 }}>{d}</p>
        </li>)}</ol>
    </section>
  </div>;
}

/* ---------- Tarjeta y explorar ---------- */
function Tarjeta({ p, i = 0 }) {
  return <A a={'/material/' + p.id} className="tarjeta tarjeta-blanca revelar" style={retraso(i % 4)}>
    <div style={{ position: 'relative' }}>
      <Cuadro cat={p.categoria} foto={portadaDe(p)} alt={p.titulo} />
      <span className="insignia">{p.estado}</span>
    </div>
    <div style={{ padding: '4px 4px 2px' }}>
      <p className="titulo">{p.titulo}</p>
      <p className="precio">{L.soles(p.precio)}</p>
      <p className="meta">{p.curso} · {p.universidad}</p>
      {p.fotoVerificada && <p className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--carbon)', marginTop: 8 }}><Icono n="shield" s={15} />Foto verificada</p>}
    </div>
  </A>;
}

function Explorar({ ruta }) {
  const d = useDatos();
  const [q, setQ] = useState(ruta.query.get('q') || '');
  const [cat, setCat] = useState(ruta.query.get('cat') || '');
  const [uni, setUni] = useState('');
  useEffect(() => { setCat(ruta.query.get('cat') || ''); }, [ruta.query.get('cat')]);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return d.publicaciones.filter(p => p.revision === 'aprobada' && !p.retirada && Datos.disponible(p.id)
      && (!cat || p.categoria === cat) && (!uni || p.universidad === uni)
      && (!t || [p.titulo, p.curso, p.universidad, p.descripcion].join(' ').toLowerCase().includes(t)));
  }, [d.publicaciones, d.pedidos, q, cat, uni]);
  const limpiar = () => { setQ(''); setCat(''); setUni(''); if (ruta.query.get('cat')) ir('/explorar'); };
  return <div className="pantalla contenedor">
    <div className="grilla" style={{ paddingTop: 'clamp(40px, 6vw, 80px)', alignItems: 'end' }}>
      <h1 className="h1" style={{ gridColumn: '1 / span 6' }}>Encuentra lo que necesitas.</h1>
    </div>
    <form className="grilla" role="search" onSubmit={e => e.preventDefault()} style={{ marginTop: 40, rowGap: 16 }}>
      <div style={{ gridColumn: '1 / span 6' }}><Campo id="buscar" etiqueta="Buscar"><input id="buscar" className="entrada" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Curso, material o universidad" /></Campo></div>
      <div style={{ gridColumn: '7 / span 3' }}><Campo id="f-cat" etiqueta="Categoría"><select id="f-cat" className="entrada" value={cat} onChange={e => setCat(e.target.value)}><option value="">Todas</option>{CFG.CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Campo></div>
      <div style={{ gridColumn: '10 / span 3' }}><Campo id="f-uni" etiqueta="Universidad"><select id="f-uni" className="entrada" value={uni} onChange={e => setUni(e.target.value)}><option value="">Todas</option>{universidades().map(u => <option key={u}>{u}</option>)}</select></Campo></div>
    </form>
    <div style={{ marginTop: 56 }}>
      {!d.listo ? <Arco bloque texto="Cargando materiales" />
        : !lista.length && !q && !cat && !uni ? <Vacio titulo="Todavía no hay materiales publicados." texto="Sé de los primeros: publica lo que ya no usas." accion={<A a="/publicar" className="boton">Publicar mi material</A>} />
        : !lista.length ? <Vacio titulo="No encontramos materiales con esos filtros." texto="Prueba con otro curso o quita los filtros." accion={<button className="boton" onClick={limpiar}>Quitar filtros</button>} />
          : <><p className="secundario pequeno" style={{ marginBottom: 24 }} aria-live="polite">{lista.length} {lista.length === 1 ? 'material disponible' : 'materiales disponibles'}</p><div className="rejilla">{lista.map((p, i) => <Tarjeta key={p.id} p={p} i={i} />)}</div></>}
    </div>
  </div>;
}

/* ---------- Detalle del material ---------- */
/* Fotos completas: en el piloto se cargan aparte para que la lista sea liviana. */
function useFotos(p) {
  const [fotos, setFotos] = useState(() => p.fotos.some(x => x.src) ? p.fotos : null);
  useEffect(() => { let vivo = true; if (!fotos) Datos.cargarFotos(p.id).then(r => vivo && setFotos(r), () => vivo && setFotos(p.fotos)); return () => { vivo = false; }; }, [p.id]);
  return fotos;
}
function Galeria({ p }) {
  const [i, setI] = useState(0);
  const cargadas = useFotos(p);
  const lista = cargadas || p.fotos.map((x, k) => k === 0 ? portadaDe(p) : x);
  const f = lista[i] || lista[0];
  return <div>
    <Cuadro cat={p.categoria} foto={f} rotulo={f && !f.src ? f.angulo : ''} alt={p.titulo + ', ' + (f ? f.angulo.toLowerCase() : '')} />
    {lista.length > 1 && <div className="miniaturas" role="group" aria-label="Fotos del material">{lista.map((x, k) =>
      <button key={k} type="button" onClick={() => setI(k)} aria-label={'Ver ' + x.angulo.toLowerCase()} aria-pressed={k === i} style={{ padding: 0, border: 0, background: 'none', cursor: 'pointer', outline: k === i ? '1px solid #1E2024' : 'none', outlineOffset: 3 }}>
        <Cuadro cat={p.categoria} foto={x} alt="" />
      </button>)}</div>}
  </div>;
}

function Material({ id }) {
  const d = useDatos();
  if (!d.listo) return <Arco bloque />;
  const p = d.publicaciones.find(x => x.id === id);
  if (!p || p.revision !== 'aprobada' || p.retirada) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="Este material ya no está publicado." texto="Puede que se haya vendido o que el vendedor lo haya retirado." accion={<A a="/explorar" className="boton">Explorar materiales</A>} /></div>;
  const vendedor = d.usuarios.find(u => u.id === p.vendedorId);
  const propio = d.sesion && d.sesion.id === p.vendedorId;
  const libre = Datos.disponible(p.id);
  return <div className="pantalla contenedor">
    <div style={{ paddingTop: 32 }}><Volver a="/explorar">Volver a explorar</Volver></div>
    <div className="grilla" style={{ marginTop: 24, rowGap: 40 }}>
      <div style={{ gridColumn: '1 / span 7' }} className="aparecer"><Galeria p={p} /></div>
      <div style={{ gridColumn: '9 / span 4', ...retraso(2) }} className="pila-3 aparecer">
        <p className="etiqueta">{categoria(p.categoria).nombre}</p>
        <h1 className="h2">{p.titulo}</h1>
        <p className="h2 cifra">{L.soles(p.precio)}</p>
        {propio ? <p className="nota">Esta es tu publicación.</p>
          : !libre ? <p className="nota">Otra persona ya está comprando este material.</p>
            : <div className="pila"><A a={'/pago/' + p.id} className="boton boton-principal boton-ancho">Comprar</A>
              <p className="secundario pequeno">Pagas con Yape. Relevo guarda el dinero hasta que confirmes que recibiste el material.</p></div>}
        {p.fotoVerificada && <div className="pila" style={{ paddingTop: 8 }}><Sello /><p className="secundario pequeno">El equipo revisó que las fotos muestran este objeto y que se tomaron con el código del día.</p></div>}
        <dl className="datos">
          <div><dt>Estado</dt><dd>{p.estado}</dd></div>
          <div><dt>Curso</dt><dd>{p.curso}</dd></div>
          <div><dt>Universidad</dt><dd>{p.universidad}</dd></div>
          <div><dt>Vendedor</dt><dd>{p.vendedorNombre || primerNombre(vendedor && vendedor.nombre)}{(p.vendedorVerificado ?? L.vendedorVerificado(vendedor, CFG)) ? <span className="secundario"> · Vendedor verificado</span> : ''}</dd></div>
          <div><dt>Publicado</dt><dd>{fechaCorta(p.creado)}</dd></div>
        </dl>
        <p className="texto">{p.descripcion}</p>
      </div>
    </div>
  </div>;
}

/* ---------- Pantalla de pago con QR de Yape ---------- */
function Pago({ id }) {
  const d = useDatos();
  const avisar = useAviso();
  const [op, setOp] = useState('');
  const [monto, setMonto] = useState('');
  const [enPaso3, setEnPaso3] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [errores, setErrores] = useState({});
  const [hecho, setHecho] = useState(null);
  const acc = usarAccion();
  if (!d.listo) return <Arco bloque />;
  const p = d.publicaciones.find(x => x.id === id);
  if (!d.sesion) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="Inicia sesión para comprar." texto="Después vuelves directo a esta pantalla de pago." accion={<A a={'/ingresar?volver=/pago/' + id} className="boton boton-principal">Iniciar sesión</A>} /></div>;
  if (hecho) return <div className="contenedor pantalla grilla" style={{ paddingTop: 96 }}>
    <div style={{ gridColumn: '1 / span 7' }} className="pila-3">
      <div className="exito"><span className="testigo" aria-hidden="true" /><h1 className="h2">Recibimos tu número de operación.</h1></div>
      <p className="texto secundario">El equipo lo revisará en el historial de Yape. Cuando confirme tu pago, te avisaremos para coordinar la entrega. Relevo guarda el dinero hasta que confirmes que recibiste el material.</p>
      <div className="acciones"><A a={'/pedido/' + hecho.id} className="boton">Ver mi compra</A><A a="/explorar" className="enlace">Seguir explorando</A></div>
    </div>
  </div>;
  if (!p || p.revision !== 'aprobada' || p.retirada) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="Este material ya no está disponible." accion={<A a="/explorar" className="boton">Explorar materiales</A>} /></div>;
  if (p.vendedorId === d.sesion.id) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="Esta es tu publicación." texto="No puedes comprar tu propio material." accion={<A a={'/material/' + id} className="boton">Volver al material</A>} /></div>;
  if (!Datos.disponible(p.id)) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="Otra persona ya está comprando este material." accion={<A a="/explorar" className="boton">Explorar materiales</A>} /></div>;

  const necesitaTerminos = !d.sesion.aceptoTerminos;
  const enviar = async e => {
    e.preventDefault();
    if (ENTREVISTA) { avisar('Fin de la demostración. No se creó ningún pedido.'); ir('/material/' + id); return; }
    const err = {};
    const v = L.validarOperacion(op); if (!v.valido) err.op = v.error;
    const m = L.validarMonto(monto); if (!m.valido) err.monto = m.error;
    if (necesitaTerminos && !acepto) err.terminos = 'Acepta los términos para comprar.';
    setErrores(err);
    if (Object.keys(err).length) { document.getElementById(err.op ? 'operacion' : err.monto ? 'monto' : 'acepto').focus(); return; }
    try { setHecho(await acc.correr(() => Datos.comprar(p.id, op.replace(/\s/g, ''), monto))); window.scrollTo(0, 0); } catch (_) { }
  };
  const actual = ENTREVISTA ? 0 : (enPaso3 || op) ? 2 : 0;
  const pasos = [
    { titulo: 'Escanea el QR con Yape.', texto: 'Abre Yape, elige escanear y apunta al código. El titular que verás es ' + CFG.YAPE_TITULAR + '.' },
    { titulo: 'Escribe exactamente ' + L.soles(p.precio) + '.', texto: 'Si el monto es distinto, el equipo no podrá confirmar tu pago.' },
    {
      titulo: ENTREVISTA ? 'Vuelve aquí y escribe el número de operación.' : 'Vuelve aquí y escribe el número de operación y el monto.',
      texto: ENTREVISTA ? 'Aparece en el detalle del Yape. No hace falta enviar captura.' : <div className="pila" style={{ marginTop: 12 }}>
        <Campo id="operacion" etiqueta="Número de operación" ayuda="Aparece en el detalle del Yape. No hace falta enviar captura." error={errores.op}>
          <input id="operacion" className="entrada" inputMode="numeric" autoComplete="off" value={op} onFocus={() => setEnPaso3(true)} onChange={e => setOp(e.target.value)} aria-describedby={errores.op ? 'operacion-error' : 'operacion-ayuda'} aria-invalid={!!errores.op} required />
        </Campo>
        <Campo id="monto" etiqueta="Monto que enviaste" ayuda={'Debe ser ' + L.soles(p.precio) + '.'} error={errores.monto || (monto && L.validarMonto(monto).valido && L.leerPrecio(monto) !== p.precio ? 'No coincide con ' + L.soles(p.precio) + '. Si enviaste otro monto, escríbelo igual y el equipo lo revisará.' : '')}>
          <div className="prefijo"><span aria-hidden="true">S/</span><input id="monto" className="entrada" inputMode="decimal" autoComplete="off" value={monto} onFocus={() => setEnPaso3(true)} onChange={e => setMonto(e.target.value)} aria-invalid={!!errores.monto} required /></div>
        </Campo>
      </div>
    }
  ];
  return <div className="pantalla contenedor">
    <div style={{ paddingTop: 32 }}><Volver a={'/material/' + id}>Volver al material</Volver></div>
    <form onSubmit={enviar} noValidate className="grilla" style={{ marginTop: 24, rowGap: 48 }}>
      <div style={{ gridColumn: '1 / span 6', gridRow: 1 }} className="pila-5">
        <h1 className="h1">Paga con Yape.</h1>
        {ENTREVISTA && <div className="nota"><strong>Modo entrevista.</strong> En esta demostración nadie paga: no escanees el código. Te mostramos cómo sería el pago.</div>}
        <div className="resumen-material"><Cuadro cat={p.categoria} foto={portadaDe(p)} alt="" /><div><p style={{ margin: 0, fontWeight: 500 }}>{p.titulo}</p><p className="secundario pequeno" style={{ margin: 0 }}>{p.estado} · {p.universidad}</p></div></div>
        <div><p className="etiqueta">Monto exacto a pagar</p><p className="monto" style={{ marginTop: 8 }}>{L.soles(p.precio)}</p></div>
      </div>
      <div style={{ gridColumn: '8 / span 5', gridRow: '1 / span 2' }}>
        <div className="tarjeta-qr pila-3">
          <img src={RAIZ + CFG.YAPE_QR} alt={'Código QR de Yape a nombre de ' + CFG.YAPE_TITULAR} width="1206" height="900" />
          <hr className="hilo" />
          <div><p className="etiqueta">Titular en Yape</p><p style={{ margin: '4px 0 0', fontSize: 20 }}>{CFG.YAPE_TITULAR}</p></div>
        </div>
      </div>
      <div style={{ gridColumn: '1 / span 6', gridRow: 2 }} className="pila-5">
        <Pasos pasos={pasos} actual={actual} />
        <p className="nota">Relevo guarda tu dinero hasta que confirmes que recibiste el material y estás conforme. Si algo sale mal, puedes reportarlo desde tu compra.</p>
        {necesitaTerminos && !ENTREVISTA && <div>
          <label className="casilla" htmlFor="acepto"><input id="acepto" type="checkbox" checked={acepto} onChange={e => setAcepto(e.target.checked)} aria-invalid={!!errores.terminos} />
            <span>Acepto los <A a="/terminos">Términos de uso</A>, la <A a="/devoluciones">Política de devolución y reclamos</A> y el <A a="/privacidad">Aviso de privacidad</A>.</span></label>
          {errores.terminos && <span className="mensaje-error" role="alert">{errores.terminos}</span>}
        </div>}
        <NotaError>{acc.error}</NotaError>
        <div>
          <button className="boton boton-principal boton-ancho" disabled={acc.cargando}>{acc.cargando ? 'Enviando' : ENTREVISTA ? 'Terminar demostración' : 'Informar mi pago'}</button>
          {acc.cargando && <div style={{ marginTop: 16 }}><Arco texto="Registrando tu pago" /></div>}
        </div>
      </div>
    </form>
  </div>;
}

/* ---------- Ingresar (Fase A: usuarios de prueba) ---------- */
function Ingresar({ ruta }) {
  const d = useDatos();
  const acc = usarAccion();
  const volver = ruta.query.get('volver') || '/';
  const entrar = async id => { try { await acc.correr(() => Datos.iniciarSesion(id)); ir(volver.startsWith('/') ? volver : '/'); } catch (_) { } };
  useEffect(() => { if (Datos.modo === 'firebase' && d.sesion && d.listo) ir(volver.startsWith('/') ? volver : '/'); }, [d.sesion && d.sesion.id, d.listo]);
  if (Datos.modo === 'firebase') {
    return <div className="pantalla contenedor grilla" style={{ paddingTop: 'clamp(48px, 8vw, 112px)' }}>
      <div style={{ gridColumn: '1 / span 6' }} className="pila-3">
        <h1 className="h1">Ingresa a Relevo.</h1>
        <p className="texto secundario">Usa tu cuenta de Google. Si es tu correo de la universidad, quedas verificado al instante. Si no, el equipo verifica tu cuenta.</p>
        <div><button className="boton boton-principal" onClick={() => acc.correr(() => Datos.iniciarSesion()).catch(() => {})} disabled={acc.cargando}>{acc.cargando ? 'Abriendo Google' : 'Continuar con Google'}</button></div>
        {acc.cargando && <Arco texto="Esperando a Google" />}
        <NotaError>{acc.error}</NotaError>
        <p className="secundario pequeno">Solo guardamos tu nombre, tu correo y tu universidad. Lee el <A a="/privacidad">Aviso de privacidad</A>.</p>
      </div>
    </div>;
  }
  const opciones = [['u-comprador', 'Comprador de prueba'], ['u-vendedor', 'Vendedor con correo institucional'], ['u-vendedora', 'Vendedora sin correo institucional'], ['u-equipo', 'Equipo de Relevo']];
  return <div className="pantalla contenedor grilla" style={{ paddingTop: 'clamp(48px, 8vw, 112px)' }}>
    <div style={{ gridColumn: '1 / span 6' }} className="pila-3">
      <h1 className="h1">Ingresa a Relevo.</h1>
      <p className="texto secundario">En esta demostración eliges un usuario de prueba. En el piloto ingresarás con tu cuenta de Google.</p>
      {d.sesion && <p className="nota">Ya ingresaste como {d.sesion.nombre}. Puedes cambiar de usuario.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', borderTop: '1px solid var(--niebla)' }}>{opciones.map(([id, t]) => {
        const u = d.usuarios.find(x => x.id === id);
        return <li key={id} style={{ borderBottom: '1px solid var(--niebla)' }}>
          <button type="button" onClick={() => entrar(id)} disabled={acc.cargando} style={{ width: '100%', minHeight: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'none', border: 0, padding: '12px 0', cursor: 'pointer', textAlign: 'left' }}>
            <span><span style={{ display: 'block', fontWeight: 500 }}>{t}</span><span className="secundario pequeno">{u.nombre} · {u.correo}</span></span>
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true"><path d="M9 1l4 4-4 4M13 5H1" fill="none" stroke="#1E2024" strokeWidth="1.2" /></svg>
          </button>
        </li>;
      })}</ul>
      {acc.cargando && <Arco texto="Ingresando" />}
      <NotaError>{acc.error}</NotaError>
    </div>
  </div>;
}

/* ---------- Verificar el correo universitario ---------- */
function Verificar() {
  const d = useDatos();
  const acc = usarAccion();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState('');
  const [pide, setPide] = useState(false);
  const [hecho, setHecho] = useState(null);
  const enlace = Datos.hayEnlaceVerificacion();
  const completar = async c => { try { setHecho(await acc.correr(() => Datos.completarVerificacion(c))); } catch (e) { if (e.pideCorreo) setPide(true); } };
  useEffect(() => { if (enlace && d.listo && d.sesion && !hecho && !acc.cargando && !acc.error) completar(); }, [enlace, d.listo, d.sesion && d.sesion.id]);
  if (!d.listo) return <Arco bloque />;
  if (!d.sesion) return <PideSesion texto={enlace ? 'Ingresa con tu cuenta para terminar de verificar tu correo.' : 'Inicia sesión para verificar tu correo universitario.'} volver="/verificar" />;
  const yaTiene = d.sesion.correoUniversitario || (L.universidadPorCorreo(d.sesion.correo, CFG) ? d.sesion.correo : '');
  const marco = hijos => <div className="pantalla contenedor grilla" style={{ paddingTop: 'clamp(48px, 8vw, 112px)' }}><div style={{ gridColumn: '1 / span 6' }} className="pila-3">{hijos}</div></div>;

  if (hecho || (yaTiene && !enlace)) return marco(<>
    <div className="exito"><span className="testigo" aria-hidden="true" /><h1 className="h2">Tu correo universitario está verificado.</h1></div>
    <p className="texto secundario">{(hecho && hecho.correo) || yaTiene} · {(hecho && hecho.universidad) || L.universidadPorCorreo(yaTiene, CFG)}. Ahora apareces como vendedor verificado en tus publicaciones.</p>
    <div className="acciones"><A a="/publicar" className="boton boton-principal">Publicar mi material</A><A a="/explorar" className="enlace">Explorar materiales</A></div>
  </>);

  if (enlace) return marco(<>
    <h1 className="h1">Verificando tu correo.</h1>
    {acc.cargando && <Arco texto="Comprobando el enlace" />}
    {pide && <form className="pila-3" onSubmit={e => { e.preventDefault(); completar(correo); }} noValidate>
      <p className="texto secundario">Abriste el enlace en otro navegador. Escribe el correo universitario al que llegó para terminar.</p>
      <Campo id="v-correo2" etiqueta="Correo universitario"><input id="v-correo2" className="entrada" type="email" autoComplete="email" value={correo} onChange={e => setCorreo(e.target.value)} /></Campo>
      <div><button className="boton boton-principal" disabled={acc.cargando}>Terminar verificación</button></div>
    </form>}
    {!pide && <NotaError>{acc.error}</NotaError>}
    {!acc.cargando && acc.error && !pide && <div><button className="boton" onClick={() => { history.replaceState(null, '', location.pathname + '#/verificar'); location.reload(); }}>Pedir un enlace nuevo</button></div>}
  </>);

  if (enviado) return marco(<>
    <div className="exito"><span className="testigo" aria-hidden="true" /><h1 className="h2">Revisa tu correo.</h1></div>
    <p className="texto secundario">Te enviamos un enlace a <strong>{enviado}</strong>. Ábrelo en este mismo navegador para terminar. Si no llega en unos minutos, revisa la carpeta de correo no deseado.</p>
    <div><button className="enlace" onClick={() => setEnviado('')}>Usar otro correo</button></div>
  </>);

  const enviar = async e => {
    e.preventDefault(); setError('');
    const c = correo.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+$/.test(c)) { setError('Escribe un correo válido.'); return; }
    if (!L.universidadPorCorreo(c, CFG)) { setError('Ese correo no es de una universidad de la lista. Usa el correo que te dio tu universidad.'); return; }
    try { const r = await acc.correr(() => Datos.enviarVerificacion(c)); if (r && r.demo) setHecho({ correo: c, universidad: L.universidadPorCorreo(c, CFG) }); else setEnviado(c); } catch (_) { }
  };
  return marco(<>
    <h1 className="h1">Verifica tu correo universitario.</h1>
    <p className="texto secundario">Te enviamos un enlace a tu correo de la universidad. Al abrirlo, apareces como vendedor verificado. Tu cuenta de Google no cambia.</p>
    <form className="pila-3" onSubmit={enviar} noValidate>
      <Campo id="v-correo" etiqueta="Correo universitario" ayuda={'Universidades aceptadas: ' + universidades().join(', ') + '.'} error={error}>
        <input id="v-correo" className="entrada" type="email" autoComplete="email" inputMode="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="tucodigo@upc.edu.pe" aria-invalid={!!error} />
      </Campo>
      <NotaError>{acc.error}</NotaError>
      <div className="acciones"><button className="boton boton-principal" disabled={acc.cargando}>{acc.cargando ? 'Enviando' : 'Enviar enlace'}</button>{acc.cargando && <Arco texto="Enviando" />}</div>
    </form>
    {Datos.modo === 'demo' && <p className="secundario pequeno">En la demostración no se envía ningún correo: la verificación se simula al instante.</p>}
  </>);
}

function PideSesion({ texto, volver }) {
  return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo={texto} accion={<A a={'/ingresar?volver=' + volver} className="boton boton-principal">Iniciar sesión</A>} /></div>;
}

/* ---------- Publicar ---------- */
function Publicar() {
  const d = useDatos();
  const vacio = { titulo: '', categoria: '', estado: '', curso: '', universidad: '', descripcion: '', precio: '', fotos: [] };
  const [f, setF] = useState(vacio);
  const [acepto, setAcepto] = useState(false);
  const [errores, setErrores] = useState({});
  const [hecho, setHecho] = useState(null);
  const acc = usarAccion();
  const codigo = useMemo(() => L.codigoDelDia(), []);
  useEffect(() => { if (d.sesion && !f.universidad && d.sesion.universidad) setF(x => ({ ...x, universidad: d.sesion.universidad })); }, [d.sesion && d.sesion.id]);
  if (!d.listo) return <Arco bloque />;
  if (!d.sesion) return <PideSesion texto="Inicia sesión para publicar tu material." volver="/publicar" />;
  if (hecho) return <div className="contenedor pantalla grilla" style={{ paddingTop: 96 }}>
    <div style={{ gridColumn: '1 / span 7' }} className="pila-3">
      <div className="exito"><span className="testigo" aria-hidden="true" /><h1 className="h2">Tu material está en revisión.</h1></div>
      <p className="texto secundario">El equipo revisará las fotos y el código del día. Cuando lo apruebe, se publicará con la marca Foto verificada.</p>
      <div className="acciones"><A a="/ventas" className="boton">Ver mis ventas</A><button className="enlace" onClick={() => { setF(vacio); setHecho(null); setErrores({}); }}>Publicar otro material</button></div>
    </div>
  </div>;

  const cambiar = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const venta = L.calcularVenta(f.precio, CFG);
  const angulos = f.categoria ? L.angulosDe(f.categoria, CFG) : [];
  const verificado = L.vendedorVerificado(d.sesion, CFG);
  const tomar = (i, angulo) => e => {
    const archivo = e.target.files && e.target.files[0];
    if (!archivo) return;
    if (!/^image\//.test(archivo.type)) { setErrores(x => ({ ...x, fotos: 'Ese archivo no es una imagen.' })); return; }
    const fotos = [...f.fotos];
    fotos[i] = { angulo, src: URL.createObjectURL(archivo), fecha: new Date().toISOString() };
    setF(x => ({ ...x, fotos }));
  };
  const enviar = async e => {
    e.preventDefault();
    const datos = { ...f, fotos: angulos.map((_, i) => f.fotos[i]).filter(Boolean), codigo, aceptoTerminos: acepto || d.sesion.aceptoTerminos };
    const err = L.validarPublicacion(datos, CFG);
    setErrores(err);
    const primero = Object.keys(err)[0];
    if (primero) { const el = document.getElementById('p-' + primero); el && el.focus(); return; }
    try { setHecho(await acc.correr(() => Datos.publicar(datos))); window.scrollTo(0, 0); } catch (x) { if (x.campos) setErrores(x.campos); }
  };
  const seccion = (titulo, texto, hijos) => <section className="grilla" style={{ paddingTop: 48, marginTop: 48, borderTop: '1px solid var(--niebla)', rowGap: 24 }}>
    <div style={{ gridColumn: '1 / span 4' }}><h2 className="h3">{titulo}</h2>{texto && <p className="secundario pequeno" style={{ marginTop: 8, maxWidth: '36ch' }}>{texto}</p>}</div>
    <div style={{ gridColumn: '6 / span 7' }} className="pila-3">{hijos}</div>
  </section>;

  return <div className="pantalla contenedor">
    <div className="grilla" style={{ paddingTop: 'clamp(40px, 6vw, 80px)' }}>
      <div style={{ gridColumn: '1 / span 7' }} className="pila">
        <h1 className="h1">Publica tu material en dos minutos.</h1>
        <p className="texto secundario">Tú pones el precio. Las fotos se toman con el código del día para que quien compre sepa que el objeto existe y es tuyo.</p>
        {!verificado && <p className="nota">Todavía no apareces como vendedor verificado. <A a="/verificar">Verifica tu correo universitario</A> o publica igual: el equipo revisará tu cuenta.</p>}
      </div>
    </div>
    <form onSubmit={enviar} noValidate>
      {seccion('Qué vendes', 'Mientras más claro, más rápido lo encuentra quien lo necesita.', <>
        <Campo id="p-titulo" etiqueta="Material" error={errores.titulo}><input id="p-titulo" className="entrada" value={f.titulo} onChange={cambiar('titulo')} placeholder="Por ejemplo: Cálculo de una variable, 8.a edición" aria-invalid={!!errores.titulo} /></Campo>
        <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}><legend className="etiqueta" style={{ marginBottom: 8, color: 'var(--carbon)' }}>Categoría</legend>
          <div className="opciones" id="p-categoria" tabIndex={-1}>{CFG.CATEGORIAS.map(c => <label key={c.id} className="opcion"><input type="radio" name="cat" value={c.id} checked={f.categoria === c.id} onChange={cambiar('categoria')} /><span>{c.nombre}</span></label>)}</div>
          {errores.categoria && <span className="mensaje-error" role="alert">{errores.categoria}</span>}</fieldset>
        <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}><legend className="etiqueta" style={{ marginBottom: 8, color: 'var(--carbon)' }}>Estado</legend>
          <div className="opciones" id="p-estado" tabIndex={-1}>{CFG.ESTADOS_MATERIAL.map(s => <label key={s} className="opcion"><input type="radio" name="estado" value={s} checked={f.estado === s} onChange={cambiar('estado')} /><span>{s}</span></label>)}</div>
          {errores.estado && <span className="mensaje-error" role="alert">{errores.estado}</span>}</fieldset>
        <div className="grilla" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', rowGap: 24 }}>
          <div style={{ gridColumn: 'span 1' }}><Campo id="p-curso" etiqueta="Curso" error={errores.curso}><input id="p-curso" className="entrada" value={f.curso} onChange={cambiar('curso')} placeholder="Por ejemplo: Cálculo 1" aria-invalid={!!errores.curso} /></Campo></div>
          <div style={{ gridColumn: 'span 1' }}><Campo id="p-universidad" etiqueta="Universidad" error={errores.universidad}><select id="p-universidad" className="entrada" value={f.universidad} onChange={cambiar('universidad')} aria-invalid={!!errores.universidad}><option value="">Elige</option>{universidades().map(u => <option key={u}>{u}</option>)}</select></Campo></div>
        </div>
        <Campo id="p-descripcion" etiqueta="Descripción" ayuda="Qué incluye, qué detalles de uso tiene y si le falta algo." error={errores.descripcion}><textarea id="p-descripcion" className="entrada" value={f.descripcion} onChange={cambiar('descripcion')} aria-invalid={!!errores.descripcion} /></Campo>
      </>)}

      {seccion('Precio', 'Tú decides cuánto cobrar.', <>
        <Campo id="p-precio" etiqueta="Precio" error={errores.precio}>
          <div className="prefijo"><span aria-hidden="true">S/</span><input id="p-precio" className="entrada" inputMode="decimal" value={f.precio} onChange={cambiar('precio')} placeholder="0.00" aria-invalid={!!errores.precio} aria-describedby="p-calculo" /></div>
        </Campo>
        <div className="calculo" id="p-calculo" aria-live="polite">
          <p className="etiqueta">Recibirás</p>
          <p className="recibe">{venta.valido ? L.soles(venta.recibe) : 'S/ 0.00'}</p>
          <p className="secundario pequeno" style={{ marginTop: 8 }}>Relevo cobra {L.soles(CFG.COMISION_VENDEDOR)} fijos por venta completada.{venta.valido ? ' Recibirás ' + L.soles(venta.recibe) + '.' : ''}</p>
          {venta.valido && (venta.aviso
            ? <p className="pequeno" style={{ marginTop: 8, fontWeight: 500 }}>{venta.aviso}</p>
            : <p className="secundario pequeno" style={{ marginTop: 8 }}>La comisión equivale al {venta.porcentaje} % del precio.</p>)}
          <p className="secundario pequeno" style={{ marginTop: 8 }}>Quien compra paga solo el precio publicado.</p>
        </div>
      </>)}

      {seccion('Foto verificada', 'Una foto por ángulo, con el código del día escrito en un papel junto al material.', <>
        <div className="pila"><p className="etiqueta">Código de hoy</p><p className="codigo-dia" aria-label={'Código de hoy: ' + codigo.split('').join(' ')}>{codigo}</p><p className="secundario pequeno">Escríbelo a mano en un papel y ponlo junto al material en cada foto. Cambia todos los días.</p></div>
        {!f.categoria ? <p className="nota" id="p-fotos" tabIndex={-1}>Elige la categoría para ver qué ángulos fotografiar.</p>
          : <div className="visor" id="p-fotos" tabIndex={-1}>{angulos.map((a, i) => {
            const foto = f.fotos[i];
            return <label key={f.categoria + a} className={'toma' + (foto ? ' lista' : '')}>
              <input type="file" accept="image/*" capture="environment" onChange={tomar(i, a)} aria-label={(foto ? 'Volver a tomar: ' : 'Tomar foto: ') + a} />
              <Cuadro cat={f.categoria} foto={foto} rotulo={foto ? '' : 'Toca para abrir la cámara'} alt={a} />
              <span className="toma-pie"><span style={{ fontWeight: 500 }}>{a}</span><span className="secundario">{foto ? 'Tomada ' + fechaHora(foto.fecha).split(', ').pop() : 'Pendiente'}</span></span>
            </label>;
          })}</div>}
        {errores.fotos && <span className="mensaje-error" role="alert">{errores.fotos}</span>}
        <p className="secundario pequeno">Abrimos la cámara cuando tu navegador lo permite. Guardamos la fecha y la hora en que subes cada foto. El equipo revisa que el código del día aparezca antes de aprobar.</p>
      </>)}

      <section className="grilla" style={{ paddingTop: 48, marginTop: 48, borderTop: '1px solid var(--niebla)' }}>
        <div style={{ gridColumn: '6 / span 7' }} className="pila-3">
          {!d.sesion.aceptoTerminos && <div><label className="casilla" htmlFor="p-terminos"><input id="p-terminos" type="checkbox" checked={acepto} onChange={e => setAcepto(e.target.checked)} aria-invalid={!!errores.terminos} />
            <span>Acepto los <A a="/terminos">Términos de uso</A>, la <A a="/devoluciones">Política de devolución y reclamos</A> y el <A a="/privacidad">Aviso de privacidad</A>.</span></label>
            {errores.terminos && <span className="mensaje-error" role="alert">{errores.terminos}</span>}</div>}
          {Object.keys(errores).length > 0 && <NotaError>Revisa los campos marcados antes de publicar.</NotaError>}
          <NotaError>{acc.error && acc.error !== 'Revisa los campos marcados.' ? acc.error : ''}</NotaError>
          <div className="acciones"><button className="boton boton-principal" disabled={acc.cargando}>{acc.cargando ? 'Enviando' : 'Enviar a revisión'}</button>{acc.cargando && <Arco texto="Enviando tu publicación" />}</div>
        </div>
      </section>
    </form>
  </div>;
}

/* ---------- Mis compras y mis ventas ---------- */
function MisPedidos({ tipo }) {
  const d = useDatos();
  const acc = usarAccion();
  const avisar = useAviso();
  if (!d.listo) return <Arco bloque />;
  if (!d.sesion) return <PideSesion texto={tipo === 'compras' ? 'Inicia sesión para ver tus compras.' : 'Inicia sesión para ver tus ventas.'} volver={'/' + tipo} />;
  const yo = d.sesion.id;
  const lista = d.pedidos.filter(p => tipo === 'compras' ? p.compradorId === yo : p.vendedorId === yo);
  const mias = tipo === 'ventas' ? d.publicaciones.filter(p => p.vendedorId === yo && !p.retirada) : [];
  const pubDe = id => d.publicaciones.find(x => x.id === id) || { titulo: 'Material', categoria: 'instrumento', fotos: [] };
  const revision = { aprobada: 'Publicada', en_revision: 'En revisión', rechazada: 'Rechazada' };
  const retirar = async id => { try { await acc.correr(() => Datos.retirarPublicacion(id)); avisar('Retiraste la publicación.'); } catch (_) { } };
  return <div className="pantalla contenedor">
    <div className="grilla" style={{ paddingTop: 'clamp(40px, 6vw, 80px)' }}>
      <h1 className="h1" style={{ gridColumn: '1 / span 8' }}>{tipo === 'compras' ? 'Mis compras' : 'Mis ventas'}</h1>
    </div>
    <div style={{ marginTop: 48 }}>
      {!lista.length ? <Vacio titulo={tipo === 'compras' ? 'Todavía no tienes compras.' : 'Todavía no tienes ventas.'} texto={tipo === 'compras' ? 'Encuentra lo que necesitas entre los materiales publicados.' : 'Cuando alguien compre tu material, lo verás aquí con su estado.'} accion={<A a={tipo === 'compras' ? '/explorar' : '/publicar'} className="boton">{tipo === 'compras' ? 'Explorar materiales' : 'Publicar mi material'}</A>} />
        : <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--niebla)' }}>{lista.map(p => {
          const pub = pubDe(p.pubId); const v = L.calcularVenta(p.precio, CFG);
          return <li key={p.id} className="fila">
            <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 16, alignItems: 'start' }}>
              <Cuadro cat={pub.categoria} foto={portadaDe(pub)} alt="" />
              <div><p style={{ margin: 0, fontWeight: 500 }}>{pub.titulo}</p><p className="secundario pequeno" style={{ margin: '2px 0 8px' }}>Pedido {p.id} · {fechaCorta(p.creado)}</p><EstadoTexto estado={p.estado} /></div>
            </div>
            <div style={{ textAlign: 'right' }} className="pila">
              {tipo === 'compras' ? <p className="h3 cifra">{L.soles(p.precio)}</p>
                : p.estado === 'cancelado' ? <p className="secundario pequeno" style={{ margin: 0 }}>Venta cancelada, sin cobro</p>
                  : <div><p className="h3 cifra">{L.soles(v.recibe)}</p><p className="secundario pequeno" style={{ margin: 0 }}>{p.estado === 'transferido' ? 'Recibiste' : 'Recibirás'} · precio {L.soles(p.precio)} menos {L.soles(CFG.COMISION_VENDEDOR)}</p></div>}
              <A a={'/pedido/' + p.id} className="enlace">Ver pedido</A>
            </div>
          </li>;
        })}</ul>}
    </div>
    {tipo === 'ventas' && <section style={{ marginTop: 96 }}>
      <h2 className="h2">Tus publicaciones</h2>
      {!mias.length ? <div style={{ marginTop: 24 }}><Vacio titulo="No tienes publicaciones activas." accion={<A a="/publicar" className="boton">Publicar mi material</A>} /></div>
        : <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', borderTop: '1px solid var(--niebla)' }}>{mias.map(p =>
          <li key={p.id} className="fila">
            <div><p style={{ margin: 0, fontWeight: 500 }}>{p.titulo}</p><p className="secundario pequeno" style={{ margin: '2px 0 0' }}>{p.revision === 'aprobada' && !Datos.disponible(p.id) ? 'Con un pedido en curso o vendida' : revision[p.revision]}{p.revision === 'rechazada' && p.motivoRechazo ? ': ' + p.motivoRechazo : ''} · {L.soles(p.precio)}</p></div>
            <div className="acciones">{p.revision === 'aprobada' && <A a={'/material/' + p.id} className="enlace">Ver</A>}{Datos.disponible(p.id) && <button className="enlace enlace-secundario" onClick={() => retirar(p.id)} disabled={acc.cargando}>Retirar</button>}</div>
          </li>)}</ul>}
      <NotaError>{acc.error}</NotaError>
    </section>}
  </div>;
}

/* ---------- Detalle del pedido: estado, entrega y reclamos ---------- */
const MOTIVOS = [['distinto', 'El material es distinto a la foto'], ['no_aparecio', 'La otra persona no apareció'], ['otro', 'Otro problema']];

function Reclamo({ cerrar, enviar, cargando, error }) {
  const [m, setM] = useState('');
  const [det, setDet] = useState('');
  const [err, setErr] = useState('');
  return <Dialogo titulo="Reportar un problema" cerrar={cerrar}>
    <form className="pila-3" onSubmit={e => { e.preventDefault(); if (!m) { setErr('Elige qué pasó.'); return; } enviar(m, det); }} noValidate>
      <p className="secundario pequeno">El pedido pasará a reclamo y el dinero seguirá retenido mientras el equipo lo revisa.</p>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="etiqueta" style={{ marginBottom: 8, color: 'var(--carbon)' }}>Qué pasó</legend>
        <div className="pila" style={{ marginTop: 0 }}>{MOTIVOS.map(([k, t]) => <label key={k} className="casilla" style={{ paddingTop: 4 }}><input type="radio" name="motivo" checked={m === k} onChange={() => { setM(k); setErr(''); }} /><span>{t}</span></label>)}</div>
        {err && <span className="mensaje-error" role="alert">{err}</span>}</fieldset>
      <Campo id="r-detalle" etiqueta="Detalle" ayuda="Cuéntanos lo necesario para resolverlo."><textarea id="r-detalle" className="entrada" value={det} onChange={e => setDet(e.target.value)} /></Campo>
      <NotaError>{error}</NotaError>
      <div className="acciones"><button className="boton" disabled={cargando}>{cargando ? 'Enviando' : 'Enviar reclamo'}</button><button type="button" className="enlace enlace-secundario" onClick={cerrar}>Cancelar</button></div>
    </form>
  </Dialogo>;
}

function Pedido({ id }) {
  const d = useDatos();
  const avisar = useAviso();
  const acc = usarAccion();
  const [reclamo, setReclamo] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [punto, setPunto] = useState('');
  const [horario, setHorario] = useState('');
  const [op, setOp] = useState('');
  const [monto2, setMonto2] = useState('');
  if (!d.listo) return <Arco bloque />;
  if (!d.sesion) return <PideSesion texto="Inicia sesión para ver este pedido." volver={'/pedido/' + id} />;
  const original = d.pedidos.find(x => x.id === id);
  const rol = original && L.rolEnPedido(d.sesion, original, CFG);
  if (!original || !rol) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="No encontramos este pedido entre los tuyos." accion={<A a="/compras" className="boton">Ver mis compras</A>} /></div>;
  /* El comprador solo recibe los campos permitidos: nunca la comisión. */
  const p = rol === 'comprador' ? L.pedidoParaComprador(original) : original;
  const pub = d.publicaciones.find(x => x.id === p.pubId) || { titulo: original.titulo || 'Material', categoria: 'instrumento', fotos: [], universidad: original.universidad || '' };
  const puntos = CFG.PUNTOS_ENTREGA[pub.universidad] || ['Patio de comidas de un centro comercial cercano', 'Cafetería concurrida cerca del campus'];
  const mover = async (estado, extra, msg) => { try { await acc.correr(() => Datos.moverPedido(id, estado, extra)); setReclamo(false); setConfirmar(false); avisar(msg); } catch (_) { } };
  const proponer = async e => { e.preventDefault(); try { await acc.correr(() => Datos.proponerEntrega(id, punto || p.entrega.punto, horario)); avisar('Propusiste el lugar y el horario de entrega.'); } catch (_) { } };
  const coordinable = ['pago_confirmado', 'en_coordinacion'].includes(p.estado);
  const puedeReclamar = L.puedeCambiar(p, 'en_reclamo', rol);
  const v = rol !== 'comprador' ? L.calcularVenta(p.precio, CFG) : null;
  const titulo = { comprador: 'Tu compra', vendedor: 'Tu venta', equipo: 'Pedido' }[rol];

  return <div className="pantalla contenedor">
    <div style={{ paddingTop: 32 }}><Volver a={rol === 'vendedor' ? '/ventas' : rol === 'equipo' ? '/equipo' : '/compras'}>{rol === 'vendedor' ? 'Volver a mis ventas' : rol === 'equipo' ? 'Volver al panel' : 'Volver a mis compras'}</Volver></div>
    <div className="grilla" style={{ marginTop: 24, rowGap: 56 }}>
      <div style={{ gridColumn: '1 / span 6' }} className="pila-5">
        <div className="pila"><p className="etiqueta">{titulo} · {p.id}</p><h1 className="h2">{pub.titulo}</h1></div>
        <section aria-label="Estado del pedido"><LineaTiempo pedido={p} /></section>
        {p.estado === 'en_reclamo' && !p.reclamo && <div className="nota"><strong>Reclamo abierto.</strong> El equipo lo está revisando y te escribirá. El dinero sigue retenido.</div>}
        {p.estado === 'en_reclamo' && p.reclamo && <div className="nota"><strong>Reclamo abierto.</strong> {(MOTIVOS.find(m => m[0] === p.reclamo.motivo) || [, 'Otro'])[1]}.{p.reclamo.detalle ? ' ' + p.reclamo.detalle : ''} El equipo te escribirá para resolverlo.</div>}
        {rol === 'comprador' && p.estado === 'pago_pendiente' && <form className="pila-3" onSubmit={e => { e.preventDefault(); mover('pago_informado', { operacion: op.replace(/\s/g, ''), monto: monto2 }, 'Enviaste el número de operación.'); }} noValidate>
          <p className="nota">El equipo no pudo confirmar tu pago{(p.historial.slice(-1)[0] || {}).nota ? ': ' + p.historial.slice(-1)[0].nota : ''}. Revisa el número de operación en Yape y vuelve a enviarlo.</p>
          <Campo id="op2" etiqueta="Número de operación"><input id="op2" className="entrada" inputMode="numeric" value={op} onChange={e => setOp(e.target.value)} /></Campo>
          <Campo id="monto2" etiqueta="Monto que enviaste"><div className="prefijo"><span aria-hidden="true">S/</span><input id="monto2" className="entrada" inputMode="decimal" value={monto2} onChange={e => setMonto2(e.target.value)} /></div></Campo>
          <button className="boton boton-principal" disabled={acc.cargando}>Informar mi pago</button>
        </form>}
        {rol === 'comprador' && p.estado === 'en_coordinacion' && <div className="pila">
          <button className="boton boton-principal boton-ancho" onClick={() => setConfirmar(true)}>Recibí el material y estoy conforme</button>
          <button className="boton boton-ancho" onClick={() => setReclamo(true)}>Tuve un problema</button>
        </div>}
        {puedeReclamar && !(rol === 'comprador' && p.estado === 'en_coordinacion') && <button className="enlace" onClick={() => setReclamo(true)}>Reportar un problema</button>}
        <NotaError>{acc.error}</NotaError>
        <div><BotonWhatsApp mensaje={'Hola, escribo por el pedido ' + p.id + ' de Relevo.'} /></div>
      </div>

      <div style={{ gridColumn: '8 / span 5' }} className="pila-5">
        <dl className="datos">
          {rol === 'comprador'
            ? <><div><dt>Precio</dt><dd className="cifra">{L.soles(p.precio)}</dd></div><div><dt>Operación Yape</dt><dd>{p.operacion || 'Pendiente'}</dd></div>{p.montoInformado != null && <div><dt>Monto que informaste</dt><dd className="cifra">{L.soles(p.montoInformado)}</dd></div>}</>
            : <><div><dt>Precio</dt><dd className="cifra">{L.soles(p.precio)}</dd></div><div><dt>Comisión de Relevo</dt><dd className="cifra">{L.soles(CFG.COMISION_VENDEDOR)}</dd></div><div><dt>{p.estado === 'transferido' ? 'Recibiste' : 'Recibirás'}</dt><dd className="cifra" style={{ fontWeight: 500 }}>{L.soles(v.recibe)}</dd></div></>}
          <div><dt>Universidad</dt><dd>{pub.universidad}</dd></div>
        </dl>

        <section className="pila-3">
          <h2 className="h3">Entrega</h2>
          {p.entrega.punto ? <p className="texto">{p.entrega.punto}{p.entrega.horario ? ', ' + fechaHora(p.entrega.horario) : ''}.</p> : <p className="texto secundario">Todavía no hay un lugar propuesto.</p>}
          {coordinable && <form className="pila-3" onSubmit={proponer}>
            <Campo id="e-punto" etiqueta="Punto de entrega"><select id="e-punto" className="entrada" value={punto || p.entrega.punto} onChange={e => setPunto(e.target.value)}><option value="">Elige un lugar público</option>{puntos.map(x => <option key={x}>{x}</option>)}</select></Campo>
            <Campo id="e-horario" etiqueta="Horario propuesto" ayuda="De día y en horario de clases, cuando hay más gente."><input id="e-horario" type="datetime-local" className="entrada" value={horario} onChange={e => setHorario(e.target.value)} /></Campo>
            <div><button className="boton" disabled={acc.cargando}>Proponer entrega</button></div>
          </form>}
          <div className="nota pequeno">
            <strong>Para tu seguridad.</strong> Encuéntrense en un lugar público y concurrido, de día. Revisa el material antes de confirmar. No entregues dinero en efectivo: el pago ya está en Relevo. Si algo no te da confianza, no hagas la entrega y escríbenos.
          </div>
        </section>
      </div>
    </div>
    {confirmar && <Dialogo titulo="¿Recibiste el material?" cerrar={() => setConfirmar(false)}>
      <p className="texto secundario">Al confirmar, Relevo transfiere el pago al vendedor. Hazlo solo si revisaste el material y coincide con la publicación.</p>
      <NotaError>{acc.error}</NotaError>
      <div className="acciones"><button className="boton boton-principal" onClick={() => mover('entregado', {}, 'Confirmaste la entrega. Gracias por usar Relevo.')} disabled={acc.cargando}>{acc.cargando ? 'Confirmando' : 'Sí, estoy conforme'}</button><button className="enlace enlace-secundario" onClick={() => setConfirmar(false)}>Todavía no</button></div>
    </Dialogo>}
    {reclamo && <Reclamo cerrar={() => setReclamo(false)} cargando={acc.cargando} error={acc.error} enviar={(m, det) => mover('en_reclamo', { motivo: m, detalle: det }, 'Recibimos tu reclamo. El equipo te escribirá.')} />}
  </div>;
}

/* ---------- Panel del equipo (Fase A: demostración con datos de ejemplo) ---------- */
function Equipo() {
  const d = useDatos();
  const avisar = useAviso();
  const acc = usarAccion();
  const [tab, setTab] = useState('publicaciones');
  const [rechazo, setRechazo] = useState(null);
  const [motivo, setMotivo] = useState('');
  if (!d.listo) return <Arco bloque />;
  if (!d.sesion) return <PideSesion texto="Inicia sesión con una cuenta del equipo." volver="/equipo" />;
  if (!L.esEquipo(d.sesion, CFG)) return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="Esta vista es solo para el equipo de Relevo." texto="Si eres del equipo, ingresa con tu cuenta autorizada." accion={<A a="/ingresar?volver=/equipo" className="boton">Cambiar de usuario</A>} /></div>;

  const pub = id => d.publicaciones.find(x => x.id === id) || { titulo: (d.pedidos.find(p => p.pubId === id) || {}).titulo || '', categoria: 'instrumento', fotos: [] };
  const usuario = id => d.usuarios.find(u => u.id === id) || { nombre: '', correo: '' };
  const deEstado = (...e) => d.pedidos.filter(p => e.includes(p.estado));
  const grupos = {
    publicaciones: d.publicaciones.filter(p => p.revision === 'en_revision'),
    pagos: deEstado('pago_informado'),
    entregas: deEstado('pago_confirmado', 'en_coordinacion'),
    transferencias: deEstado('entregado'),
    reclamos: deEstado('en_reclamo'),
    vendedores: d.usuarios.filter(u => u.rol !== 'equipo' && !L.vendedorVerificado(u, CFG) && d.publicaciones.some(p => p.vendedorId === u.id))
  };
  const nombres = { publicaciones: 'Publicaciones por revisar', pagos: 'Pagos por confirmar', entregas: 'Entregas en curso', transferencias: 'Transferencias', reclamos: 'Reclamos', vendedores: 'Vendedores' };
  const correr = async (fn, msg) => { try { await acc.correr(fn); avisar(msg); setRechazo(null); setMotivo(''); } catch (_) { } };
  const exportar = () => {
    const csv = L.generarCSV(d.pedidos, d.publicaciones, CFG);
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'relevo-pedidos-' + L.fechaLima() + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const lista = grupos[tab];
  const filaPedido = (p, extra, acciones) => {
    const u = { nombre: p.compradorNombre || usuario(p.compradorId).nombre }, vend = { nombre: p.vendedorNombre || usuario(p.vendedorId).nombre };
    return <li key={p.id} className="fila">
      <div><p className="etiqueta">{p.id} · {fechaHora(p.creado)}</p><p className="h3" style={{ marginTop: 4 }}>{pub(p.pubId).titulo}</p>
        <p className="secundario pequeno" style={{ margin: '4px 0 0' }}>Compra {u.nombre} · Vende {vend.nombre}</p>{extra}</div>
      <div className="acciones">{acciones}</div>
    </li>;
  };
  const vacios = { publicaciones: 'No hay publicaciones por revisar.', pagos: 'No hay pagos por confirmar.', entregas: 'No hay entregas en curso.', transferencias: 'No hay transferencias pendientes.', reclamos: 'No hay reclamos abiertos.', vendedores: 'No hay vendedores por verificar.' };

  return <div className="pantalla contenedor">
    <div className="grilla" style={{ paddingTop: 'clamp(40px, 6vw, 80px)', alignItems: 'end', rowGap: 24 }}>
      <div style={{ gridColumn: '1 / span 8' }} className="pila"><h1 className="h1">Panel del equipo</h1><p className="texto secundario">Demostración con datos de ejemplo. Los pagos se confirman contra el historial de Yape del equipo.</p></div>
      <div style={{ gridColumn: '9 / span 4', justifySelf: 'end' }}><button className="boton" onClick={exportar}>Exportar CSV</button></div>
    </div>
    <div className="pestanas" role="tablist" style={{ marginTop: 48 }}>{Object.keys(grupos).map(k =>
      <button key={k} role="tab" id={'tab-' + k} aria-selected={tab === k} aria-controls="panel-equipo" onClick={() => setTab(k)}>{nombres[k]}<span className="cuenta">{grupos[k].length}</span></button>)}</div>
    <div id="panel-equipo" role="tabpanel" aria-labelledby={'tab-' + tab}>
      <NotaError>{acc.error}</NotaError>
      {!lista.length ? <div style={{ marginTop: 32 }}><Vacio titulo={vacios[tab]} /></div> : <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tab === 'publicaciones' && lista.map(p => {
          const v = usuario(p.vendedorId);
          return <li key={p.id} className="fila">
            <div><p className="etiqueta">{categoria(p.categoria).nombre} · enviada {fechaHora(p.creado)}</p><p className="h3" style={{ marginTop: 4 }}>{p.titulo}</p>
              <p className="secundario pequeno" style={{ margin: '4px 0 0' }}>{v.nombre} · {L.vendedorVerificado(v, CFG) ? 'Vendedor verificado' : 'Vendedor sin verificar'} · {L.soles(p.precio)} · código esperado {p.codigo}</p>
              <FotosRevision p={p} /></div>
            <div className="acciones"><button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.aprobarPublicacion(p.id), 'Publicación aprobada con foto verificada.')}>Aprobar con foto verificada</button><button className="enlace enlace-secundario" onClick={() => setRechazo({ tipo: 'pub', id: p.id })}>Rechazar</button></div>
          </li>;
        })}
        {tab === 'pagos' && lista.map(p => filaPedido(p, <dl className="datos" style={{ marginTop: 16, maxWidth: 420 }}><div><dt>Operación</dt><dd>{p.operacion}</dd></div><div><dt>Monto esperado</dt><dd className="cifra">{L.soles(p.precio)}</dd></div>{p.montoInformado != null && <div><dt>Monto informado</dt><dd className="cifra">{L.soles(p.montoInformado)}{p.montoInformado !== p.precio ? <strong> · no coincide</strong> : ''}</dd></div>}</dl>,
          <><button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'pago_confirmado'), 'Pago confirmado. El dinero queda retenido.')}>Confirmar pago</button><button className="enlace enlace-secundario" onClick={() => setRechazo({ tipo: 'pago', id: p.id })}>Rechazar</button></>))}
        {tab === 'entregas' && lista.map(p => filaPedido(p, <p className="pequeno" style={{ margin: '8px 0 0' }}><EstadoTexto estado={p.estado} />{p.entrega.punto ? ' · ' + p.entrega.punto : ''}</p>,
          p.estado === 'pago_confirmado'
            ? <button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'en_coordinacion'), 'Pedido en coordinación.')}>Pasar a coordinación</button>
            : <><A a={'/pedido/' + p.id} className="enlace">Ver pedido</A><button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'entregado'), 'Entrega registrada.')}>Marcar entregado</button></>))}
        {tab === 'transferencias' && lista.map(p => filaPedido(p, <dl className="datos" style={{ marginTop: 16, maxWidth: 420 }}><div><dt>Precio</dt><dd className="cifra">{L.soles(p.precio)}</dd></div><div><dt>Comisión</dt><dd className="cifra">{L.soles(CFG.COMISION_VENDEDOR)}</dd></div><div><dt>Transferir a {p.vendedorNombre || usuario(p.vendedorId).nombre}</dt><dd className="cifra" style={{ fontWeight: 500 }}>{L.soles(L.calcularVenta(p.precio, CFG).recibe)}</dd></div></dl>,
          <button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'transferido'), 'Transferencia registrada.')}>Marcar transferido</button>))}
        {tab === 'reclamos' && lista.map(p => filaPedido(p, <p className="pequeno" style={{ margin: '8px 0 0' }}>{(MOTIVOS.find(m => m[0] === (p.reclamo || {}).motivo) || [, 'Otro'])[1]}{p.reclamo && p.reclamo.detalle ? ': ' + p.reclamo.detalle : ''}</p>,
          <><button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'en_coordinacion'), 'El pedido volvió a coordinación.')}>Volver a coordinación</button>
            <button className="enlace" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'entregado'), 'Reclamo cerrado como entregado.')}>Cerrar como entregado</button>
            <button className="enlace enlace-secundario" disabled={acc.cargando} onClick={() => correr(() => Datos.moverPedido(p.id, 'cancelado', { motivo: 'Reclamo resuelto con devolución' }), 'Pedido cancelado. Devuelve el pago por Yape.')}>Cancelar y devolver</button></>))}
        {tab === 'vendedores' && lista.map(u => <li key={u.id} className="fila">
          <div><p className="h3">{u.nombre}</p><p className="secundario pequeno" style={{ margin: '4px 0 0' }}>{u.correo} · correo no institucional</p></div>
          <div className="acciones">{u.aprobadoPorEquipo ? <span className="secundario">Aprobado</span> : <button className="boton" disabled={acc.cargando} onClick={() => correr(() => Datos.aprobarVendedor(u.id), 'Vendedor verificado por el equipo.')}>Verificar vendedor</button>}</div>
        </li>)}
      </ul>}
    </div>
    {rechazo && <Dialogo titulo={rechazo.tipo === 'pub' ? 'Rechazar publicación' : 'Rechazar pago'} cerrar={() => setRechazo(null)}>
      <form className="pila-3" onSubmit={e => { e.preventDefault(); correr(() => rechazo.tipo === 'pub' ? Datos.rechazarPublicacion(rechazo.id, motivo) : Datos.moverPedido(rechazo.id, 'pago_pendiente', { motivo }), rechazo.tipo === 'pub' ? 'Publicación rechazada.' : 'Pago rechazado. El comprador puede volver a enviarlo.'); }} noValidate>
        <Campo id="motivo" etiqueta="Motivo" ayuda={rechazo.tipo === 'pub' ? 'Lo verá el vendedor. Por ejemplo: no se ve el código del día.' : 'Lo verá el comprador. Por ejemplo: el monto no coincide.'}><textarea id="motivo" className="entrada" value={motivo} onChange={e => setMotivo(e.target.value)} /></Campo>
        <NotaError>{acc.error}</NotaError>
        <div className="acciones"><button className="boton" disabled={acc.cargando || !motivo.trim()}>Rechazar</button><button type="button" className="enlace enlace-secundario" onClick={() => setRechazo(null)}>Cancelar</button></div>
      </form>
    </Dialogo>}
  </div>;
}

/* Fotos de una publicación en revisión, con su ángulo y la hora de subida. */
function FotosRevision({ p }) {
  const fotos = useFotos(p) || p.fotos;
  return <div className="miniaturas">{fotos.map((f, i) => <div key={i} style={{ width: 120 }}>
    <Cuadro cat={p.categoria} foto={f} alt={f.angulo} />
    <p className="secundario" style={{ fontSize: 12, lineHeight: '16px', margin: '4px 0 0' }}>{f.angulo}{f.fecha ? ' · ' + fechaHora(f.fecha) : ''}</p>
  </div>)}</div>;
}

/* ---------- Experimento A/B de fotos: /experimento/fotos?orden=AB o ?orden=BA. No guarda datos. ---------- */
function Experimento({ ruta }) {
  const orden = (ruta.query.get('orden') || new URLSearchParams(location.search).get('orden') || 'AB').toUpperCase() === 'BA' ? 'BA' : 'AB';
  const mat = { titulo: 'Calculadora científica fx-991', categoria: 'calculadora', estado: 'Buen estado', curso: 'Cálculo 2', universidad: 'UPC', precio: 52, descripcion: 'Funciona perfecto. Incluye tapa protectora. Pantalla sin rayones.' };
  const angulos = L.angulosDe(mat.categoria, CFG);
  const variantes = {
    A: <div className="pila-3">
      <div className="cuadro" role="img" aria-label="Foto común del material" style={{ background: '#E4E6E8' }}><Objeto cat={mat.categoria} /></div>
      <div className="miniaturas">{angulos.slice(0, 2).map(a => <div key={a} className="cuadro" style={{ width: 88, background: '#E4E6E8' }} role="img" aria-label={a}><Objeto cat={mat.categoria} /></div>)}</div>
    </div>,
    B: <div className="pila-3">
      <div style={{ position: 'relative' }}><Cuadro cat={mat.categoria} rotulo={'Código del día: ' + L.codigoDelDia()} alt="Foto verificada del material con el código del día" /></div>
      <div className="miniaturas">{angulos.map(a => <div key={a} style={{ width: 88 }}><Cuadro cat={mat.categoria} alt={a} /></div>)}</div>
      <div><Sello /><p className="secundario pequeno" style={{ marginTop: 8 }}>Fotos tomadas con el código del día y revisadas por el equipo.</p></div>
    </div>
  };
  return <div className="pantalla contenedor" style={{ paddingTop: 'clamp(40px, 6vw, 80px)' }}>
    <div className="par">{orden.split('').map((v, i) =>
      <article key={v} className="pila-3" aria-label={'Publicación ' + (i + 1)}>
        <p className="etiqueta">Publicación {i + 1}</p>
        {variantes[v]}
        <h2 className="h3">{mat.titulo}</h2>
        <p className="h2 cifra">{L.soles(mat.precio)}</p>
        <dl className="datos"><div><dt>Estado</dt><dd>{mat.estado}</dd></div><div><dt>Curso</dt><dd>{mat.curso}</dd></div><div><dt>Universidad</dt><dd>{mat.universidad}</dd></div></dl>
        <p className="texto">{mat.descripcion}</p>
      </article>)}</div>
    <p className="secundario pequeno" style={{ marginTop: 64 }}>Vista de prueba para entrevistas. No guarda datos de quien la visita.</p>
  </div>;
}

/* ---------- Páginas legales (texto provisional) ---------- */
function Legal({ cual }) {
  const aviso = <p className="nota">Texto provisional. El equipo de Relevo debe revisarlo antes del piloto.</p>;
  const paginas = {
    terminos: ['Términos de uso', <>
      <h2>Qué es Relevo</h2><p>Relevo es un servicio para que estudiantes universitarios de Lima compren y vendan materiales académicos de segunda mano. En esta etapa, el equipo de Relevo gestiona a mano los pagos y la coordinación de las entregas.</p>
      <h2>Publicaciones</h2><p>Quien vende pone el precio. Debe publicar solo materiales propios, en el estado que describe y con fotos tomadas con el código del día. El equipo revisa cada publicación antes de mostrarla y puede rechazarla si no cumple estas condiciones.</p>
      <h2>Pagos y comisión</h2><p>Quien compra paga por Yape el precio publicado, sin recargo. Relevo retiene el dinero hasta que el comprador confirma que recibió el material y está conforme. Después transfiere al vendedor el precio menos una comisión fija de {L.soles(CFG.COMISION_VENDEDOR)} por venta completada.</p>
      <h2>Entregas</h2><p>Las entregas se hacen en lugares públicos y concurridos. Relevo no se hace responsable de encuentros fuera de los puntos sugeridos.</p>
      <h2>Conducta</h2><p>No se permiten materiales ilegales, copias no autorizadas ni objetos que no sean académicos. Relevo puede suspender cuentas que incumplan estos términos.</p></>],
    devoluciones: ['Política de devolución y reclamos', <>
      <h2>Cuándo puedes reclamar</h2><p>Puedes reportar un problema desde tu pedido si el material es distinto a la foto, si la otra persona no apareció o por otro motivo. El pedido pasa a reclamo y el dinero sigue retenido.</p>
      <h2>Cómo se resuelve</h2><p>El equipo revisa el caso, puede pedir fotos o detalles a ambas partes y decide si se reprograma la entrega, se completa la venta o se cancela el pedido con devolución del pago por Yape.</p>
      <h2>Plazos</h2><p>El equipo responde en un plazo máximo de 2 días hábiles. Una vez que confirmas que recibiste el material, la venta se considera completada.</p>
      <h2>Contacto</h2><p>También puedes escribirnos por WhatsApp desde cualquier pedido.</p></>],
    privacidad: ['Aviso de privacidad', <>
      <h2>Qué datos pedimos</h2><p>Solo lo necesario: tu nombre, tu correo y tu universidad. Para las compras, el número de operación de Yape. No pedimos capturas de comprobantes, DNI ni datos bancarios del comprador.</p>
      <h2>Para qué los usamos</h2><p>Para verificar que eres estudiante, gestionar pagos, coordinar entregas y atender reclamos. No vendemos ni compartimos tus datos con terceros con fines comerciales.</p>
      <h2>Fotos</h2><p>Las fotos de los materiales se muestran en la publicación. Guardamos la fecha y hora en que se suben. No incluyas personas ni datos personales en ellas.</p>
      <h2>Tus derechos</h2><p>Puedes pedir acceso, corrección o eliminación de tus datos escribiendo al equipo, conforme a la Ley N.° 29733 de Protección de Datos Personales.</p>
      <h2>Esta demostración</h2><p>En la versión de demostración, todo funciona con datos de ejemplo en tu navegador y nada se guarda al recargar.</p></>]
  };
  const [titulo, cuerpo] = paginas[cual];
  return <div className="pantalla contenedor grilla" style={{ paddingTop: 'clamp(40px, 6vw, 80px)' }}>
    <div style={{ gridColumn: '1 / span 8' }} className="pila-3 legal"><h1 className="h1">{titulo}</h1>{aviso}{cuerpo}</div>
  </div>;
}

function NoEncontrado() {
  return <div className="contenedor pantalla" style={{ paddingTop: 80 }}><Vacio titulo="No encontramos esta página." accion={<A a="/" className="boton">Ir al inicio</A>} /></div>;
}
