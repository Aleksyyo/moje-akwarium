# Moje Akwarium - Aplikacja do Zarządzania Wirtualnym Akwarium

Witaj w projekcie "Moje Akwarium"! Jest to aplikacja webowa pozwalająca użytkownikom na zarządzanie własnym wirtualnym akwarium, dodawanie ryb, dekoracji oraz interakcję z elementami akwarium.

## Spis Treści

- [Opis Projektu](#opis-projektu)
- [Technologie](#technologie)
- [Struktura Projektu](#struktura-projektu)
- [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
- [Funkcjonalności](#funkcjonalności)
- [Dokumentacja Szczegółowa](#dokumentacja-szczegółowa)
- [Autor](#autor)

## Opis Projektu

Aplikacja "Moje Akwarium" umożliwia:
- Rejestrację i logowanie użytkowników.
- Personalizację wirtualnego akwarium poprzez dodawanie i zarządzanie rybami.
- Zmianę tła akwarium.
- Dodawanie, pozycjonowanie i usuwanie dekoracji.
- Interaktywne akcje takie jak karmienie ryb, włączanie/wyłączanie światła, czyszczenie akwarium (z prostymi animacjami).
- Przeglądanie galerii posiadanych ryb.

## Technologie

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** PHP (wersja X.X.X lub nowsza)
- **Baza Danych:** SQLite (plikowa)
- **Zarządzanie Zależnościami PHP:** Composer (dla biblioteki JWT)
- **Format Wymiany Danych:** JSON
- **Uwierzytelnianie:** Tokeny JWT (JSON Web Tokens)

## Struktura Projektu

/moje-akwarium/
├── public/                     # Pliki frontendu (HTML, CSS, JS, zasoby)
│   ├── index.html
│   ├── gallery.html
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js
│   │   └── gallery.js
│   └── assets/
│       ├── images/             # Obrazki (tła, dekoracje, ryby, efekty)
│       │   ├── aquarium_elements/
│       │   ├── aquarium_effects/
│       │   └── fish_icons/
│       └── ...
├── server/                     # Pliki backendu (PHP)
│   ├── api/                    # Endpointy API (auth.php, fish.php, species.php, aquarium.php, decorations.php)
│   ├── classes/                # Klasy PHP (Database.php, User.php)
│   ├── config/                 # Pliki konfiguracyjne (config.php)
│   ├── includes/               # Pliki pomocnicze (auth_middleware.php)
│   ├── database/               # Plik bazy danych SQLite (aquarium.sqlite - tworzony automatycznie)
│   └── vendor/                 # Biblioteki Composera (np. firebase/php-jwt)
├── docs/                       # Dokumentacja szczegółowa
│   ├── README_frontend.md
│   ├── README_backend.md
│   └── postman_collection.json # (Opcjonalnie) Eksport kolekcji Postmana
└── README.md                   # Ten plik

## Instalacja i Uruchomienie

### Wymagania Wstępne
- Serwer WWW z obsługą PHP (np. Apache, Nginx, lub wbudowany serwer PHP)
- PHP (zalecana wersja 7.4 lub nowsza)
- Composer (do instalacji zależności backendu)
- Przeglądarka internetowa

### Kroki Instalacji

1.  **Sklonuj repozytorium (lub pobierz pliki projektu):**
    ```bash
    git clone <adres-repozytorium> moje-akwarium
    cd moje-akwarium
    ```

2.  **Zainstaluj zależności backendu (Composer):**
    Przejdź do głównego katalogu projektu (`moje-akwarium/`) i uruchom:
    ```bash
    composer install
    ```
    To zainstaluje bibliotekę `firebase/php-jwt` do katalogu `vendor/`.

3.  **Konfiguracja Backendu:**
    - Skopiuj `server/config/config.php.example` (jeśli istnieje) do `server/config/config.php`.
    - Edytuj `server/config/config.php` i **ustaw swój własny, unikalny `JWT_SECRET_KEY`**.
    - Upewnij się, że ścieżki `DB_PATH` są poprawne i serwer WWW ma uprawnienia do zapisu w katalogu `server/database/` (aby mógł utworzyć plik `aquarium.sqlite`).

4.  **Uruchomienie Serwera:**

    **Opcja 1: Wbudowany serwer PHP (dla dewelopmentu)**
    Z głównego katalogu projektu (`moje-akwarium/`) uruchom:
    ```bash
    php -S localhost:8000 -t public dev_router.php
    ```
    Aplikacja frontendowa będzie dostępna pod `http://localhost:8000/`.
    Endpointy API będą dostępne pod `http://localhost:8000/api/...`.

    **Opcja 2: Konfiguracja lokalnego serwera (np. XAMPP, WAMP, MAMP, Docker)**
    - Skonfiguruj swój serwer WWW tak, aby `document root` wskazywał na katalog `public/` wewnątrz projektu.
    - Upewnij się, że `mod_rewrite` (dla Apache) jest włączony, jeśli planujesz używać bardziej zaawansowanego routingu.

5.  **Dostęp do Aplikacji:**
    Otwórz przeglądarkę i przejdź pod adres `http://localhost:8000` (lub inny skonfigurowany adres).

## Funkcjonalności

- **Uwierzytelnianie:** Rejestracja, logowanie, wylogowywanie (JWT).
- **Zarządzanie Akwarium:**
    - Dodawanie i usuwanie ryb (tekstowa lista i graficzna reprezentacja).
    - Pływające ryby w akwarium.
    - Zmiana tła akwarium.
    - Dodawanie, pozycjonowanie (domyślne) i usuwanie dekoracji.
    - Włączanie/wyłączanie światła w akwarium (z efektem wizualnym).
    - Karmienie ryb (z animacją).
    - Czyszczenie akwarium (z animacją).
- **Galeria Ryb:** Podstrona wyświetlająca posiadane ryby.
- **Responsywność:** Podstawowe RWD dla strony głównej i galerii ryb.
- **Walidacja danych wejściowych** (podstawowa po stronie klienta i serwera).
- **Informacje zwrotne dla użytkownika** (komunikaty o błędach i sukcesie).

## Dokumentacja Szczegółowa

- [Dokumentacja Frontendu](./docs/README_frontend.md)
- [Dokumentacja Backendu (w tym przykłady zapytań API)](./docs/README_backend.md)

