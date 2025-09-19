#!/usr/bin/env python

import os
import logging
from app import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main function to run the backend server"""
    try:
        # Create data directory if it doesn't exist
        os.makedirs('backend/data', exist_ok=True)
        
        # Log startup information
        logger.info("Starting QAOA Portfolio Optimization Backend Server")
        logger.info("Server will be available at http://localhost:5000")
        
        # Run the Flask app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        raise

if __name__ == '__main__':
    main()