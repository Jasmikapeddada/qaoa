# Quantum Portfolio Optimization with QAOA

This project demonstrates how to use the Quantum Approximate Optimization Algorithm (QAOA) to solve portfolio optimization problems. The implementation is compatible with Qiskit 2.x and provides a simplified approach to quantum portfolio optimization.

## Overview

Portfolio optimization is a classic financial problem where we aim to select assets that maximize returns while minimizing risk. This project formulates the portfolio optimization problem as a Quadratic Unconstrained Binary Optimization (QUBO) problem and solves it using QAOA, a hybrid quantum-classical algorithm.

## Files

- `simple_qaoa_optimizer.py`: Core implementation of the QAOA optimizer
- `test_simple_qaoa.py`: Simple test script for the QAOA optimizer
- `portfolio_optimization_example.py`: Example of portfolio optimization using QAOA

## Requirements

- Python 3.8+
- Qiskit 2.x
- qiskit-aer 0.17+
- qiskit-optimization
- numpy
- matplotlib (for visualization)

## How to Use

### Running the Simple Test

```bash
python test_simple_qaoa.py
```

This script creates a simple QUBO problem and solves it using the QAOA optimizer.

### Running the Portfolio Optimization Example

```bash
python portfolio_optimization_example.py
```

This script creates a portfolio optimization problem with 4 assets, converts it to an unconstrained QUBO, and solves it using QAOA. It also visualizes the results.

## Implementation Details

### SimpleQAOAOptimizer

The `SimpleQAOAOptimizer` class provides a simplified implementation of QAOA for solving QUBO problems. Key features include:

- Converting QUBO to Hamiltonian
- Creating QAOA circuits with parameterized gates
- Executing circuits on Qiskit Aer simulator or IBM Quantum Hardware
- Extracting optimal solutions and probabilities

### PortfolioOptimizer

The `PortfolioOptimizer` class in `backend/optimizer.py` integrates the `SimpleQAOAOptimizer` to solve portfolio optimization problems. It follows a 6-step process:

1. **Classical Pre-computation**: Calculate expected returns, covariance matrix, and other financial metrics
2. **Candidate Generation**: Generate candidate portfolios
3. **Hard Constraint Filtering**: Filter out portfolios that don't meet hard constraints
4. **Quantum Optimization**: Use QAOA to find optimal portfolios
5. **No-Solution Handling**: Fallback to greedy algorithm if quantum optimization fails
6. **Classical Post-processing**: Calculate precise financial metrics for the optimized portfolios

## Integration Tests

Two integration tests are provided to verify the implementation:

- `test_integration.py`: Tests the integration with Qiskit Aer simulator
- `test_ibm_integration.py`: Tests the integration with IBM Quantum Hardware

Run the tests using:

```bash
python test_integration.py
python test_ibm_integration.py
```

### Portfolio Optimization

The portfolio optimization example demonstrates how to:

1. Create a portfolio optimization problem with expected returns and a covariance matrix
2. Add a budget constraint (select exactly k assets)
3. Convert the constrained problem to an unconstrained QUBO by adding penalty terms
4. Solve the problem using QAOA
5. Calculate portfolio metrics (return, risk, risk-adjusted return)
6. Visualize the results

## Example Results

The portfolio optimization example selects assets that maximize the risk-adjusted return. The results include:

- Selected assets
- Portfolio expected return
- Portfolio risk
- Risk-adjusted return
- Visualization of asset returns and the covariance matrix

## Extending the Project

Possible extensions include:

- Implementing parameter optimization for QAOA
- Adding more constraints to the portfolio optimization problem
- Comparing QAOA results with classical optimization methods
- Scaling to larger portfolio problems
- Implementing other quantum optimization algorithms