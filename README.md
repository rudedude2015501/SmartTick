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

We use bind mounts for source files to enable hot reloading, but we intentionally exclude node_modules from being mounted from the host. Instead, we create a dedicated Docker volume for node_modules to avoid platform mismatches and keep dependencies container-specific.

Note: If you're doing a fresh install, you can skip this step. However, if you already have a node_modules Docker volume from a previous build and new dependencies have been added since, you'll need to either:

1. Manually install the new dependencies inside the container: docker-compose exec frontend npm install, or  

2. Delete the old node_modules volume and let Docker recreate it with the updated dependencies.

Reason being when node_modules is mounted as a volume, it can become stale—meaning the volume persists even if the Docker image has changed. This can cause your container to miss newly added dependencies.
