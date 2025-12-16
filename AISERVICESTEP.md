# AI Service Setup Guide (Beginner Friendly)

This guide will help you set up and run the **Rentverse AI Service** step by step.

---

## What is This Service?

The AI Service provides machine learning features for Rentverse:
- **Price Prediction** - Predicts rental prices based on property features
- **Batch Processing** - Process multiple predictions at once

---

## Prerequisites

Before starting, make sure you have these installed:

| Requirement | Download Link |
|-------------|---------------|
| **Python 3.12+** | [https://python.org/downloads](https://python.org/downloads) |
| **Poetry** (recommended) | [https://python-poetry.org](https://python-poetry.org/docs/#installation) |

> **Tip:** To check if you have them installed:
> ```bash
> python --version    # Check Python version (should be 3.12+)
> poetry --version    # Check Poetry version
> ```

### Installing Poetry

If you don't have Poetry installed:

```bash
# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Mac / Linux
curl -sSL https://install.python-poetry.org | python3 -
```

---

## Step 1: Navigate to the AI Service Directory

Open your terminal and navigate to the AI service folder:

```bash
cd rentverse-ai-service
```

---

## Step 2: Install Dependencies

Choose **one** of the following methods:

### Option A: Using Poetry (Recommended)
```bash
poetry install
```

### Option B: Using pip
```bash
pip install -r requirements.txt
```

### Option C: Using pip with virtual environment
```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 3: Set Up Environment Variables

1. Copy the example environment file:

```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell) / Mac / Linux
cp .env.example .env
```

2. The default values should work for development. Key settings:

```env
# Server runs on port 8000
HOST=0.0.0.0
PORT=8000

# Enable debug mode for development
DEBUG=true

# API prefix
API_PREFIX=/api/v1
```

---

## Step 4: Run the Development Server

### Option A: Using Poetry (Recommended)
```bash
poetry run dev
```

Or enter the Poetry shell first:
```bash
poetry shell
dev
```

### Option B: Using Python directly
```bash
python -m uvicorn rentverse.main:app --reload --host 0.0.0.0 --port 8000
```

### Option C: Using the CLI
```bash
poetry run python -m rentverse.cli dev
```

---

## Step 5: Verify It's Working

Once the server starts, open your browser:

1. **Health Check:**
   ```
   http://localhost:8000/api/v1/health
   ```

2. **API Documentation (Swagger UI):**
   ```
   http://localhost:8000/docs
   ```

3. **Alternative API Docs (ReDoc):**
   ```
   http://localhost:8000/redoc
   ```

---

## Running with Docker (Alternative)

If you prefer Docker:

### Build and Run
```bash
docker-compose up --build
```

### Run in Background
```bash
docker-compose up -d
```

### Stop
```bash
docker-compose down
```

The service will be available at `http://localhost:8000`

---

## Available Commands

| Command | Description |
|---------|-------------|
| `poetry run dev` | Start development server with auto-reload |
| `poetry run start` | Start production server |
| `poetry run pytest` | Run tests |
| `poetry run black .` | Format code |

---

## Project Structure (Quick Overview)

```
rentverse-ai-service/
├── rentverse/           # Main package
│   ├── api/             # API routes/endpoints
│   ├── core/            # Core ML logic
│   ├── models/          # ML model files (.pkl)
│   ├── utils/           # Helper functions
│   ├── cli.py           # CLI commands
│   ├── config.py        # Configuration
│   └── main.py          # FastAPI app entry
├── notebooks/           # Jupyter notebooks for ML development
├── test_*.py            # Test files
├── pyproject.toml       # Poetry dependencies
├── requirements.txt     # Pip dependencies
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── .env.example         # Environment template
```

---

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Scikit-learn** - Machine learning
- **Pandas** - Data processing
- **NumPy** - Numerical computing
- **Joblib** - Model serialization

---

## Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Enable debug mode | `false` |
| `MODEL_DIR` | Path to ML models | `rentverse/models` |
| `API_PREFIX` | API route prefix | `/api/v1` |
| `MAX_BATCH_SIZE` | Max items per batch | `100` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `CORS_ORIGINS` | Allowed origins | `*` |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/predict` | POST | Single price prediction |
| `/api/v1/predict/batch` | POST | Batch predictions |
| `/docs` | GET | Swagger UI documentation |
| `/redoc` | GET | ReDoc documentation |

---

## Troubleshooting

### "Python not found" or wrong version
- Make sure Python 3.12+ is installed
- Try `python3` instead of `python`
- Check your PATH environment variable

### "Poetry not found"
- Install Poetry: https://python-poetry.org/docs/#installation
- Restart your terminal after installation

### "Module not found" errors
```bash
# If using Poetry
poetry install

# If using pip
pip install -r requirements.txt
```

### "Port 8000 already in use"
- Change the `PORT` in your `.env` file
- Or stop the other application using port 8000

### Model files not found
- Make sure the `.pkl` files exist in `rentverse/models/`
- Check the `MODEL_DIR` path in `.env`

### Docker issues
```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## Running Tests

```bash
# Using Poetry
poetry run pytest

# Or directly
python -m pytest
```

Test specific files:
```bash
poetry run pytest test_api.py
poetry run pytest test_cors.py
```

---

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- View [NEW_ROUTES_DOCUMENTATION.md](./NEW_ROUTES_DOCUMENTATION.md) for API details
- Check [CORS_CONFIGURATION.md](./CORS_CONFIGURATION.md) for CORS setup
- View API docs at `/docs` when server is running

---

Happy coding!
