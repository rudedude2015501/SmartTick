# SmartTick

## 🚀 Getting Started

1. **Install Docker**  
   Make sure Docker Desktop (or Docker CLI) is installed and running on your machine.

2. **Create `.env` file**  
   Add your environment variables in a `.env` file in the root directory.

## 🛠️ Setup Instructions

1. Build containers and run services: `docker-compose up --build`

2. Run database migrations: `docker-compose exec backend flask db upgrade` (not needed on subsequent reruns)

3. Load trade data: `docker-compose exec backend python scripts/import_trades.py` (not needed on subsequent reruns)

4. Load stock profile data: `docker-compose exec backend python scripts/import_profiles.py` (not needed on subsequent reruns)

<br>

## ⚠️ Errors

### Frontend dependencies out of sync (`node_modules` volume)

We use bind mounts for source files to enable hot reloading, but we intentionally exclude node_modules from being mounted from the host. Instead, we create a dedicated Docker volume for node_modules to avoid platform mismatches and keep dependencies container-specific.

Note: If you're doing a fresh install, you can skip this step. However, if you already have a node_modules Docker volume from a previous build and new dependencies have been added since, you'll need to either:

1. Manually install the new dependencies inside the container: `docker-compose exec frontend npm install`, or  

2. Delete the old node_modules volume and let Docker recreate it with the updated dependencies.

Reason being when node_modules is mounted as a volume, it can become stale—meaning the volume persists even if the Docker image has changed. This can cause your container to miss newly added dependencies.

<br>

## :mag_right: Testing

To build testing containers and run testing services together: `docker compose --profile testing up --build`
+ We add the `--profile` flag so Docker can run the testing services independently from our development services

### Frontend 
To run the the frontend testing service independently: `docker compose --profile testing up testfrontend` 
+ For cleaner, easier to read output, run: `docker compose --profile testing run --rm testfrontend` 
   + To run with coverage tests, append `coverage` to the command above 

### Backend

#### :wrench: Set Up Instructions 
To run tests for the backend, we must first populate the testing database.
To do this, run: `docker compose --profile testing run testbackend bash` 

This will put you inside the backend service container. 
From here, run the usual setup commands:
+ `flask db upgrade`
+ `python scripts/import_*.py`

Then run `exit` 

Now to run the backend testing service independently: `docker compose --profile testing up testbackend`
+ Again, for a cleaner output, run: `docker compose --profile testing run --rm testbackend` 
   + To run with coverage tests, append `coverage` to the command above