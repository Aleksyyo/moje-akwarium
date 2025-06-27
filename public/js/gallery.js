document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM w pełni załadowany i sparsowany na gallery.html");

  const fishGalleryGrid = document.querySelector('#fish-gallery-section .gallery-grid');
  const API_BASE_URL = 'http://localhost:8000/api'; // Upewnij się, że jest zgodne z app.js
  const logoutNavItemGallery = document.getElementById('logout-nav-item');

  // Funkcje pomocnicze dla API
  const apiRequest = async (endpoint, method = 'GET', body = null, requiresAuth = false) => {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('authToken');

      if (requiresAuth && token) {
          headers['Authorization'] = `Bearer ${token}`;
      } else if (requiresAuth && !token) {
          console.warn("Wymagana autoryzacja, ale brak tokenu.");
          throw { status: 401, message: 'Brak autoryzacji. Zaloguj się.' };
      }

      const config = { method: method, headers: headers };
      if (body) config.body = JSON.stringify(body);

      try {
          const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
          const data = await response.json();
          if (!response.ok) {
              if (response.status === 401 && requiresAuth) {
                  console.warn("Token wygasł lub nieprawidłowy na stronie galerii.");
                  // Wyloguj użytkownika, jeśli token jest zły
                  if (logoutNavItemGallery) logoutNavItemGallery.style.display = 'none'; // Ukryj przycisk wyloguj
                  clearAuthDataGallery(); // Wyczyść dane autoryzacyjne
                  if (fishGalleryGrid) {
                      fishGalleryGrid.innerHTML = `<p>Sesja wygasła lub problem z autoryzacją. <a href="index.html" class="button-like">Zaloguj się ponownie</a></p>`;
                  }
              }
              throw { status: response.status, message: data.message || `Błąd serwera: ${response.status}` };
          }
          return data;
      } catch (error) {
          console.error(`Błąd API (${endpoint}) w gallery.js:`, error.message || error);
          throw error;
      }
  };

  const checkGalleryLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      const expiryString = localStorage.getItem('authTokenExpiry');
      if (token && expiryString) {
          const expiryTime = parseInt(expiryString, 10);
          if (new Date().getTime() < expiryTime) return true;
      }
      return false;
  };

  const renderGallery = (fishes) => {
      if (!fishGalleryGrid) return;
      fishGalleryGrid.innerHTML = '';
      if (!fishes || fishes.length === 0) {
          fishGalleryGrid.innerHTML = '<p>Brak ryb w Twojej galerii. Dodaj ryby na stronie głównej.</p>';
          return;
      }
      fishes.forEach(fish => {
          const fishCard = document.createElement('div');
          fishCard.classList.add('fish-card');
          const imageName = fish.species_image_path || 'default_fish.png';
          let details = '';
          if (fish.weight) details += `<p>Waga: ${fish.weight} g</p>`;
          if (fish.size) details += `<p>Rozmiar: ${fish.size} cm</p>`;
          if (fish.description) details += `<p>Opis: ${fish.description}</p>`;
          fishCard.innerHTML = `
              <img src="assets/images/fish_icons/${imageName}" alt="${fish.species_name || 'Ryba'}" class="fish-card-image" onerror="this.src='assets/images/fish_icons/default_fish.png'; this.alt='Brak obrazka';">
              <h3>${fish.name}</h3>
              <p>Gatunek: ${fish.species_name || 'Nieznany'}</p>
              ${details}
          `;
          fishGalleryGrid.appendChild(fishCard);
      });
  };

  const loadGalleryFish = async () => {
      if (!fishGalleryGrid) return;
      try {
          const data = await apiRequest('fish.php', 'GET', null, true);
          if (data.success) {
              renderGallery(data.fish);
          } else {
              fishGalleryGrid.innerHTML = `<p>Nie udało się załadować ryb: ${data.message}.</p>`;
          }
      } catch (error) {
          if (error.status === 401) {
               fishGalleryGrid.innerHTML = `<p>Musisz być zalogowany, aby zobaczyć galerię ryb. <a href="index.html" class="button-like">Zaloguj się</a></p>`;
          } else {
              fishGalleryGrid.innerHTML = `<p>Błąd sieci podczas ładowania galerii: ${error.message}</p>`;
          }
      }
  };

  // Zarządzanie wylogowaniem na stronie galerii
  const clearAuthDataGallery = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authTokenExpiry');
  };

  const updateUIAfterLogoutGallery = () => {
    window.location.href = 'index.html';
  };

  const logoutUserGallery = () => {
      clearAuthDataGallery();
      updateUIAfterLogoutGallery();
      console.log("Użytkownik wylogowany ze strony galerii, przekierowanie...");
  };

  const logoutButtonGallery = document.getElementById('logout-button');
  if (logoutButtonGallery) {
      logoutButtonGallery.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUserGallery();
      });
  }

  // Inicjalizacja Galerii
  if (checkGalleryLoginStatus()) {
      if (logoutNavItemGallery) logoutNavItemGallery.style.display = 'list-item';
      loadGalleryFish();
  } else {
    console.log("Użytkownik nie jest zalogowany na stronie galerii, przekierowanie do logowania.");
    window.location.href = 'index.html';
  }
});
