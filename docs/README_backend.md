# Dokumentacja Backend - Moje Akwarium

## Struktura Plików Backendu (w katalogu `server/`)

-   `api/`: Endpointy dostępne publicznie (po odpowiedniej konfiguracji serwera WWW).
    -   `auth.php`: Rejestracja i logowanie użytkowników.
    -   `species.php`: Pobieranie listy dostępnych gatunków ryb.
    -   `fish.php`: Zarządzanie rybami użytkownika (CRUD).
    -   `aquarium.php`: Zarządzanie ustawieniami akwarium użytkownika (światło, karmienie, czyszczenie).
    -   `decorations.php`: Zarządzanie dostępnymi i umieszczonymi dekoracjami.
-   `classes/`: Klasy PHP.
    -   `Database.php`: Obsługa połączenia z bazą danych (SQLite) i inicjalizacja schematu.
    -   `User.php`: Logika biznesowa dla użytkowników (rejestracja, logowanie).
-   `config/`: Pliki konfiguracyjne.
    -   `config.php`: Główna konfiguracja aplikacji (ścieżki, ustawienia bazy, klucze JWT, CORS).
-   `includes/`: Skrypty pomocnicze.
    -   `auth_middleware.php`: Middleware do weryfikacji tokenów JWT.
-   `database/`:
    -   `aquarium.sqlite`: Plik bazy danych SQLite (tworzony automatycznie).
-   `vendor/`: Katalog z zależnościami zainstalowanymi przez Composer.
    -   `firebase/php-jwt`: Biblioteka do obsługi JSON Web Tokens.
-   `composer.json`, `composer.lock`: Pliki konfiguracyjne Composera.

## Baza Danych

Używana jest baza danych SQLite. Schemat bazy jest definiowany i tworzony automatycznie przez klasę `Database.php` przy pierwszym uruchomieniu (jeśli plik bazy nie istnieje).

**Tabele:**
-   `users`: Dane użytkowników (id, username, password_hash, created_at).
-   `fish_species`: Dostępne gatunki ryb (id, name, image_path).
-   `fish`: Ryby dodane przez użytkowników (id, user_id, name, species_id, added_at).
-   `user_aquarium_settings`: Ustawienia akwarium dla użytkownika (id, user_id, light_status, last_fed_at, last_cleaned_at).
-   `available_decorations`: Szablony dostępnych dekoracji (id, name, image_path, default_width, default_height).
-   `user_placed_decorations`: Dekoracje umieszczone przez użytkownika (id, user_id, decoration_id, pos_x, pos_y, width, height, rotation, z_index).

## Uwierzytelnianie

Uwierzytelnianie oparte jest na JSON Web Tokens (JWT).
1.  Użytkownik loguje się przez endpoint `/api/auth.php?action=login`.
2.  Serwer weryfikuje dane i, jeśli są poprawne, generuje token JWT podpisany sekretnym kluczem (`JWT_SECRET_KEY` z `config.php`).
3.  Token jest zwracany do klienta, który przechowuje go (np. w `localStorage`).
4.  Dla żądań do chronionych endpointów, klient musi dołączyć token w nagłówku `Authorization` jako `Bearer <token>`.
5.  Middleware `auth_middleware.php` weryfikuje token przed przetworzeniem żądania.

## Endpointy API

Wszystkie endpointy API znajdują się w katalogu `server/api/`. Domyślnie zwracają odpowiedzi w formacie JSON.
**Adres bazowy API (przy użyciu wbudowanego serwera z routerem):** `http://localhost:8000/api`

---

### 1. Uwierzytelnianie (`auth.php`)

-   **Rejestracja nowego użytkownika**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/auth.php?action=register`
    -   **Nagłówki:** `Content-Type: application/json`
    -   **Ciało żądania (JSON):**
        ```json
        {
            "username": "nowy_user",
            "password": "jego_haslo123"
        }
        ```
    -   **Odpowiedź sukces (201 Created):**
        ```json
        {
            "success": true,
            "message": "Rejestracja zakończona pomyślnie. Możesz się teraz zalogować."
        }
        ```
    -   **Odpowiedź błąd (np. 400 Bad Request):**
        ```json
        {
            "success": false,
            "message": "Użytkownik o tej nazwie już istnieje."
        }
        ```

-   **Logowanie użytkownika**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/auth.php?action=login`
    -   **Nagłówki:** `Content-Type: application/json`
    -   **Ciało żądania (JSON):**
        ```json
        {
            "username": "istniejacy_user",
            "password": "jego_haslo123"
        }
        ```
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Logowanie pomyślne.",
            "token": "dlugi.ciag.znakowJWT",
            "user": {
                "id": 1,
                "username": "istniejacy_user"
            },
            "expiresIn": 3600
        }
        ```
    -   **Odpowiedź błąd (np. 401 Unauthorized):**
        ```json
        {
            "success": false,
            "message": "Nieprawidłowa nazwa użytkownika lub hasło."
        }
        ```

---

### 2. Gatunki Ryb (`species.php`) - Chroniony

-   **Pobierz listę dostępnych gatunków ryb**
    -   **Metoda:** `GET`
    -   **Endpoint:** `/species.php`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "species": [
                { "id": 1, "name": "Gupik", "image_path": "gupik.png" },
                { "id": 2, "name": "Neon Innesa", "image_path": "neon_innesa.png" }
                // ... więcej gatunków
            ]
        }
        ```

---

### 3. Ryby Użytkownika (`fish.php`) - Chroniony

-   **Pobierz ryby zalogowanego użytkownika**
    -   **Metoda:** `GET`
    -   **Endpoint:** `/fish.php`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "fish": [
                { "id": 10, "name": "Nemo", "added_at": "...", "species_name": "Gupik", "species_image_path": "gupik.png" },
                // ... więcej ryb
            ]
        }
        ```

-   **Dodaj nową rybę**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/fish.php`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
    -   **Ciało żądania (JSON):**
        ```json
        {
            "name": "Dory",
            "species_id": 2 // ID gatunku z /api/species.php
        }
        ```
    -   **Odpowiedź sukces (201 Created):**
        ```json
        {
            "success": true,
            "message": "Ryba dodana pomyślnie.",
            "fish_id": 11 // ID nowo dodanej ryby
        }
        ```

-   **Usuń rybę**
    -   **Metoda:** `DELETE`
    -   **Endpoint:** `/fish.php?id=<ID_RYBY_DO_USUNIECIA>`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Ryba usunięta pomyślnie."
        }
        ```

-   **Usuń WSZYSTKIE ryby użytkownika**
    -   **Metoda:** `DELETE`
    -   **Endpoint:** `/fish.php?all=true`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Usunięto X ryb."
        }
        ```

---

### 4. Ustawienia Akwarium (`aquarium.php`) - Chroniony

-   **Pobierz ustawienia akwarium**
    -   **Metoda:** `GET`
    -   **Endpoint:** `/aquarium.php`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "settings": {
                "id": 1,
                "user_id": 1,
                "last_fed_at": "YYYY-MM-DD HH:MM:SS",
                "last_cleaned_at": null,
                "light_on": true // Zamiast light_status
            }
        }
        ```

-   **Przełącz światło**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/aquarium.php?action=toggle_light`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Światło przełączone.",
            "light_on": false // Nowy stan światła
        }
        ```

-   **Nakarm ryby**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/aquarium.php?action=feed`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Ryby nakarmione.",
            "last_fed_at": "YYYY-MM-DD HH:MM:SS" // Nowa data karmienia
        }
        ```

-   **Wyczyść akwarium**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/aquarium.php?action=clean`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Akwarium wyczyszczone.",
            "last_cleaned_at": "YYYY-MM-DD HH:MM:SS" // Nowa data czyszczenia
        }
        ```

---

### 5. Dekoracje (`decorations.php`) - Chroniony

-   **Pobierz listę dostępnych szablonów dekoracji**
    -   **Metoda:** `GET`
    -   **Endpoint:** `/decorations.php?type=available`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "decorations": [
                { "id": 1, "name": "Mały Kamień", "image_path": "rock1.png", "default_width": 120, "default_height": 80 },
                // ... więcej szablonów
            ]
        }
        ```

-   **Pobierz dekoracje umieszczone przez użytkownika**
    -   **Metoda:** `GET`
    -   **Endpoint:** `/decorations.php?type=user`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "decorations": [
                {
                    "user_placed_id": 1, "pos_x": 50, "pos_y": 350, "width": 100, "height": 70,
                    "rotation": 15, "z_index": 2, "decoration_template_id": 1,
                    "name": "Mały Kamień", "image_path": "rock1.png",
                    "default_width": 120, "default_height": 80
                },
                // ... więcej umieszczonych dekoracji
            ]
        }
        ```

-   **Dodaj/Zaktualizuj dekorację użytkownika**
    -   **Metoda:** `POST`
    -   **Endpoint:** `/decorations.php?type=user`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
    -   **Ciało żądania (JSON) - Dodanie nowej:**
        ```json
        {
            "decoration_id": 1, // ID szablonu z available_decorations
            "pos_x": 100,
            "pos_y": 300,
            "width": 120, // Opcjonalne, jeśli inne niż domyślne
            "height": 80, // Opcjonalne
            "rotation": 0,
            "z_index": 2
        }
        ```
    -   **Ciało żądania (JSON) - Aktualizacja istniejącej:**
        ```json
        {
            "user_placed_id": 1, // ID rekordu z user_placed_decorations
            "decoration_id": 1,
            "pos_x": 110, // Nowa pozycja
            "pos_y": 310,
            // ... inne pola do aktualizacji
        }
        ```
    -   **Odpowiedź sukces (201 Created dla nowej, 200 OK dla aktualizacji):**
        ```json
        {
            "success": true,
            "message": "Dekoracja dodana/zaktualizowana.",
            "decoration": { /* pełne dane zapisanej/zaktualizowanej dekoracji */ }
        }
        ```

-   **Usuń umieszczoną dekorację**
    -   **Metoda:** `DELETE`
    -   **Endpoint:** `/decorations.php?type=user&user_decoration_id=<ID_UMIESZCZONEJ_DEKORACJI>`
    -   **Nagłówki:** `Authorization: Bearer <JWT_TOKEN>`
    -   **Odpowiedź sukces (200 OK):**
        ```json
        {
            "success": true,
            "message": "Dekoracja usunięta pomyślnie."
        }
        ```

---

## Dalszy Rozwój (Backend)

-   Bardziej zaawansowana walidacja danych wejściowych.
-   Implementacja klasy `Fish.php`, `AquariumSettings.php`, `Decoration.php` do hermetyzacji logiki.
-   Obsługa błędów i wyjątków w bardziej rozbudowany sposób.
-   Możliwość logowania zdarzeń serwera do pliku.
-   Testy jednostkowe dla klas i testy integracyjne dla API.
-   Rozważenie użycia bardziej zaawansowanego routera PHP (np. z biblioteki).
-   Implementacja mechanizmu odświeżania tokenów JWT (refresh tokens).
