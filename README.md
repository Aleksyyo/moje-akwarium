# Moje Akwarium – Kompleksowa Dokumentacja

Witaj w projekcie "Moje Akwarium"! Jest to aplikacja webowa pozwalająca użytkownikom na zarządzanie własnym wirtualnym akwarium, dodawanie ryb, dekoracji oraz interakcję z elementami akwarium.

---

## Spis Treści
- [Opis Projektu](#opis-projektu)
- [Technologie](#technologie)
- [Struktura Projektu](#struktura-projektu)
- [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
- [Funkcjonalności](#funkcjonalności)
- [Frontend – Szczegóły](#frontend--szczegóły)
- [Backend – Szczegóły i API](#backend--szczegóły-i-api)
- [Dalszy Rozwój](#dalszy-rozwój)
- [FAQ](#faq)
- [Zgłaszanie Błędów i Sugestii](#zgłaszanie-błędów-i-sugestii)
- [Autor](#autor)

---

## Opis Projektu
Aplikacja "Moje Akwarium" umożliwia:
- Rejestrację i logowanie użytkowników (JWT)
- Personalizację wirtualnego akwarium (dodawanie/zarządzanie rybami, dekoracjami, tłem)
- Interaktywne akcje: karmienie ryb, włączanie/wyłączanie światła, czyszczenie akwarium (z animacjami)
- Przeglądanie galerii posiadanych ryb

## Technologie
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** PHP (>=7.4)
- **Baza Danych:** SQLite (plikowa)
- **Zarządzanie zależnościami:** Composer (PHP)
- **Uwierzytelnianie:** JWT (JSON Web Tokens)
- **Format wymiany danych:** JSON

## Struktura Projektu

```
moje-akwarium/
├── public/           # Frontend (HTML, CSS, JS, assets)
│   ├── index.html
│   ├── gallery.html
│   ├── css/
│   ├── js/
│   └── assets/
├── server/           # Backend (PHP)
│   ├── api/          # Endpointy API
│   ├── classes/      # Klasy PHP (logika, baza)
│   ├── config/       # Konfiguracja
│   ├── includes/     # Middleware, helpery
│   └── database/     # Plik bazy SQLite
├── vendor/           # Zależności Composer
├── docs/             # (archiwalne, całość poniżej)
├── composer.json
├── composer.lock
├── dev_router.php
└── README.md         # (ten plik)
```

### Frontend – Pliki
- `index.html` – główna strona (logowanie, rejestracja, dashboard akwarium)
- `gallery.html` – galeria ryb
- `css/style.css` – główny arkusz stylów
- `js/app.js` – logika UI, interakcje, komunikacja z API
- `js/gallery.js` – obsługa galerii
- `assets/` – obrazy tła, dekoracji, ryb, animacji

### Backend – Pliki
- `api/` – endpointy API (auth.php, fish.php, aquarium.php, decorations.php, species.php)
- `classes/` – logika PHP (Database.php, User.php)
- `config/` – konfiguracja (config.php)
- `includes/` – middleware (auth_middleware.php)
- `database/` – plik bazy SQLite

---

## Instalacja i Uruchomienie

### Wymagania
- Serwer WWW z obsługą PHP (np. Apache, Nginx, wbudowany serwer PHP)
- PHP >= 7.4
- Composer
- Przeglądarka internetowa

### Kroki Instalacji
1. **Sklonuj repozytorium:**
   ```bash
   git clone <adres-repozytorium> moje-akwarium
   cd moje-akwarium
   ```
2. **Zainstaluj zależności backendu:**
   ```bash
   composer install
   ```
3. **Konfiguracja:**
   - Skopiuj `server/config/config.php.example` do `server/config/config.php` (jeśli istnieje)
   - Ustaw własny `JWT_SECRET_KEY` w `config.php`
   - Sprawdź ścieżki `DB_PATH` i uprawnienia do zapisu w `server/database/`
4. **Uruchom serwer:**
   - Wbudowany serwer PHP (dev):
     ```bash
     php -S localhost:8000 -t public dev_router.php
     ```
   - Lub skonfiguruj swój serwer WWW, aby `document root` wskazywał na `public/`
5. **Dostęp do aplikacji:**
   - Otwórz przeglądarkę: `http://localhost:8000`

---

## Funkcjonalności
- Rejestracja, logowanie, wylogowywanie (JWT)
- Dodawanie, usuwanie, przeglądanie ryb (lista + grafika)
- Zmiana tła akwarium
- Dodawanie, pozycjonowanie, usuwanie dekoracji
- Włączanie/wyłączanie światła (efekt wizualny)
- Karmienie ryb (animacja)
- Czyszczenie akwarium (animacja)
- Galeria ryb
- Responsywność (RWD)
- Walidacja danych wejściowych (frontend + backend)
- Komunikaty o błędach i sukcesie

---

## Frontend – Szczegóły

### Struktura i logika
- **UI:** Formularze logowania/rejestracji, dashboard akwarium, panele wyboru tła, ryb, dekoracji, galeria
- **Logika JS:**
  - Obsługa zdarzeń (kliknięcia, formularze)
  - Dynamiczna aktualizacja DOM (dodawanie/usuwanie ryb, dekoracji, zmiana wyglądu)
  - Animacje (pływające ryby, karmienie, czyszczenie)
  - Przechowywanie tokenu JWT i danych użytkownika w `localStorage`
  - Zarządzanie stanem zalogowania
  - Walidacja danych wejściowych
- **Komunikacja z API:**
  - Wysyłanie żądań do endpointów API (rejestracja, logowanie, ryby, dekoracje, ustawienia akwarium)
  - Obsługa odpowiedzi i komunikatów
  - Dołączanie tokenu JWT do autoryzowanych żądań
- **Responsywność:**
  - CSS Grid, Flexbox, Media Queries
  - Dostosowanie do desktop/tablet/mobile

### Użyte biblioteki
- Czysty JavaScript (Vanilla JS), HTML, CSS
- Brak zewnętrznych frameworków JS (łatwa integracja w przyszłości)

---

## Backend – Szczegóły i API

### Struktura
- **api/** – endpointy API (auth.php, fish.php, aquarium.php, decorations.php, species.php)
- **classes/** – logika PHP (Database.php, User.php)
- **config/** – konfiguracja (config.php)
- **includes/** – middleware (auth_middleware.php)
- **database/** – plik bazy SQLite

### Baza danych (SQLite)
- Tworzona automatycznie przez `Database.php` przy pierwszym uruchomieniu
- **Tabele:**
  - `users` – użytkownicy
  - `fish_species` – gatunki ryb
  - `fish` – ryby użytkowników
  - `user_aquarium_settings` – ustawienia akwarium
  - `available_decorations` – szablony dekoracji
  - `user_placed_decorations` – dekoracje użytkownika

### Uwierzytelnianie (JWT)
- Logowanie przez `/api/auth.php?action=login` (POST)
- Token JWT zwracany do klienta, dołączany do autoryzowanych żądań
- Middleware `auth_middleware.php` weryfikuje token

### Endpointy API (przykłady)

#### 1. Uwierzytelnianie (`auth.php`)
- **Rejestracja:**
  - `POST /api/auth.php?action=register`
  - Body: `{ "username": "nowy_user", "password": "haslo" }`
- **Logowanie:**
  - `POST /api/auth.php?action=login`
  - Body: `{ "username": "user", "password": "haslo" }`
  - Odpowiedź: `{ "token": "...", "user": { ... } }`

#### 2. Gatunki ryb (`species.php`)
- **GET /api/species.php** (wymaga JWT)
- Zwraca listę dostępnych gatunków

#### 3. Ryby użytkownika (`fish.php`)
- **GET /api/fish.php** – pobierz ryby
- **POST /api/fish.php** – dodaj rybę `{ "name": "Dory", "species_id": 2 }`
- **DELETE /api/fish.php?id=ID** – usuń rybę
- **DELETE /api/fish.php?all=true** – usuń wszystkie ryby

#### 4. Ustawienia akwarium (`aquarium.php`)
- **GET /api/aquarium.php** – pobierz ustawienia
- **POST /api/aquarium.php?action=toggle_light** – przełącz światło
- **POST /api/aquarium.php?action=feed** – nakarm ryby
- **POST /api/aquarium.php?action=clean** – wyczyść akwarium

#### 5. Dekoracje (`decorations.php`)
- **GET /api/decorations.php?type=available** – lista szablonów dekoracji
- **GET /api/decorations.php?type=user** – dekoracje użytkownika
- **POST /api/decorations.php?type=user** – dodaj/aktualizuj dekorację
- **DELETE /api/decorations.php?type=user&user_decoration_id=ID** – usuń dekorację

##### Wszystkie chronione endpointy wymagają nagłówka:
```
Authorization: Bearer <JWT_TOKEN>
```

##### Przykładowa odpowiedź (dodanie ryby):
```json
{
  "success": true,
  "message": "Ryba dodana pomyślnie.",
  "fish_id": 11
}
```

---

## Dalszy Rozwój
- Bardziej zaawansowane animacje i interakcje (frontend)
- Drag & drop i zmiana rozmiaru dekoracji
- Lepsza obsługa błędów i komunikatów
- Refaktoryzacja JS do modułów ES6
- Testy jednostkowe i E2E
- Zaawansowana walidacja danych (backend)
- Klasy PHP dla logiki domenowej (Fish, AquariumSettings, Decoration)
- Obsługa wyjątków, logowanie zdarzeń
- Testy jednostkowe/integracyjne backendu
- Odświeżanie tokenów JWT (refresh tokens)

---

## FAQ
**1. Nie mogę się zalogować – co robić?**
- Sprawdź, czy serwer backendu działa i czy masz poprawnie skonfigurowany `JWT_SECRET_KEY`.
- Upewnij się, że baza danych jest zapisywalna.

**2. Nie działa komunikacja z API?**
- Sprawdź, czy endpointy API są dostępne pod `/api/`.
- Sprawdź konsolę przeglądarki (F12) – mogą być tam komunikaty o błędach CORS lub autoryzacji.

**3. Jak dodać własne gatunki ryb lub dekoracje?**
- Dodaj rekordy do odpowiednich tabel w bazie SQLite (`fish_species`, `available_decorations`).
- Dodaj odpowiednie obrazki do katalogu `public/assets/images/`.

**4. Jak zresetować hasło?**
- Funkcja resetowania hasła nie jest zaimplementowana – zrób to bezpośrednio w bazie danych.

---

