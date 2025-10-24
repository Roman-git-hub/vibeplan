VibePlan Sync Edition — базовая версия с ручной синхронизацией через GitHub API.

Файлы в архиве:
- index.html — интерфейс с кнопкой «Синхронизировать сейчас»
- style.css — стили
- script.js — логика и ручная синхронизация
- README.txt — краткая инструкция

Как подключить синхронизацию (коротко):
1) Создайте Personal Access Token (PAT) в GitHub: Settings → Developer settings → Personal access tokens → Generate new token (classic).
   Дайте права 'public_repo' (или 'repo' если репозиторий приватный).
2) Откройте ваш VibePlan, нажмите «Настройки» → введите GitHub owner (ваш username), repo (имя репозитория, например 'vibeplan'), path (data.json) и вставьте PAT (только у вас).
3) Нажмите «Синхронизировать сейчас» — сайт создаст/обновит data.json в репозитории.

ВАЖНО: токен хранится локально в localStorage вашего браузера. Не передавайте токен другим людям.

Generated: 2025-10-24T21:57:01.241823Z
