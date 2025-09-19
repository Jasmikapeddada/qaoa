import numpy as np
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer
from qiskit_algorithms.minimum_eigensolvers import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit_aer.primitives import Sampler

# Create a simple QUBO problem
qubo = QuadraticProgram()
qubo.binary_var('x')
qubo.binary_var('y')
qubo.minimize(linear={'x': 1, 'y': -2}, quadratic={('x', 'y'): -1})

print("QUBO problem created:")
print(qubo.export_as_lp_string())

# Create the Sampler primitive
sampler = Sampler()

# Create the QAOA instance
qaoa = QAOA(
    sampler=sampler,
    optimizer=COBYLA(),
    reps=1,
    initial_point=None
)

# Create the MinimumEigenOptimizer
optimizer = MinimumEigenOptimizer(qaoa)

# Solve the problem
print("\nSolving with QAOA...")
result = optimizer.solve(qubo)

# Print the results
print("\nOptimization Results:")
print(f"Optimal value: {result.fval}")
print(f"Optimal solution: {result.x}")