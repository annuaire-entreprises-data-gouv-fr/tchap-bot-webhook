# Tchap Bot Webhook

Un bot Tchap qui expose des webhooks pour envoyer des notifications dans des salons Tchap.

## Fonctionnalités

- **Webhook générique** — Envoie un message texte dans un salon Tchap via `POST /api/webhook`
- **Webhook Updown.io** — Reçoit les alertes de disponibilité Updown.io et les formate en messages HTML riches
- **Gestion des alertes** — Associe une URL surveillée à un salon Tchap
- **Habilitations** — Gère la liste des utilisateurs autorisés à interagir avec le bot
- **Healthcheck** — `GET /api/health`

## Prérequis

- Node.js 20+
- Une base de données PostgreSQL
- Un compte Tchap pour le bot

## Installation

```bash
npm install
```

## Configuration

Copier le fichier `.env.example` en `.env` et renseigner les variables :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL complète de connexion PostgreSQL (optionnel, surcharge les `DATABASE_*`) |
| `DATABASE_HOST` | Hôte PostgreSQL |
| `DATABASE_PORT` | Port PostgreSQL (défaut: `5432`) |
| `DATABASE_NAME` | Nom de la base de données |
| `DATABASE_USER` | Utilisateur PostgreSQL |
| `DATABASE_PASSWORD` | Mot de passe PostgreSQL |
| `MATRIX_DOMAIN` | Domaine du serveur Tchap |
| `MATRIX_SERVER_URL` | URL complète du serveur Tchap (ex: `https://matrix.domaine.fr`) |
| `TCHAP_USERNAME` | Nom d'utilisateur du bot Tchap |
| `TCHAP_PASSWORD` | Mot de passe du bot Tchap |
| `PORT` | Port du serveur Express (défaut: `3001`) |

### Développement

```bash
npm run startDev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t tchap-bot-webhook .
docker run -p 3001:3001 --env-file .env tchap-bot-webhook
```

## API

Toutes les routes sont préfixées par `/api`.

### Webhook générique

Envoie un message texte dans un salon Tchap.

```http
POST /api/webhook
Content-Type: application/json

{
  "roomId": "!roomId:domaine.fr",
  "message": "Bonjour depuis un webhook !"
}
```

### Webhook Updown.io

Reçoit les événements Updown.io et envoie une notification formatée dans un salon Tchap.

```http
POST /api/webhook-updownio/:tchapRoomId
Content-Type: application/json

[
  {
    "event": "check.down",
    "description": "Service is down",
    "check": { "url": "https://mon-site.fr", "alias": null },
    "downtime": {
      "started_at": "2024-01-01T00:00:00Z",
      "details_url": "https://updown.io/details"
    }
  }
]
```

Configurer Updown.io pour envoyer ses webhooks vers `https://votre-domaine.fr/api/webhook-updownio/!roomId:domaine.fr`.

### Alertes (URL → salon)

Crée une association entre une URL surveillée et un salon Tchap.

```http
POST /api/alerts
Content-Type: application/json

{
  "roomId": "!roomId:domaine.fr",
  "url": "https://mon-site.fr"
}
```

```http
GET /api/alerts
```

### Healthcheck

```http
GET /api/health
```

## Migration de la base de données

Les migrations sont exécutées automatiquement au démarrage.

```bash
npm run migration:generate --name=ma-migration
npm run migration:run
npm run migration:rollback
```

## Tests

```bash
npm test
```

## Licence

Voir le fichier [LICENSE](./LICENSE).
