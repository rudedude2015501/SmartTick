# Use the official Python 3.11 image
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application into the container
COPY . .

# Expose port for Flask (default: 5000)
EXPOSE 5000

# Command to run the Flask dev server
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

