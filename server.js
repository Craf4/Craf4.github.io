// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Configuración de lowdb para persistencia en un archivo JSON
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data = db.data || { movies: [] };
  await db.write();
}

initDB();

// Endpoint para obtener todos los contenidos
app.get('/movies', async (req, res) => {
  await db.read();
  res.json(db.data.movies);
});

// Endpoint para agregar un nuevo contenido
app.post('/movies', async (req, res) => {
  await db.read();
  const movie = req.body;
  // Generar un ID simple (único)
  movie.id = Date.now().toString();
  db.data.movies.push(movie);
  await db.write();
  res.status(201).json(movie);
});

// Endpoint para actualizar un contenido existente
app.put('/movies/:id', async (req, res) => {
  await db.read();
  const id = req.params.id;
  const index = db.data.movies.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: "Contenido no encontrado" });
  // Actualizamos todo el objeto (incluyendo temporadas, episodios, etc.)
  db.data.movies[index] = { ...db.data.movies[index], ...req.body };
  await db.write();
  res.json(db.data.movies[index]);
});

// Endpoint para borrar un contenido
app.delete('/movies/:id', async (req, res) => {
  await db.read();
  const id = req.params.id;
  const initialLength = db.data.movies.length;
  db.data.movies = db.data.movies.filter(m => m.id !== id);
  if (db.data.movies.length === initialLength) {
    return res.status(404).json({ error: "Contenido no encontrado" });
  }
  await db.write();
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
