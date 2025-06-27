document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM w pełni załadowany i sparsowany na index.html");

  const API_BASE_URL = 'http://localhost:8000/api';

  // Główne Elementy UI pobierane na początku
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const aquariumDashboard = document.getElementById('aquarium-dashboard');
  const logoutNavItem = document.getElementById('logout-nav-item');
  const welcomeUsernameSpan = document.getElementById('welcome-username');
  const logoutButton = document.getElementById('logout-button');

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginErrorMessage = document.getElementById('login-error-message');
  const registerErrorMessage = document.getElementById('register-error-message');
  const registerSuccessMessage = document.getElementById('register-success-message');

  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');

  const aquariumVisual = document.getElementById('aquarium-visual');
  const toggleLightBtn = document.getElementById('toggle-light-btn');
  const feedFishBtn = document.getElementById('feed-fish-btn');
  const cleanAquariumBtn = document.getElementById('clean-aquarium-btn');
  const removeAllFishBtn = document.getElementById('remove-fish-btn');

  const fishEntitiesLayer = document.getElementById('fish-entities-layer');
  const fishList = document.getElementById('fish-list');

  const addFishModal = document.getElementById('add-fish-modal');
  const addFishBtn = document.getElementById('add-fish-btn');
  const closeButton = document.querySelector('#add-fish-modal .close-button');
  const addFishForm = document.getElementById('add-fish-form');
  const modalErrorMessage = document.getElementById('modal-error-message');
  const fishSpeciesSelect = document.getElementById('fish-species');

  // Elementy dla dekoracji
  const decorateAquariumBtn = document.getElementById('decorate-aquarium-btn');
  const decorationPanel = document.getElementById('decoration-panel');
  const closeDecorationPanelBtn = document.getElementById('close-decoration-panel');
  const availableDecorationsList = document.getElementById('available-decorations-list');
  const saveDecorationsBtn = document.getElementById('save-decorations-btn');
  const aquariumDecorationsLayer = document.getElementById('aquarium-decorations');
  const backgroundSelector = document.getElementById('bg-select');
  const aquariumBgLayer = document.querySelector('#aquarium-visual .aquarium-bg-layer');


  // Globalne zmienne
  let activeFishEntities = [];
  let animationFrameId = null;
  let currentPlacedDecorations = [];
  let availableDecorationTemplates = [];
  let selectedPlacedDecoration = null;
  let hungerLevel = 100;
  let dirtLevel = 0;
  let hungerInterval = null;
  let dirtInterval = null;
  let statusIntervalsStarted = false;


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
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: `Błąd serwera: ${response.status} ${response.statusText}` }));
              if (response.status === 401 && requiresAuth) {
                  console.warn("Token wygasł lub nieprawidłowy. Wylogowywanie.");
                  logoutUser();
              }
              throw { status: response.status, message: errorData.message || `Błąd serwera: ${response.status}` };
          }
          if (response.status === 204) return { success: true, message: "Operacja wykonana pomyślnie (brak zawartości)." };
          const data = await response.json();
          return data;
      } catch (error) {
          console.error(`Błąd API (${endpoint}):`, error.message || error);
          if (!error.status && !(error instanceof TypeError)) {
               throw { status: 0, message: "Błąd sieci lub serwer nieosiągalny." };
          }
          throw error;
      }
  };

  // Zarządzanie stanem zalogowania
  const saveAuthData = (token, user, expiresIn) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('authTokenExpiry', expiryTime.toString());
      updateUIForLoggedInUser(user.username);
  };

  const clearAuthData = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authTokenExpiry');
      localStorage.removeItem('aquariumBg');
  };

  const logoutUser = () => {
      clearAuthData();
      updateUIForLoggedOutUser();
      console.log("Użytkownik wylogowany.");
  };

  const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      const userString = localStorage.getItem('authUser');
      const expiryString = localStorage.getItem('authTokenExpiry');

      if (token && userString && expiryString) {
          const expiryTime = parseInt(expiryString, 10);
          if (new Date().getTime() < expiryTime) {
              const user = JSON.parse(userString);
              updateUIForLoggedInUser(user.username);
              return true;
          } else {
              console.log("Token wygasł.");
              logoutUser();
              return false;
          }
      }
      updateUIForLoggedOutUser();
      return false;
  };

  // Aktualizacja UI
  const updateUIForLoggedInUser = (username) => {
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'none';
      if (aquariumDashboard) aquariumDashboard.style.display = 'block';
      if (logoutNavItem) logoutNavItem.style.display = 'list-item';
      if (welcomeUsernameSpan) welcomeUsernameSpan.textContent = username;
      loadUserFish();
      loadAquariumSettings();
      loadUserDecorations();
      initializeBackgroundSelector();
  };

  const updateUIForLoggedOutUser = () => {
      if (loginSection) loginSection.style.display = 'block';
      if (registerSection) registerSection.style.display = 'none';
      if (aquariumDashboard) aquariumDashboard.style.display = 'none';
      if (logoutNavItem) logoutNavItem.style.display = 'none';
      if (welcomeUsernameSpan) welcomeUsernameSpan.textContent = '';
      if (fishEntitiesLayer) fishEntitiesLayer.innerHTML = '<p style="text-align:center; padding-top: 50px; color: white;">Zaloguj się, aby zobaczyć akwarium.</p>';
      if (fishList) fishList.innerHTML = '<li>Zaloguj się, aby zobaczyć swoje ryby.</li>';
      if (aquariumDecorationsLayer) aquariumDecorationsLayer.innerHTML = '';
      currentPlacedDecorations = [];
      selectedPlacedDecoration = null;
      // Usunięcie globalnego przycisku usuwania, jeśli istniał
      const tempDeleteBtn = document.getElementById('temp-delete-deco-btn');
      if (tempDeleteBtn && tempDeleteBtn.parentNode) {
          tempDeleteBtn.parentNode.removeChild(tempDeleteBtn);
      }

      if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
          activeFishEntities = [];
      }
  };

  // Obsługa formularzy logowania/rejestracji
  // (Pełny kod tej sekcji jest w poprzedniej odpowiedzi - zakładam, że działa)
  if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          if(loginErrorMessage) loginErrorMessage.style.display = 'none';
          const username = loginForm.username.value;
          const password = loginForm.password.value;
          try {
              const data = await apiRequest('auth.php?action=login', 'POST', { username, password });
              if (data.success && data.token) {
                  saveAuthData(data.token, data.user, data.expiresIn);
                  loginForm.reset();
              } else {
                  if(loginErrorMessage) { loginErrorMessage.textContent = data.message || 'Logowanie nie powiodło się.'; loginErrorMessage.style.display = 'block'; }
                  else { console.error("Login error message element not found"); }
              }
          } catch (error) {
              if(loginErrorMessage) { loginErrorMessage.textContent = error.message || 'Błąd podczas logowania.'; loginErrorMessage.style.display = 'block'; }
              else { console.error("Login error message element not found"); }
          }
      });
  }

  if (registerForm) {
      registerForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          if(registerErrorMessage) registerErrorMessage.style.display = 'none';
          if(registerSuccessMessage) registerSuccessMessage.style.display = 'none';
          const username = registerForm.username.value;
          const password = registerForm.password.value;
          try {
              const data = await apiRequest('auth.php?action=register', 'POST', { username, password });
              if (data.success) {
                  if(registerSuccessMessage) { registerSuccessMessage.textContent = data.message + " Możesz się teraz zalogować."; registerSuccessMessage.style.display = 'block'; }
                  else { console.error("Register success message element not found"); }
                  registerForm.reset();
                  if (registerSection) registerSection.style.display = 'none';
                  if (loginSection) loginSection.style.display = 'block';
              } else {
                  if(registerErrorMessage) { registerErrorMessage.textContent = data.message || 'Rejestracja nie powiodła się.'; registerErrorMessage.style.display = 'block'; }
                  else { console.error("Register error message element not found"); }
              }
          } catch (error) {
               if(registerErrorMessage) { registerErrorMessage.textContent = error.message || 'Błąd podczas rejestracji.'; registerErrorMessage.style.display = 'block'; }
               else { console.error("Register error message element not found"); }
          }
      });
  }

  if (showRegisterLink) {
      showRegisterLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (loginSection) loginSection.style.display = 'none';
          if (registerSection) registerSection.style.display = 'block';
          if(loginErrorMessage) loginErrorMessage.style.display = 'none';
          if(registerErrorMessage) registerErrorMessage.style.display = 'none';
          if(registerSuccessMessage) registerSuccessMessage.style.display = 'none';
      });
  }
  if (showLoginLink) {
      showLoginLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (registerSection) registerSection.style.display = 'none';
          if (loginSection) loginSection.style.display = 'block';
          if(loginErrorMessage) loginErrorMessage.style.display = 'none';
          if(registerErrorMessage) registerErrorMessage.style.display = 'none';
          if(registerSuccessMessage) registerSuccessMessage.style.display = 'none';
      });
  }

  if (logoutButton) {
      logoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser();
      });
  } else {
      console.error("Logout button not found");
  }

  // Obsługa zmiany tła akwarium
  const initializeBackgroundSelector = () => {
      if (backgroundSelector && aquariumBgLayer) {
          const defaultBgPath = "assets/images/aquarium_elements/background_aquarium_1.png";
          const savedBg = localStorage.getItem('aquariumBg');
          let currentBg = defaultBgPath;
          if (savedBg) {
              let isValidSavedBg = false;
              for (let i = 0; i < backgroundSelector.options.length; i++) {
                  if (backgroundSelector.options[i].value === savedBg) { isValidSavedBg = true; break; }
              }
              if (isValidSavedBg) currentBg = savedBg;
              else localStorage.setItem('aquariumBg', defaultBgPath);
          } else {
              localStorage.setItem('aquariumBg', defaultBgPath);
          }
          aquariumBgLayer.src = currentBg;
          backgroundSelector.value = currentBg;
      }
  };
  if (backgroundSelector) {
      backgroundSelector.addEventListener('change', (event) => {
          const selectedBgPath = event.target.value;
          if (selectedBgPath && aquariumBgLayer) {
              aquariumBgLayer.src = selectedBgPath;
              localStorage.setItem('aquariumBg', selectedBgPath);
          }
      });
  }

  // Logika ryb (graficzna i tekstowa)
  // (Funkcje renderFishEntities, animateAquarium, renderTextFishList, loadUserFish - bez zmian, jak w poprzedniej odpowiedzi)
  // Poniżej wklejam je dla kompletności.
  const renderFishEntities = (fishes) => {
      if (!fishEntitiesLayer) { console.error("Fish entities layer not found!"); return; }
      fishEntitiesLayer.innerHTML = '';
      activeFishEntities = [];

      if (!fishes || fishes.length === 0) {
          if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
          return;
      }

      const aquariumWidth = fishEntitiesLayer.offsetWidth;
      const aquariumHeight = fishEntitiesLayer.offsetHeight;

      fishes.forEach((fishData) => {
          const fishImg = document.createElement('img');
          fishImg.classList.add('fish-entity');
          const speciesImage = fishData.species_image_path || 'default_fish_icon.png';
          fishImg.src = `assets/images/fish_icons/${speciesImage}`;
          fishImg.alt = fishData.name;
          fishImg.title = `${fishData.name} (${fishData.species_name || 'Nieznany gatunek'})`;
          fishImg.dataset.fishId = fishData.id.toString();

          const fishWidth = 100;
          const fishHeight = fishWidth * 0.5;

          fishImg.x_pos = Math.max(0, Math.random() * (aquariumWidth - fishWidth));
          fishImg.y_pos = Math.max(0, Math.random() * (aquariumHeight - fishHeight));
          fishImg.vx = (Math.random() - 0.5) * 2 * 0.5;
          fishImg.vy = (Math.random() - 0.5) * 2 * 0.3;

          fishImg.style.left = fishImg.x_pos + 'px';
          fishImg.style.top = fishImg.y_pos + 'px';

          if (fishImg.vx < 0) fishImg.style.transform = 'scaleX(-1)';

          fishEntitiesLayer.appendChild(fishImg);
          activeFishEntities.push(fishImg);
      });

      if (activeFishEntities.length > 0 && !animationFrameId) animateAquarium();
  };

  function animateAquarium() {
      if (!fishEntitiesLayer || activeFishEntities.length === 0) {
          animationFrameId = null; return;
      }
      const aquariumWidth = fishEntitiesLayer.offsetWidth;
      const aquariumHeight = fishEntitiesLayer.offsetHeight;

      activeFishEntities.forEach(fishImg => {
          const fishWidth = fishImg.offsetWidth || 100;
          const fishHeight = fishImg.offsetHeight || 50;

          fishImg.x_pos += fishImg.vx;
          fishImg.y_pos += fishImg.vy;

          if (fishImg.x_pos + fishWidth > aquariumWidth) { fishImg.x_pos = aquariumWidth - fishWidth; fishImg.vx *= -1; fishImg.style.transform = 'scaleX(1)'; }
          else if (fishImg.x_pos < 0) { fishImg.x_pos = 0; fishImg.vx *= -1; fishImg.style.transform = 'scaleX(-1)'; }
          if (fishImg.y_pos + fishHeight > aquariumHeight) { fishImg.y_pos = aquariumHeight - fishHeight; fishImg.vy *= -1; }
          else if (fishImg.y_pos < 0) { fishImg.y_pos = 0; fishImg.vy *= -1; }

          if (Math.random() < 0.005) { fishImg.vy += (Math.random() - 0.5) * 0.2; fishImg.vy = Math.max(-0.5, Math.min(0.5, fishImg.vy)); }
          if (Math.random() < 0.002) {
              fishImg.vx += (Math.random() - 0.5) * 0.3;
              fishImg.vx = Math.max(-1, Math.min(1, fishImg.vx));
              if (fishImg.vx < 0 && fishImg.style.transform !== 'scaleX(-1)') fishImg.style.transform = 'scaleX(-1)';
              else if (fishImg.vx > 0 && fishImg.style.transform === 'scaleX(-1)') fishImg.style.transform = 'scaleX(1)';
          }
          fishImg.style.left = fishImg.x_pos + 'px';
          fishImg.style.top = fishImg.y_pos + 'px';
      });
      animationFrameId = requestAnimationFrame(animateAquarium);
  }

  const renderTextFishList = (fishes) => {
      if (!fishList) return;
      fishList.innerHTML = '';
      if (!fishes || fishes.length === 0) {
          fishList.innerHTML = '<li>Brak ryb w akwarium. Dodaj pierwszą!</li>';
      } else {
          fishes.forEach(fish => {
              const listItem = document.createElement('li');
              listItem.textContent = `${fish.name} (${fish.species_name || 'Nieznany gatunek'}) `;
              const deleteButton = document.createElement('button');
              deleteButton.textContent = 'Usuń';
              deleteButton.classList.add('delete-fish-item-btn');
              deleteButton.dataset.fishId = fish.id.toString();
              deleteButton.addEventListener('click', async (event) => {
                  const fishIdToDelete = event.target.dataset.fishId;
                  const fishNameToDelete = fishes.find(f => f.id.toString() === fishIdToDelete)?.name || 'tej ryby';
                  if (confirm(`Czy na pewno chcesz usunąć rybę "${fishNameToDelete}"?`)) {
                      try {
                          await apiRequest(`fish.php?id=${fishIdToDelete}`, 'DELETE', null, true);
                          loadUserFish();
                      } catch (error) {
                          alert(`Nie udało się usunąć ryby: ${error.message}`);
                      }
                  }
              });
              listItem.appendChild(deleteButton);
              fishList.appendChild(listItem);
          });
      }
  };

  const loadUserFish = async () => {
      if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
      activeFishEntities = [];
      if (!localStorage.getItem('authToken')) {
          if (fishEntitiesLayer) fishEntitiesLayer.innerHTML = '<p style="text-align:center; padding-top: 50px; color: white;">Zaloguj się</p>';
          if (fishList) fishList.innerHTML = '<li>Zaloguj się</li>';
          return;
      }
      try {
          const data = await apiRequest('fish.php', 'GET', null, true);
          if (data.success) {
              renderFishEntities(data.fish);
              renderTextFishList(data.fish);
          } else {
              if (fishEntitiesLayer) fishEntitiesLayer.innerHTML = `<p>Błąd: ${data.message}</p>`;
              if (fishList) fishList.innerHTML = `<li>Błąd: ${data.message}</li>`;
          }
      } catch (error) {
          if (fishEntitiesLayer) fishEntitiesLayer.innerHTML = `<p>Błąd sieci: ${error.message}</p>`;
          if (fishList) fishList.innerHTML = `<li>Błąd sieci: ${error.message}</li>`;
      }
  };

  // Modal dodawania ryby
  const loadFishSpecies = async () => {
      if (!fishSpeciesSelect) return;
      try {
          const data = await apiRequest('species.php', 'GET', null, true);
          if (data.success && data.species) {
              fishSpeciesSelect.innerHTML = '<option value="">-- Wybierz gatunek --</option>';
              data.species.forEach(spec => {
                  const option = document.createElement('option');
                  option.value = spec.id;
                  option.textContent = spec.name;
                  fishSpeciesSelect.appendChild(option);
              });
          } else {
              console.error("Nie udało się załadować gatunków ryb:", data.message);
              fishSpeciesSelect.innerHTML = '<option value="">Błąd ładowania gatunków</option>';
          }
      } catch (error) {
          console.error("Błąd sieci podczas ładowania gatunków ryb:", error.message);
          if (fishSpeciesSelect) fishSpeciesSelect.innerHTML = '<option value="">Błąd ładowania gatunków</option>';
      }
  };

  if (addFishBtn) {
      addFishBtn.addEventListener('click', async () => {
          if (addFishModal) {
              addFishModal.style.display = 'block';
              if (modalErrorMessage) modalErrorMessage.style.display = 'none';
              else console.error("Element 'modal-error-message' nie został znaleziony w DOM.");
              if(addFishForm) addFishForm.reset();
              try {
                  await loadFishSpecies();
              } catch (error) {
                  console.error("Nie udało się załadować gatunków do modala:", error);
              }
          }
      });
  }

  if (closeButton) {
      closeButton.addEventListener('click', () => {
          if (addFishModal) addFishModal.style.display = 'none';
      });
  }
  window.addEventListener('click', (event) => {
      if (addFishModal && event.target === addFishModal) {
          addFishModal.style.display = 'none';
      }
      if (decorationPanel && event.target === decorationPanel) {
          decorationPanel.style.display = 'none';
      }
  });

  if (addFishForm) {
      addFishForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const fishNameInput = document.getElementById('fish-name');
          const fishName = fishNameInput.value.trim();
          const speciesId = fishSpeciesSelect.value;
          const fishWeightInput = document.getElementById('fish-weight');
          const fishSizeInput = document.getElementById('fish-size');
          const fishDescriptionInput = document.getElementById('fish-description');
          const fishWeight = fishWeightInput && fishWeightInput.value ? parseFloat(fishWeightInput.value) : null;
          const fishSize = fishSizeInput && fishSizeInput.value ? parseFloat(fishSizeInput.value) : null;
          const fishDescription = fishDescriptionInput && fishDescriptionInput.value ? fishDescriptionInput.value.trim() : null;

          if (fishName === '') {
              if(modalErrorMessage) { modalErrorMessage.textContent = 'Nazwa ryby jest wymagana!'; modalErrorMessage.style.display = 'block';}
              else { console.error("Modal error message element not found"); }
              if (fishNameInput) fishNameInput.focus(); return;
          }
          if (speciesId === '') {
               if(modalErrorMessage) { modalErrorMessage.textContent = 'Gatunek ryby jest wymagany!'; modalErrorMessage.style.display = 'block';}
               else { console.error("Modal error message element not found"); }
              if (fishSpeciesSelect) fishSpeciesSelect.focus(); return;
          }
          if(modalErrorMessage) modalErrorMessage.style.display = 'none';

          try {
              const newFishData = {
                  name: fishName,
                  species_id: speciesId,
                  weight: fishWeight,
                  size: fishSize,
                  description: fishDescription
              };
              const result = await apiRequest('fish.php', 'POST', newFishData, true);
              if (result.success) {
                  loadUserFish();
                  addFishForm.reset();
                  if (addFishModal) addFishModal.style.display = 'none';
              } else {
                  if(modalErrorMessage) { modalErrorMessage.textContent = result.message || "Nie udało się dodać ryby."; modalErrorMessage.style.display = 'block';}
                  else { console.error("Modal error message element not found"); }
              }
          } catch (error) {
              if(modalErrorMessage) { modalErrorMessage.textContent = error.message || "Błąd serwera podczas dodawania ryby."; modalErrorMessage.style.display = 'block';}
              else { console.error("Modal error message element not found"); }
          }
      });
  }

  // Ustawienia i akcje akwarium
  function updateLastActions(settings) {
    const lastFed = document.getElementById('last-fed-info');
    const lastCleaned = document.getElementById('last-cleaned-info');
    const dateOpts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    if (lastFed) {
      if (settings.last_fed_at) {
        const d = new Date(settings.last_fed_at.replace(' ', 'T'));
        lastFed.textContent = 'Ostatnie karmienie: ' + d.toLocaleString('pl-PL', dateOpts);
      } else {
        lastFed.textContent = 'Ostatnie karmienie: --';
      }
    }
    if (lastCleaned) {
      if (settings.last_cleaned_at) {
        const d = new Date(settings.last_cleaned_at.replace(' ', 'T'));
        lastCleaned.textContent = 'Ostatnie czyszczenie: ' + d.toLocaleString('pl-PL', dateOpts);
      } else {
        lastCleaned.textContent = 'Ostatnie czyszczenie: --';
      }
    }
  }

  let updateAquariumVisuals = (settings) => {
    if (typeof settings.hunger_level === 'number') hungerLevel = settings.hunger_level;
    if (typeof settings.dirt_level === 'number') dirtLevel = settings.dirt_level;
    updateStatusBars();
    updateLastActions(settings);
    if (!statusIntervalsStarted) startStatusIntervals();
    // Oryginalna logika światła
    if (!aquariumVisual) return;
    if (settings.light_on) {
        aquariumVisual.classList.add('light-on');
        aquariumVisual.classList.remove('light-off');
        if (toggleLightBtn) {
            toggleLightBtn.setAttribute('data-status', 'on');
            toggleLightBtn.textContent = 'Wyłącz Światło';
        }
    } else {
        aquariumVisual.classList.add('light-off');
        aquariumVisual.classList.remove('light-on');
        if (toggleLightBtn) {
            toggleLightBtn.setAttribute('data-status', 'off');
            toggleLightBtn.textContent = 'Włącz Światło';
        }
    }
    console.log("Ustawienia akwarium zaktualizowane na froncie:", settings);
  }

  const loadAquariumSettings = async () => {
      if (!localStorage.getItem('authToken')) return;
      try {
          const data = await apiRequest('aquarium.php', 'GET', null, true);
          if (data.success && data.settings) {
              updateAquariumVisuals(data.settings);
          } else {
              console.error("Nie udało się załadować ustawień akwarium:", data.message);
          }
      } catch (error) {
          console.error("Błąd sieci podczas ładowania ustawień akwarium:", error.message);
      }
  };

  // Funkcja animacji karmienia
  const showFeedingAnimation = () => {
      if (!aquariumVisual) { console.error("Aquarium visual container not found for feeding animation."); return; }
      const numberOfPellets = 10 + Math.floor(Math.random() * 5);
      const pelletStartY = -30;
      for (let i = 0; i < numberOfPellets; i++) {
          const pellet = document.createElement('img');
          pellet.src = 'assets/images/fish_food/fish_food_1.png';
          pellet.alt = 'Jedzenie dla ryb';
          pellet.style.position = 'absolute';
          pellet.style.width = '75px';
          pellet.style.height = '75px';
          pellet.style.zIndex = '5';
          pellet.style.opacity = '0';
          pellet.style.pointerEvents = 'none';
          const aquariumWidth = aquariumVisual.offsetWidth;
          const aquariumHeight = aquariumVisual.offsetHeight;
          if (aquariumWidth <=0 || aquariumHeight <=0) { console.warn("Aquarium dimensions not available for pellet positioning."); return; }
          pellet.style.left = Math.random() * (aquariumWidth - 8) + 'px';
          pellet.style.top = pelletStartY + 'px';
          const effectsLayer = document.getElementById('aquarium-effects-layer') || aquariumVisual;
          effectsLayer.appendChild(pellet);
          let startTime = null;
          const durationFall = 2500 + Math.random() * 1000;
          const durationFade = 1000;
          const endY = aquariumHeight - 10;
          function animatePellet(timestamp) {
              if (!startTime) startTime = timestamp;
              const progress = timestamp - startTime;
              pellet.style.opacity = '1';
              if (progress < durationFall) {
                  const currentY = pelletStartY + (endY - pelletStartY) * (progress / durationFall);
                  pellet.style.top = currentY + 'px';
                  requestAnimationFrame(animatePellet);
              } else if (progress < durationFall + durationFade) {
                  const fadeProgress = progress - durationFall;
                  pellet.style.opacity = (1 - fadeProgress / durationFade).toString();
                  requestAnimationFrame(animatePellet);
              } else {
                  if (pellet.parentNode) pellet.parentNode.removeChild(pellet);
              }
          }
          setTimeout(() => requestAnimationFrame(animatePellet), i * 150 + Math.random() * 100);
      }
  };

  // Funkcja animacji czyszczenia (zmiotka)
  const showCleaningAnimation = () => {
      if (!aquariumVisual) { console.error("Aquarium visual container not found for cleaning animation."); return; }
      const brush = document.createElement('img');
      brush.src = 'assets/images/glass_cleaner/glass_cleaner.png';
      brush.alt = 'Czyszczenie akwarium';
      brush.style.position = 'absolute';
      const brushWidth = 200;
      const brushHeight = 120;
      brush.style.width = brushWidth + 'px';
      brush.style.height = 'auto';
      brush.style.zIndex = '11';
      brush.style.opacity = '0';
      brush.style.transform = 'rotate(90deg)';
      brush.style.pointerEvents = 'none';
      const effectsLayer = document.getElementById('aquarium-effects-layer') || aquariumVisual;
      effectsLayer.appendChild(brush);
      const aquariumWidth = aquariumVisual.offsetWidth;
      const aquariumHeight = aquariumVisual.offsetHeight;
      if (aquariumWidth <=0 || aquariumHeight <=0) {
          console.warn("Aquarium dimensions not available for brush positioning.");
          if (brush.parentNode) brush.parentNode.removeChild(brush);
          return;
      }
      let startX = -brushWidth - 20;
      let endX = aquariumWidth + 20;
      let currentY = Math.random() * (aquariumHeight - brushHeight);
      brush.style.top = currentY + 'px';
      brush.style.left = startX + 'px';
      brush.style.transition = 'opacity 0.3s ease-in';
      brush.style.opacity = '0.9';
      let passes = 0;
      const maxPasses = 3;
      const durationPerPass = 1800;
      function animateBrushPass() {
          const targetX = (passes % 2 === 0) ? endX : startX;
          brush.style.transition = `left ${durationPerPass}ms ease-in-out, top 0.5s ease-in-out, opacity 0.3s ease-in`;
          brush.style.left = targetX + 'px';
          passes++;
          if (passes < maxPasses) {
              currentY = Math.random() * (aquariumHeight - brushHeight);
              setTimeout(() => {
                  brush.style.top = currentY + 'px';
                  animateBrushPass();
              }, durationPerPass + 100);
          } else {
              setTimeout(() => {
                  brush.style.transition = 'opacity 0.5s ease-out, left 0.5s ease-out';
                  brush.style.opacity = '0';
                  brush.style.left = (passes % 2 === 0) ? aquariumWidth + brushWidth + 20 + 'px' : -brushWidth * 2 - 20 + 'px';
                  setTimeout(() => {
                      if (brush.parentNode) brush.parentNode.removeChild(brush);
                  }, 500);
              }, durationPerPass);
          }
      }
      setTimeout(animateBrushPass, 300);
  };

  // Obsługa panelu dekoracji
  if (decorateAquariumBtn) {
      decorateAquariumBtn.addEventListener('click', () => {
          if (decorationPanel) {
              decorationPanel.style.display = 'block';
              loadAvailableDecorations();
          }
      });
  }

  if (closeDecorationPanelBtn) {
      closeDecorationPanelBtn.addEventListener('click', () => {
          if (decorationPanel) decorationPanel.style.display = 'none';
      });
  }

  // Funkcje związane z dekoracjami
  const loadAvailableDecorations = async () => {
      if (!availableDecorationsList) return;
      availableDecorationsList.innerHTML = '<p>Ładowanie...</p>';
      try {
          const data = await apiRequest('decorations.php?type=available', 'GET', null, true);
          if (data.success && data.decorations) {
              availableDecorationTemplates = data.decorations;
              renderAvailableDecorations(availableDecorationTemplates);
          } else {
              availableDecorationsList.innerHTML = `<p>Błąd: ${data.message || 'Nie udało się załadować dekoracji.'}</p>`;
          }
      } catch (error) {
          availableDecorationsList.innerHTML = `<p>Błąd sieci: ${error.message}</p>`;
      }
  };

  const renderAvailableDecorations = (decorations) => {
      if (!availableDecorationsList) return;
      availableDecorationsList.innerHTML = '';
      if (decorations.length === 0) {
          availableDecorationsList.innerHTML = '<p>Brak dostępnych dekoracji.</p>';
          return;
      }
      decorations.forEach(decoTemplate => {
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('decoration-item');
          itemDiv.dataset.decorationId = decoTemplate.id;
          itemDiv.innerHTML = `
              <img src="assets/images/aquarium_elements/${decoTemplate.image_path}" alt="${decoTemplate.name}">
              <p>${decoTemplate.name}</p>
          `;
          itemDiv.addEventListener('click', () => handleAddDecorationToAquarium(decoTemplate));
          availableDecorationsList.appendChild(itemDiv);
      });
  };

  const loadUserDecorations = async () => {
      if (!aquariumDecorationsLayer || !localStorage.getItem('authToken')) return;
      try {
          const data = await apiRequest('decorations.php?type=user', 'GET', null, true);
          if (data.success && data.decorations) {
              currentPlacedDecorations = data.decorations;
              renderPlacedDecorations(currentPlacedDecorations);
          } else {
              console.error("Nie udało się załadować dekoracji użytkownika:", data.message);
              if (aquariumDecorationsLayer) aquariumDecorationsLayer.innerHTML = '';
          }
      } catch (error) {
          console.error("Błąd sieci podczas ładowania dekoracji użytkownika:", error.message);
          if (aquariumDecorationsLayer) aquariumDecorationsLayer.innerHTML = '';
      }
  };

  const renderPlacedDecorations = (placedDecorations) => {
    if (!aquariumDecorationsLayer) {
        console.error("Warstwa dekoracji (#aquarium-decorations) nie znaleziona!");
        return;
    }
    aquariumDecorationsLayer.innerHTML = ''; // Wyczyść poprzednie
    console.log("Renderowanie umieszczonych dekoracji:", placedDecorations); // LOG

    placedDecorations.forEach(deco => {
        const decoWrapper = document.createElement('div');
        decoWrapper.classList.add('placed-decoration-wrapper');
        decoWrapper.style.position = 'absolute';
        decoWrapper.style.left = `${deco.pos_x}px`;
        decoWrapper.style.top = `${deco.pos_y}px`;
        decoWrapper.style.width = deco.width ? `${deco.width}px` : `${deco.default_width || 100}px`;
        decoWrapper.style.transform = `rotate(${deco.rotation || 0}deg)`;
        decoWrapper.style.zIndex = deco.z_index || 3; // Zmieniono z-index na 3, aby był spójny z rybami na 4
        decoWrapper.dataset.userPlacedId = deco.user_placed_id;

        const decoImg = document.createElement('img');
        decoImg.classList.add('decoration-img');
        decoImg.src = `assets/images/aquarium_elements/${deco.image_path}`;
        decoImg.alt = deco.name;
        decoImg.title = deco.name;
        decoImg.style.width = '100%';
        decoImg.style.height = 'auto';
        if (deco.height && deco.width) {
            decoImg.style.height = `${deco.height}px`;
        }

        const deleteDecoBtn = document.createElement('span');
        deleteDecoBtn.classList.add('delete-placed-deco-btn');
        deleteDecoBtn.innerHTML = '&times;';
        deleteDecoBtn.title = 'Usuń dekorację';
        deleteDecoBtn.style.display = 'none'; // Domyślnie ukryty

        deleteDecoBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Zapobiegaj zaznaczeniu po kliknięciu X
            console.log(`Kliknięto X dla dekoracji ID: ${deco.user_placed_id}, Nazwa: ${deco.name}`); // LOG
            if (confirm(`Czy na pewno chcesz usunąć "${deco.name}"?`)) {
                console.log(`Potwierdzono usunięcie dekoracji ID: ${deco.user_placed_id}`); // LOG
                try {
                    const result = await apiRequest(`decorations.php?type=user&user_decoration_id=${deco.user_placed_id}`, 'DELETE', null, true);
                    console.log("Odpowiedź API na usunięcie:", result); // LOG
                    if (result.success) {
                        console.log("Dekoracja usunięta pomyślnie z serwera."); // LOG
                        loadUserDecorations(); // Odśwież widok dekoracji
                        selectedPlacedDecoration = null; // Odznacz, jeśli była zaznaczona
                    } else {
                        alert(`Nie udało się usunąć dekoracji: ${result.message}`);
                    }
                } catch (error) {
                    console.error("Błąd API podczas usuwania dekoracji:", error); // LOG
                    alert(`Błąd serwera podczas usuwania dekoracji: ${error.message}`);
                }
            } else {
                console.log(`Anulowano usunięcie dekoracji ID: ${deco.user_placed_id}`); // LOG
            }
        });

        decoWrapper.appendChild(decoImg);
        decoWrapper.appendChild(deleteDecoBtn); // Upewnij się, że przycisk jest dodany do DOM
        aquariumDecorationsLayer.appendChild(decoWrapper);

        decoWrapper.addEventListener('click', (e) => {
            // Nie chcemy, aby kliknięcie na już zaznaczony przycisk 'X' ponownie wywoływało handleSelect
            if (e.target !== deleteDecoBtn) {
                console.log("Wrapper kliknięty (nie przycisk X), user_placed_id:", deco.user_placed_id); // LOG
                handleSelectPlacedDecoration(decoWrapper, deco);
            }
        });
    });
};

const handleSelectPlacedDecoration = (decoWrapperElement, decoData) => {
    console.log("handleSelectPlacedDecoration wywołana dla:", decoData.name, "ID:", decoData.user_placed_id); // LOG

    // Odznacz poprzednią, jeśli istnieje i jest inna niż aktualnie kliknięta
    if (selectedPlacedDecoration && selectedPlacedDecoration.element && selectedPlacedDecoration.element !== decoWrapperElement) {
        console.log("Odznaczanie poprzedniej:", selectedPlacedDecoration.data.name); // LOG
        selectedPlacedDecoration.element.style.outline = 'none';
        const prevDeleteBtn = selectedPlacedDecoration.element.querySelector('.delete-placed-deco-btn');
        if (prevDeleteBtn) {
            prevDeleteBtn.style.display = 'none';
            console.log("Ukryto przycisk usuwania dla poprzedniej."); // LOG
        }
    }

    // Przełącz zaznaczenie dla aktualnie klikniętego elementu
    if (selectedPlacedDecoration && selectedPlacedDecoration.element === decoWrapperElement) {
        // Jeśli kliknięto ten sam element, odznacz go
        decoWrapperElement.style.outline = 'none';
        const currentDeleteBtn = decoWrapperElement.querySelector('.delete-placed-deco-btn');
        if (currentDeleteBtn) currentDeleteBtn.style.display = 'none';
        selectedPlacedDecoration = null;
        console.log("Odznaczono dekorację:", decoData.name); // LOG
    } else {
        // Zaznacz nowy element
        decoWrapperElement.style.outline = '2px dashed #8e2de2';
        const currentDeleteBtn = decoWrapperElement.querySelector('.delete-placed-deco-btn');
        if (currentDeleteBtn) {
            currentDeleteBtn.style.display = 'block';
            console.log("Pokazano przycisk usuwania dla:", decoData.name, currentDeleteBtn); // LOG
        } else {
            console.error("Nie znaleziono przycisku .delete-placed-deco-btn wewnątrz wrapper'a", decoWrapperElement);
        }
        selectedPlacedDecoration = { element: decoWrapperElement, data: decoData };
    }
};

  // Event Listenery dla przycisków akcji (światło, karmienie, czyszczenie, usuń wszystkie ryby)
  if (toggleLightBtn) {
      toggleLightBtn.addEventListener('click', async () => {
          try {
              const data = await apiRequest('aquarium.php?action=toggle_light', 'POST', null, true);
              if (data.success) {
                  // Zmień tylko wygląd światła i tekst przycisku
                  if (data.light_on) {
                      aquariumVisual.classList.add('light-on');
                      aquariumVisual.classList.remove('light-off');
                      toggleLightBtn.setAttribute('data-status', 'on');
                      toggleLightBtn.textContent = 'Wyłącz Światło';
                  } else {
                      aquariumVisual.classList.add('light-off');
                      aquariumVisual.classList.remove('light-on');
                      toggleLightBtn.setAttribute('data-status', 'off');
                      toggleLightBtn.textContent = 'Włącz Światło';
                  }
              } else {
                  alert(`Błąd przełączania światła: ${data.message}`);
              }
          } catch (error) {
              alert(`Błąd sieci: ${error.message}`);
          }
      });
  }

  if (feedFishBtn) {
      feedFishBtn.addEventListener('click', async () => {
          try {
              const data = await apiRequest('aquarium.php?action=feed', 'POST', null, true);
              if (data.success) {
                  hungerLevel = 0;
                  updateStatusBars();
                  alert(`Ryby nakarmione! Ostatnio: ${new Date(data.last_fed_at).toLocaleString()}`);
                  showFeedingAnimation();
              } else {
                  alert(`Błąd karmienia: ${data.message}`);
              }
          } catch (error) {
              alert(`Błąd sieci: ${error.message}`);
          }
      });
  }

  if (cleanAquariumBtn) {
      cleanAquariumBtn.addEventListener('click', async () => {
          try {
              const data = await apiRequest('aquarium.php?action=clean', 'POST', null, true);
              if (data.success) {
                  dirtLevel = typeof data.dirt_level === 'number' ? data.dirt_level : 0;
                  updateStatusBars();
                  alert(`Akwarium wyczyszczone! Ostatnio: ${new Date(data.last_cleaned_at).toLocaleString()}`);
                  showCleaningAnimation();
              } else {
                  alert(`Błąd czyszczenia: ${data.message}`);
              }
          } catch (error) {
              alert(`Błąd sieci: ${error.message}`);
          }
      });
  }

  if (removeAllFishBtn) {
      removeAllFishBtn.addEventListener('click', async () => {
          if (confirm("Czy na pewno chcesz usunąć WSZYSTKIE swoje ryby? Tej operacji nie można cofnąć.")) {
              try {
                  const data = await apiRequest('fish.php?all=true', 'DELETE', null, true);
                  if (data.success) {
                      alert(data.message);
                      loadUserFish();
                  } else {
                      alert(`Błąd usuwania wszystkich ryb: ${data.message}`);
                  }
              } catch (error) {
                  alert(`Błąd sieci: ${error.message}`);
              }
          }
      });
  }

  // Dodawanie dekoracji do akwarium
  const handleAddDecorationToAquarium = async (decoTemplate) => {
      if (!decoTemplate || !decoTemplate.id) {
          alert('Nieprawidłowa dekoracja.');
          return;
      }
      // Ustaw dekorację w dolnej części akwarium
      const aquarium = document.getElementById('aquarium-visual');
      const aquariumHeight = aquarium ? aquarium.offsetHeight : 400;
      const decoHeight = decoTemplate.default_height || 100;
      const posY = aquariumHeight - decoHeight - 10; // 10px od dołu
      const aquariumWidth = aquarium ? aquarium.offsetWidth : 800;
      const decoWidth = decoTemplate.default_width || 100;
      const minX = 10;
      const maxX = aquariumWidth - decoWidth - 10;
      const posX = minX + Math.floor(Math.random() * (maxX - minX + 1));
      const width = decoWidth;
      const height = decoHeight;
      const rotation = 0;
      const zIndex = 3;
      try {
          const result = await apiRequest('decorations.php?type=user', 'POST', {
              decoration_id: decoTemplate.id,
              pos_x: posX,
              pos_y: posY,
              width: width,
              height: height,
              rotation: rotation,
              z_index: zIndex
          }, true);
          if (result.success) {
              loadUserDecorations();
          } else {
              alert(result.message || 'Nie udało się dodać dekoracji.');
          }
      } catch (error) {
          alert(error.message || 'Błąd podczas dodawania dekoracji.');
      }
  };

  // Usuwanie wszystkich dekoracji
  const removeAllDecorationsBtn = document.getElementById('remove-all-decorations-btn');
  if (removeAllDecorationsBtn) {
      removeAllDecorationsBtn.addEventListener('click', async () => {
          if (confirm('Czy na pewno chcesz usunąć wszystkie dekoracje z akwarium?')) {
              try {
                  const result = await apiRequest('decorations.php?type=user&all=true', 'DELETE', null, true);
                  if (result.success) {
                      loadUserDecorations();
                  } else {
                      alert(result.message || 'Nie udało się usunąć dekoracji.');
                  }
              } catch (error) {
                  alert(error.message || 'Błąd podczas usuwania dekoracji.');
              }
          }
      });
  }

  // Inicjalizacja
  checkLoginStatus();

  function updateStatusBars() {
    const hungerBar = document.getElementById('hunger-bar');
    const dirtBar = document.getElementById('dirt-bar');
    const hungerValue = document.getElementById('hunger-value');
    const dirtValue = document.getElementById('dirt-value');
    const reminder = document.getElementById('aquarium-reminder');
    if (hungerBar) hungerBar.style.width = Math.max(0, Math.min(100, hungerLevel)) + '%';
    if (dirtBar) dirtBar.style.width = Math.max(0, Math.min(100, dirtLevel)) + '%';
    if (hungerValue) hungerValue.textContent = Math.round(hungerLevel);
    if (dirtValue) dirtValue.textContent = Math.round(dirtLevel);
    if (reminder) {
      let messages = [];
      if (hungerLevel >= 70) messages.push('Nakarm ryby!');
      if (dirtLevel >= 70) messages.push('Wyczyść akwarium!');
      if (messages.length > 0) {
        reminder.style.display = 'block';
        reminder.innerHTML = messages.map(msg => `<div>${msg}</div>`).join('');
      } else {
        reminder.style.display = 'none';
        reminder.innerHTML = '';
      }
    }
  }

  function startStatusIntervals() {
    if (statusIntervalsStarted) return;
    statusIntervalsStarted = true;
    hungerInterval = setInterval(() => {
      if (hungerLevel < 100) {
        hungerLevel += 100/60;
        if (hungerLevel > 100) hungerLevel = 100;
        updateStatusBars();
      }
    }, 1000);
    dirtInterval = setInterval(() => {
      if (dirtLevel < 100) {
        dirtLevel += 100/60;
        if (dirtLevel > 100) dirtLevel = 100;
        updateStatusBars();
      }
    }, 1000);
  }

  function stopStatusIntervals() {
    if (hungerInterval) clearInterval(hungerInterval);
    if (dirtInterval) clearInterval(dirtInterval);
    statusIntervalsStarted = false;
  }
});
