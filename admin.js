// admin.js – Panel de Administración (actualizado para usar backend)

// Verificar login simple (usando sessionStorage, esto se mantiene igual)
function checkAdmin() {
  return sessionStorage.getItem('adminLogged') === 'true';
}

function showAdminPanel() {
  document.getElementById('adminLoginContainer').style.display = 'none';
  document.getElementById('adminPanelContainer').style.display = 'block';
  loadAdminMovies();
}

// Login simple
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  if (user === "admin" && pass === "admin123") {
    sessionStorage.setItem('adminLogged', 'true');
    showAdminPanel();
  } else {
    document.getElementById('loginError').textContent = "Credenciales incorrectas.";
  }
});

// Cargar contenidos para administración desde el backend
async function loadAdminMovies() {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const list = document.getElementById('moviesAdminList');
  list.innerHTML = '';
  movies.forEach(movie => {
    const item = document.createElement('div');
    item.className = 'movie-item';
    item.innerHTML = `
      <div>
        <img src="${movie.cover}" alt="${movie.title}">
        <strong>${movie.title}</strong> <em>(${movie.category})</em>
      </div>
      <div class="movie-actions">
        <button onclick="editMovie('${movie.id}')">Editar</button>
        <button onclick="deleteMovie('${movie.id}')">Borrar</button>
        <button onclick="manageSeasons('${movie.id}')">Temporadas</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Variables para controlar edición
let editingMovieId = null;
const movieModal = document.getElementById('movieModal');
const movieForm = document.getElementById('movieForm');

// Abrir modal para agregar nuevo contenido
document.getElementById('btnAddMovie').addEventListener('click', function() {
  editingMovieId = null;
  document.getElementById('movieModalTitle').textContent = "Agregar Nueva Película/Serie";
  movieForm.reset();
  movieModal.style.display = 'block';
});

// Cerrar modal de contenido
document.getElementById('movieModalClose').addEventListener('click', function() {
  movieModal.style.display = 'none';
});

// Guardar (agregar o editar) contenido usando POST o PUT
movieForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const title = document.getElementById('movieTitle').value.trim();
  const cover = document.getElementById('movieCover').value.trim();
  const category = document.getElementById('movieCategory').value;
  if (editingMovieId) {
    // Actualizar contenido existente
    await fetch(`http://localhost:3000/movies/${editingMovieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, cover, category })
    });
  } else {
    // Agregar nuevo contenido
    await fetch('http://localhost:3000/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, cover, category, seasons: [] })
    });
  }
  movieModal.style.display = 'none';
  loadAdminMovies();
});

// Editar contenido: cargar datos en el formulario
async function editMovie(id) {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === id);
  if (movie) {
    document.getElementById('movieTitle').value = movie.title;
    document.getElementById('movieCover').value = movie.cover;
    document.getElementById('movieCategory').value = movie.category;
    document.getElementById('movieModalTitle').textContent = "Editar Película/Serie";
    editingMovieId = id;
    movieModal.style.display = 'block';
  }
}

// Borrar contenido
async function deleteMovie(id) {
  await fetch(`http://localhost:3000/movies/${id}`, {
    method: 'DELETE'
  });
  loadAdminMovies();
}

// Gestión de temporadas y episodios
// Se reutiliza la estructura interna del objeto; luego de modificar, se actualiza vía PUT

function manageSeasons(movieId) {
  document.getElementById('seasonsModal').style.display = 'block';
  currentMovieIdForSeasons = movieId;
  loadSeasons(movieId);
}

let currentMovieIdForSeasons = null;

async function loadSeasons(movieId) {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === movieId);
  const container = document.getElementById('seasonsContainer');
  container.innerHTML = '';
  if (movie && movie.seasons && movie.seasons.length > 0) {
    movie.seasons.forEach(season => {
      const seasonDiv = document.createElement('div');
      seasonDiv.className = 'season-admin';
      seasonDiv.innerHTML = `<h3>Temporada ${season.number}</h3>`;
      if (season.episodes && season.episodes.length > 0) {
        season.episodes.forEach(episode => {
          const epDiv = document.createElement('div');
          epDiv.className = 'episode';
          epDiv.innerHTML = `
            <span>Episodio ${episode.number}: ${episode.title}</span>
            <button onclick="editEpisode('${movieId}', ${season.number}, ${episode.number})">Editar</button>
            <button onclick="deleteEpisode('${movieId}', ${season.number}, ${episode.number})">Borrar</button>
          `;
          seasonDiv.appendChild(epDiv);
        });
      }
      const btnAddEp = document.createElement('button');
      btnAddEp.textContent = 'Agregar Episodio';
      btnAddEp.className = 'btn-submit';
      btnAddEp.style.marginTop = '0.5rem';
      btnAddEp.onclick = () => addEpisode(movieId, season.number);
      seasonDiv.appendChild(btnAddEp);
      
      const btnDeleteSeason = document.createElement('button');
      btnDeleteSeason.textContent = 'Borrar Temporada';
      btnDeleteSeason.className = 'btn-submit';
      btnDeleteSeason.style.marginTop = '0.5rem';
      btnDeleteSeason.onclick = () => deleteSeason(movieId, season.number);
      seasonDiv.appendChild(btnDeleteSeason);
      
      container.appendChild(seasonDiv);
    });
  } else {
    container.innerHTML = '<p>No hay temporadas agregadas.</p>';
  }
}

// Agregar temporada
document.getElementById('btnAddSeason').addEventListener('click', function() {
  if (!currentMovieIdForSeasons) return;
  addSeason(currentMovieIdForSeasons);
});

async function addSeason(movieId) {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    const newSeasonNumber = movie.seasons && movie.seasons.length > 0 ? movie.seasons[movie.seasons.length - 1].number + 1 : 1;
    if (!movie.seasons) movie.seasons = [];
    movie.seasons.push({ number: newSeasonNumber, episodes: [] });
    await fetch(`http://localhost:3000/movies/${movieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movie)
    });
    loadSeasons(movieId);
    loadAdminMovies();
  }
}

// Agregar episodio
async function addEpisode(movieId, seasonNumber) {
  const episodeTitle = prompt("Ingrese título del episodio:");
  const episodeEmbed = prompt("Ingrese código/embed del video:");
  if (!episodeTitle || !episodeEmbed) return;
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    const season = movie.seasons.find(s => s.number === seasonNumber);
    if (season) {
      const newEpisodeNumber = season.episodes && season.episodes.length > 0 ? season.episodes[season.episodes.length - 1].number + 1 : 1;
      if (!season.episodes) season.episodes = [];
      season.episodes.push({ number: newEpisodeNumber, title: episodeTitle, embed: episodeEmbed });
      await fetch(`http://localhost:3000/movies/${movieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie)
      });
      loadSeasons(movieId);
    }
  }
}

// Editar episodio
async function editEpisode(movieId, seasonNumber, episodeNumber) {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    const season = movie.seasons.find(s => s.number === seasonNumber);
    if (season) {
      const episode = season.episodes.find(e => e.number === episodeNumber);
      if (episode) {
        const newTitle = prompt("Editar título del episodio:", episode.title);
        const newEmbed = prompt("Editar código/embed del video:", episode.embed);
        if (newTitle && newEmbed) {
          episode.title = newTitle;
          episode.embed = newEmbed;
          await fetch(`http://localhost:3000/movies/${movieId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movie)
          });
          loadSeasons(movieId);
        }
      }
    }
  }
}

// Borrar episodio
async function deleteEpisode(movieId, seasonNumber, episodeNumber) {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    const season = movie.seasons.find(s => s.number === seasonNumber);
    if (season) {
      season.episodes = season.episodes.filter(e => e.number !== episodeNumber);
      await fetch(`http://localhost:3000/movies/${movieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie)
      });
      loadSeasons(movieId);
    }
  }
}

// Borrar temporada
async function deleteSeason(movieId, seasonNumber) {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    movie.seasons = movie.seasons.filter(s => s.number !== seasonNumber);
    await fetch(`http://localhost:3000/movies/${movieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movie)
    });
    loadSeasons(movieId);
    loadAdminMovies();
  }
}

// Cerrar modal de temporadas
document.getElementById('seasonsModalClose').addEventListener('click', function() {
  document.getElementById('seasonsModal').style.display = 'none';
});
