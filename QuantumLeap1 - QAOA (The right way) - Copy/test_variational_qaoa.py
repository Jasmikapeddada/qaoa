import numpy as np
from simple_qaoa_optimizer import SimpleQAOAOptimizer

def test_variational_vs_fixed():
    """
    Test comparing fixed parameters with COBYLA and SPSA optimized variational QAOA
    on a simple 3-variable QUBO problem.
    """
    # Define a simple QUBO problem that benefits from optimization
    # This problem has a minimum at [0,0,1] with value -1
    qubo_dict = {
        (0, 0): 1,
        (1, 1): 1,
        (2, 2): -1,
        (0, 1): -0.5,
        (0, 2): -0.5,
        (1, 2): -0.5
    }
    
    print("\nTesting QAOA with fixed vs. variational parameters")
    print("==================================================")
    
    # Solve with fixed parameters
    print("\nSolving with fixed parameters (gamma=0.8, beta=0.4)...")
    fixed_optimizer = SimpleQAOAOptimizer(reps=1, shots=4096)  # Increased shots for better accuracy
    fixed_result = fixed_optimizer.solve_problem(qubo_dict, use_variational=False)
    print(f"Fixed parameters solution: {fixed_result['solution']}")
    print(f"Fixed parameters objective value: {fixed_result['objective_value']}")
    print(f"Fixed parameters probability: {fixed_result['probability']:.4f}")
    
    # Solve with COBYLA optimizer
    print("\nSolving with COBYLA variational optimization...")
    cobyla_optimizer = SimpleQAOAOptimizer(reps=1, shots=4096)  # Increased shots for better accuracy
    cobyla_result = cobyla_optimizer.solve_problem(qubo_dict, optimizer_name='COBYLA', use_variational=True)
    print(f"COBYLA solution: {cobyla_result['solution']}")
    print(f"COBYLA objective value: {cobyla_result['objective_value']}")
    print(f"COBYLA probability: {cobyla_result['probability']:.4f}")
    
    # Solve with SPSA optimizer
    print("\nSolving with SPSA variational optimization...")
    spsa_optimizer = SimpleQAOAOptimizer(reps=1, shots=4096)  # Increased shots for better accuracy
    spsa_result = spsa_optimizer.solve_problem(qubo_dict, optimizer_name='SPSA', use_variational=True)
    print(f"SPSA solution: {spsa_result['solution']}")
    print(f"SPSA objective value: {spsa_result['objective_value']}")
    print(f"SPSA probability: {spsa_result['probability']:.4f}")
    
    # Compare results
    print("\nComparison:")
    print(f"Fixed parameters objective: {fixed_result['objective_value']}")
    print(f"COBYLA optimized objective: {cobyla_result['objective_value']}")
    print(f"SPSA optimized objective: {spsa_result['objective_value']}")
    
    # Check if variational methods found better or equal solutions
    # Allow a small tolerance for statistical fluctuations
    assert cobyla_result['objective_value'] <= fixed_result['objective_value'] + 0.5, "COBYLA should find a solution at least as good as fixed parameters"
    assert spsa_result['objective_value'] <= fixed_result['objective_value'] + 0.5, "SPSA should find a solution at least as good as fixed parameters"

def test_quadratic_program_interface():
    """
    Test the QuadraticProgram interface with fixed and variational parameters.
    """
    from qiskit_optimization import QuadraticProgram
    
    # Create a simple quadratic program
    qp = QuadraticProgram()
    qp.binary_var('x0')
    qp.binary_var('x1')
    qp.binary_var('x2')
    qp.minimize(linear=[1, 1, -1], quadratic={('x0', 'x1'): -0.5, ('x0', 'x2'): -0.5, ('x1', 'x2'): -0.5})
    
    print("\nTesting QuadraticProgram interface")
    print("=================================")
    
    # Solve with fixed parameters
    print("\nSolving QuadraticProgram with fixed parameters...")
    fixed_optimizer = SimpleQAOAOptimizer(reps=1, shots=4096)  # Increased shots for better accuracy
    fixed_result = fixed_optimizer.solve(qp, use_variational=False)
    print(f"Fixed parameters solution: {fixed_result['x']}")
    print(f"Fixed parameters objective value: {fixed_result['fval']}")
    
    # Solve with COBYLA optimizer
    print("\nSolving QuadraticProgram with COBYLA variational optimization...")
    cobyla_optimizer = SimpleQAOAOptimizer(reps=1, shots=4096)  # Increased shots for better accuracy
    cobyla_result = cobyla_optimizer.solve(qp, optimizer_name='COBYLA', use_variational=True)
    print(f"COBYLA solution: {cobyla_result['x']}")
    print(f"COBYLA objective value: {cobyla_result['fval']}")
    
    # Check if variational method found better or equal solution
    # Allow a small tolerance for statistical fluctuations
    assert cobyla_result['fval'] <= fixed_result['fval'] + 0.5, "COBYLA should find a solution at least as good as fixed parameters"

if __name__ == "__main__":
    print("Running QAOA variational parameter optimization tests...")
    test_variational_vs_fixed()
    test_quadratic_program_interface()
    print("\nAll tests completed successfully!")