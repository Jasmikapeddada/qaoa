import numpy as np
import logging
from typing import Dict, Any, List
from qiskit_aer import Aer
from qiskit import QuantumCircuit
from qiskit.quantum_info import Pauli, SparsePauliOp
from qiskit_optimization import QuadraticProgram

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleQAOAOptimizer:
    """
    A simplified QAOA optimizer for portfolio optimization that works with Qiskit 2.x
    """
    
    def __init__(self, reps: int = 1, shots: int = 1024, backend: str = None):
        """
        Initialize the QAOA optimizer.
        
        Args:
            reps: Number of QAOA repetitions (p parameter)
            shots: Number of measurement shots
            backend: Backend to use for simulation or real quantum hardware
        """
        self.reps = reps
        self.shots = shots
        self.backend = backend
        logger.info(f"Simple QAOA Optimizer initialized with {reps} reps, {shots} shots, and backend: {backend if backend else 'default Aer simulator'}")
    
    def _qubo_to_hamiltonian(self, qubo_matrix: np.ndarray) -> SparsePauliOp:
        """
        Convert a QUBO matrix to a Hamiltonian operator.
        
        Args:
            qubo_matrix: The QUBO matrix representing the optimization problem
            
        Returns:
            SparsePauliOp: The Hamiltonian operator
        """
        n = qubo_matrix.shape[0]  # Number of qubits
        pauli_strings = []
        coefficients = []
        
        # Constant term
        constant = 0
        
        # Convert QUBO to Ising
        for i in range(n):
            # Diagonal terms
            coeff = qubo_matrix[i, i]
            if abs(coeff) > 1e-10:
                # Z_i term
                pauli_str = ['I'] * n
                pauli_str[i] = 'Z'
                pauli_strings.append(''.join(pauli_str))
                coefficients.append(coeff / 2)
                
                # Constant term
                constant += coeff / 2
        
        # Off-diagonal terms
        for i in range(n):
            for j in range(i+1, n):
                coeff = qubo_matrix[i, j]
                if abs(coeff) > 1e-10:
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
        
        # Add constant term
        if abs(constant) > 1e-10:
            pauli_strings.append('I' * n)
            coefficients.append(constant)
        
        # Create SparsePauliOp
        hamiltonian = SparsePauliOp(pauli_strings, coefficients)
        return hamiltonian
    
    def _create_qaoa_circuit(self, hamiltonian: SparsePauliOp, gamma: float, beta: float) -> QuantumCircuit:
        """
        Create a QAOA circuit with one repetition.
        
        Args:
            hamiltonian: The problem Hamiltonian
            gamma: The gamma parameter for the cost unitary
            beta: The beta parameter for the mixer unitary
            
        Returns:
            QuantumCircuit: The QAOA circuit
        """
        num_qubits = len(hamiltonian.paulis[0]) if hamiltonian.paulis else 0
        
        # Create quantum circuit
        qc = QuantumCircuit(num_qubits)
        
        # Initial state: Hadamard on all qubits
        for q in range(num_qubits):
            qc.h(q)
        
        # Apply QAOA layers
        for _ in range(self.reps):
            # Cost unitary
            for pauli_str, coeff in zip(hamiltonian.paulis, hamiltonian.coeffs):
                if all(p == 'I' for p in pauli_str):
                    # Skip identity terms
                    continue
                    
                # Apply Z rotations
                for q, p in enumerate(pauli_str):
                    if p == 'Z':
                        qc.rz(2 * gamma * coeff, q)
            
            # Mixer unitary
            for q in range(num_qubits):
                qc.rx(2 * beta, q)
        
        # Measurement
        qc.measure_all()
        
        return qc
    
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
            
            # Convert QUBO to Hamiltonian
            hamiltonian = self._qubo_to_hamiltonian(qubo_matrix)
            
            # Create the Aer simulator backend
            simulator = Aer.get_backend('aer_simulator')
            
            # Use fixed gamma and beta values for simplicity
            # In a real implementation, you would optimize these parameters
            gamma = 0.8
            beta = 0.4
            
            # Create QAOA circuit
            qaoa_circuit = self._create_qaoa_circuit(hamiltonian, gamma, beta)
            
            # Execute the circuit
            logger.info(f"Executing QAOA circuit with {self.shots} shots")
            job = simulator.run(qaoa_circuit, shots=self.shots)
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

    def solve_problem(self, qubo_dict: Dict) -> Dict[str, Any]:
        """
        Solve a QUBO problem directly from a dictionary representation.
        
        Args:
            qubo_dict: Dictionary with (i,j) tuples as keys and coefficients as values
            
        Returns:
            Dict[str, Any]: The optimization result containing the solution and other metadata
        """
        try:
            logger.info("Starting QAOA optimization from QUBO dictionary")
            
            # Determine the number of variables from the QUBO dict
            all_indices = set()
            for (i, j) in qubo_dict.keys():
                all_indices.add(i)
                all_indices.add(j)
            n_vars = max(all_indices) + 1
            
            # Create a QUBO matrix from the dictionary
            qubo_matrix = np.zeros((n_vars, n_vars))
            for (i, j), coeff in qubo_dict.items():
                qubo_matrix[i, j] = coeff
                if i != j:  # Ensure symmetry for off-diagonal elements
                    qubo_matrix[j, i] = coeff
            
            # Convert QUBO to Hamiltonian
            hamiltonian = self._qubo_to_hamiltonian(qubo_matrix)
            
            # Use fixed gamma and beta values for simplicity
            # In a real implementation, you would optimize these parameters
            gamma = 0.8
            beta = 0.4
            
            # Create QAOA circuit
            qaoa_circuit = self._create_qaoa_circuit(hamiltonian, gamma, beta)
            
            # Select the appropriate backend
            if self.backend:
                try:
                    # If a specific backend name is provided, try to use it
                    from qiskit_ibm_runtime import QiskitRuntimeService
                    service = QiskitRuntimeService()
                    backend = service.backend(self.backend)
                    logger.info(f"Using specified backend: {self.backend}")
                except Exception as e:
                    logger.warning(f"Could not access specified backend {self.backend}: {str(e)}")
                    logger.info("Falling back to Aer simulator")
                    backend = Aer.get_backend('aer_simulator')
            else:
                # Default to Aer simulator
                backend = Aer.get_backend('aer_simulator')
                logger.info("Using default Aer simulator backend")
            
            # Execute the circuit
            logger.info(f"Executing QAOA circuit with {self.shots} shots")
            job = backend.run(qaoa_circuit, shots=self.shots)
            counts = job.result().get_counts()
            
            # Process results
            best_bitstring = max(counts, key=counts.get)
            best_solution = [int(bit) for bit in best_bitstring[::-1]]  # Reverse to match qubit ordering
            probability = counts[best_bitstring] / self.shots
            
            # Calculate objective value
            objective_value = self._calculate_objective_value(best_solution, qubo_matrix)
            
            # Create result dictionary
            result = {
                'solution': best_solution,
                'objective_value': objective_value,
                'probability': probability,
                'counts': counts,
                'success': True
            }
            
            logger.info(f"QAOA optimization completed successfully with objective value: {objective_value}")
            return result
            
        except Exception as e:
            logger.error(f"Error in QAOA optimization: {str(e)}")
            raise