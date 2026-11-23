/**
 * Lumi · Hoja del master
 * Guarda el progreso de las personas que usan tu link de Lumi y se lo da
 * solo a quien tenga la CLAVE (tú), para el panel del master.
 *
 * 1) Cambia la CLAVE de abajo por una que solo sepas tú.
 * 2) Implementar → Nueva implementación → Aplicación web.
 *    Ejecutar como: Yo.   Quién tiene acceso: Cualquier usuario.
 * 3) Copia la URL que termina en /exec y pégala en el panel del master.
 */
var CLAVE = 'CAMBIA-ESTA-CLAVE';

var COLS_U = ['usuario_id', 'nombre', 'edad', 'grupo', 'primera_vez', 'ultima_vez', 'veces_que_entra', 'sesiones',
  'dias_practicados', 'racha_dias', 'ejercicios', 'a_la_primera', 'estrellas', 'puntos_cerebro', 'rango', 'premios', 'dispositivo', 'datos'];
var COLS_A = ['fecha', 'tipo', 'usuario_id', 'nombre', 'edad', 'tema', 'ejercicios', 'estrellas', 'puntos', 'minutos', 'completa', 'dispositivo'];

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var evs = (body.events || [body]).slice(0, 100);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var us = hoja(ss, 'Usuarios', COLS_U), ac = hoja(ss, 'Actividad', COLS_A);
    var ids = us.getLastRow() > 1 ? us.getRange(2, 1, us.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    evs.forEach(function (ev) {
      if (!ev || !ev.uid) return;
      var s = ev.snap || {}, f = new Date(Number(ev.ts) || Date.now()), edad = num(ev.age);
      ac.appendRow([f, txt(ev.type), txt(ev.uid), txt(ev.name), edad, txt(ev.topicName || ''), num(ev.n), num(ev.stars), num(ev.pts), num(ev.min),
        ev.done === undefined ? '' : (ev.done ? 'sí' : 'no'), txt(ev.dev)]);
      var i = ids.indexOf(String(ev.uid));
      var grupo = edad < 13 ? 'niño/a' : edad < 60 ? 'adulto' : 'mayor';
      var primera = i >= 0 ? us.getRange(i + 2, 5).getValue() : f;
      var fila = [txt(ev.uid), txt(ev.name), edad, grupo, primera, f, num(s.opens), num(s.sessions), num(s.days), num(s.streak), num(s.solved),
        num(s.perfect), num(s.stars), num(s.brain), txt(s.rank), num(s.badges), txt(ev.dev), JSON.stringify(s).slice(0, 40000)];
      if (i >= 0) us.getRange(i + 2, 1, 1, fila.length).setValues([fila]);
      else { us.appendRow(fila); ids.push(String(ev.uid)); }
    });
  } finally {
    lock.releaseLock();
  }
  return salida({ok: true});
}

function doGet(e) {
  if (!e.parameter.clave || e.parameter.clave !== CLAVE || CLAVE === 'CAMBIA-ESTA-CLAVE') return salida({ok: false, error: 'clave'});
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var us = hoja(ss, 'Usuarios', COLS_U), ac = hoja(ss, 'Actividad', COLS_A);
  var users = filas(us, COLS_U, 2).map(function (o) { try { o.datos = JSON.parse(o.datos); } catch (x) { o.datos = {}; } return o; });
  var activity = filas(ac, COLS_A, Math.max(2, ac.getLastRow() - 3000 + 1));
  return salida({ok: true, users: users, activity: activity});
}

function hoja(ss, nombre, cols) {
  var h = ss.getSheetByName(nombre);
  if (!h) { h = ss.insertSheet(nombre); h.appendRow(cols); h.setFrozenRows(1); h.getRange(1, 1, 1, cols.length).setFontWeight('bold'); }
  return h;
}
function filas(h, cols, desde) {
  var last = h.getLastRow();
  if (last < desde) return [];
  return h.getRange(desde, 1, last - desde + 1, cols.length).getValues().map(function (r) {
    var o = {};
    cols.forEach(function (c, i) { o[c] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
}
function txt(v) { v = String(v == null ? '' : v).slice(0, 200); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function num(v) { v = Number(v); return isFinite(v) ? v : ''; }
function salida(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
