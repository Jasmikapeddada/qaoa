#!/usr/bin/env python
"""Test script for QuantumLeap backend

This script tests the core functionality of the QuantumLeap backend by:
1. Generating sample data
2. Loading and processing the data
3. Running portfolio optimization
4. Generating visualization data
5. Printing sample API responses

Run this script to verify that all backend components work together correctly.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import backend modules
try:
    from backend.data_manager import DataManager
    from backend.optimizer import PortfolioOptimizer
    from backend.visualization import VisualizationDataGenerator
    from backend.sample_data import SampleDataGenerator
    from backend.api_response_schema import get_example_response
except ImportError:
    # If running from backend directory
    from data_manager import DataManager
    from optimizer import PortfolioOptimizer
    from visualization import VisualizationDataGenerator
    from sample_data import SampleDataGenerator
    from api_response_schema import get_example_response


def test_backend_workflow() -> None:
    """Test the complete backend workflow"""
    try:
        logger.info("Starting backend test workflow")
        
        # Step 1: Generate sample data
        logger.info("Generating sample data...")
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
        sample_generator = SampleDataGenerator(data_dir=data_dir)
        
        # Use a smaller set of tickers for testing
        test_tickers = ['INFY', 'TCS', 'WIPRO', 'HCLTECH', 'TECHM']
        sample_generator.generate_sample_data(tickers=test_tickers, days=252)
        
        # Step 2: Initialize components
        logger.info("Initializing backend components...")
        data_manager = DataManager(data_dir=data_dir)
        optimizer = PortfolioOptimizer()
        viz_generator = VisualizationDataGenerator()
        
        # Step 3: Get available stocks
        logger.info("Getting available stocks...")
        available_stocks = data_manager.get_available_stocks()
        logger.info(f"Found {len(available_stocks)} available stocks")
        
        # Step 4: Load stock data
        logger.info("Loading stock data...")
        stock_data = data_manager.load_stock_data(test_tickers)
        logger.info(f"Loaded data for {len(stock_data)} stocks")
        
        # Step 5: Compute financial metrics
        logger.info("Computing financial metrics...")
        expected_returns, covariance_matrix, latest_prices = data_manager.compute_financial_metrics(stock_data)
        logger.info(f"Computed metrics: returns shape={expected_returns.shape}, covariance shape={covariance_matrix.shape}")
        
        # Step 6: Run portfolio optimization
        logger.info("Running portfolio optimization...")
        optimization_params = {
            'budget': 100000,
            'risk_aversion': 0.5,
            'return_weight': 1.0,
            'budget_penalty': 10.0,
            'min_assets': 2,
            'min_assets_penalty': 5.0,
            'risk_free_rate': 0.02,
            'qaoa_reps': 1,
            'qaoa_shots': 1024
        }
        
        optimization_result = optimizer.optimize(
            tickers=test_tickers,
            expected_returns=expected_returns,
            covariance_matrix=covariance_matrix,
            latest_prices=latest_prices,
            **optimization_params
        )
        
        logger.info(f"Optimization complete. Found {len(optimization_result['top_portfolios'])} top portfolios")
        
        # Step 7: Generate visualization data
        logger.info("Generating visualization data...")
        visualization_data = viz_generator.generate_visualization_data(
            optimization_result=optimization_result,
            stock_data=stock_data,
            tickers=test_tickers,
            budget=optimization_params['budget'],
            risk_free_rate=optimization_params['risk_free_rate']
        )
        
        logger.info(f"Generated visualization data for {len(visualization_data)} plots")
        
        # Step 8: Create API response
        logger.info("Creating API response...")
        api_response = {
            'top_portfolios': optimization_result['top_portfolios'],
            'plots': visualization_data
        }
        
        # Step 9: Print sample results
        logger.info("Sample top portfolio:")
        if optimization_result['top_portfolios']:
            top_portfolio = optimization_result['top_portfolios'][0]
            print(json.dumps(top_portfolio, indent=2))
        
        logger.info("Backend test workflow completed successfully")
        return api_response
    
    except Exception as e:
        logger.error(f"Error in backend test workflow: {str(e)}")
        raise


def test_with_sample_data() -> None:
    """Test using pre-generated sample data"""
    try:
        logger.info("Testing with pre-generated sample data")
        
        # Generate sample optimization result
        sample_generator = SampleDataGenerator()
        test_tickers = ['INFY', 'TCS', 'WIPRO', 'HCLTECH', 'TECHM']
        
        # Generate sample stock data (just for structure)
        sample_stock_data = {}
        for ticker in test_tickers:
            # Create a simple DataFrame with dates and prices
            dates = pd.date_range(end=pd.Timestamp.now(), periods=252, freq='B')
            prices = np.random.random(size=len(dates)) * 1000 + 500
            sample_stock_data[ticker] = pd.DataFrame({
                'Date': dates,
                'Close': prices
            })
        
        # Generate sample optimization result
        optimization_result = sample_generator.generate_sample_optimization_result(test_tickers)
        
        # Initialize visualization generator
        viz_generator = VisualizationDataGenerator()
        
        # Generate visualization data
        visualization_data = viz_generator.generate_visualization_data(
            optimization_result=optimization_result,
            stock_data=sample_stock_data,
            tickers=test_tickers,
            budget=100000,
            risk_free_rate=0.02
        )
        
        # Create API response
        api_response = {
            'top_portfolios': optimization_result['top_portfolios'],
            'plots': visualization_data
        }
        
        # Print sample results
        logger.info("Sample API response structure:")
        print(json.dumps({k: "..." for k in api_response.keys()}, indent=2))
        
        logger.info("Sample top portfolio:")
        if optimization_result['top_portfolios']:
            top_portfolio = optimization_result['top_portfolios'][0]
            print(json.dumps(top_portfolio, indent=2))
        
        logger.info("Sample visualization data keys:")
        print(json.dumps({k: "..." for k in visualization_data.keys()}, indent=2))
        
        return api_response
    
    except Exception as e:
        logger.error(f"Error in sample data test: {str(e)}")
        raise


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("QuantumLeap Backend Test")
    print("=" * 80)
    
    try:
        # Try the full workflow first
        print("\nTesting full backend workflow...")
        try:
            result = test_backend_workflow()
            print("\n✅ Full backend workflow test completed successfully!")
        except Exception as e:
            print(f"\n❌ Full backend workflow test failed: {str(e)}")
            print("\nFalling back to sample data test...")
            result = test_with_sample_data()
            print("\n✅ Sample data test completed successfully!")
    
    except Exception as e:
        print(f"\n❌ All tests failed: {str(e)}")
    
    print("\n" + "=" * 80)
    print("Test Complete")
    print("=" * 80 + "\n")