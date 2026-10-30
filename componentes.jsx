/* Componentes base de Relevo: datos, rutas y elementos gráficos del manual. */
const { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } = React;
const CFG = window.RELEVO_CONFIG;
const L = window.RelevoLogica;
/* Prefijo de archivos estáticos: '' en la demo, '../' en /piloto/. */
const RAIZ = CFG.RAIZ || '';

/* Modo entrevista: config.js, con opción de forzarlo desde la URL (?entrevista=1 o ?entrevista=0). */
const ENTREVISTA = (() => {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams((location.hash.split('?')[1]) || '');
  const v = q.has('entrevista') ? q.get('entrevista') : h.has('entrevista') ? h.get('entrevista') : null;
  return v == null ? CFG.MODO_ENTREVISTA : v !== '0';
})();

/* ---------- Datos ---------- */
const Datos = (() => { try { return window.RelevoDatos.crearDatos(CFG); } catch (e) { return { error: e.message }; } })();
function useDatos() {
  const [s, setS] = useState(() => Datos.leer());
  useEffect(() => Datos.escuchar(setS), []);
  const sesion = s.usuarios.find(u => u.id === s.sesionId) || null;
  return { ...s, sesion };
}

/* ---------- Rutas con hash: funcionan en GitHub Pages dentro de /Relevo/ sin servidor ---------- */
function leerRuta() {
  const [ruta, qs] = (location.hash.replace(/^#/, '') || '/').split('?');
  return { ruta: ruta || '/', partes: (ruta || '/').split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}
function useRuta() {
  const [r, setR] = useState(leerRuta);
  useEffect(() => {
    const f = () => { setR(leerRuta()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return r;
}
const ir = ruta => { location.hash = ruta; };
const A = ({ a, children, ...p }) => <a href={'#' + a} {...p}>{children}</a>;

/* ---------- Avisos ---------- */
const AvisoCtx = createContext(() => {});
const useAviso = () => useContext(AvisoCtx);
function ProveedorAviso({ children }) {
  const [m, setM] = useState('');
  const t = useRef();
  const avisar = useCallback(msg => { setM(msg); clearTimeout(t.current); t.current = setTimeout(() => setM(''), Math.max(3200, msg.length * 60)); }, []);
  return <AvisoCtx.Provider value={avisar}>{children}<div aria-live="polite">{m && <div className="aviso" role="status">{m}</div>}</div></AvisoCtx.Provider>;
}

/* ---------- Utilidades ---------- */
const fechaCorta = iso => iso ? new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : '';
const fechaHora = iso => iso ? new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const portadaDe = p => p.portada ? { src: p.portada, angulo: (p.fotos[0] || {}).angulo } : p.fotos[0];
const categoria = id => CFG.CATEGORIAS.find(c => c.id === id) || { id, nombre: 'Material', angulos: [] };
const primerNombre = n => (n || '').split(' ')[0];
const universidades = () => [...new Set(Object.values(CFG.DOMINIOS_INSTITUCIONALES))];
function usarAccion() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const correr = async fn => {
    setCargando(true); setError('');
    try { return await fn(); } catch (e) { setError(e.message); throw e; } finally { setCargando(false); }
  };
  return { cargando, error, setError, correr };
}

/* Íconos de línea (los mismos de la versión anterior de Relevo). */
const P={search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',file:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/>',calc:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',check:'<path d="M20 6 9 17l-5-5"/>',plus:'<path d="M5 12h14M12 5v14"/>',filter:'<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',bag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'};
Object.assign(P,{left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',zoom:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'});
Object.assign(P,{star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',award:'<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'});
const Icono = ({ n, s = 20, c = '', relleno }) => <svg className={c} width={s} height={s} viewBox="0 0 24 24" fill={relleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />;
const ICONO_CATEGORIA = { libro: 'book', calculadora: 'calc', bata: 'pen', instrumento: 'box' };

/* ---------- Movimiento de presentación ---------- */
/* Retraso escalonado para apariciones en grupo, con tope para que nada espere demasiado. */
const retraso = i => ({ '--retraso': Math.min(i, 7) * 90 + 'ms' });
const sinMovimiento = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Observa los elementos .revelar que aparecen en la página y los muestra al entrar en pantalla. */
function useRevelar() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || sinMovimiento()) return;
    document.documentElement.classList.add('con-movimiento');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    const ver = () => document.querySelectorAll('.revelar:not([data-obs])').forEach(el => { el.setAttribute('data-obs', ''); io.observe(el); });
    ver();
    const mo = new MutationObserver(ver);
    mo.observe(document.getElementById('raiz'), { childList: true, subtree: true });
    /* Respaldo: si el navegador no dispara el observador, nada queda oculto en pantalla. */
    const respaldo = setInterval(() => document.querySelectorAll('.revelar:not(.visible)').forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible'); }), 1500);
    return () => { io.disconnect(); mo.disconnect(); clearInterval(respaldo); };
  }, []);
}

/* Progreso de 0 a 1 de un elemento mientras cruza la pantalla, para el recorrido con scroll. */
function useProgreso(ref) {
  const [p, setP] = useState(() => sinMovimiento() ? 1 : 0);
  useEffect(() => {
    if (sinMovimiento()) return;
    const medir = () => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      setP(Math.round(Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height))) * 1000) / 1000);
    };
    medir();
    window.addEventListener('scroll', medir, { passive: true }); window.addEventListener('resize', medir);
    return () => { window.removeEventListener('scroll', medir); window.removeEventListener('resize', medir); };
  }, []);
  return p;
}

/* ---------- Ilustraciones de objetos: recuadros en niebla para los ejemplos sin foto real ---------- */
function Objeto({ cat }) {
  const t = { fill: 'none', stroke: '#1E2024', strokeWidth: 1.1, strokeLinejoin: 'round', strokeLinecap: 'round' };
  const sombra = { fill: '#4A4E55', opacity: 0.12 };
  const cuerpo = { ...t, fill: '#F2F3F3' };
  const dibujos = {
    libro: <g><path d="M40 18h44l4 4v60H44l-4-4z" {...sombra} transform="translate(5 3)" /><path d="M36 14h46v64H36z" {...cuerpo} /><path d="M42 14v64M82 18h4v64H40v-4" {...t} /><path d="M50 30h24M50 36h18" {...t} strokeWidth="0.8" /></g>,
    calculadora: <g><rect x="45" y="13" width="34" height="62" rx="3" {...sombra} transform="translate(5 3)" /><rect x="42" y="10" width="34" height="62" rx="3" {...cuerpo} /><rect x="47" y="16" width="24" height="11" {...t} />{[0, 1, 2, 3].map(r => [0, 1, 2].map(c => <rect key={r + '-' + c} x={48 + c * 8} y={33 + r * 9} width="6" height="5" rx="1" {...t} strokeWidth="0.8" />))}</g>,
    bata: <g><path d="M48 14l-14 8-6 52h16l2-26 2 30h28l2-30 2 26h16l-6-52-14-8-8 6h-12z" {...sombra} transform="translate(5 3)" /><path d="M46 12l-14 8-6 52h16l2-26 2 30h28l2-30 2 26h16l-6-52-14-8-8 6H54z" {...cuerpo} /><path d="M54 18l6 12 6-12M60 30v46" {...t} /><path d="M50 52h6" {...t} strokeWidth="0.8" /></g>,
    instrumento: <g><path d="M30 76L84 22v54z" {...sombra} transform="translate(5 3)" /><path d="M28 72L80 20v52z" {...cuerpo} /><path d="M46 66L74 38v28z" {...t} /><path d="M24 80h70" {...t} /><path d="M30 80v-4M38 80v-3M46 80v-4M54 80v-3M62 80v-4M70 80v-3M78 80v-4M86 80v-3" {...t} strokeWidth="0.8" /></g>
  };
  return <svg className="objeto" viewBox="16 4 92 84" aria-hidden="true">{dibujos[cat] || dibujos.instrumento}</svg>;
}

/* Imagen de objeto con las esquinas. Si hay foto real la muestra; si no, la ilustración. */
function Cuadro({ cat, foto, rotulo, alt, clase }) {
  return <div className={'cuadro esquinas ' + (clase || '')} role={foto && foto.src ? undefined : 'img'} aria-label={foto && foto.src ? undefined : (alt || 'Ilustración de ' + categoria(cat).nombre.toLowerCase())}>
    <span className="eq" aria-hidden="true" />
    {foto && foto.src ? <img src={foto.src} alt={alt || ''} /> : <Objeto cat={cat} />}
    {rotulo && <span className="rotulo">{rotulo}</span>}
  </div>;
}

const Sello = ({ fondo }) => <span className={'sello' + (fondo ? ' sello-fondo' : '')}>Foto verificada</span>;

function Arco({ texto, bloque }) {
  const svg = <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6.5 20A11 11 0 1 1 26 24" fill="none" stroke="#1E2024" strokeWidth="1.2" strokeLinecap="round" /><circle cx="6.5" cy="20" r="2.2" fill="#6A1B2F" /></svg>;
  return bloque
    ? <div className="arco-bloque" role="status"><span className="arco">{svg}</span><span className="secundario pequeno">{texto || 'Cargando'}</span></div>
    : <span className="arco" role="status">{svg}<span>{texto || 'Cargando'}</span></span>;
}

function Campo({ id, etiqueta, ayuda, error, children }) {
  return <div className={'campo' + (error ? ' con-error' : '')}>
    <label className="etiqueta" htmlFor={id}>{etiqueta}</label>
    {children}
    {ayuda && !error && <span className="ayuda" id={id + '-ayuda'}>{ayuda}</span>}
    {error && <span className="mensaje-error" id={id + '-error'} role="alert">{error}</span>}
  </div>;
}

function Vacio({ titulo, texto, accion }) {
  return <div className="estado-vacio pila"><p className="h3" style={{ fontSize: 30, lineHeight: '38px' }}>{titulo}</p>{texto && <p className="texto secundario">{texto}</p>}{accion && <div style={{ marginTop: 24 }}>{accion}</div>}</div>;
}
const NotaError = ({ children }) => children ? <div className="nota nota-error" role="alert">{children}</div> : null;

function Dialogo({ titulo, cerrar, children }) {
  const ref = useRef();
  useEffect(() => {
    const previo = document.activeElement;
    const el = ref.current; const foco = el && el.querySelector('input, textarea, select, button');
    foco && foco.focus();
    const tecla = e => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); previo && previo.focus && previo.focus(); };
  }, []);
  return <div className="velo" onMouseDown={e => { if (e.target === e.currentTarget) cerrar(); }}>
    <div className="dialogo pila-3" role="dialog" aria-modal="true" aria-label={titulo} ref={ref}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <h2 className="h3">{titulo}</h2>
        <button className="boton-icono" onClick={cerrar} aria-label="Cerrar"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="#1E2024" strokeWidth="1.2" /></svg></button>
      </div>
      {children}
    </div>
  </div>;
}

/* Pasos numerados: el actual lleva el punto testigo. */
function Pasos({ pasos, actual }) {
  return <ol className="pasos">{pasos.map((p, i) =>
    <li key={i} className={'paso ' + (i === actual ? 'actual' : i < actual ? 'hecho' : '')} aria-current={i === actual ? 'step' : undefined}>
      <span className="paso-marca" aria-hidden="true"><span>{i + 1}</span></span>
      <div><p className="texto" style={{ fontWeight: 500 }}>{p.titulo}</p>{p.texto && <div className="texto secundario pequeno" style={{ marginTop: 4 }}>{p.texto}</div>}</div>
    </li>)}</ol>;
}

/* Línea de tiempo del pedido: hilo con el punto testigo en el estado actual. */
function LineaTiempo({ pedido }) {
  const fechas = {};
  (pedido.historial || []).forEach(h => { fechas[h.estado] = h.fecha; });
  const desvio = pedido.estado === 'en_reclamo' || pedido.estado === 'cancelado';
  const camino = L.CAMINO.filter(e => !desvio || fechas[e]);
  const pasos = desvio ? [...camino, pedido.estado] : camino;
  const iActual = pasos.indexOf(pedido.estado);
  return <ol className="linea">{pasos.map((e, i) => {
    const clase = i === iActual ? 'actual' : i < iActual ? 'hecho' : 'pendiente';
    return <li key={e} className={clase} aria-current={i === iActual ? 'step' : undefined}>
      <span className="punto" aria-hidden="true" />
      <span>{L.ESTADOS[e]}{i === iActual && <span className="oculto"> (estado actual)</span>}</span>
      <time dateTime={fechas[e] || ''}>{fechas[e] ? fechaHora(fechas[e]) : ''}</time>
    </li>;
  })}</ol>;
}

/* Texto de estado en una línea, para listas: el estado se comunica con texto, no con color. */
const EstadoTexto = ({ estado }) => <span className="pequeno" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid #1E2024', background: ['transferido', 'cancelado'].includes(estado) ? 'transparent' : '#1E2024' }} />{L.ESTADOS[estado]}</span>;

function Volver({ a, children }) {
  return <A a={a} className="enlace enlace-secundario"><svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true"><path d="M5 1L1 5l4 4M1 5h12" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>{children}</A>;
}

function BotonWhatsApp({ texto, mensaje }) {
  const avisar = useAviso();
  const num = (CFG.WHATSAPP_EQUIPO || '').replace(/\D/g, '');
  if (!num) return <button className="enlace" onClick={() => avisar('El número de WhatsApp del equipo todavía no está configurado.')}>{texto || 'Escribir al equipo por WhatsApp'}</button>;
  return <a className="enlace" href={'https://wa.me/' + num + '?text=' + encodeURIComponent(mensaje || 'Hola, tengo una consulta sobre Relevo.')} target="_blank" rel="noopener">{texto || 'Escribir al equipo por WhatsApp'}</a>;
}
