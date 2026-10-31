/* Configuración de Relevo. Todo lo que el equipo puede ajustar sin tocar el resto del código está aquí.
   Este archivo es público (GitHub Pages): no pongas contraseñas, claves privadas ni datos personales. */
window.RELEVO_CONFIG = {
  /* Comisión fija que paga el vendedor por cada compraventa completada. El comprador nunca la ve. */
  COMISION_VENDEDOR: 4.00,
  /* Si el precio es menor a este monto, el formulario avisa qué porcentaje del precio es la comisión. */
  UMBRAL_AVISO: 15.00,

  /* Modo entrevista: muestra la pantalla de pago completa, pero no crea pedidos ni pide el número de operación.
     También se puede forzar desde la URL con ?entrevista=1 o ?entrevista=0. */
  MODO_ENTREVISTA: true,

  /* 'demo': todo funciona en el navegador con datos de ejemplo que se borran al recargar (Fase A).
     'firebase': base de datos compartida e inicio de sesión con Google (Fase B, aún no conectado). */
  MODO_DATOS: 'demo',

  /* Pago por Yape. La imagen del QR no se modifica ni se regenera. */
  YAPE_TITULAR: 'Alejandro Ferrari Navea',
  YAPE_QR: 'assets/yape-qr.jpg',

  /* Número de WhatsApp del equipo con código de país, solo dígitos (por ejemplo 51 seguido del número).
     Vacío: el botón explica que todavía no está configurado. */
  WHATSAPP_EQUIPO: '',

  /* Correos del equipo que pueden usar el panel. En la Fase B estas mismas direcciones van en las reglas de Firestore. */
  CORREOS_ADMIN: [],

  /* Dominios de correo institucional de universidades de Lima. Un vendedor con uno de estos correos queda verificado. */
  DOMINIOS_INSTITUCIONALES: {
    'upc.edu.pe': 'UPC',
    'pucp.edu.pe': 'PUCP',
    'aloe.ulima.edu.pe': 'Universidad de Lima',
    'ulima.edu.pe': 'Universidad de Lima',
    'alum.up.edu.pe': 'Universidad del Pacífico',
    'unmsm.edu.pe': 'UNMSM',
    'uni.pe': 'UNI',
    'utp.edu.pe': 'UTP',
    'usmp.pe': 'USMP',
    'upn.pe': 'UPN',
    'urp.edu.pe': 'URP',
    'cientifica.edu.pe': 'Universidad Científica del Sur'
  },

  /* Puntos de entrega sugeridos por universidad: siempre lugares públicos y concurridos, fuera del campus.
     Textos provisionales: el equipo debe confirmarlos antes del piloto. */
  PUNTOS_ENTREGA: {
    'UPC': ['Patio de comidas del centro comercial más cercano al campus', 'Cafetería frente a la puerta principal', 'Exterior de la garita principal, en horario de clases'],
    'PUCP': ['Patio de comidas del centro comercial más cercano al campus', 'Cafetería frente a la puerta principal', 'Paradero principal frente al campus, en horario de clases'],
    'Universidad de Lima': ['Patio de comidas del centro comercial más cercano al campus', 'Cafetería frente a la puerta principal', 'Exterior de la puerta principal, en horario de clases'],
    'Universidad del Pacífico': ['Cafetería frente a la puerta principal', 'Patio de comidas del centro comercial más cercano', 'Exterior de la puerta principal, en horario de clases'],
    'UNMSM': ['Exterior de la puerta principal, en horario de clases', 'Patio de comidas del centro comercial más cercano', 'Cafetería frente al campus'],
    'UNI': ['Exterior de la puerta principal, en horario de clases', 'Patio de comidas del centro comercial más cercano', 'Cafetería frente al campus'],
    'UTP': ['Patio de comidas del centro comercial más cercano', 'Cafetería frente a la sede', 'Exterior de la puerta principal, en horario de clases'],
    'USMP': ['Patio de comidas del centro comercial más cercano', 'Cafetería frente al campus', 'Exterior de la puerta principal, en horario de clases'],
    'UPN': ['Patio de comidas del centro comercial más cercano', 'Cafetería frente a la sede', 'Exterior de la puerta principal, en horario de clases'],
    'URP': ['Patio de comidas del centro comercial más cercano', 'Cafetería frente al campus', 'Exterior de la puerta principal, en horario de clases'],
    'Universidad Científica del Sur': ['Patio de comidas del centro comercial más cercano', 'Cafetería frente al campus', 'Exterior de la puerta principal, en horario de clases']
  },

  /* Categorías y ángulos guiados de la foto verificada: una foto por ángulo. */
  CATEGORIAS: [
    { id: 'libro', nombre: 'Libros', angulos: ['Portada', 'Contraportada', 'Lomo', 'Página interior 1', 'Página interior 2'] },
    { id: 'calculadora', nombre: 'Calculadoras', angulos: ['Frente', 'Parte posterior', 'Pantalla encendida'] },
    { id: 'bata', nombre: 'Batas', angulos: ['Vista general', 'Detalle del uso', 'Etiqueta o talla'] },
    { id: 'instrumento', nombre: 'Instrumentos', angulos: ['Vista general', 'Detalle del uso', 'Marca o modelo'] }
  ],

  ESTADOS_MATERIAL: ['Como nuevo', 'Buen estado', 'Uso visible']
};
