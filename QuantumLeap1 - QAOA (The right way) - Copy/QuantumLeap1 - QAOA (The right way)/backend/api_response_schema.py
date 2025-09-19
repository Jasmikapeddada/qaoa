"""API Response Schema Documentation

This module documents the JSON response structure for the QuantumLeap API endpoints.
These schemas serve as documentation for frontend developers to understand the
expected data format for visualization integration.
"""

import json
from typing import Dict, Any

# Example response for /optimize endpoint
OPTIMIZE_RESPONSE_SCHEMA = {
    "top_portfolios": [
        {
            "assets": ["INFY", "TCS"],  # List of selected assets
            "weights": [0.6, 0.4],      # Allocation weights (normalized)
            "return": 0.12,            # Expected annualized return
            "risk": 0.08,              # Expected annualized risk (std dev)
            "sharpe": 1.1,             # Sharpe ratio
            "cost": 95000,             # Total cost in currency units
            "qubo_value": -8.5         # QUBO objective function value
        }
        # More portfolios...
    ],
    "plots": {
        "budget_distribution": {
            "histogram": {
                "x": [80000, 85000, 90000, 95000, 100000],  # Bin centers
                "y": [5, 12, 20, 15, 8],                    # Counts
                "bin_width": 5000                          # Width of each bin
            },
            "budget_bands": {
                "target": 100000,   # Target budget
                "lower": 90000,     # Lower acceptable bound
                "upper": 110000     # Upper acceptable bound
            },
            "portfolios": [
                {
                    "cost": 95000,              # Total cost
                    "asset_count": 2,          # Number of assets
                    "assets": ["INFY", "TCS"],  # Selected assets
                    "return": 0.12,            # Expected return
                    "risk": 0.08,              # Risk
                    "sharpe": 1.1              # Sharpe ratio
                }
                # More portfolios...
            ]
        },
        "qubo_vs_sharpe": {
            "scatter": {
                "x": [0.8, 0.9, 1.0, 1.05, 1.1],       # Sharpe ratios
                "y": [-10.2, -9.8, -9.5, -8.7, -8.5]  # QUBO values
            },
            "qubo_components": {
                "return": [-20.0, -18.0, -16.0, -14.0, -12.0],  # Return term values
                "risk": [7.5, 6.0, 4.5, 3.0, 1.5],              # Risk term values
                "budget": [2.3, 2.2, 2.0, 2.3, 2.0],             # Budget constraint values
                "total": [-10.2, -9.8, -9.5, -8.7, -8.5]         # Total QUBO values
            },
            "portfolios": [
                {
                    "qubo_value": -8.5,          # QUBO objective value
                    "sharpe": 1.1,              # Sharpe ratio
                    "return": 0.12,             # Expected return
                    "risk": 0.08,               # Risk
                    "assets": ["INFY", "TCS"],   # Selected assets
                    "weights": [0.6, 0.4]        # Allocation weights
                }
                # More portfolios...
            ]
        },
        "efficient_frontier": {
            "scatter": {
                "x": [0.05, 0.06, 0.07, 0.08, 0.09],    # Risk values
                "y": [0.08, 0.09, 0.10, 0.12, 0.14],    # Return values
                "color": [0.8, 0.9, 1.0, 1.1, 1.2]      # Sharpe ratios for coloring
            },
            "frontier": {
                "x": [0.05, 0.07, 0.09],               # Risk values on frontier
                "y": [0.08, 0.10, 0.14]                # Return values on frontier
            },
            "risk_free": {
                "x": 0.0,                              # Risk-free point (x=0)
                "y": 0.02                              # Risk-free rate
            },
            "portfolios": [
                {
                    "return": 0.12,             # Expected return
                    "risk": 0.08,               # Risk
                    "sharpe": 1.1,              # Sharpe ratio
                    "assets": ["INFY", "TCS"],   # Selected assets
                    "weights": [0.6, 0.4]        # Allocation weights
                }
                # More portfolios...
            ]
        },
        "brute_force": {
            "scatter": {
                "x": [0.05, 0.06, 0.07, 0.08, 0.09],    # Risk values
                "y": [0.08, 0.09, 0.10, 0.12, 0.14],    # Return values
                "color": [0.8, 0.9, 1.0, 1.1, 1.2]      # Sharpe ratios for coloring
            },
            "portfolios": [
                {
                    "return": 0.12,             # Expected return
                    "risk": 0.08,               # Risk
                    "sharpe": 1.1,              # Sharpe ratio
                    "assets": ["INFY", "TCS"],   # Selected assets
                    "weights": [0.6, 0.4]        # Allocation weights
                }
                # More portfolios...
            ]
        },
        "historical_backtest": {
            "dates": ["2022-01-01", "2022-01-02", "2022-01-03"],  # Dates for x-axis
            "portfolios": {
                "Portfolio 1": [100, 102, 105],  # Portfolio 1 values over time
                "Portfolio 2": [100, 101, 103],  # Portfolio 2 values over time
                "Benchmark": [100, 99, 101]      # Benchmark values over time
            },
            "details": [
                {
                    "name": "Portfolio 1",
                    "assets": ["INFY", "TCS"],
                    "weights": [0.6, 0.4],
                    "return": 0.12,
                    "risk": 0.08,
                    "sharpe": 1.1
                },
                {
                    "name": "Portfolio 2",
                    "assets": ["WIPRO", "HCLTECH"],
                    "weights": [0.7, 0.3],
                    "return": 0.10,
                    "risk": 0.07,
                    "sharpe": 1.0
                }
                # More portfolios...
            ]
        }
    }
}

# Example response for /stocks endpoint
STOCKS_RESPONSE_SCHEMA = {
    "stocks": [
        {
            "ticker": "INFY",
            "name": "Infosys Ltd",
            "sector": "Technology",
            "latest_price": 1450.75,
            "data_available": True
        },
        {
            "ticker": "TCS",
            "name": "Tata Consultancy Services Ltd",
            "sector": "Technology",
            "latest_price": 3250.50,
            "data_available": True
        }
        # More stocks...
    ]
}

# Example response for /jobs/{job_id} endpoint
JOB_STATUS_RESPONSE_SCHEMA = {
    "job_id": "abc123",
    "status": "completed",  # One of: pending, running, completed, failed
    "progress": 100,       # Percentage complete (0-100)
    "message": "Optimization completed successfully",
    "result_url": "/api/results/abc123",  # URL to fetch results when completed
    "created_at": "2023-06-15T10:30:00Z",
    "updated_at": "2023-06-15T10:35:00Z"
}

# Example error response
ERROR_RESPONSE_SCHEMA = {
    "error": True,
    "code": 400,  # HTTP status code
    "message": "Invalid request parameters",
    "details": "Budget must be a positive number"
}


def get_example_response(endpoint: str) -> Dict[str, Any]:
    """Get an example response for the specified endpoint
    
    Args:
        endpoint: API endpoint name (e.g., 'optimize', 'stocks')
        
    Returns:
        Example response as a dictionary
    """
    if endpoint == 'optimize':
        return OPTIMIZE_RESPONSE_SCHEMA
    elif endpoint == 'stocks':
        return STOCKS_RESPONSE_SCHEMA
    elif endpoint == 'job_status':
        return JOB_STATUS_RESPONSE_SCHEMA
    elif endpoint == 'error':
        return ERROR_RESPONSE_SCHEMA
    else:
        return {"error": True, "message": f"Unknown endpoint: {endpoint}"}


def print_example_response(endpoint: str) -> None:
    """Print a formatted example response for the specified endpoint
    
    Args:
        endpoint: API endpoint name (e.g., 'optimize', 'stocks')
    """
    response = get_example_response(endpoint)
    print(json.dumps(response, indent=2))


if __name__ == "__main__":
    # Print example responses
    print("Example response for /optimize endpoint:")
    print_example_response('optimize')
    
    print("\nExample response for /stocks endpoint:")
    print_example_response('stocks')
    
    print("\nExample response for /jobs/{job_id} endpoint:")
    print_example_response('job_status')
    
    print("\nExample error response:")
    print_example_response('error')