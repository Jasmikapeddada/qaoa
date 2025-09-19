import logging
import numpy as np
from typing import Dict, Any, List, Tuple

from qiskit_aer import Aer
from qiskit import QuantumCircuit
from qiskit.circuit.library import QAOAAnsatz
from qiskit.quantum_info import SparsePauliOp
from qiskit_algorithms.optimizers import COBYLA
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import GroverOptimizer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QAOAPortfolioOptimizer:
    """
    A class to solve portfolio optimization problems using QAOA.
    
    This class provides a modular implementation of QAOA for portfolio optimization,
    handling the conversion from QUBO to Ising Hamiltonian and executing the quantum algorithm.
    """
    
    def __init__(self, reps: int = 1, shots: int = 1024):
        """
        Initialize the QAOA Portfolio Optimizer.
        
        Args:
            reps: Number of QAOA repetitions (p parameter)
            shots: Number of measurement shots
        """
        self.reps = reps
        self.shots = shots
        self.optimizer = COBYLA()
        logger.info(f"QAOA Portfolio Optimizer initialized with {reps} reps and {shots} shots")
    
    def _qubo_to_ising(self, qubo_matrix: np.ndarray) -> SparsePauliOp:
        """
        Convert a QUBO matrix to an Ising Hamiltonian.
        
        Args:
            qubo_matrix: The QUBO matrix representing the optimization problem
            
        Returns:
            SparsePauliOp: The Ising Hamiltonian as a SparsePauliOp
        """
        n = qubo_matrix.shape[0]  # Number of qubits
        pauli_strings = []
        coefficients = []
        
        # Constant term
        constant = 0
        
        # Convert QUBO to Ising
        # For each diagonal term (i,i), we replace x_i with (1 + Z_i)/2
        for i in range(n):
            # Diagonal terms: x_i -> (1 + Z_i)/2
            # This gives Z_i term and constant term
            coeff = qubo_matrix[i, i]
            if abs(coeff) > 1e-10:  # Ignore very small coefficients
                # Z_i term
                pauli_str = ['I'] * n
                pauli_str[i] = 'Z'
                pauli_strings.append(''.join(pauli_str))
                coefficients.append(coeff / 2)
                
                # Constant term
                constant += coeff / 2
        
        # For each off-diagonal term (i,j), we replace x_i*x_j with (1 + Z_i)(1 + Z_j)/4
        for i in range(n):
            for j in range(i+1, n):
                coeff = qubo_matrix[i, j]
                if abs(coeff) > 1e-10:  # Ignore very small coefficients
                    # (1 + Z_i)(1 + Z_j)/4 expands to:
                    # 1/4 + Z_i/4 + Z_j/4 + Z_i*Z_j/4
                    
                    # Z_i*Z_j term
                    pauli_str = ['I'] * n
                    pauli_str[i] = 'Z'
                    pauli_str[j] = 'Z'
                    pauli_strings.append(''.join(pauli_str))
                    coefficients.append(coeff / 4)
                    
                    # Z_i term
                    pauli_str = ['I'] * n
                    pauli_str[i] = 'Z'
                    pauli_strings.append(''.join(pauli_str))
                    coefficients.append(coeff / 4)
                    
                    # Z_j term
                    pauli_str = ['I'] * n
                    pauli_str[j] = 'Z'
                    pauli_strings.append(''.join(pauli_str))
                    coefficients.append(coeff / 4)
                    
                    # Constant term
                    constant += coeff / 4
        
        # Add constant term as identity operator
        if abs(constant) > 1e-10:
            pauli_strings.append('I' * n)
            coefficients.append(constant)
        
        # Create SparsePauliOp
        hamiltonian = SparsePauliOp(pauli_strings, coefficients)
        return hamiltonian
    
    def solve(self, qubo_problem: QuadraticProgram) -> Dict[str, Any]:
        """
        Solve the portfolio optimization problem using QAOA.
        
        Args:
            qubo_problem: The QuadraticProgram instance representing the portfolio optimization problem
            
        Returns:
            Dict[str, Any]: The optimization result containing the optimal solution and other metadata
        """
        try:
            logger.info("Starting QAOA portfolio optimization")
            
            # Extract QUBO matrix from the problem
            qubo_matrix = np.zeros((qubo_problem.get_num_vars(), qubo_problem.get_num_vars()))
            
            # Fill the QUBO matrix with linear terms
            for i, coeff in qubo_problem.objective.linear.to_dict().items():
                qubo_matrix[i, i] = coeff
            
            # Fill the QUBO matrix with quadratic terms
            for (i, j), coeff in qubo_problem.objective.quadratic.to_dict().items():
                qubo_matrix[i, j] = coeff
                qubo_matrix[j, i] = coeff  # Ensure symmetry
            
            # Convert QUBO to Ising Hamiltonian
            hamiltonian = self._qubo_to_ising(qubo_matrix)
            
            # Create the Aer simulator backend
            simulator = Aer.get_backend('aer_simulator')
            
            # Create QAOA circuit
            num_qubits = qubo_problem.get_num_vars()
            qaoa_circuit = QAOAAnsatz(hamiltonian, reps=self.reps)
            
            # Set initial parameters (alternating between 0 and pi/2)
            initial_params = []
            for i in range(2 * self.reps):
                if i % 2 == 0:  # gamma parameters
                    initial_params.append(0.0)
                else:  # beta parameters
                    initial_params.append(np.pi/2)
            
            # Bind parameters to circuit
            bound_circuit = qaoa_circuit.bind_parameters(initial_params)
            
            # Add measurements
            bound_circuit.measure_all()
            
            # Execute the circuit
            logger.info(f"Executing QAOA circuit with {self.shots} shots")
            job = simulator.run(bound_circuit, shots=self.shots)
            counts = job.result().get_counts()
            
            # Process results
            best_bitstring = max(counts, key=counts.get)
            best_solution = [int(bit) for bit in best_bitstring[::-1]]  # Reverse to match qubit ordering
            
            # Calculate objective value
            objective_value = self._calculate_objective_value(best_solution, qubo_matrix)
            
            # Create result dictionary
            result = {
                'x': best_solution,
                'fval': objective_value,
                'counts': counts,
                'success': True
            }
            
            logger.info(f"QAOA optimization completed successfully with objective value: {objective_value}")
            return result
            
        except Exception as e:
            logger.error(f"Error in QAOA portfolio optimization: {str(e)}")
            # Fall back to classical optimizer
            logger.info("Falling back to classical optimizer")
            try:
                from qiskit_optimization.algorithms import MinimumEigenOptimizer
                from qiskit.algorithms.optimizers import SLSQP
                from qiskit_algorithms.minimum_eigensolvers import NumPyMinimumEigensolver
                
                # Use NumPy Minimum Eigensolver as a classical fallback
                classical_solver = NumPyMinimumEigensolver()
                optimizer = MinimumEigenOptimizer(classical_solver)
                result = optimizer.solve(qubo_problem)
                
                logger.info(f"Classical optimization completed with objective value: {result.fval}")
                return result
            except Exception as fallback_error:
                logger.error(f"Error in classical fallback: {str(fallback_error)}")
                raise
    
    def _calculate_objective_value(self, solution: List[int], qubo_matrix: np.ndarray) -> float:
        """
        Calculate the objective value for a given solution using the QUBO matrix.
        
        Args:
            solution: Binary solution vector
            qubo_matrix: QUBO matrix representing the problem
            
        Returns:
            float: Objective value
        """
        objective = 0.0
        n = len(solution)
        
        # Calculate linear terms
        for i in range(n):
            objective += qubo_matrix[i, i] * solution[i]
        
        # Calculate quadratic terms
        for i in range(n):
            for j in range(i+1, n):
                objective += qubo_matrix[i, j] * solution[i] * solution[j]
        
        return objective

# Example usage:
# qubo_problem = QuadraticProgram()  # This would be your existing QUBO problem
# optimizer = QAOAPortfolioOptimizer(reps=3, shots=1000)
# result = optimizer.solve(qubo_problem)
# print(f"Optimal value: {result['fval']}")
# print(f"Optimal solution: {result['x']}")