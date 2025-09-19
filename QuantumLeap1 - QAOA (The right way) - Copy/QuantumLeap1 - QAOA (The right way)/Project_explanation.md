# QuantumLeap Portfolio Optimization Project

## Project Overview

QuantumLeap is a cutting-edge portfolio optimization platform that leverages quantum computing principles, specifically the Quantum Approximate Optimization Algorithm (QAOA), to solve complex portfolio optimization problems. The platform combines classical optimization techniques with quantum-inspired algorithms to provide superior investment strategies compared to traditional methods.

## Core Features

1. **Quantum-Inspired Portfolio Optimization**: Uses QAOA to find optimal asset allocations that maximize returns while minimizing risk.
2. **Multi-Objective Optimization**: Supports different optimization objectives including maximizing Sharpe ratio, minimizing variance, and maximizing returns.
3. **Interactive Visualizations**: Provides comprehensive visualizations of portfolio performance, efficient frontier, correlation matrices, and historical backtests.
4. **AI-Powered Analysis**: Integrates with Google AI to provide intelligent insights and recommendations for portfolios.
5. **Customizable Parameters**: Allows users to fine-tune their investment strategy through various parameters like risk aversion, budget constraints, and minimum asset requirements.

## Key Metrics and Formulas

### 1. Expected Returns
Calculated as the average of historical returns for each asset.

```python
expected_returns = historical_returns.mean()
```

### 2. Risk (Volatility)
Measured as the standard deviation of historical returns.

```python
volatility = historical_returns.std()
```

### 3. Covariance Matrix
Captures the relationships between asset returns.

```python
covariance_matrix = historical_returns.cov()
```

### 4. Correlation Matrix
Normalized measure of how assets move in relation to each other.

```python
correlation_matrix = historical_returns.corr()
```

### 5. Portfolio Return
Weighted sum of individual asset returns.

```python
portfolio_return = sum(weights * expected_returns)
```

### 6. Portfolio Risk
Calculated using the portfolio variance formula.

```python
portfolio_risk = sqrt(weights.T @ covariance_matrix @ weights)
```

### 7. Sharpe Ratio
Measures risk-adjusted return.

```python
sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_risk
```

### 8. QUBO (Quadratic Unconstrained Binary Optimization)
The quantum formulation of the portfolio optimization problem.

```python
QUBO = -return_weight * returns @ x + risk_aversion * x.T @ covariance_matrix @ x + budget_penalty * (budget - prices @ x)^2 + min_assets_penalty * (min_assets - sum(x))^2
```

## Project Architecture

### Backend Components

1. **Flask Server (app.py)**
   - Serves as the main entry point for the application
   - Handles API requests from the frontend
   - Coordinates between different backend components

2. **Data Manager (backend/data_manager.py)**
   - Loads and processes stock data from CSV files
   - Computes financial metrics like returns, covariance, and correlation
   - Provides data to the optimizer and visualization components

3. **Portfolio Optimizer (backend/optimizer.py)**
   - Implements the 6-step optimization process:
     1. Classical Pre-computation
     2. Classical Candidate Generation
     3. Classical Hard Constraint Filtering
     4. Quantum Optimization on Valid Candidates
     5. Handle No-Solution Case
     6. Classical Post-processing & Ranking
   - Uses QAOA for quantum optimization
   - Evaluates portfolios based on financial metrics

4. **Visualization Generator (backend/visualization.py)**
   - Creates various visualizations for portfolio analysis
   - Generates efficient frontier, correlation heatmaps, cost distribution, etc.
   - Converts matplotlib figures to base64 encoded images for frontend display

5. **Analysis Service (analysis_service.py)**
   - Integrates with Google AI for portfolio analysis
   - Provides intelligent insights and recommendations

### Frontend Components

1. **Main Page (index.html)**
   - Landing page with information about the technology
   - Navigation to the optimizer

2. **Optimizer Page (optimizer.html)**
   - Control panel for configuring optimization parameters
   - Dashboard for displaying optimization results and visualizations
   - Interactive elements for exploring portfolio options

3. **JavaScript Logic (script.js)**
   - Handles user interactions
   - Communicates with backend API
   - Updates UI based on optimization results
   - Manages the optimization workflow

4. **Styling (style.css)**
   - Provides the visual design for the application
   - Implements responsive layout and animations

## File Structure and Key Code Snippets

### app.py
The main Flask application that serves as the entry point.

```python
# Initialize Flask app
app = Flask(__name__, static_url_path='', static_folder='.')
app.json_encoder = CustomJSONEncoder  # Use custom JSON encoder to handle special values
CORS(app)  # Enable CORS for all routes

# Initialize backend components
data_manager = DataManager(data_dir='backend/data')
optimizer = PortfolioOptimizer()
vis_generator = VisualizationDataGenerator()

# Portfolio optimization endpoint
@app.route('/optimize', methods=['POST'])
def optimize_portfolio():
    # Parse request data and run optimization
    # ...
    optimization_result = optimizer.optimize(**optimization_params)
    visualization_data = vis_generator.generate_visualization_data(...)
    # Return results to frontend
```

### optimizer.py
Implements the portfolio optimization logic using QAOA.

```python
def optimize(self, tickers, expected_returns, covariance_matrix, prices, budget, ...):
    # Step 1: Classical Pre-computation
    correlation_matrix = self._compute_correlation_matrix(covariance_matrix)
    
    # Step 2: Classical Candidate Generation
    # Generate all possible portfolio combinations
    
    # Step 3: Classical Hard Constraint Filtering
    # Filter portfolios based on constraints
    
    # Step 4: Quantum Optimization on Valid Candidates
    # Use QAOA to find optimal portfolio allocation
    
    # Step 5: Handle No-Solution Case
    # Provide fallback solutions if needed
    
    # Step 6: Classical Post-processing & Ranking
    # Evaluate and rank portfolios
```

### visualization.py
Generates visualizations for portfolio analysis.

```python
def generate_visualization_data(self, optimization_result, stock_data, tickers, budget, risk_free_rate):
    # Generate various visualizations
    correlation_matrix_image = self._generate_correlation_heatmap_image(...)
    brute_force_image = self._generate_brute_force_scatter_image(...)
    efficient_frontier_image = self._generate_efficient_frontier_image(...)
    cost_distribution_image = self._generate_cost_distribution_image(...)
    historical_backtest_image = self._generate_historical_backtest_image(...)
    # Return base64 encoded images
```

### script.js
Handles frontend logic and user interactions.

```javascript
// Run optimization when user clicks the optimize button
function runOptimization() {
    // Collect parameters from UI
    const params = {
        tickers: selectedStocks,
        budget: parseFloat(document.getElementById('budget').value),
        optimization_objective: document.getElementById('optimization-objective').value,
        risk_aversion: parseFloat(document.getElementById('risk-aversion').value),
        // ...
    };
    
    // Send request to backend
    fetch('/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => updateDashboard(data))
    .catch(error => handleError(error));
}
```

## Control Panel Parameters

1. **Investment Budget**
   - The total amount to invest
   - Used as a target for portfolio construction
   - Controlled by budget penalty parameter

2. **Optimization Objective**
   - Max Sharpe Ratio: Balanced approach for risk-adjusted returns
   - Min Variance: Conservative approach focusing on stability
   - Max Return: Aggressive approach focusing on growth

3. **Risk Aversion**
   - Controls the trade-off between risk and return
   - Higher values prioritize lower risk
   - Lower values prioritize higher returns

4. **Risk-Free Rate**
   - Used in Sharpe ratio calculation
   - Represents the return of a risk-free investment

5. **Return Weight**
   - Controls the importance of expected returns in the optimization
   - Higher values prioritize higher returns

6. **Budget Penalty**
   - Controls how strictly the budget constraint is enforced
   - Higher values ensure closer adherence to the budget

7. **Minimum Assets**
   - Sets the minimum number of assets in the portfolio
   - Ensures diversification

8. **Minimum Assets Penalty**
   - Controls how strictly the minimum assets constraint is enforced
   - Higher values ensure the minimum is met

9. **Correlation Threshold**
   - Sets the maximum allowed correlation between assets
   - Helps avoid highly correlated assets in the portfolio

10. **QAOA Layers**
    - Controls the depth of the quantum circuit
    - More layers can improve optimization quality but increase computation time

11. **QAOA Shots**
    - Number of quantum circuit executions
    - More shots improve statistical accuracy but increase computation time

12. **Quantum Backend**
    - Selects the quantum processor or simulator to use
    - Options include Aer Simulator, IBM Quantum systems, etc.

## Visualization Features

1. **Correlation Heatmap**
   - Shows the correlation between different assets
   - Helps identify diversification opportunities

2. **Brute Force Scatter Plot**
   - Displays all evaluated portfolios in risk-return space
   - Highlights classical and quantum solutions

3. **Efficient Frontier**
   - Shows the optimal portfolios for different risk levels
   - Includes the capital allocation line and tangency portfolio

4. **Cost Distribution**
   - Shows the distribution of portfolio costs
   - Helps evaluate budget constraint satisfaction

5. **Historical Backtest**
   - Simulates portfolio performance over historical data
   - Compares different portfolio strategies

6. **QUBO vs Sharpe Ratio**
   - Shows the relationship between quantum objective and financial metrics
   - Helps validate the quantum optimization approach

## Quantum Optimization Process

1. **Problem Formulation**
   - Convert portfolio optimization to QUBO form
   - Include constraints as penalty terms

2. **QAOA Circuit Construction**
   - Create quantum circuit based on QUBO
   - Configure circuit depth (reps) and measurement shots

3. **Quantum Execution**
   - Run the circuit on quantum simulator or hardware
   - Collect measurement results

4. **Classical Post-processing**
   - Convert quantum results to portfolio allocations
   - Evaluate financial metrics for the quantum portfolios

## Conclusion

QuantumLeap represents a cutting-edge approach to portfolio optimization by combining classical financial theory with quantum computing principles. The platform provides a comprehensive set of tools for investors to create optimized portfolios based on their specific goals and constraints. By leveraging the power of QAOA, QuantumLeap can explore a vast solution space efficiently and find high-quality portfolio allocations that traditional methods might miss.