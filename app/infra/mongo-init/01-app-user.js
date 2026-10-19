/* global db, print, process -- globales de mongosh */
// Se ejecuta una sola vez, al crear el volumen vacío (imagen oficial de mongo).
// Crea el usuario de la aplicación con privilegios mínimos: solo readWrite sobre
// su base (.claude/rules/datos-y-seguridad.md). El usuario raíz no lo usa el bot.
const database = process.env.MONGO_DATABASE;
const username = process.env.MONGO_APP_USERNAME;
const password = process.env.MONGO_APP_PASSWORD;

db.getSiblingDB(database).createUser({
  user: username,
  pwd: password,
  roles: [{ role: 'readWrite', db: database }],
});

print(`Usuario de la aplicación creado en la base ${database}`);
