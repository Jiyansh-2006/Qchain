FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    git \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Clone and build liboqs
RUN git clone --depth=1 https://github.com/open-quantum-safe/liboqs.git \
    && cd liboqs \
    && mkdir build && cd build \
    && cmake -GNinja -DBUILD_SHARED_LIBS=ON -DOQS_BUILD_ONLY_LIB=ON .. \
    && ninja \
    && ninja install \
    && ldconfig \
    && cd ../.. \
    && rm -rf liboqs

# Make sure dynamic linker finds liboqs
ENV LD_LIBRARY_PATH=/usr/local/lib

# Install correct Python OQS wrapper
RUN pip install --no-cache-dir pyoqs

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port used by Render
EXPOSE 10000

# Start FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
