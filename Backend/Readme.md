# Aplicación de Transporte - Backend

Este es el backend de la Aplicación de Transporte, desarrollado en Node.js.

## Requisitos

- Node.js >= 16
- npm o yarn
- MySQL

## Instalación

```bash
cd Backend
npm install
```

## Configuración

Copia el archivo `.env.example` a `.env` y configura tus variables de entorno:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASS=contraseña
DB_NAME=transporte_institucional
PORT=8000
CORS_ORIGIN=http://localhost:5173
```

## Ejecución en desarrollo

```bash
npm run dev
```

El backend estará disponible en [http://localhost:8000](http://localhost:8000).

## Notas

- No subas archivos `.env` ni `.env.example` al repositorio.