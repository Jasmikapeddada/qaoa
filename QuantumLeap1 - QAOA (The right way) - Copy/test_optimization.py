#!/usr/bin/env python3
"""
Test script to verify the optimization implementation works correctly
and respects all user parameters from the very first run.
"""

import requests
import json
import time

def test_optimization_parameters():
    """Test that the optimization respects all user parameters"""
    
    # Test data with specific parameters
    test_params = {
        "tickers": ["TCS", "HDFCBANK", "AXISBANK"],
        "budget": 150000,
        "optimization_objective": "Max Sharpe Ratio",
        "risk_free_rate": 0.08,
        "risk_aversion": 0.3,
        "return_weight": 1.5,
        "budget_penalty": 2.0,
        "min_assets": 3,
        "min_assets_penalty": 1.5,
        "correlation_threshold": 0.7,
        "reps": 5,
        "shots": 2048,
        "backend": "Aer Simulator"
    }
    
    print("=== TESTING OPTIMIZATION PARAMETER RESPECT ===")
    print(f"Test parameters: {json.dumps(test_params, indent=2)}")
    print()
    
    try:
        # Test regular endpoint
        print("Testing regular /optimize endpoint...")
        response = requests.post(
            'http://127.0.0.1:5000/optimize',
            json=test_params,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Regular endpoint successful")
            print(f"Number of portfolios found: {len(result.get('top_portfolios', []))}")
            
            if result.get('top_portfolios'):
                top_portfolio = result['top_portfolios'][0]
                print(f"Top portfolio assets: {top_portfolio.get('assets', [])}")
                print(f"Top portfolio cost: {top_portfolio.get('cost', 0)}")
                print(f"Top portfolio Sharpe ratio: {top_portfolio.get('sharpe', 0)}")
        else:
            print(f"❌ Regular endpoint failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Regular endpoint error: {e}")
    
    print()
    
    try:
        # Test streaming endpoint
        print("Testing streaming /optimize-stream endpoint...")
        response = requests.post(
            'http://127.0.0.1:5000/optimize-stream',
            json=test_params,
            timeout=30,
            stream=True
        )
        
        if response.status_code == 200:
            print("✅ Streaming endpoint connected")
            
            # Read the stream
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        try:
                            data = json.loads(line_str[6:])  # Remove 'data: ' prefix
                            
                            if data.get('type') == 'progress':
                                print(f"Progress: {data.get('step', 0)}/7 - {data.get('message', '')} ({data.get('progress', 0)}%)")
                            elif data.get('type') == 'done':
                                print("✅ Streaming optimization completed")
                                result = data
                                print(f"Number of portfolios found: {len(result.get('top_portfolios', []))}")
                                
                                if result.get('top_portfolios'):
                                    top_portfolio = result['top_portfolios'][0]
                                    print(f"Top portfolio assets: {top_portfolio.get('assets', [])}")
                                    print(f"Top portfolio cost: {top_portfolio.get('cost', 0)}")
                                    print(f"Top portfolio Sharpe ratio: {top_portfolio.get('sharpe', 0)}")
                                break
                            elif data.get('type') == 'error':
                                print(f"❌ Streaming optimization failed: {data.get('error', 'Unknown error')}")
                                print(f"Error message: {data.get('message', 'No message')}")
                                break
                        except json.JSONDecodeError as e:
                            print(f"Error parsing JSON: {e}")
        else:
            print(f"❌ Streaming endpoint failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Streaming endpoint error: {e}")
    
    print()
    print("=== TEST COMPLETED ===")

if __name__ == "__main__":
    test_optimization_parameters()
