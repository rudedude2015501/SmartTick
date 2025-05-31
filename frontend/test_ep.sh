#!/bin/bash

if [ "$1" = "coverage" ]; then
    echo "running frontend tests with coverage..."
    npm run test:coverage
else
    echo "running frontend tests..."
    npm run test
fi