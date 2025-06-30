# Use a lightweight Python base image
FROM python:3.11-slim-buster

# Set the working directory in the container
WORKDIR ./

ENV PIP_CACHE_DIR=/root/.cache/pip

# Copy the requirements file
COPY requirements.txt requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . ./

# Expose the port on which the app will run
EXPOSE 5000

# Run the Flask app
CMD ["python", "app.py"]
