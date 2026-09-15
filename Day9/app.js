document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const autocompleteDropdown = document.getElementById('autocompleteDropdown');
  const searchBtn = document.getElementById('searchBtn');

  const heroBanner = document.getElementById('heroBanner');
  const heroTitle = document.getElementById('heroTitle');
  const heroMatch = document.getElementById('heroMatch');
  const heroYear = document.getElementById('heroYear');
  const heroRating = document.getElementById('heroRating');
  const heroRuntime = document.getElementById('heroRuntime');
  const heroOverview = document.getElementById('heroOverview');
  const heroPlayBtn = document.getElementById('heroPlayBtn');
  const heroInfoBtn = document.getElementById('heroInfoBtn');

  const sectionTitleText = document.getElementById('sectionTitleText');
  const sectionSubtitleText = document.getElementById('sectionSubtitleText');
  const recCountBadge = document.getElementById('recCountBadge');
  const moviesGrid = document.getElementById('moviesGrid');
  const loadingSkeleton = document.getElementById('loadingSkeleton');

  const movieModal = document.getElementById('movieModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBanner = document.getElementById('modalBanner');
  const modalTitle = document.getElementById('modalTitle');
  const modalTagline = document.getElementById('modalTagline');
  const modalPoster = document.getElementById('modalPoster');
  const modalMatch = document.getElementById('modalMatch');
  const modalYear = document.getElementById('modalYear');
  const modalRating = document.getElementById('modalRating');
  const modalRuntime = document.getElementById('modalRuntime');
  const modalGenres = document.getElementById('modalGenres');
  const modalOverview = document.getElementById('modalOverview');

  let allTitles = [];
  let currentTargetMovie = null;
  let currentRecommendations = [];

  // 1. Fetch all titles for autocomplete
  async function fetchAllTitles() {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      allTitles = data.titles || [];
    } catch (err) {
      console.error('Failed to load movie list for autocomplete:', err);
    }
  }
  fetchAllTitles();

  // 2. Autocomplete Event Listeners
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length > 0) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
      autocompleteDropdown.classList.add('hidden');
      return;
    }

    const matches = allTitles
      .filter(t => t.toLowerCase().includes(query))
      .slice(0, 8); // Top 8 matches

    if (matches.length > 0) {
      autocompleteDropdown.innerHTML = matches
        .map(t => `<div class="autocomplete-item">${escapeHtml(t)}</div>`)
        .join('');
      autocompleteDropdown.classList.remove('hidden');
    } else {
      autocompleteDropdown.classList.add('hidden');
    }
  });

  // Handle autocomplete item click
  autocompleteDropdown.addEventListener('click', (e) => {
    if (e.target.classList.contains('autocomplete-item')) {
      const selectedTitle = e.target.textContent;
      searchInput.value = selectedTitle;
      autocompleteDropdown.classList.add('hidden');
      loadRecommendations(selectedTitle);
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      autocompleteDropdown.classList.add('hidden');
    }
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    autocompleteDropdown.classList.add('hidden');
    searchInput.focus();
  });

  searchBtn.addEventListener('click', () => {
    const title = searchInput.value.trim();
    if (title) {
      autocompleteDropdown.classList.add('hidden');
      loadRecommendations(title);
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const title = searchInput.value.trim();
      if (title) {
        autocompleteDropdown.classList.add('hidden');
        loadRecommendations(title);
      }
    }
  });

  // 3. Load Recommendations Function
  async function loadRecommendations(title) {
    // Show Loading state
    moviesGrid.innerHTML = '';
    loadingSkeleton.classList.remove('hidden');
    
    try {
      const res = await fetch(`/api/recommend?title=${encodeURIComponent(title)}&top_n=10`);
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || 'Movie not found!');
        loadingSkeleton.classList.add('hidden');
        return;
      }

      const data = await res.json();
      currentTargetMovie = data.target_movie;
      currentRecommendations = data.recommendations;

      // Update Hero Banner
      updateHeroBanner(currentTargetMovie);

      // Update Section Header
      sectionTitleText.textContent = `Recommendations for "${currentTargetMovie.title}"`;
      sectionSubtitleText.textContent = `Based on AI Cosine Similarity score from 4,809 movies dataset`;
      recCountBadge.textContent = `${currentRecommendations.length} Movies`;

      // Render Cards
      renderMovieCards(currentRecommendations);

      // Scroll smoothly to recommendations
      document.getElementById('recommendations').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error('Error fetching recommendations:', err);
      alert('Failed to fetch recommendations. Please check server status.');
    } finally {
      loadingSkeleton.classList.add('hidden');
    }
  }

  // 4. Update Hero Banner
  function updateHeroBanner(movie) {
    if (movie.backdrop_url) {
      heroBanner.style.backgroundImage = `url('${movie.backdrop_url}')`;
    }
    heroTitle.textContent = movie.title;
    heroMatch.textContent = `Selected Movie`;
    heroYear.textContent = movie.release_date || 'N/A';
    heroRating.innerHTML = `<i class="fa-solid fa-star"></i> ${movie.vote_average || 'N/A'}`;
    heroRuntime.textContent = movie.runtime ? `${movie.runtime} min` : '';
    heroOverview.textContent = movie.overview || 'No overview available for this movie.';

    heroPlayBtn.onclick = () => {
      // Re-trigger recommendations for hero movie
      loadRecommendations(movie.title);
    };

    heroInfoBtn.onclick = () => {
      openModal(movie);
    };
  }

  // 5. Render Movie Poster Cards
  function renderMovieCards(movies) {
    moviesGrid.innerHTML = movies.map((m, idx) => `
      <div class="movie-card" data-index="${idx}">
        <div class="card-poster-wrapper">
          <img class="card-poster" src="${m.poster_url}" alt="${escapeHtml(m.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750/1f1f1f/ffffff?text=No+Poster'">
          <span class="card-match-badge">${m.similarity_score}% Match</span>
        </div>
        <div class="card-info">
          <h3 class="card-title" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</h3>
          <div class="card-meta">
            <span class="card-rating"><i class="fa-solid fa-star"></i> ${m.vote_average}</span>
            <span>${m.release_date}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Attach click handlers to cards
    document.querySelectorAll('.movie-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = card.getAttribute('data-index');
        openModal(currentRecommendations[idx]);
      });
    });
  }

  // 6. Modal Functions
  function openModal(movie) {
    if (movie.backdrop_url) {
      modalBanner.style.backgroundImage = `url('${movie.backdrop_url}')`;
    } else {
      modalBanner.style.backgroundImage = 'none';
    }
    
    modalTitle.textContent = movie.title;
    modalTagline.textContent = movie.tagline ? `"${movie.tagline}"` : '';
    modalPoster.src = movie.poster_url;
    modalMatch.textContent = movie.similarity_score ? `${movie.similarity_score}% Match` : 'Original';
    modalYear.textContent = movie.release_date || 'N/A';
    modalRating.innerHTML = `<i class="fa-solid fa-star"></i> ${movie.vote_average || 'N/A'}`;
    modalRuntime.textContent = movie.runtime ? `${movie.runtime} min` : '';
    modalOverview.textContent = movie.overview || 'Overview unavailable.';

    if (movie.genres && movie.genres.length > 0) {
      modalGenres.innerHTML = movie.genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('');
    } else {
      modalGenres.innerHTML = '';
    }

    movieModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // prevent page scroll
  }

  function closeModal() {
    movieModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) closeModal();
  });

  // Helper escape HTML string
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }

  // Initial load default movie (Avatar)
  loadRecommendations('Avatar');
});
