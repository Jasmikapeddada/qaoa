import numpy as np
import pandas as pd
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class SampleDataGenerator:
    """Generates sample stock data for testing and development"""
    
    def __init__(self, data_dir: str = 'backend/data'):
        """Initialize the sample data generator
        
        Args:
            data_dir: Directory to store sample CSV files
        """
        self.data_dir = data_dir
        logger.info(f"Sample data generator initialized with data directory: {data_dir}")
    
    def generate_sample_data(self, tickers: List[str] = None, days: int = 252) -> None:
        """Generate sample stock data for the given tickers
        
        Args:
            tickers: List of stock tickers to generate data for
            days: Number of days of historical data to generate
        """
        try:
            # Default tickers if none provided
            if tickers is None:
                tickers = ['INFY', 'TCS', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'MINDTREE', 
                          'PERSISTENT', 'MPHASIS', 'COFORGE', 'OFSS', 'LTTS', 'HAPPSTMNDS', 
                          'CYIENT', 'SONATSOFTW']
            
            # Create data directory if it doesn't exist
            os.makedirs(self.data_dir, exist_ok=True)
            
            # Generate data for each ticker
            for ticker in tickers:
                self._generate_ticker_data(ticker, days)
            
            logger.info(f"Generated sample data for {len(tickers)} tickers")
        
        except Exception as e:
            logger.error(f"Error generating sample data: {str(e)}")
            raise
    
    def _generate_ticker_data(self, ticker: str, days: int) -> None:
        """Generate sample data for a single ticker
        
        Args:
            ticker: Stock ticker symbol
            days: Number of days of historical data to generate
        """
        try:
            # Set random seed based on ticker for reproducibility but different patterns
            seed = sum(ord(c) for c in ticker)
            np.random.seed(seed)
            
            # Generate dates (business days)
            end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            dates = [end_date - timedelta(days=i) for i in range(days)][::-1]
            # Filter weekends (simple approach, not accounting for holidays)
            dates = [date for date in dates if date.weekday() < 5]
            
            # Generate price data with realistic patterns
            initial_price = np.random.uniform(500, 5000)  # Initial price between ₹500-5000
            price = initial_price
            prices = [price]
            
            # Daily returns with mean and volatility based on ticker
            mean_return = np.random.uniform(0.0001, 0.0008)  # Annualized ~2.5-20%
            volatility = np.random.uniform(0.005, 0.025)     # Annualized ~8-40%
            
            # Generate price series
            for _ in range(1, len(dates)):
                daily_return = np.random.normal(mean_return, volatility)
                price = price * (1 + daily_return)
                prices.append(price)
            
            # Create DataFrame
            df = pd.DataFrame({
                'Date': dates,
                'Open': prices,
                'High': [p * (1 + np.random.uniform(0, 0.02)) for p in prices],
                'Low': [p * (1 - np.random.uniform(0, 0.02)) for p in prices],
                'Close': [p * (1 + np.random.normal(0, 0.005)) for p in prices],
                'Adj Close': [p * (1 + np.random.normal(0, 0.005)) for p in prices],
                'Volume': [int(np.random.uniform(100000, 1000000)) for _ in prices]
            })
            
            # Ensure Close and Adj Close are realistic
            df['Close'] = np.maximum(df['Low'], np.minimum(df['High'], df['Close']))
            df['Adj Close'] = df['Close']  # For simplicity, make Adj Close same as Close
            
            # Format dates as strings
            df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')
            
            # Save to CSV
            file_path = os.path.join(self.data_dir, f"{ticker}.csv")
            df.to_csv(file_path, index=False)
            logger.info(f"Generated sample data for {ticker} at {file_path}")
        
        except Exception as e:
            logger.error(f"Error generating data for {ticker}: {str(e)}")
            raise
    
    def generate_sample_optimization_result(self, tickers: List[str] = None) -> Dict[str, Any]:
        """Generate a sample optimization result for testing visualization
        
        Args:
            tickers: List of stock tickers to include in the result
            
        Returns:
            Dictionary containing sample optimization result
        """
        try:
            # Default tickers if none provided
            if tickers is None:
                tickers = ['INFY', 'TCS', 'WIPRO', 'HCLTECH', 'TECHM']
            
            # Set random seed for reproducibility
            np.random.seed(42)
            
            # Generate sample portfolios
            num_portfolios = 100
            all_portfolios = []
            
            for _ in range(num_portfolios):
                # Random selection of assets
                selection = np.random.randint(0, 2, size=len(tickers)).tolist()
                assets = [tickers[i] for i, s in enumerate(selection) if s == 1]
                
                # Skip empty portfolios
                if not assets:
                    continue
                
                # Random weights
                weights = np.random.uniform(0, 1, size=len(assets))
                weights = weights / weights.sum()
                
                # Random financial metrics
                expected_return = np.random.uniform(0.05, 0.25)  # 5-25%
                risk = np.random.uniform(0.08, 0.40)            # 8-40%
                # Calculate Sharpe ratio with safeguard against division by zero or very small risk
                if risk < 1e-8:  # Use a small threshold
                    sharpe = 0.0 if expected_return <= 0.02 else 1000.0  # Cap at a large finite value
                else:
                    sharpe = (expected_return - 0.02) / risk         # Assuming 2% risk-free rate
                cost = np.random.uniform(80000, 120000)         # ₹80k-120k
                qubo_value = np.random.uniform(-10, 0)          # Negative values (minimization)
                
                # Create portfolio
                portfolio = {
                    'selection': selection,
                    'assets': assets,
                    'weights': weights.tolist(),
                    'return': float(expected_return),
                    'risk': float(risk),
                    'sharpe': min(float(sharpe), 1000.0),  # Cap sharpe ratio to avoid Infinity
                    'cost': float(cost),
                    'qubo_value': float(qubo_value)
                }
                
                all_portfolios.append(portfolio)
            
            # Sort portfolios by Sharpe ratio (descending)
            all_portfolios.sort(key=lambda p: p['sharpe'], reverse=True)
            
            # Select top portfolios
            top_portfolios = all_portfolios[:5]
            
            # Separate QAOA and classical portfolios
            qaoa_portfolios = all_portfolios[:20]  # Pretend first 20 are from QAOA
            classical_portfolios = [{
                'selection': p['selection'],
                'assets': p['assets'],
                'weights': p['weights'],
                'return': p['return'],
                'risk': p['risk'],
                'sharpe': min(float(p['sharpe']), 1000.0),  # Cap sharpe ratio to avoid Infinity
                'cost': p['cost'],
                'qubo_value': p['qubo_value']
            } for p in all_portfolios[20:]]  # Rest are classical
            
            # Create optimization result
            optimization_result = {
                'all_evaluated_portfolios': all_portfolios,
                'qaoa_portfolios': qaoa_portfolios,
                'classical_portfolios': classical_portfolios,
                'top_portfolios': top_portfolios
            }
            
            logger.info(f"Generated sample optimization result with {len(all_portfolios)} portfolios")
            return optimization_result
        
        except Exception as e:
            logger.error(f"Error generating sample optimization result: {str(e)}")
            raise


# Example usage
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Create sample data generator
    generator = SampleDataGenerator()
    
    # Generate sample stock data
    generator.generate_sample_data()
    
    # Generate sample optimization result
    result = generator.generate_sample_optimization_result()
    print(f"Generated {len(result['all_evaluated_portfolios'])} sample portfolios")