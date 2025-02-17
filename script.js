// script.js – Página principal (actualizado para usar backend)

let currentFilter = "all"; // filtro por defecto

// Función para cargar los contenidos desde el servidor
async function loadMovies() {
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();
  return movies;
}

// Función para renderizar los contenidos en grid y carrusel
async function renderMovies() {
  const allMovies = await loadMovies();
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();

  // Filtrar según búsqueda
  let filtered = allMovies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery)
  );

  // Aplicar filtro de categoría si no es "all"
  if (currentFilter !== "all") {
    filtered = filtered.filter(movie => movie.category === currentFilter);
  }

  // Separar los contenidos recomendados de los demás
  const recommended = filtered.filter(movie => movie.category === "recomendado");
  const gridMovies = filtered.filter(movie => movie.category !== "recomendado");

  // Renderizar en grid (para películas y series)
  const moviesGrid = document.getElementById('moviesGrid');
  moviesGrid.innerHTML = "";
  if (currentFilter !== "recomendado") {
    gridMovies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.movieId = movie.id;
      card.innerHTML = `
        <img src="${movie.cover}" alt="${movie.title}">
        <div class="movie-info">
          <h3>${movie.title}</h3>
        </div>
      `;
      card.addEventListener('click', () => openDetailsModal(movie));
      moviesGrid.appendChild(card);
    });
  }

  // Renderizar en carrusel (para recomendados)
  const carouselSection = document.getElementById('recommendedCarousel');
  const carouselContainer = carouselSection.querySelector('.carousel-container');
  carouselContainer.innerHTML = "";
  if (currentFilter === "recomendado" || (currentFilter === "all" && recommended.length)) {
    recommended.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.movieId = movie.id;
      card.innerHTML = `
        <img src="${movie.cover}" alt="${movie.title}">
        <div class="movie-info">
          <h3>${movie.title}</h3>
        </div>
      `;
      card.addEventListener('click', () => openDetailsModal(movie));
      carouselContainer.appendChild(card);
    });
    carouselSection.style.display = "block";
  } else {
    carouselSection.style.display = "none";
  }
}

// Abre el modal con temporadas y episodios
function openDetailsModal(movie) {
  const detailsModal = document.getElementById('detailsModal');
  const movieDetails = document.getElementById('movieDetails');
  movieDetails.innerHTML = `<h2>${movie.title}</h2>`;
  
  if (movie.seasons && movie.seasons.length > 0) {
    movie.seasons.forEach(season => {
      const seasonDiv = document.createElement('div');
      seasonDiv.className = 'season';
      seasonDiv.innerHTML = `<h3>Temporada ${season.number}</h3>`;
      if (season.episodes && season.episodes.length > 0) {
        season.episodes.forEach(episode => {
          const epButton = document.createElement('button');
          epButton.className = 'btn-submit';
          epButton.style.marginRight = '0.5rem';
          epButton.textContent = `Episodio ${episode.number}: ${episode.title}`;
          epButton.addEventListener('click', () => openVideoModal(episode.embed));
          seasonDiv.appendChild(epButton);
        });
      } else {
        seasonDiv.innerHTML += `<p>No hay episodios.</p>`;
      }
      movieDetails.appendChild(seasonDiv);
    });
  } else {
    movieDetails.innerHTML += `<p>No se han agregado temporadas.</p>`;
  }
  
  detailsModal.style.display = 'block';
}

// Abre el modal del video y carga el código embed
function openVideoModal(embedCode) {
  const videoModal = document.getElementById('videoModal');
  const videoContainer = document.getElementById('videoContainer');
  videoContainer.innerHTML = embedCode;
  videoModal.style.display = 'block';
}

// Cerrar modales
document.getElementById('detailsClose').addEventListener('click', () => {
  document.getElementById('detailsModal').style.display = 'none';
});
document.getElementById('videoClose').addEventListener('click', () => {
  document.getElementById('videoModal').style.display = 'none';
  document.getElementById('videoContainer').innerHTML = '';
});

// Actualizar la visualización con el buscador y filtros
document.getElementById('searchInput').addEventListener('input', renderMovies);
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-filter');
    renderMovies();
  });
});

// Cargar contenidos al iniciar la página
document.addEventListener('DOMContentLoaded', renderMovies);
