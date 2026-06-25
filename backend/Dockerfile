# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Create a non-root user and group
RUN groupadd -r appgroup && useradd -m -r -g appgroup appuser

# Install system dependencies (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# --- CRITICAL FIX: Create instance folder and set ownership ---
RUN mkdir -p /app/instance && chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose port 5000
EXPOSE 5000

# Use Gunicorn for production
# Use Gunicorn for production with threading and extended timeouts
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "120", "--workers", "3", "--threads", "4", "app:app"]]