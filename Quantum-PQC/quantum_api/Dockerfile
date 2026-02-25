FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    git \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install liboqs
RUN git clone --depth=1 https://github.com/open-quantum-safe/liboqs.git \
    && cd liboqs \
    && mkdir build && cd build \
    && cmake -GNinja -DBUILD_SHARED_LIBS=ON .. \
    && ninja \
    && ninja install \
    && cd ../.. \
    && rm -rf liboqs

# Install Python OQS wrapper
RUN pip install --no-cache-dir oqs

# Set work directory
WORKDIR /app

# Copy project files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
