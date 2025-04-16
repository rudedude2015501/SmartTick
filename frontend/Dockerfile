# official node image 
# ensures we all use the same node version 
FROM node:18 

# set working directories 
# all following commands will run in /app 
WORKDIR /app

# copy package files first to leverage docker cache 
COPY package.json yarn.lock* package-lock.json* ./ 

# install dependencies 
# runs in the container /app directory 
RUN npm install 

# copy the rest of the application onto the container
COPY . .

# build the react app 
# vite wil bundle and optimize our code 
RUN npm run build 

# port the app runs on (current port: Vite default)
EXPOSE 5173 

# command to run the dev server when the container starts  
CMD ["npm", "run", "dev"]
