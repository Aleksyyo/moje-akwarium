document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM w pełni załadowany i sparsowany na index.html");

  const API_BASE_URL = 'http://localhost:8000/api';

  // --- Główne Elementy UI pobierane na początku ---
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const aquariumDashboard = document.getElementById('aquarium-dashboard');
  const logoutNavItem = document.getElementById('logout-nav-item');
  const welcomeUsernameSpan = document.getElementById('welcome-username');
  const logoutButton = document.getElementById('logout-button'); // Przeniesiono deklarację wyżej

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


  // --- Funkcje pomocnicze dla API ---
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

  // --- Zarządzanie stanem zalogowania ---
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

  // --- Aktualizacja UI ---
  const updateUIForLoggedInUser = (username) => {
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'none';
      if (aquariumDashboard) aquariumDashboard.style.display = 'block';
      if (logoutNavItem) logoutNavItem.style.display = 'list-item';
      if (welcomeUsernameSpan) welcomeUsernameSpan.textContent = username;
      loadUserFish();
      loadAquariumSettings();
  };

  const updateUIForLoggedOutUser = () => {
      if (loginSection) loginSection.style.display = 'block';
      if (registerSection) registerSection.style.display = 'none';
      if (aquariumDashboard) aquariumDashboard.style.display = 'none';
      if (logoutNavItem) logoutNavItem.style.display = 'none';
      if (welcomeUsernameSpan) welcomeUsernameSpan.textContent = '';
      if (fishEntitiesLayer) fishEntitiesLayer.innerHTML = '<p style="text-align:center; padding-top: 50px; color: white;">Zaloguj się, aby zobaczyć akwarium.</p>';
      if (fishList) fishList.innerHTML = '<li>Zaloguj się, aby zobaczyć swoje ryby.</li>';
  };

  // --- Obsługa formularzy logowania/rejestracji ---
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
                  if(loginErrorMessage) {
                      loginErrorMessage.textContent = data.message || 'Logowanie nie powiodło się.';
                      loginErrorMessage.style.display = 'block';
                  } else { console.error("Login error message element not found"); }
              }
          } catch (error) {
              if(loginErrorMessage) {
                  loginErrorMessage.textContent = error.message || 'Błąd podczas logowania.';
                  loginErrorMessage.style.display = 'block';
              } else { console.error("Login error message element not found"); }
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
                  if(registerSuccessMessage) {
                      registerSuccessMessage.textContent = data.message + " Możesz się teraz zalogować.";
                      registerSuccessMessage.style.display = 'block';
                  } else { console.error("Register success message element not found"); }
                  registerForm.reset();
                  if (registerSection) registerSection.style.display = 'none';
                  if (loginSection) loginSection.style.display = 'block';
              } else {
                  if(registerErrorMessage) {
                      registerErrorMessage.textContent = data.message || 'Rejestracja nie powiodła się.';
                      registerErrorMessage.style.display = 'block';
                  } else { console.error("Register error message element not found"); }
              }
          } catch (error) {
               if(registerErrorMessage) {
                  registerErrorMessage.textContent = error.message || 'Błąd podczas rejestracji.';
                  registerErrorMessage.style.display = 'block';
              } else { console.error("Register error message element not found"); }
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

  // Event listener dla przycisku wylogowania - teraz logoutButton jest już zadeklarowane
  if (logoutButton) {
      logoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser();
      });
  } else {
      console.error("Logout button not found");
  }


  // --- Logika ryb (graficzna i tekstowa) ---
  const renderFishEntities = (fishes) => {
      if (!fishEntitiesLayer) return;
      fishEntitiesLayer.innerHTML = '';
      if (!fishes || fishes.length === 0) return;

      fishes.forEach((fish, index) => {
          const fishImg = document.createElement('img');
          fishImg.classList.add('fish-entity');
          const speciesImage = fish.species_image_path || 'default_fish_icon.png';
          fishImg.src = `assets/images/fish_icons/${speciesImage}`;
          fishImg.alt = fish.name;
          fishImg.title = `${fish.name} (${fish.species_name || 'Nieznany gatunek'})`;
          fishImg.dataset.fishId = fish.id.toString();

          const aquariumWidth = fishEntitiesLayer.offsetWidth;
          const aquariumHeight = fishEntitiesLayer.offsetHeight;
          
          const computedStyle = getComputedStyle(fishImg);
          let fishWidth = parseInt(computedStyle.width);
          let fishHeight = parseInt(computedStyle.height);

          // Jeśli wymiary nie są jeszcze dostępne z CSS (obrazek się nie załadował), użyj domyślnych
          if (isNaN(fishWidth) || fishWidth === 0) fishWidth = 80;
          if (isNaN(fishHeight) || fishHeight === 0) fishHeight = fishWidth * 0.5;


          if (aquariumWidth > fishWidth && aquariumHeight > fishHeight) {
              fishImg.style.left = Math.max(0, Math.random() * (aquariumWidth - fishWidth)) + 'px';
              fishImg.style.top = Math.max(0, Math.random() * (aquariumHeight - fishHeight)) + 'px';
              if (Math.random() > 0.5) fishImg.style.transform = 'scaleX(-1)';
          } else {
              fishImg.style.left = '10px';
              fishImg.style.top = '10px';
          }
          fishEntitiesLayer.appendChild(fishImg);
      });
  };

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

  // --- Modal dodawania ryby ---
  const loadFishSpecies = async () => { // Zmieniono nazwę na loadFishSpecies, aby uniknąć konfliktu
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
                  await loadFishSpecies(); // Użyj poprawnej nazwy funkcji
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
      if (event.target === addFishModal) {
          if (addFishModal) addFishModal.style.display = 'none';
      }
  });

  if (addFishForm) {
      addFishForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const fishNameInput = document.getElementById('fish-name');
          const fishName = fishNameInput.value.trim();
          const speciesId = fishSpeciesSelect.value;

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
              const newFishData = { name: fishName, species_id: speciesId };
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


  // --- Ustawienia i akcje akwarium ---
  const updateAquariumVisuals = (settings) => {
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
  };

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

  // --- Funkcja animacji karmienia ---
  const showFeedingAnimation = () => {
      if (!aquariumVisual) {
          console.error("Aquarium visual container not found for feeding animation.");
          return;
      }
      const numberOfPellets = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numberOfPellets; i++) {
          const pellet = document.createElement('img');
          pellet.src = 'assets/images/fish_food/fish_food_1.png';
          pellet.alt = 'Jedzenie dla ryb';
          pellet.style.position = 'absolute';
          pellet.style.width = '100px';
          pellet.style.height = '80px';
          pellet.style.zIndex = '5';
          pellet.style.opacity = '0';
          pellet.style.pointerEvents = 'none';

          const aquariumWidth = aquariumVisual.offsetWidth;
          const aquariumHeight = aquariumVisual.offsetHeight;

          if (aquariumWidth <=0 || aquariumHeight <=0) {
              console.warn("Aquarium dimensions not available for pellet positioning.");
              return;
          }

          pellet.style.left = Math.random() * (aquariumWidth - 8) + 'px';
          pellet.style.top = '-10px';

          const effectsLayer = document.getElementById('aquarium-effects-layer') || aquariumVisual;
          effectsLayer.appendChild(pellet);

          let startTime = null;
          const durationFall = 2000 + Math.random() * 1000;
          const durationFade = 1000;
          const startY = -10;
          const endY = aquariumHeight - 10;

          function animatePellet(timestamp) {
              if (!startTime) startTime = timestamp;
              const progress = timestamp - startTime;
              pellet.style.opacity = '1';
              if (progress < durationFall) {
                  const currentY = startY + (endY - startY) * (progress / durationFall);
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

  // --- Funkcja animacji czyszczenia (zmiotka) ---
  const showCleaningAnimation = () => {
      if (!aquariumVisual) {
          console.error("Aquarium visual container not found for cleaning animation.");
          return;
      }
      const brush = document.createElement('img');
      brush.src = 'assets/images/glass_cleaner/glass_cleaner.png';
      brush.alt = 'Czyszczenie akwarium';
      brush.style.position = 'absolute';
      brush.style.width = '200px';
      brush.style.height = 'auto';
      brush.style.zIndex = '11';
      brush.style.opacity = '0.9';
      brush.style.pointerEvents = 'none';
      brush.style.transform = 'rotate(90deg)';

      const effectsLayer = document.getElementById('aquarium-effects-layer') || aquariumVisual;
      effectsLayer.appendChild(brush);

      const aquariumWidth = aquariumVisual.offsetWidth;
      const aquariumHeight = aquariumVisual.offsetHeight;
      const brushWidth = 100;

      if (aquariumWidth <=0 || aquariumHeight <=0) {
          console.warn("Aquarium dimensions not available for brush positioning.");
          if (brush.parentNode) brush.parentNode.removeChild(brush);
          return;
      }

      let startX = -brushWidth;
      let endX = aquariumWidth;
      let currentY = Math.random() * (aquariumHeight - 50);
      brush.style.top = currentY + 'px';
      brush.style.left = startX + 'px';

      let passes = 0;
      const maxPasses = 3;
      const durationPerPass = 1500;

      function animateBrush() {
          const targetX = (passes % 2 === 0) ? endX : startX;
          brush.style.transition = `left ${durationPerPass}ms ease-in-out`;
          brush.style.left = targetX + 'px';
          passes++;

          if (passes < maxPasses) {
              currentY = Math.random() * (aquariumHeight - 50);
              setTimeout(() => {
                  brush.style.transition = 'none';
                  brush.style.top = currentY + 'px';
                  void brush.offsetHeight;
                  animateBrush();
              }, durationPerPass + 50);
          } else {
              setTimeout(() => {
                  brush.style.transition = 'opacity 0.5s ease-out';
                  brush.style.opacity = '0';
                  setTimeout(() => {
                      if (brush.parentNode) brush.parentNode.removeChild(brush);
                  }, 500);
              }, durationPerPass);
          }
      }
      setTimeout(animateBrush, 100);
  };

  // --- Event Listenery dla przycisków akcji ---
  if (toggleLightBtn) {
      toggleLightBtn.addEventListener('click', async () => {
          try {
              const data = await apiRequest('aquarium.php?action=toggle_light', 'POST', null, true);
              if (data.success) {
                  updateAquariumVisuals({ light_on: data.light_on });
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

  // --- Inicjalizacja ---
  checkLoginStatus();
});
