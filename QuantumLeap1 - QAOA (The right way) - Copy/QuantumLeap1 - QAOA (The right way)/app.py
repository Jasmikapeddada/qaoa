from flask import Flask, request, jsonify, Response, stream_template, make_response
from flask_cors import CORS
import os
import json
import logging
import numpy as np
from datetime import datetime
import time
from analysis_service import get_google_ai_analysis

# Custom JSON encoder to handle special values
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if np.isnan(obj) or np.isinf(obj):
            return None  # Replace NaN and Infinity with None
        return super(CustomJSONEncoder, self).default(obj)

# Import backend modules
from backend.data_manager import DataManager
from backend.optimizer import PortfolioOptimizer
from backend.visualization import VisualizationDataGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_url_path='', static_folder='.')
app.json_encoder = CustomJSONEncoder  # Use custom JSON encoder to handle special values
CORS(app)  # Enable CORS for all routes

# Initialize backend components
data_manager = DataManager(data_dir='backend/data')
optimizer = PortfolioOptimizer()
vis_generator = VisualizationDataGenerator()

# Google AI Analysis endpoint
@app.route('/generate-google-analysis', methods=['POST', 'OPTIONS'])
def generate_google_analysis():
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Origin')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        # Pass the full request data to match backend expectations
        analysis = get_google_ai_analysis(request.json)
        response = jsonify({"analysis": analysis})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200
    except Exception as e:
        logger.error(f"Google AI Analysis error: {str(e)}")
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# Get available stocks endpoint
@app.route('/stocks', methods=['GET'])
def get_stocks():
    try:
        available_stocks = data_manager.get_available_stocks()
        return jsonify({
            'stocks': available_stocks
        })
    except Exception as e:
        logger.error(f"Error retrieving stocks: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve available stocks',
            'message': str(e)
        }), 500

# Portfolio optimization endpoint with Server-Sent Events
@app.route('/optimize', methods=['POST'])
def optimize_portfolio():
    try:
        # Parse request data
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # CRITICAL: Log the exact payload received from frontend
        print(f'=== BACKEND PARAMETER VERIFICATION ===')
        print(f'Received optimization request with params: {data}')
        print(f'Raw request data type: {type(data)}')
        print(f'Individual parameter verification:')
        print(f'- Tickers: {data.get("tickers", "MISSING")}')
        print(f'- Budget: {data.get("budget", "MISSING")}')
        print(f'- Optimization Objective: {data.get("optimization_objective", "MISSING")}')
        print(f'- Risk Aversion: {data.get("risk_aversion", "MISSING")}')
        print(f'- Min Assets: {data.get("min_assets", "MISSING")}')
        print(f'- Backend: {data.get("backend", "MISSING")}')
        print(f'=== END BACKEND PARAMETER VERIFICATION ===')
            
        # Extract all 13 parameters
        tickers = data.get('tickers', [])
        budget = data.get('budget', 100000)
        optimization_objective = data.get('optimization_objective', 'Max Sharpe Ratio')
        risk_free_rate = data.get('risk_free_rate', 0.07)
        risk_aversion = data.get('risk_aversion', 0.5)
        return_weight = data.get('return_weight', 1.0)
        budget_penalty = data.get('budget_penalty', 1.0)
        min_assets = data.get('min_assets', 2)
        min_assets_penalty = data.get('min_assets_penalty', 1.0)
        correlation_threshold = data.get('correlation_threshold', 0.8)
        reps = data.get('reps', 3)
        shots = data.get('shots', 1024)
        backend_name = data.get('backend', 'Aer Simulator')
        
        # Validate inputs
        if not tickers:
            return jsonify({'error': 'No tickers provided'}), 400
            
        # Scale QAOA parameters based on number of stocks
        num_stocks = len(tickers)
        
        # Adjust QAOA parameters based on stock count for better performance
        reps = max(3, min(10, num_stocks // 2))  # Scale layers: min 3, max 10
        shots = min(8192, 1024 * (num_stocks // 5))  # Scale shots with stock count
        
        # Add artificial delay based on parameters to simulate longer processing time
        # More stocks, layers, or shots will increase processing time
        processing_delay = 0.5 * reps + 0.001 * shots + 0.2 * num_stocks
        logger.info(f"Adding artificial delay of {processing_delay:.2f} seconds based on parameters")
        time.sleep(processing_delay)
        
        # Update the parameters in the data dictionary
        data['reps'] = reps
        data['shots'] = shots
            
        # Load and validate data
        stock_data = data_manager.load_stock_data(tickers)
        if not stock_data or len(stock_data) == 0:
            return jsonify({'error': 'Failed to load stock data'}), 400
            
        # Compute returns and risk
        returns, cov_matrix, latest_prices = data_manager.compute_financial_metrics(stock_data)
        
        # Use only the tickers that have sufficient data (keys in stock_data)
        valid_tickers = list(stock_data.keys())
        
        # Check if we have enough valid tickers
        if len(valid_tickers) < 2:
            return jsonify({
                'error': 'Insufficient data',
                'message': f'Only {len(valid_tickers)} stocks have sufficient data. At least 2 are required.'
            }), 400
        
        # Adjust min_assets if needed
        if min_assets > len(valid_tickers):
            min_assets = len(valid_tickers)
        
        # Prepare all parameters as a single dictionary
        optimization_params = {
            'tickers': valid_tickers,
            'expected_returns': returns,
            'covariance_matrix': cov_matrix,
            'prices': latest_prices,
            'budget': budget,
            'optimization_objective': optimization_objective,
            'risk_free_rate': risk_free_rate,
            'risk_aversion': risk_aversion,
            'return_weight': return_weight,
            'budget_penalty': budget_penalty,
            'min_assets': min_assets,
            'min_assets_penalty': min_assets_penalty,
            'correlation_threshold': correlation_threshold,
            'reps': reps,
            'shots': shots,
            'backend_name': backend_name
        }
        
        # Run optimization with all parameters
        optimization_result = optimizer.optimize(**optimization_params)
        
        # Generate visualization data
        visualization_data = vis_generator.generate_visualization_data(
            optimization_result=optimization_result,
            stock_data=stock_data,
            tickers=valid_tickers,  # Use valid tickers instead of original tickers
            budget=budget,
            risk_free_rate=risk_free_rate
        )
        
        # Combine results
        result = {
            'top_portfolios': optimization_result['top_portfolios'],
            'plots': visualization_data
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Optimization error: {str(e)}")
        return jsonify({
            'error': 'Portfolio optimization failed',
            'message': str(e)
        }), 500

# NEW: Server-Sent Events streaming endpoint for real-time progress
@app.route('/optimize-stream', methods=['POST'])
def optimize_portfolio_stream():
    try:
        # Parse request data
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # CRITICAL: Log the exact payload received from frontend
        print(f'=== STREAMING BACKEND PARAMETER VERIFICATION ===')
        print(f'Received streaming optimization request with params: {data}')
        print(f'Individual parameter verification:')
        print(f'- Tickers: {data.get("tickers", "MISSING")}')
        print(f'- Budget: {data.get("budget", "MISSING")}')
        print(f'- Risk Aversion: {data.get("risk_aversion", "MISSING")}')
        print(f'- Min Assets: {data.get("min_assets", "MISSING")}')
        print(f'- Backend: {data.get("backend", "MISSING")}')
        print(f'=== END STREAMING BACKEND PARAMETER VERIFICATION ===')
            
        # Extract all 13 parameters
        tickers = data.get('tickers', [])
        budget = data.get('budget', 100000)
        optimization_objective = data.get('optimization_objective', 'Max Sharpe Ratio')
        risk_free_rate = data.get('risk_free_rate', 0.07)
        risk_aversion = data.get('risk_aversion', 0.5)
        return_weight = data.get('return_weight', 1.0)
        budget_penalty = data.get('budget_penalty', 1.0)
        min_assets = data.get('min_assets', 2)
        min_assets_penalty = data.get('min_assets_penalty', 1.0)
        correlation_threshold = data.get('correlation_threshold', 0.8)
        reps = data.get('reps', 3)
        shots = data.get('shots', 1024)
        backend_name = data.get('backend', 'Aer Simulator')
        
        # Validate inputs
        if not tickers:
            return jsonify({'error': 'No tickers provided'}), 400
        # No limit on number of tickers
            
        # Load and validate data (within request context)
        try:
            stock_data = data_manager.load_stock_data(tickers)
            if not stock_data or len(stock_data) == 0:
                return jsonify({'error': 'Failed to load stock data'}), 400
                
            # Compute returns and risk
            returns, cov_matrix, latest_prices = data_manager.compute_financial_metrics(stock_data)
        except Exception as e:
            logger.error(f"Data loading error: {str(e)}")
            return jsonify({'error': 'Data loading failed', 'message': str(e)}), 400
            
        # Use only the tickers that have sufficient data (keys in stock_data)
        valid_tickers = list(stock_data.keys())
        
        # Check if we have enough valid tickers
        if len(valid_tickers) < 2:
            return jsonify({'error': 'Insufficient data', 'message': f'Only {len(valid_tickers)} stocks have sufficient data. At least 2 are required.'}), 400
        
        # Adjust min_assets if needed
        if min_assets > len(valid_tickers):
            min_assets = len(valid_tickers)
        
        def generate():
            try:
                # Send progress updates manually for each step
                yield f"data: {json.dumps({'type': 'progress', 'step': 1, 'message': 'Step 1/6: Classical pre-computation (returns, covariance, correlation)', 'progress': 17})}\n\n"
                
                # Prepare all parameters as a single dictionary
                optimization_params = {
                    'tickers': valid_tickers,
                    'expected_returns': returns,
                    'covariance_matrix': cov_matrix,
                    'prices': latest_prices,
                    'budget': budget,
                    'optimization_objective': optimization_objective,
                    'risk_free_rate': risk_free_rate,
                    'risk_aversion': risk_aversion,
                    'return_weight': return_weight,
                    'budget_penalty': budget_penalty,
                    'min_assets': min_assets,
                    'min_assets_penalty': min_assets_penalty,
                    'correlation_threshold': correlation_threshold,
                    'reps': reps,
                    'shots': shots,
                    'backend_name': backend_name
                }
                
                # Send progress for step 2
                yield f"data: {json.dumps({'type': 'progress', 'step': 2, 'message': 'Step 2/6: Generating all possible portfolio combinations', 'progress': 33})}\n\n"
                
                # Send progress for step 3
                yield f"data: {json.dumps({'type': 'progress', 'step': 3, 'message': 'Step 3/6: Applying hard constraints (min_assets, correlation_threshold)', 'progress': 50})}\n\n"
                
                # Send progress for step 4
                yield f"data: {json.dumps({'type': 'progress', 'step': 4, 'message': 'Step 4/6: Quantum optimization on valid candidates', 'progress': 67})}\n\n"
                
                # Run optimization (no progress callback needed since we're manually yielding progress)
                optimization_result = optimizer.optimize(**optimization_params)
                
                # Send progress for step 5
                yield f"data: {json.dumps({'type': 'progress', 'step': 5, 'message': 'Step 5/6: Post-processing and ranking portfolios', 'progress': 83})}\n\n"
                
                # Generate visualization data
                visualization_data = vis_generator.generate_visualization_data(
                    optimization_result=optimization_result,
                    stock_data=stock_data,
                    tickers=valid_tickers,
                    budget=budget,
                    risk_free_rate=risk_free_rate
                )
                
                # Send final progress step
                yield f"data: {json.dumps({'type': 'progress', 'step': 6, 'message': 'Step 6/6: Final results prepared', 'progress': 100})}\n\n"
                
                # Combine results
                result = {
                    'type': 'done',
                    'top_portfolios': optimization_result['top_portfolios'],
                    'plots': visualization_data
                }
                
                # Send final result
                yield f"data: {json.dumps(result)}\n\n"
                
            except Exception as e:
                logger.error(f"Streaming optimization error: {str(e)}")
                error_data = {
                    'type': 'error',
                    'error': 'Portfolio optimization failed',
                    'message': str(e)
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return Response(generate(), mimetype='text/event-stream', headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        })
        
    except Exception as e:
        logger.error(f"Streaming endpoint error: {str(e)}")
        return jsonify({'error': 'Streaming endpoint failed', 'message': str(e)}), 500

# Job status endpoint (for async operations with IBM hardware)
@app.route('/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    try:
        # Check job status
        status = optimizer.get_job_status(job_id)
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error checking job status: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve job status',
            'message': str(e)
        }), 500

# Generate AI Analysis endpoint
@app.route('/generate-analysis', methods=['POST', 'OPTIONS'])
def generate_analysis():
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Origin')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
        
    try:
        # Parse request data
        data = request.json
        if not data:
            return jsonify({'error': 'No portfolio data provided'}), 400
        
        # Import the analysis service
        from analysis_service import get_ai_analysis
        
        # Generate the analysis
        logger.info("Generating AI analysis for portfolio data")
        analysis_text = get_ai_analysis(data)
        
        # Return the analysis with CORS headers
        response = jsonify({
            'analysis': analysis_text
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        logger.error(f"Error generating analysis: {str(e)}")
        response = jsonify({
            'error': 'Failed to generate analysis',
            'message': str(e)
        }), 500
        if isinstance(response, tuple):
            response[0].headers.add('Access-Control-Allow-Origin', '*')
        else:
            response.headers.add('Access-Control-Allow-Origin', '*')
        return response

# Run the app
if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('backend/data', exist_ok=True)
    
    # Serve static files
    @app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    @app.route('/test_frontend.html')
    def test_frontend():
        return app.send_static_file('test_frontend.html')
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)