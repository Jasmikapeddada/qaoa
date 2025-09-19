import numpy as np
from qiskit_optimization import QuadraticProgram
from simple_qaoa_optimizer import SimpleQAOAOptimizer
import matplotlib.pyplot as plt

def create_portfolio_problem(num_assets=4, seed=42):
    """
    Create a portfolio optimization problem.
    
    Args:
        num_assets: Number of assets in the portfolio
        seed: Random seed for reproducibility
        
    Returns:
        QuadraticProgram: The portfolio optimization problem
    """
    # Set random seed for reproducibility
    np.random.seed(seed)
    
    # Create expected returns (random values between 0.01 and 0.10)
    returns = np.random.uniform(0.01, 0.10, size=num_assets)
    
    # Create covariance matrix (ensure it's positive semi-definite)
    # First create a random correlation matrix
    A = np.random.normal(0, 1, size=(num_assets, num_assets))
    cov = np.dot(A, A.T)
    # Scale to reasonable values
    cov = cov * 0.01
    
    # Risk aversion parameter (lambda)
    risk_aversion = 0.5
    
    # Create a new quadratic program
    qubo = QuadraticProgram()
    
    # Add binary variables (1 if asset is selected, 0 otherwise)
    for i in range(num_assets):
        qubo.binary_var(name=f'x{i}')
    
    # Define the objective function: maximize returns - lambda * risk
    # For QUBO, we need to minimize, so we negate the returns
    
    # Linear terms (negative returns)
    linear = {}
    for i in range(num_assets):
        linear[f'x{i}'] = -returns[i]
    
    # Quadratic terms (risk)
    quadratic = {}
    for i in range(num_assets):
        for j in range(i, num_assets):
            if i == j:
                # Diagonal terms
                quadratic[(f'x{i}', f'x{j}')] = risk_aversion * cov[i, j]
            else:
                # Off-diagonal terms (multiply by 2 due to symmetry)
                quadratic[(f'x{i}', f'x{j}')] = 2 * risk_aversion * cov[i, j]
    
    # Set the objective
    qubo.minimize(linear=linear, quadratic=quadratic)
    
    # Add constraint: select exactly k assets (budget constraint)
    k = num_assets // 2  # Select half of the assets
    constraint_linear = {f'x{i}': 1 for i in range(num_assets)}
    qubo.linear_constraint(linear=constraint_linear, sense='==', rhs=k, name='budget')
    
    return qubo, returns, cov, k

def convert_to_unconstrained_qubo(qubo):
    """
    Convert a constrained QuadraticProgram to an unconstrained QUBO by adding penalty terms.
    
    Args:
        qubo: The constrained QuadraticProgram
        
    Returns:
        QuadraticProgram: The unconstrained QUBO problem
    """
    # Create a new quadratic program for the unconstrained problem
    unconstrained_qubo = QuadraticProgram()
    
    # Add the same variables
    for var in qubo.variables:
        if var.vartype.name == 'BINARY':
            unconstrained_qubo.binary_var(name=var.name)
    
    # Extract the original objective
    original_linear = {}
    original_quadratic = {}
    
    for i, var in enumerate(qubo.variables):
        coeff = qubo.objective.linear.to_dict().get(i, 0)
        if abs(coeff) > 1e-10:
            original_linear[var.name] = coeff
    
    for (i, j), coeff in qubo.objective.quadratic.to_dict().items():
        if abs(coeff) > 1e-10:
            var_i = qubo.variables[i].name
            var_j = qubo.variables[j].name
            original_quadratic[(var_i, var_j)] = coeff
    
    # Extract constraints and add penalty terms
    penalty_weight = 10.0  # Large enough to enforce constraints
    
    # New linear and quadratic terms including penalties
    new_linear = original_linear.copy()
    new_quadratic = original_quadratic.copy()
    
    # Process each constraint
    for constraint in qubo.linear_constraints:
        # Get the constraint parameters
        sense = constraint.sense
        rhs = constraint.rhs
        
        # Get the linear coefficients
        linear_dict = {}
        for i, coeff in constraint.linear.to_dict().items():
            var_name = qubo.variables[i].name
            linear_dict[var_name] = coeff
        
        # Add penalty for equality constraint (x - b)^2
        if sense == '==':
            # Add quadratic penalty terms
            for var1, coeff1 in linear_dict.items():
                for var2, coeff2 in linear_dict.items():
                    key = (var1, var2) if var1 <= var2 else (var2, var1)
                    penalty = penalty_weight * coeff1 * coeff2
                    new_quadratic[key] = new_quadratic.get(key, 0) + penalty
                
                # Add linear penalty terms
                linear_penalty = -2 * penalty_weight * coeff1 * rhs
                new_linear[var1] = new_linear.get(var1, 0) + linear_penalty
            
            # Add constant term (not needed for optimization)
            # constant_penalty = penalty_weight * (rhs ** 2)
    
    # Set the new objective
    unconstrained_qubo.minimize(linear=new_linear, quadratic=new_quadratic)
    
    return unconstrained_qubo

def main():
    # Create a portfolio optimization problem
    num_assets = 4
    qubo_problem, returns, cov, k = create_portfolio_problem(num_assets=num_assets)
    
    print("Portfolio Optimization Problem:")
    print(f"Number of assets: {num_assets}")
    print(f"Expected returns: {returns}")
    print(f"Covariance matrix:\n{cov}")
    print(f"Budget constraint: select exactly {k} assets")
    print("\nQUBO formulation:")
    print(qubo_problem.prettyprint())
    
    # Convert to unconstrained QUBO
    unconstrained_qubo = convert_to_unconstrained_qubo(qubo_problem)
    print("\nUnconstrained QUBO formulation:")
    print(unconstrained_qubo.prettyprint())
    
    # Initialize the QAOA optimizer
    qaoa_optimizer = SimpleQAOAOptimizer(reps=2, shots=1024)
    
    # Solve the problem
    print("\nSolving with QAOA...")
    result = qaoa_optimizer.solve(unconstrained_qubo)
    
    # Print results
    print("\nOptimization Results:")
    solution = result['x']
    print(f"Selected assets: {[i for i, x in enumerate(solution) if x == 1]}")
    print(f"Number of selected assets: {sum(solution)}")
    
    # Calculate portfolio metrics
    selected_returns = returns * solution
    portfolio_return = np.sum(selected_returns)
    
    portfolio_risk = 0
    for i in range(num_assets):
        for j in range(num_assets):
            portfolio_risk += solution[i] * solution[j] * cov[i, j]
    
    print(f"Portfolio expected return: {portfolio_return:.4f}")
    print(f"Portfolio risk: {portfolio_risk:.4f}")
    print(f"Risk-adjusted return: {portfolio_return - 0.5 * portfolio_risk:.4f}")
    
    # Verify constraint satisfaction
    print(f"Constraint satisfied: {sum(solution) == k}")
    
    # Visualize the results
    plt.figure(figsize=(10, 6))
    
    # Plot asset returns
    plt.subplot(1, 2, 1)
    bars = plt.bar(range(num_assets), returns)
    for i, x in enumerate(solution):
        if x == 1:
            bars[i].set_color('green')
        else:
            bars[i].set_color('gray')
    plt.xlabel('Asset')
    plt.ylabel('Expected Return')
    plt.title('Asset Returns (Selected in Green)')
    plt.xticks(range(num_assets), [f'Asset {i}' for i in range(num_assets)])
    
    # Plot covariance matrix
    plt.subplot(1, 2, 2)
    plt.imshow(cov, cmap='viridis')
    plt.colorbar(label='Covariance')
    plt.title('Asset Covariance Matrix')
    plt.xlabel('Asset')
    plt.ylabel('Asset')
    plt.xticks(range(num_assets), [f'{i}' for i in range(num_assets)])
    plt.yticks(range(num_assets), [f'{i}' for i in range(num_assets)])
    
    plt.tight_layout()
    plt.savefig('portfolio_optimization_results.png')
    print("\nResults visualization saved to 'portfolio_optimization_results.png'")

if __name__ == "__main__":
    main()