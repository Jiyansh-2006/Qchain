FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    git \
    libssl-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------
# Build liboqs
# ----------------------------
RUN git clone --depth=1 https://github.com/open-quantum-safe/liboqs.git \
    && cd liboqs \
    && mkdir build && cd build \
    && cmake -GNinja -DBUILD_SHARED_LIBS=ON -DOQS_BUILD_ONLY_LIB=ON .. \
    && ninja \
    && ninja install \
    && ldconfig \
    && cd ../.. \
    && rm -rf liboqs

ENV LD_LIBRARY_PATH=/usr/local/lib

# ----------------------------
# Install official Python wrapper from source
# ----------------------------
RUN git clone --depth=1 https://github.com/open-quantum-safe/liboqs-python.git \
    && cd liboqs-python \
    && pip install . \
    && cd .. \
    && rm -rf liboqs-python

# ----------------------------
# Setup app
# ----------------------------
WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
