import os
import pandas as pd
import numpy as np
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any

logger = logging.getLogger(__name__)

class DataManager:
    """Handles data loading, parsing, and financial metrics calculation"""
    
    def __init__(self, data_dir: str = 'backend/data'):
        """Initialize the DataManager with the data directory path"""
        self.data_dir = data_dir
        logger.info(f"DataManager initialized with data directory: {data_dir}")
    
    def get_available_stocks(self) -> List[str]:
        """Get list of available stock tickers from CSV files in the data directory"""
        try:
            # Check if data directory exists
            if not os.path.exists(self.data_dir):
                logger.warning(f"Data directory {self.data_dir} does not exist")
                return []
            
            # Get all CSV files in the data directory
            csv_files = [f for f in os.listdir(self.data_dir) if f.endswith('.csv')]
            
            # Extract ticker symbols from filenames
            tickers = [os.path.splitext(f)[0] for f in csv_files]
            
            logger.info(f"Found {len(tickers)} available stocks")
            return tickers
        except Exception as e:
            logger.error(f"Error getting available stocks: {str(e)}")
            return []
    
    def load_stock_data(self, tickers: List[str]) -> Dict[str, pd.DataFrame]:
        """Load stock data for the specified tickers from CSV files"""
        stock_data = {}
        valid_tickers = []
        
        for ticker in tickers:
            try:
                # Construct file path
                file_path = os.path.join(self.data_dir, f"{ticker}.csv")
                
                # Check if file exists
                if not os.path.exists(file_path):
                    logger.warning(f"CSV file for {ticker} not found at {file_path}")
                    continue
                
                # Read CSV file with specific parsing for date and numeric values
                df = pd.read_csv(
                    file_path,
                    parse_dates=['Date '],  # Space in column name
                    dayfirst=True,  # Format is DD-MM-YYYY
                    thousands=',',  # Handle comma as thousands separator
                )
                
                # Clean and validate data
                df = self._clean_stock_data(df, ticker)
                
                # Check if we have sufficient data
                if len(df) < 60:  # Minimum 60 trading days required
                    logger.warning(f"Insufficient data for {ticker}: only {len(df)} days available")
                    continue
                
                # Add to stock data dictionary
                stock_data[ticker] = df
                valid_tickers.append(ticker)
                
                logger.info(f"Successfully loaded data for {ticker} with {len(df)} days")
            except Exception as e:
                logger.error(f"Error loading data for {ticker}: {str(e)}")
        
        logger.info(f"Successfully loaded data for {len(valid_tickers)} out of {len(tickers)} tickers")
        return stock_data
    
    def _clean_stock_data(self, df: pd.DataFrame, ticker: str) -> pd.DataFrame:
        """Clean and standardize stock data"""
        try:
            # Make a copy to avoid modifying the original dataframe
            df = df.copy()
            
            # Standardize column names (handle variations and strip whitespace)
            # First strip whitespace from column names
            df.columns = [col.strip() for col in df.columns]
            
            # Then apply standard mapping
            column_mapping = {
                'date': 'Date',
                'Date': 'Date',
                'close': 'Close',
                'Close': 'Close',
                'adj close': 'Close',
                'Adj Close': 'Close'
            }
            
            # Rename columns based on mapping
            df.rename(columns={col: column_mapping[col.lower()] for col in df.columns 
                              if col.lower() in column_mapping}, inplace=True)
            
            # Ensure required columns exist
            required_columns = ['Date', 'Close']
            for col in required_columns:
                if col not in df.columns:
                    raise ValueError(f"Required column '{col}' not found in data for {ticker}")
            
            # Convert Date column to datetime, handling DD-MM-YYYY format
            try:
                # First try automatic parsing
                df['Date'] = pd.to_datetime(df['Date'])
            except Exception:
                # If automatic parsing fails, try with explicit format for DD-MM-YYYY
                df['Date'] = pd.to_datetime(df['Date'], format='%d-%m-%Y', errors='coerce')
            
            # Convert Close to numeric, handling any non-numeric values
            df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
            
            # Drop rows with missing values
            df.dropna(subset=['Close'], inplace=True)
            
            # Sort by date (ascending)
            df.sort_values('Date', inplace=True)
            
            # Reset index
            df.reset_index(drop=True, inplace=True)
            
            return df
        except Exception as e:
            logger.error(f"Error cleaning data for {ticker}: {str(e)}")
            raise
    
    def compute_financial_metrics(self, stock_data: Dict[str, pd.DataFrame]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Compute expected returns, covariance matrix, and latest prices"""
        try:
            # Extract tickers
            tickers = list(stock_data.keys())
            n_assets = len(tickers)
            
            if n_assets == 0:
                raise ValueError("No valid stock data provided")
            
            # Calculate daily returns for each stock
            returns_dict = {}
            for ticker, df in stock_data.items():
                # Calculate daily returns: (Close[t] - Close[t-1]) / Close[t-1]
                daily_returns = df['Close'].pct_change().dropna()
                returns_dict[ticker] = daily_returns
            
            # Create a DataFrame with all returns aligned by date
            returns_df = pd.DataFrame(returns_dict)
            
            # Calculate annualized expected returns (mean daily return × 252)
            expected_returns = returns_df.mean() * 252
            
            # Calculate annualized covariance matrix (covariance of returns × 252)
            cov_matrix = returns_df.cov() * 252
            
            # Get latest prices
            latest_prices = np.array([stock_data[ticker]['Close'].iloc[-1] for ticker in tickers])
            
            # Convert to numpy arrays
            expected_returns_array = expected_returns.values
            cov_matrix_array = cov_matrix.values
            
            logger.info(f"Computed financial metrics for {n_assets} assets")
            return expected_returns_array, cov_matrix_array, latest_prices
        except Exception as e:
            logger.error(f"Error computing financial metrics: {str(e)}")
            raise
    
    def get_historical_prices(self, stock_data: Dict[str, pd.DataFrame], lookback_days: int = 252) -> Dict[str, pd.DataFrame]:
        """Get historical prices for backtesting"""
        try:
            historical_data = {}
            
            for ticker, df in stock_data.items():
                # Get the last lookback_days days of data
                historical = df.tail(lookback_days).copy()
                historical_data[ticker] = historical
            
            return historical_data
        except Exception as e:
            logger.error(f"Error getting historical prices: {str(e)}")
            raise