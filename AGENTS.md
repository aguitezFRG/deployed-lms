# Repository Guidelines

## Project Structure & Module Organization

The main application lives in `LMS/`; run project commands from that directory. Laravel domain code is under `app/`, with Filament panels and resources in `app/Filament/`, HTTP controllers and middleware in `app/Http/`, and authorization rules in `app/Policies/`. Routes are defined in `routes/`. Blade templates, JavaScript, and Tailwind CSS live in `resources/`; web-served assets belong in `public/`. Database migrations, factories, and seeders are in `database/`. Tests are split between `tests/Feature/` and `tests/Unit/`.

## Build, Test, and Development Commands

```bash
cd LMS
composer setup                         # Install dependencies, initialize .env/database, and build assets
composer dev                           # Start Laravel, queue listener, logs, and Vite together
composer test                          # Clear config and run the complete PHPUnit suite
php artisan test --filter=CatalogTest  # Run a focused test or test class
./vendor/bin/pint                      # Format PHP code
npm run dev                            # Run only the Vite development server
npm run build                          # Create production frontend assets
composer audit --locked                # Check PHP dependencies for known vulnerabilities
```

## Coding Style & Naming Conventions

Follow PSR-4 namespaces (`App\\` maps to `app/`) and Laravel conventions. Use four spaces for PHP, JavaScript, and Blade; YAML uses two spaces, as specified by `.editorconfig`. Name classes and PHP files in PascalCase, methods and variables in camelCase, and database columns in snake_case. Use descriptive Laravel suffixes such as `Controller`, `Policy`, `Service`, and `Test`. Run Pint before submitting PHP changes. Keep generated Filament assets in `public/` out of hand-edited source changes when an equivalent file exists under `resources/`.

## Testing Guidelines

PHPUnit 11 uses in-memory SQLite with synchronous queues and array-backed cache/session settings. Add behavior and integration coverage to `tests/Feature/`; reserve `tests/Unit/` for isolated logic. Test files must end in `Test.php`, and test names should state the behavior being verified. Run focused tests while developing, then `composer test` before opening a pull request. No fixed coverage threshold is configured; changes should cover success, validation, authorization, and relevant security paths.

## Commit & Pull Request Guidelines

Recent commits use concise imperative subjects, commonly Conventional Commit prefixes such as `feat:`, `fix:`, and `style/ui:`. Keep each commit scoped to one logical change. Pull requests should explain the user-visible effect, list verification commands, link related issues, and include screenshots for Filament, Blade, or theme changes. Call out migrations, environment-variable changes, and security implications explicitly; never commit `.env`, credentials, or production data.
