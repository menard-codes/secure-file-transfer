# Secure File Transfer

![Express](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![AlpineJS](https://img.shields.io/badge/Alpine%20JS-8BC0D0?style=for-the-badge&logo=alpinedotjs&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)

A `Dev x Pinata` hackathon project for secure file sharing via password-protected disposable share links.

## Overview

**"Secure File Transfer"** is an open-source, self-hostable file sharing solution that allows users to generate secure, password-protected file share links with customizable expiration dates. This application doesn't require any logins or signups - it's designed for simple, secure file sharing.

This app mainly solves the issue of sharing sensitive information online, without the need of signing up from any 3rd party app. Since this can be self-hosted, you can have full control over your files.

## How it Works

1. Upload a file you want to share
2. Set a passphrase and expiration, then click Create Share Link
3. Send the share link to your intended recipient/s. It's recommended to share the passphrase separately.

### Key Features

- Generate secure, password-protected file share links
- Set custom expiration dates for shared links
- No user accounts or logins required
- Files stored in Pinata cloud
- Self-hostable
- Free and open-source
- BullMQ with Redis for handling background tasks (files and records deletion on expiration)

## Tech Stack

- Backend: Express.js with TypeScript
- Frontend: EJS templates, Bulma CSS framework, Alpine.js
- Database: SQLite with Prisma ORM (easily replaceable if needed)
- File Storage: Pinata cloud

## Getting Started

### Prerequisites

- Node.js and npm
- Docker and Docker Compose (optional, for containerized deployment)
- Pinata account for file storage

### Installation and Setup

1. Fork the project and clone it locally
2. Sign up for a [Pinata account](https://pinata.cloud/)
3. Obtain your `PINATA_JWT` and `PINATA_GATEWAY` credentials
4. Set up your environment variables:
   - `PINATA_JWT`
   - `PINATA_GATEWAY`
   - `REDIS_URL`
   (**Note**: Redis is used by BullMQ for background tasks - file deletion on expiration jobs)

### Running the Application

#### Local Development

For development with hot reloading:

```
docker compose watch
```

#### Docker Deployment

The application can be run as a single Docker container or via Docker Compose.

Single container:
```
docker build -t secure-file-transfer .
docker run --env-file ./.env --name secure-file-transfer -p 3000:3000 secure-file-transfer
```

Docker Compose (includes Redis):
```
docker-compose up
```

## Deployment

### Self-Hosting

This application can be self-hosted (like in VPS machines).

### Fly.io Deployment

To deploy on Fly.io:

1. Remove the existing `fly.toml` file
2. Generate a new `fly.toml` file using the Fly.io CLI
3. Follow Fly.io's deployment instructions

## License

MIT License

## Acknowledgements

- This project was created as part of the Dev and Pinata hackathon
- Thanks to Pinata for providing the cloud storage solution
