# python image with version 3.11 
# ensures consitent python version between us 
FROM python:3.11 

# set a working directory inside our container 
# all following commands run from /app 
WORKDIR /app 

# copy requirements first to leverage Docker cache 
# allows docker to cache `pip install` 
COPY requirements.txt .

# install dependencies 
# runs in the container /app directory
RUN pip install -r requirements.txt

# copy rest of the application 
# includes flask code, templates, etc 
COPY . . 

# expose port for FLask (default port: 5000) 
# does not publish the port, just documents it 
EXPOSE 5000 

# command to run the flask dev server 
# the host makes the server accessible outside our container 
CMD ["flask", "run", "--host=0.0.0.0"]

