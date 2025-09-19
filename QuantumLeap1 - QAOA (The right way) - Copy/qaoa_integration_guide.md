# QAOA Portfolio Optimizer Integration Guide

This guide explains how to integrate the new `QAOAPortfolioOptimizer` into your existing QuantumLeap portfolio optimization workflow.

## Overview

The `QAOAPortfolioOptimizer` class provides a modular solution for portfolio optimization using the Quantum Approximate Optimization Algorithm (QAOA). It specifically addresses the parameter binding error that occurs when running QAOA circuits on the Aer simulator.

## Integration Steps

### 1. Import the Optimizer

Add the following import to your file where you handle the optimization process:

```python
from qaoa_portfolio_optimizer import QAOAPortfolioOptimizer
```

### 2. Replace the Failing QAOA Execution Logic

Locate the section in your code where the QAOA optimization is performed (likely in the `_run_aer_simulator_on_valid_portfolios` method). Replace it with the new optimizer:

```python
def _run_aer_simulator_on_valid_portfolios(self,
                                         valid_portfolios: List[List[int]],
                                         qubo_matrix: np.ndarray,
                                         reps: int = 3,
                                         shots: int = 1000) -> Dict[str, Any]:
    """Run QAOA optimization on valid portfolios using Aer Simulator"""
    try:
        logger.info(f"Starting QAOA optimization on {len(valid_portfolios)} valid portfolios")
        
        # Create a QuadraticProgram from the QUBO matrix
        from qiskit_optimization import QuadraticProgram
        qubo_problem = QuadraticProgram()
        
        # Add binary variables
        n = qubo_matrix.shape[0]
        for i in range(n):
            qubo_problem.binary_var(name=f'x{i}')
        
        # Set the objective from the QUBO matrix
        for i in range(n):
            for j in range(n):
                if i == j:  # Linear terms
                    qubo_problem.minimize_linear(i, qubo_matrix[i, i])
                elif i < j:  # Quadratic terms (only add each pair once)
                    qubo_problem.minimize_quadratic(i, j, qubo_matrix[i, j])
        
        # Create and use the QAOA optimizer
        qaoa_optimizer = QAOAPortfolioOptimizer(reps=reps, shots=shots)
        result = qaoa_optimizer.solve(qubo_problem)
        
        # Convert the result to the expected format
        portfolios = []
        solution = result.x
        
        # Convert solution to selection array
        selection = np.array([int(round(val)) for val in solution])
        
        # Check if this selection corresponds to a valid portfolio
        selected_indices = [i for i, bit in enumerate(selection) if bit == 1]
        
        if selected_indices in valid_portfolios:
            portfolios.append({
                'selection': selection.tolist(),
                'selected_indices': selected_indices,
                'probability': 1.0  # This is the optimal solution
            })
        
        logger.info(f"Aer Simulator optimization completed with {len(portfolios)} valid portfolios")
        return {'portfolios': portfolios}
    
    except Exception as e:
        logger.error(f"Error in Aer Simulator optimization: {str(e)}")
        # Fallback to greedy algorithm on valid portfolios
        logger.info("Falling back to greedy algorithm on valid portfolios")
        return self._greedy_optimization_on_valid_portfolios(valid_portfolios, qubo_matrix, shots)
```

### 3. Alternative: Direct Integration with Existing QUBO Problem

If you already have a `QuadraticProgram` object named `qubo_problem`, you can use the optimizer directly:

```python
# Create the QAOA optimizer
qaoa_optimizer = QAOAPortfolioOptimizer(reps=3, shots=1000)

# Solve the problem
result = qaoa_optimizer.solve(qubo_problem)

# Access the optimal solution
optimal_solution = result.x
optimal_value = result.fval
```

## Key Benefits

1. **Resolves Parameter Binding Error**: The new implementation correctly handles parameter binding in the QAOA circuit.
2. **Uses Modern Qiskit Primitives**: Leverages the Sampler primitive for improved performance and compatibility.
3. **Modular Design**: Can be easily integrated into existing code without disrupting other components.
4. **Proper Error Handling**: Includes comprehensive logging and error handling.

## Testing

A test script (`test_qaoa_optimizer.py`) is provided to verify the functionality of the optimizer. Run it to ensure everything is working correctly:

```bash
python test_qaoa_optimizer.py
```

## Requirements

Ensure you have the following Qiskit packages installed:

```
qiskit
qiskit-aer
qiskit-algorithms
qiskit-optimization
```

You can install them using pip:

```bash
pip install qiskit qiskit-aer qiskit-algorithms qiskit-optimization
```