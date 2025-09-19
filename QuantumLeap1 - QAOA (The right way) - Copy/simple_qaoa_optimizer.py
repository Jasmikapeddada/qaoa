import numpy as np
import logging
from typing import Dict, Any, List, Tuple, Callable, Optional
from qiskit_aer import Aer
from qiskit import QuantumCircuit
from qiskit.quantum_info import Pauli, SparsePauliOp
from qiskit_optimization import QuadraticProgram
# Update imports for optimizers
from qiskit_algorithms.optimizers import COBYLA, SPSA

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
    
    def _create_parameterized_circuit(self, hamiltonian: SparsePauliOp, gammas: np.ndarray, betas: np.ndarray) -> QuantumCircuit:
        """
        Create a QAOA circuit with optimized parameters for multiple repetitions.
        
        Args:
            hamiltonian: The problem Hamiltonian
            gammas: Array of gamma parameters for the cost unitaries
            betas: Array of beta parameters for the mixer unitaries
            
        Returns:
            QuantumCircuit: The QAOA circuit with optimized parameters
        """
        num_qubits = len(hamiltonian.paulis[0]) if hamiltonian.paulis else 0
        
        # Create quantum circuit
        qc = QuantumCircuit(num_qubits)
        
        # Initial state: Hadamard on all qubits
        for q in range(num_qubits):
            qc.h(q)
        
        # Apply QAOA layers with optimized parameters
        for p in range(self.reps):
            # Cost unitary with optimized gamma
            for pauli_str, coeff in zip(hamiltonian.paulis, hamiltonian.coeffs):
                if all(p_char == 'I' for p_char in pauli_str):
                    # Skip identity terms
                    continue
                    
                # Apply Z rotations
                for q, p_char in enumerate(pauli_str):
                    if p_char == 'Z':
                        qc.rz(2 * gammas[p] * coeff, q)
            
            # Mixer unitary with optimized beta
            for q in range(num_qubits):
                qc.rx(2 * betas[p], q)
        
        # Measurement
        qc.measure_all()
        
        return qc
    
    def solve(self, qubo_problem: QuadraticProgram, optimizer_name: str = 'COBYLA', use_variational: bool = True) -> Dict[str, Any]:
        """
        Solve the portfolio optimization problem using QAOA.
        
        Args:
            qubo_problem: The QuadraticProgram instance representing the portfolio optimization problem
            optimizer_name: Name of the optimizer to use ('COBYLA' or 'SPSA')
            use_variational: Whether to use variational parameter optimization (True) or fixed parameters (False)
            
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
            
            if use_variational:
                # Use variational parameter optimization
                logger.info("Using variational parameter optimization")
                gammas, betas, final_cost = self._optimize_parameters(hamiltonian, self.reps, optimizer_name)
                
                # Create parameterized QAOA circuit with optimized parameters
                qaoa_circuit = self._create_parameterized_circuit(hamiltonian, gammas, betas)
                
                logger.info(f"Optimized parameters - gammas: {gammas}, betas: {betas}")
            else:
                # Use fixed gamma and beta values
                logger.info("Using fixed parameters (non-variational QAOA)")
                gamma = 0.8
                beta = 0.4
                qaoa_circuit = self._create_qaoa_circuit(hamiltonian, gamma, beta)
            
            # Execute the circuit
            logger.info(f"Executing QAOA circuit with {self.shots} shots")
            job = simulator.run(qaoa_circuit, shots=self.shots)
            counts = job.result().get_counts()
            
            # Process results
            best_bitstring = max(counts, key=counts.get)
            best_solution = [int(bit) for bit in best_bitstring[::-1]]  # Reverse to match qubit ordering
            probability = counts[best_bitstring] / self.shots
            
            # Calculate objective value
            objective_value = self._calculate_objective_value(best_solution, qubo_matrix)
            
            # Create result dictionary
            result = {
                'x': best_solution,
                'fval': objective_value,
                'probability': probability,
                'counts': counts,
                'success': True
            }
            
            logger.info(f"QAOA optimization completed successfully with objective value: {objective_value}")
            return result
            
        except Exception as e:
            logger.error(f"Error in QAOA portfolio optimization: {str(e)}")
            raise

    def solve_problem(self, qubo_dict: Dict, optimizer_name: str = 'COBYLA', use_variational: bool = True) -> Dict[str, Any]:
        """
        Solve a QUBO problem directly from a dictionary representation.
        
        Args:
            qubo_dict: Dictionary with (i,j) tuples as keys and coefficients as values
            optimizer_name: Name of the optimizer to use ('COBYLA' or 'SPSA')
            use_variational: Whether to use variational parameter optimization (True) or fixed parameters (False)
            
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
            
            if use_variational:
                # Use variational parameter optimization
                logger.info("Using variational parameter optimization")
                gammas, betas, final_cost = self._optimize_parameters(hamiltonian, self.reps, optimizer_name)
                
                # Create parameterized QAOA circuit with optimized parameters
                qaoa_circuit = self._create_parameterized_circuit(hamiltonian, gammas, betas)
                
                logger.info(f"Optimized parameters - gammas: {gammas}, betas: {betas}")
            else:
                # Use fixed gamma and beta values
                logger.info("Using fixed parameters (non-variational QAOA)")
                gamma = 0.8
                beta = 0.4
                qaoa_circuit = self._create_qaoa_circuit(hamiltonian, gamma, beta)
            
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

    def _create_cost_function(self, hamiltonian: SparsePauliOp, reps=1) -> Callable:
        """
        Create a cost function for the classical optimizer to minimize.
        
        Args:
            hamiltonian: The problem Hamiltonian
            reps: Number of QAOA repetitions
            
        Returns:
            Callable: A function that takes parameters and returns the expectation value
        """
        num_qubits = len(hamiltonian.paulis[0]) if hamiltonian.paulis else 0
        
        def cost_function(params: np.ndarray) -> float:
            # Reshape parameters for multiple QAOA layers if needed
            params_reshaped = params.reshape(2, self.reps)
            gammas = params_reshaped[0, :]
            betas = params_reshaped[1, :]
            
            # Create a parameterized circuit without measurement for expectation value calculation
            qc = QuantumCircuit(num_qubits)
            
            # Initial state: Hadamard on all qubits
            for q in range(num_qubits):
                qc.h(q)
            
            # Apply QAOA layers with the parameters
            for p in range(self.reps):
                # Cost unitary with gamma
                for pauli_str, coeff in zip(hamiltonian.paulis, hamiltonian.coeffs):
                    if all(p_char == 'I' for p_char in pauli_str):
                        # Skip identity terms
                        continue
                        
                    # Apply Z rotations
                    for q, p_char in enumerate(pauli_str):
                        if p_char == 'Z':
                            qc.rz(2 * gammas[p] * float(coeff.real), q)  # Ensure real value
                
                # Mixer unitary with beta
                for q in range(num_qubits):
                    qc.rx(2 * betas[p], q)
            
            # Execute the circuit with the Aer simulator
            simulator = Aer.get_backend('aer_simulator')
            
            # Add measurement for sampling
            qc_with_measure = qc.copy()
            qc_with_measure.measure_all()
            
            # Execute the circuit
            job = simulator.run(qc_with_measure, shots=self.shots)
            counts = job.result().get_counts()
            
            # Calculate the expected value
            energy = 0.0
            total_shots = sum(counts.values())
            
            for bitstring, count in counts.items():
                # Convert bitstring to solution vector (reverse to match qubit ordering)
                solution = [int(bit) for bit in bitstring[::-1]]
                
                # Calculate the energy contribution for this bitstring
                bitstring_energy = 0.0
                
                # For each term in the Hamiltonian
                for pauli_str, coeff in zip(hamiltonian.paulis, hamiltonian.coeffs):
                    term_contrib = float(coeff.real)  # Ensure real value
                    
                    # For each qubit position with a Z operator
                    for q, p_char in enumerate(pauli_str):
                        if p_char == 'Z':
                            # Apply Z operator effect: +1 for |0⟩, -1 for |1⟩
                            term_contrib *= 1 - 2 * solution[q]
                    
                    bitstring_energy += term_contrib
                
                # Add weighted contribution to energy
                energy += bitstring_energy * count / total_shots
            
            return float(energy)  # Ensure return value is a real float
        
        return cost_function

    def _optimize_parameters(self, hamiltonian: SparsePauliOp, reps=1, optimizer_name='COBYLA') -> Tuple[np.ndarray, float]:
        """
        Optimize the QAOA parameters (gamma and beta) using a classical optimizer.
        
        Args:
            hamiltonian: The problem Hamiltonian
            reps: Number of QAOA repetitions
            optimizer_name: Name of the optimizer to use ('COBYLA' or 'SPSA')
            
        Returns:
            Tuple[np.ndarray, float]: Optimized parameters (gammas, betas) and final cost value
        """
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger('simple_qaoa_optimizer')
        
        # Create the cost function
        cost_function = self._create_cost_function(hamiltonian, reps)
        
        # Initialize parameters (gamma, beta) for each repetition
        # Use better initial points instead of random
        initial_point = np.zeros(2 * reps)
        for i in range(reps):
            # Initialize gamma close to optimal value for 1-layer QAOA
            initial_point[i] = 0.8  # gamma
            # Initialize beta close to optimal value for 1-layer QAOA
            initial_point[i + reps] = 0.4  # beta
        
        # Select optimizer
        if optimizer_name == 'COBYLA':
            from qiskit_algorithms.optimizers import COBYLA
            optimizer = COBYLA(maxiter=200, tol=1e-4)
        elif optimizer_name == 'SPSA':
            from qiskit_algorithms.optimizers import SPSA
            optimizer = SPSA(maxiter=100)
        else:
            raise ValueError(f"Unsupported optimizer: {optimizer_name}")
        
        logger.info(f"Starting parameter optimization with {optimizer_name}")
        
        # Run optimization
        result = optimizer.minimize(cost_function, x0=initial_point)
        
        # Extract optimized parameters
        optimized_params = result.x
        function_evals = result.nfev
        
        logger.info(f"Parameter optimization completed with {function_evals} function evaluations")
        logger.info(f"Final cost value: {result.fun}")
        
        # Split optimized parameters into gamma and beta
        gammas = optimized_params[:reps]
        betas = optimized_params[reps:]
        
        logger.info(f"Optimized parameters - gammas: {gammas}, betas: {betas}")
        
        return gammas, betas, result.fun

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