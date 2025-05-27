# Use the official Node.js 18 image
FROM node:lts

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application into the container
COPY . .

# Expose the port the app runs on (Vite default: 5173)
EXPOSE 5173

# Command to run the development server when the container starts
CMD ["npm", "run", "dev", "test"]
