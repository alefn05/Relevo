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
  return <div className="estado-vacio pila"><p className="h3">{titulo}</p>{texto && <p className="texto secundario">{texto}</p>}{accion && <div style={{ marginTop: 24 }}>{accion}</div>}</div>;
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
