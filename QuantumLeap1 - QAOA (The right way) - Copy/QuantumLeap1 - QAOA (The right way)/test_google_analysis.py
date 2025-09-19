import requests
import json
import webbrowser
import os
import time

# Sample portfolio data
portfolio_data = {
    'portfolio_data': {
        'top_portfolios': [
            {
                'assets': ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'],
                'weights': [0.25, 0.25, 0.25, 0.25],
                'return': 0.15,
                'risk': 0.10,
                'sharpe': 1.2
            },
            {
                'assets': ['APOLLOHOSP', 'BHARTIARTL', 'BOSCHLTD', 'CHOLAFIN'],
                'weights': [0.1468, 0.0361, 0.7897, 0.0274],
                'return': 0.2492,
                'risk': 0.2143,
                'sharpe': 0.84
            }
        ]
    }
}

# Send request to the API
print("Sending request to Google AI Analysis API...")
response = requests.post(
    'http://127.0.0.1:5000/generate-google-analysis',
    json=portfolio_data,
    headers={'Content-Type': 'application/json'}
)

# Check if the request was successful
if response.status_code == 200:
    print(f"Request successful! Status code: {response.status_code}")
    
    # Parse the response
    data = response.json()
    
    # Save the analysis to an HTML file for viewing
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google AI Analysis Result</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }}
            h1, h2, h3 {{ color: #3b82f6; }}
            pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }}
        </style>
    </head>
    <body>
        <h1>Google AI Analysis Result</h1>
        <h2>Response Status: {response.status_code}</h2>
        <h3>Analysis:</h3>
        <div style="white-space: pre-wrap;">{data.get('analysis', 'No analysis found')}</div>
    </body>
    </html>
    """
    
    # Write the HTML file
    result_file = os.path.join(os.getcwd(), "google_analysis_result.html")
    with open(result_file, "w") as f:
        f.write(html_content)
    
    print(f"\nAnalysis saved to {result_file}")
    print("Opening result in browser...")
    
    # Open the HTML file in the default browser
    webbrowser.open(f"file://{result_file}")
    
    # Also print the raw analysis text
    print("\nRaw Analysis Text:")
    print(data.get('analysis', 'No analysis found'))
    
    # Check if the analysis is empty or very short
    analysis = data.get('analysis', '')
    if not analysis or len(analysis) < 50:
        print("\nWARNING: The analysis appears to be empty or very short. This might indicate a problem.")
        print("Full response data:")
        print(json.dumps(data, indent=2))
else:
    print(f"Request failed! Status code: {response.status_code}")
    print("Response content:")
    print(response.text)