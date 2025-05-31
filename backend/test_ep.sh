#!/bin/bash

if [ "$1" = "coverage" ]; then
    echo "running backend tests with coverage..."
    python -m pytest tests/ --cov=app --cov-report=html --cov-report=term -v
elif [ "$1" = "shell" ] || [ "$1" = "bash" ]; then
    echo "starting backend container shell..."
    exec bash
else
    echo "running backend tests..."
    python -m pytest tests/ -v
fi