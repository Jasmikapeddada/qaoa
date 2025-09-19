# QuantumLeap Backend

Quantum-inspired portfolio optimization backend for the QuantumLeap application. This backend provides API endpoints for portfolio optimization using both quantum (QAOA) and classical methods.

## Features

- **Data Management**: Read and process stock data from CSV files
- **Portfolio Optimization**: Quantum-inspired optimization using QAOA and classical alternatives
- **Interactive Visualizations**: Generate data for frontend visualizations
- **API Endpoints**: RESTful API for portfolio optimization and data retrieval

## Architecture

The backend is built with Flask and consists of the following components:

- **Data Manager**: Handles stock data loading, cleaning, and financial metrics calculation
- **Portfolio Optimizer**: Implements QAOA and classical optimization methods
- **Visualization Data Generator**: Creates data for interactive visualizations
- **API Layer**: Exposes endpoints for frontend integration

## API Endpoints

- `GET /health`: Check backend status
- `GET /stocks`: List available stock tickers
- `POST /optimize`: Run portfolio optimization
- `GET /jobs/{job_id}`: Check status of asynchronous optimization jobs

## Setup Instructions

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
pip install -r requirements.txt
```

### Data Setup

Place your stock CSV files in the `backend/data` directory. Each file should be named with the ticker symbol (e.g., `INFY.csv`) and contain at least the following columns:
- `Date`: Date in YYYY-MM-DD format
- `Close` or `Adj Close`: Closing price for the day

Alternatively, you can generate sample data for testing:

```bash
python -c "from backend.sample_data import SampleDataGenerator; SampleDataGenerator().generate_sample_data()"
```

### Running the Backend

For development:

```bash
flask run --debug
```

For production:

```bash
gunicorn app:app
```

## API Response Format

The `/optimize` endpoint returns a JSON response with the following structure:

```json
{
  "top_portfolios": [
    {
      "assets": ["INFY", "TCS"],
      "weights": [0.6, 0.4],
      "return": 0.12,
      "risk": 0.08,
      "sharpe": 1.1,
      "cost": 95000,
      "qubo_value": -8.5
    }
  ],
  "plots": {
    "budget_distribution": { ... },
    "qubo_vs_sharpe": { ... },
    "efficient_frontier": { ... },
    "brute_force": { ... },
    "historical_backtest": { ... }
  }
}
```

For detailed response schemas, see `api_response_schema.py`.

## Visualization Data

The backend generates data for the following interactive visualizations:

1. **Budget Distribution**: Histogram of total spent across portfolios
2. **QUBO vs Sharpe**: Scatter plot of QUBO objective values vs Sharpe ratios
3. **Efficient Frontier**: Risk-return scatter plot with frontier curve
4. **Brute Force (Sharpe-colored)**: All brute force portfolios plotted
5. **Historical Backtesting**: Line charts of portfolio value vs benchmark over time

## Development

### Project Structure

```
backend/
├── __init__.py
├── app.py                  # Main Flask application
├── data_manager.py         # Stock data management
├── optimizer.py            # Portfolio optimization
├── visualization.py        # Visualization data generation
├── sample_data.py          # Sample data generation
├── api_response_schema.py  # API response documentation
├── data/                   # Stock CSV files
└── README.md               # This file
```

### Adding New Features

1. **New Optimization Method**: Extend the `PortfolioOptimizer` class in `optimizer.py`
2. **New Visualization**: Add a new method to `VisualizationDataGenerator` in `visualization.py`
3. **New API Endpoint**: Add a new route in `app.py`

## License

This project is licensed under the MIT License - see the LICENSE file for details.