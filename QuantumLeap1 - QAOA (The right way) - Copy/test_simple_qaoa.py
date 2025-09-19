import numpy as np
from qiskit_optimization import QuadraticProgram
from simple_qaoa_optimizer import SimpleQAOAOptimizer

def create_sample_qubo_problem():
    """
    Create a simple QUBO problem for testing.
    
    Returns:
        QuadraticProgram: A simple QUBO problem
    """
    # Create a new quadratic program
    qubo = QuadraticProgram()
    
    # Add binary variables
    qubo.binary_var('x0')
    qubo.binary_var('x1')
    qubo.binary_var('x2')
    
    # Define the objective function: minimize -x0 - x1 - 2*x2 + 2*x0*x1 + x0*x2
    linear = {'x0': -1, 'x1': -1, 'x2': -2}
    quadratic = {('x0', 'x1'): 2, ('x0', 'x2'): 1}
    
    # Set the objective
    qubo.minimize(linear=linear, quadratic=quadratic)
    
    return qubo, linear, quadratic

def main():
    # Create a sample QUBO problem
    qubo_problem, linear, quadratic = create_sample_qubo_problem()
    print("QUBO Problem:")
    print(qubo_problem.export_as_lp_string())
    
    # Initialize the QAOA optimizer
    qaoa_optimizer = SimpleQAOAOptimizer(reps=1, shots=1024)
    
    # Solve the problem
    print("\nSolving with QAOA...")
    result = qaoa_optimizer.solve(qubo_problem)
    
    # Print results
    print("\nOptimization Results:")
    print(f"Best solution: {result['x']}")
    print(f"Objective value: {result['fval']}")
    print(f"Measurement counts: {result['counts']}")
    
    # Verify the solution
    print("\nVerifying solution...")
    # Convert solution to a dictionary for easier verification
    solution_dict = {f'x{i}': result['x'][i] for i in range(len(result['x']))}
    print(f"Solution as dictionary: {solution_dict}")
    
    # Calculate expected objective value
    expected_obj = 0
    for var, coeff in linear.items():
        i = int(var[1:])  # Extract index from variable name
        expected_obj += coeff * result['x'][i]
    
    for (var1, var2), coeff in quadratic.items():
        i = int(var1[1:])  # Extract index from first variable name
        j = int(var2[1:])  # Extract index from second variable name
        expected_obj += coeff * result['x'][i] * result['x'][j]
    
    print(f"Expected objective value: {expected_obj}")
    print(f"Calculated objective value: {result['fval']}")
    print(f"Match: {abs(expected_obj - result['fval']) < 1e-6}")

if __name__ == "__main__":
    main()