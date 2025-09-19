import logging
import numpy as np
from backend.optimizer import PortfolioOptimizer
from simple_qaoa_optimizer import SimpleQAOAOptimizer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_ibm_quantum_integration():
    """Test the integration of SimpleQAOAOptimizer with IBM Quantum Hardware"""
    # Create sample data
    tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
    returns = np.array([0.05, 0.1, 0.15, 0.2])  # Expected returns for 4 assets
    risk_matrix = np.array([
        [0.05, 0.01, 0.02, 0.03],
        [0.01, 0.10, 0.03, 0.02],
        [0.02, 0.03, 0.15, 0.01],
        [0.03, 0.02, 0.01, 0.20]
    ])  # Risk matrix (covariance)
    prices = np.array([150.0, 250.0, 2000.0, 3000.0])  # Current prices
    
    # Initialize the portfolio optimizer
    optimizer = PortfolioOptimizer()
    
    # Run the optimization with IBM Quantum Hardware
    result = optimizer.optimize(
        tickers=tickers,
        expected_returns=returns,
        covariance_matrix=risk_matrix,
        prices=prices,
        budget=10000.0,
        optimization_objective='Max Sharpe Ratio',
        risk_free_rate=0.07,
        risk_aversion=0.5,
        return_weight=1.0,
        budget_penalty=1.0,
        min_assets=1,
        min_assets_penalty=1.0,
        correlation_threshold=0.5,
        reps=1,
        shots=1024,
        backend_name='IBM Quantum Hardware'
    )
    
    # Check if optimization was successful
    assert 'error' not in result, f"Optimization failed with error: {result.get('error', 'Unknown error')}"
    assert 'top_portfolios' in result, "No portfolios found in result"
    assert len(result['top_portfolios']) > 0, "No valid portfolios found"
    
    # Print the results
    logger.info(f"Optimization successful. Found {len(result['top_portfolios'])} top portfolios.")
    for i, portfolio in enumerate(result['top_portfolios']):
        logger.info(f"Portfolio {i+1}: Assets {portfolio['assets']} with sharpe ratio {portfolio['sharpe']}")
    
    return result

if __name__ == "__main__":
    logger.info("Testing PortfolioOptimizer integration with IBM Quantum Hardware")
    result = test_ibm_quantum_integration()
    logger.info("Test completed successfully")