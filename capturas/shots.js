// Genera capturas del MVP (index.html) con datos de ejemplo para la encuesta de validacion.
// Bloquea Firebase y lo reemplaza por capturas/mock.js, asi no se escribe nada en la base real.
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PW_PATH || 'playwright');
const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(__dirname, 'img'), OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const ph = {};
for (const f of fs.readdirSync(IMG)) ph[f.replace('.jpg', '')] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(IMG, f)).toString('base64');
const mock = fs.readFileSync(path.join(__dirname, 'mock.js'), 'utf8');

(async () => {
  const browser = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE } : {});
  const ctx = await browser.newContext({ viewport: { width: 640, height: 1500 }, deviceScaleFactor: 2 });
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: 'application/javascript', body: '/* firebase reemplazado por mock */' }));
  await ctx.addInitScript({ content: 'window.__PH=' + JSON.stringify(ph) + ';\n' + mock });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForSelector('text=Lo que ya usaste', { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const shot = (name, clip) => page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 85, clip });

  // 1. Explorar
  await page.click('nav >> text=Explorar');
  await page.waitForSelector('text=Explorar materiales');
  await page.waitForTimeout(500);
  const c2 = await page.locator('section.lg\\:col-span-3 .grid > button').nth(1).boundingBox();
  await shot('1_explorar', { x: 0, y: 0, width: 640, height: Math.round(c2.y + c2.height + 24) });

  // 2. Detalle del material
  await page.click('text=Calculadora Casio fx-991');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(500);
  const dlg = await page.locator('[role=dialog]').boundingBox();
  await shot('2_detalle', { x: dlg.x, y: dlg.y, width: dlg.width, height: dlg.height });

  // 3. Perfil del vendedor con resenas
  await page.click('[role=dialog] >> text=Ver perfil');
  await page.waitForSelector('text=ventas confirmadas');
  await page.waitForTimeout(500);
  const last = await page.locator('main h2:has-text("Reseñas") + div > div').last().boundingBox();
  const top = await page.locator('main').boundingBox();
  await shot('3_perfil', { x: 0, y: top.y, width: 640, height: Math.round(last.y + last.height + 24 - top.y) });

  // 4. Publicar con precio sugerido
  await page.click('nav >> text=Vender');
  await page.waitForSelector('text=Publica en un minuto');
  await page.fill('input[placeholder^="Ej: Física"]', 'Cálculo: trascendentes tempranas, 7.ª ed.');
  await page.fill('textarea', 'Con subrayado leve en los capítulos 2 y 3. Sin hojas sueltas.');
  await page.locator('form select').first().selectOption('Libros');
  await page.fill('input[placeholder="Ej: Cálculo 1"]', 'Cálculo 1');
  await page.fill('input[placeholder="Opcional"]', '150');
  await page.setInputFiles('input[type=file]', [path.join(IMG, 'book1.jpg'), path.join(IMG, 'book2.jpg')]);
  await page.waitForSelector('text=Portada');
  await page.click('text=Usar este precio');
  await page.click('text=¿Cómo se calcula?');
  await page.waitForTimeout(500);
  const form = await page.locator('form').boundingBox();
  const est = await page.locator('form >> text=Estado').first().boundingBox();
  const fotos = await page.locator('form >> text=La primera es la portada').boundingBox();
  await shot('4_publicar', { x: form.x, y: est.y - 10, width: form.width, height: Math.round(fotos.y + 196 - (est.y - 10)) });

  console.log('Errores de la pagina:', errs.length ? errs : 'ninguno');
  await browser.close();
  if (errs.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
