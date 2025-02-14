// admin.js – Panel de Administración

// Función para verificar login (usando sessionStorage)
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

// Cargar contenidos para administración
function loadAdminMovies() {
  const movies = JSON.parse(localStorage.getItem('movies')) || [];
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

// Generar un ID único
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

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

// Guardar (agregar/editar) contenido
movieForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const title = document.getElementById('movieTitle').value.trim();
  const cover = document.getElementById('movieCover').value.trim();
  const category = document.getElementById('movieCategory').value;
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
  if (editingMovieId) {
    movies = movies.map(movie => {
      if (movie.id === editingMovieId) {
        movie.title = title;
        movie.cover = cover;
        movie.category = category;
      }
      return movie;
    });
  } else {
    const newMovie = {
      id: generateId(),
      title,
      cover,
      category,
      seasons: [] // inicialmente sin temporadas
    };
    movies.push(newMovie);
  }
  localStorage.setItem('movies', JSON.stringify(movies));
  movieModal.style.display = 'none';
  loadAdminMovies();
});

function editMovie(id) {
  editingMovieId = id;
  const movies = JSON.parse(localStorage.getItem('movies')) || [];
  const movie = movies.find(m => m.id === id);
  if (movie) {
    document.getElementById('movieTitle').value = movie.title;
    document.getElementById('movieCover').value = movie.cover;
    document.getElementById('movieCategory').value = movie.category;
    document.getElementById('movieModalTitle').textContent = "Editar Película/Serie";
    movieModal.style.display = 'block';
  }
}

function deleteMovie(id) {
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
  movies = movies.filter(m => m.id !== id);
  localStorage.setItem('movies', JSON.stringify(movies));
  loadAdminMovies();
}

// Gestión de temporadas y episodios
function manageSeasons(movieId) {
  const seasonsModal = document.getElementById('seasonsModal');
  seasonsModal.style.display = 'block';
  loadSeasons(movieId);
  currentMovieIdForSeasons = movieId;
}

let currentMovieIdForSeasons = null;

function loadSeasons(movieId) {
  const movies = JSON.parse(localStorage.getItem('movies')) || [];
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
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
  const movie = movies.find(m => m.id === currentMovieIdForSeasons);
  if (movie) {
    const newSeasonNumber = movie.seasons.length > 0 ? movie.seasons[movie.seasons.length - 1].number + 1 : 1;
    movie.seasons.push({ number: newSeasonNumber, episodes: [] });
    localStorage.setItem('movies', JSON.stringify(movies));
    loadSeasons(currentMovieIdForSeasons);
    loadAdminMovies();
  }
});

// Agregar episodio (se usan prompt para simplificar)
function addEpisode(movieId, seasonNumber) {
  const episodeTitle = prompt("Ingrese título del episodio:");
  const episodeEmbed = prompt("Ingrese código/embed del video:");
  if (!episodeTitle || !episodeEmbed) return;
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    const season = movie.seasons.find(s => s.number === seasonNumber);
    if (season) {
      const newEpisodeNumber = season.episodes.length > 0 ? season.episodes[season.episodes.length - 1].number + 1 : 1;
      season.episodes.push({ number: newEpisodeNumber, title: episodeTitle, embed: episodeEmbed });
      localStorage.setItem('movies', JSON.stringify(movies));
      loadSeasons(movieId);
    }
  }
}

function editEpisode(movieId, seasonNumber, episodeNumber) {
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
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
          localStorage.setItem('movies', JSON.stringify(movies));
          loadSeasons(movieId);
        }
      }
    }
  }
}

function deleteEpisode(movieId, seasonNumber, episodeNumber) {
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    const season = movie.seasons.find(s => s.number === seasonNumber);
    if (season) {
      season.episodes = season.episodes.filter(e => e.number !== episodeNumber);
      localStorage.setItem('movies', JSON.stringify(movies));
      loadSeasons(movieId);
    }
  }
}

function deleteSeason(movieId, seasonNumber) {
  let movies = JSON.parse(localStorage.getItem('movies')) || [];
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    movie.seasons = movie.seasons.filter(s => s.number !== seasonNumber);
    localStorage.setItem('movies', JSON.stringify(movies));
    loadSeasons(movieId);
    loadAdminMovies();
  }
}

// Cerrar modal de temporadas
document.getElementById('seasonsModalClose').addEventListener('click', function() {
  document.getElementById('seasonsModal').style.display = 'none';
});
