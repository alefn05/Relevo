/* Estructura general de Relevo: cabecera, rutas y pie. */
function Cabecera({ ruta, limpio }) {
  const d = useDatos();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => setAbierto(false), [ruta.ruta]);
  const actual = '/' + (ruta.partes[0] || '');
  const enlaces = [['/explorar', 'Explorar'], ['/publicar', 'Publicar'], ['/compras', 'Mis compras'], ['/ventas', 'Mis ventas'], ...(L.esEquipo(d.sesion, CFG) ? [['/equipo', 'Equipo']] : [])];
  const volver = ruta.ruta === '/ingresar' ? (ruta.query.get('volver') || '/') : ruta.ruta;
  return <header className="cabecera">
    <div className="contenedor">
      <A a="/" className="logo" aria-label="relevo, ir al inicio"><img src="assets/marca/relevo_wordmark_color.svg" alt="relevo" width="112" height="33" /></A>
      {!limpio && <>
        <button className="boton-icono boton-menu" aria-expanded={abierto} aria-controls="navegacion" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setAbierto(!abierto)}>
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">{abierto ? <path d="M4 1l14 12M18 1L4 13" stroke="#1E2024" strokeWidth="1.2" /> : <path d="M1 3h20M1 11h20" stroke="#1E2024" strokeWidth="1.2" />}</svg>
        </button>
        <div id="navegacion" className={'nav-envoltura' + (abierto ? ' abierto' : '')}>
          <nav className="nav" aria-label="Principal">{enlaces.map(([a, t]) => <A key={a} a={a} aria-current={actual === a ? 'page' : undefined}>{t}</A>)}</nav>
          <div className="nav-sesion">{d.sesion
            ? <><span className="secundario pequeno" style={{ display: 'inline-flex', alignItems: 'center' }}>{primerNombre(d.sesion.nombre)}</span><button className="enlace" onClick={() => { Datos.cerrarSesion(); ir('/'); }}>Salir</button></>
            : <A a={'/ingresar?volver=' + volver} className="enlace">Ingresar</A>}</div>
        </div>
      </>}
    </div>
  </header>;
}

function Pie() {
  return <footer className="pie">
    <div className="contenedor">
      <p style={{ margin: 0, display: 'flex', alignItems: 'center' }}>relevo · Pasar lo que todavía sirve.</p>
      <nav aria-label="Legal"><A a="/terminos">Términos de uso</A><A a="/devoluciones">Devolución y reclamos</A><A a="/privacidad">Privacidad</A><BotonWhatsApp texto="WhatsApp del equipo" /></nav>
    </div>
  </footer>;
}

function Rutas({ ruta }) {
  const [a, b, c] = ruta.partes;
  if (!a) return <Inicio />;
  if (a === 'explorar') return <Explorar ruta={ruta} />;
  if (a === 'material' && b) return <Material id={b} key={b} />;
  if (a === 'pago' && b) return <Pago id={b} key={b} />;
  if (a === 'ingresar') return <Ingresar ruta={ruta} />;
  if (a === 'publicar') return <Publicar />;
  if (a === 'compras' || a === 'ventas') return <MisPedidos tipo={a} key={a} />;
  if (a === 'pedido' && b) return <Pedido id={b} key={b} />;
  if (a === 'equipo') return <Equipo />;
  if (a === 'experimento' && b === 'fotos') return <Experimento ruta={ruta} />;
  if (['terminos', 'devoluciones', 'privacidad'].includes(a)) return <Legal cual={a} key={a} />;
  return <NoEncontrado />;
}

function App() {
  const ruta = useRuta();
  const limpio = ruta.partes[0] === 'experimento';
  useEffect(() => {
    const titulos = { explorar: 'Explorar', publicar: 'Publicar', compras: 'Mis compras', ventas: 'Mis ventas', equipo: 'Panel del equipo', pago: 'Pago', pedido: 'Pedido', ingresar: 'Ingresar', terminos: 'Términos de uso', devoluciones: 'Devolución y reclamos', privacidad: 'Privacidad', experimento: 'Publicaciones' };
    const t = titulos[ruta.partes[0]];
    document.title = t ? t + ' · Relevo' : 'Relevo · Publica en dos minutos. Encuentra a quien lo necesita.';
  }, [ruta.ruta]);
  return <ProveedorAviso>
    <a href="#contenido" className="oculto" onFocus={e => e.currentTarget.classList.remove('oculto')} onBlur={e => e.currentTarget.classList.add('oculto')} onClick={e => { e.preventDefault(); document.getElementById('contenido').focus(); }}>Saltar al contenido</a>
    {!limpio && Datos.modo === 'demo' && <div className="aviso-demo"><div className="contenedor"><span>Demostración con datos de ejemplo. Nada se guarda al recargar.</span>{ENTREVISTA && <span>Modo entrevista: no se registran pagos.</span>}</div></div>}
    <Cabecera ruta={ruta} limpio={limpio} />
    <main id="contenido" tabIndex={-1} style={{ outline: 'none' }}><Rutas ruta={ruta} /></main>
    {!limpio && <Pie />}
  </ProveedorAviso>;
}

const raiz = ReactDOM.createRoot(document.getElementById('raiz'));
if (Datos.error) raiz.render(<div className="contenedor" style={{ paddingTop: 80 }}><Vacio titulo="No se pudo iniciar Relevo." texto={Datos.error} /></div>);
else raiz.render(<App />);
