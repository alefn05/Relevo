/* Configuración del piloto (Fase B). Se carga después de ../config.js y solo cambia lo necesario.
   La configuración web de Firebase es pública por diseño: la seguridad está en firestore.rules. */
Object.assign(window.RELEVO_CONFIG, {
  MODO_DATOS: 'firebase',
  MODO_ENTREVISTA: false,
  RAIZ: '../',
  FIREBASE: {
    apiKey: 'AIzaSyAdaWPC7r-9pg4tlSTlbu9xd0lX5EVujNg',
    authDomain: 'relevo-95b06.firebaseapp.com',
    projectId: 'relevo-95b06',
    storageBucket: 'relevo-95b06.firebasestorage.app',
    messagingSenderId: '918035821584',
    appId: '1:918035821584:web:c8d39266c6b0bdaef98695'
  },
  /* Correos del equipo. Deben ser exactamente los mismos que la lista ADMINS de firestore.rules. */
  CORREOS_ADMIN: ['u202312020@gmail.com']
});
