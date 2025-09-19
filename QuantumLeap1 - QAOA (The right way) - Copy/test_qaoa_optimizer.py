import numpy as np
import logging
from qiskit_optimization import QuadraticProgram
from qaoa_portfolio_optimizer import QAOAPortfolioOptimizer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_sample_qubo_problem(num_assets: int = 4):
    """
    Create a sample QUBO problem for portfolio optimization.
    
    Args:
        num_assets: Number of assets in the portfolio
        
    Returns:
        QuadraticProgram: A sample QUBO problem for testing
    """
    # Create a new quadratic program
    qubo = QuadraticProgram()
    
    # Add binary variables for each asset
    for i in range(num_assets):
        qubo.binary_var(name=f'x{i}')
    
    # Create random expected returns
    returns = np.random.normal(0.05, 0.02, num_assets)
    
    # Create random covariance matrix (ensure it's positive semi-definite)
    temp = np.random.normal(0, 0.1, (num_assets, num_assets))
    cov = np.dot(temp, temp.T)
    
    # Set risk aversion parameter
    risk_aversion = 2.0
    
    # Add objective: maximize returns - risk_aversion * risk
    # For returns: -sum(returns_i * x_i) (negative because we're minimizing)
    linear = {i: -returns[i] for i in range(num_assets)}
    
    # For risk: risk_aversion * sum(cov_ij * x_i * x_j)
    quadratic = {}
    for i in range(num_assets):
        for j in range(num_assets):
            if i <= j:  # Only add each pair once
                quadratic[(i, j)] = risk_aversion * cov[i, j]
    
    # Set the objective
    qubo.minimize(linear=linear, quadratic=quadratic)
    
    return qubo

def main():
    """
    Main function to test the QAOA portfolio optimizer.
    """
    try:
        # Create a sample QUBO problem
        logger.info("Creating sample QUBO problem")
        qubo_problem = create_sample_qubo_problem(num_assets=4)
        
        # Print the problem
        print("\nSample QUBO Problem:")
        print(qubo_problem.export_as_lp_string())
        
        # Create the QAOA optimizer
        logger.info("Creating QAOA optimizer")
        qaoa_optimizer = QAOAPortfolioOptimizer(reps=2, shots=1024)
        
        # Solve the problem
        logger.info("Solving the QUBO problem using QAOA")
        result = qaoa_optimizer.solve(qubo_problem)
        
        # Print the results
        print("\nOptimization Results:")
        print(f"Optimal value: {result['fval']}")
        print(f"Optimal solution: {result['x']}")
        print(f"Selected assets: {[i for i, val in enumerate(result['x']) if val > 0.5]}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in test: {str(e)}")
        raise

if __name__ == "__main__":
    main()