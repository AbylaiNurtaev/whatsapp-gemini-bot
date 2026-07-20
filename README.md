# WhatsApp Gemini Bot for Wappi

Минимальный бот для Wappi: принимает входящие WhatsApp-сообщения через webhook, получает ответ от Gemini и отправляет его обратно в чат.

## Локальный запуск

```bash
cd whatsapp-gemini-bot
npm install
cp .env.example .env
npm run dev
```

Заполните `.env`:

```bash
WAPPI_API_TOKEN=...
WAPPI_PROFILE_ID=...
GEMINI_API_KEY=...
```

## Railway

1. Создайте новый Railway project из этой папки.
2. Добавьте переменные окружения из `.env.example`.
3. После деплоя добавьте `PUBLIC_BASE_URL=https://your-app.up.railway.app`.
4. Запустите один раз:

```bash
npm run setup:webhook
```

Или установите webhook вручную в Wappi:

```text
POST https://wappi.pro/api/webhook/url/set?profile_id=...&url=https://your-app.up.railway.app/webhook
Authorization: your_wappi_api_token
```

Для типов webhook включите минимум `incoming_message`.

## Endpoints

- `GET /health` - проверка сервиса.
- `POST /webhook` - endpoint для Wappi.

## Настройка поведения

Измените `BOT_SYSTEM_PROMPT`, чтобы задать тон, роль и правила ассистента. Например, можно добавить название компании, список услуг, цены, адреса и правила передачи диалога менеджеру.
