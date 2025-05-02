# SmartTick

## 🚀 Getting Started

#### Prerequisites

1. **Install Docker**  
   Make sure Docker Desktop (or Docker CLI) is installed and running on your machine.

2. **Create `.env` file**  
   Add your environment variables in a `.env` file in the root directory.

## 🛠️ Setup Instructions

1. Build containers and run services: docker-compose up --build

2. Run database migrations: docker-compose exec backend flask db upgrade (Not needed on subsequent reruns)

3. Load trade data: docker-compose exec backend python loadtrades.py (Not needed on subsequent reruns)

## ⚠️ Errors

### Frontend dependencies out of sync (`node_modules` volume)

#### Two Options

1. Reinstall dependencies inside the frontend container: docker-compose exec frontend npm install
   
2. Delete the node_modules volume manually in Docker for a clean install and then build again
