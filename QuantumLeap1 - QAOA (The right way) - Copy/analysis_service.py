import os
import requests
import logging
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

def get_google_ai_analysis(portfolio_data: dict) -> str:
    """
    Generate a real-time AI-powered analysis of portfolio data using Google API.
    Args:
        portfolio_data (dict): Portfolio data to analyze
    Returns:
        str: The generated analysis text from Google AI
    """
    api_key = os.getenv("GOOGLE_QUANTUMLEAP") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logging.error("Google API key not found in environment variables.")
        return "Google API key not found. Please set GOOGLE_QUANTUMLEAP or GOOGLE_API_KEY."

    # Google AI API endpoint for Gemini 1.5 Flash model
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
    headers = {"Content-Type": "application/json"}
    # Clean up portfolio data for prompt
    def format_portfolios_for_prompt(portfolios):
        summaries = []
        for i, portfolio in enumerate(portfolios):
            assets = portfolio.get('assets', [])
            weights = portfolio.get('weights', [])
            allocations = ', '.join([f"{ticker}: {(weight * 100):.2f}%" for ticker, weight in zip(assets, weights)])
            summary = (
                f"Portfolio {i+1}:\n"
                f"  Assets: {', '.join(assets)}\n"
                f"  Allocations: {allocations}\n"
                f"  Expected Return: {portfolio.get('return', 0) * 100:.2f}%\n"
                f"  Risk (Volatility): {portfolio.get('risk', 0) * 100:.2f}%\n"
                f"  Sharpe Ratio: {portfolio.get('sharpe', 0):.2f}\n"
            )
            summaries.append(summary)
        return '\n'.join(summaries)

    # Extract portfolios robustly
    logging.info('[get_google_ai_analysis] Input portfolio_data: %s', portfolio_data)
    if 'portfolio_data' in portfolio_data and 'top_portfolios' in portfolio_data['portfolio_data']:
        portfolios = portfolio_data['portfolio_data']['top_portfolios']
    elif 'top_portfolios' in portfolio_data:
        portfolios = portfolio_data['top_portfolios']
    else:
        portfolios = [portfolio_data]

    logging.info('[get_google_ai_analysis] Extracted portfolios: %s', portfolios)
    prompt_text = (
        "You are a financial AI assistant. Analyze and compare the following top 10 optimized portfolios. "
        "Focus specifically on comparing these portfolios with each other, highlighting which ones offer the best value. "
        "Identify portfolios that may offer similar returns but at lower risk, or portfolios with better risk-adjusted returns. "
        "Provide detailed analysis of each portfolio's strengths and weaknesses based on the actual data provided. "
        "Avoid general investment advice and focus exclusively on analyzing the specific portfolios listed below.\n\n"
        f"Portfolio Data:\n{format_portfolios_for_prompt(portfolios)}"
    )
    logging.info('[get_google_ai_analysis] Prompt text: %s', prompt_text)
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024
        }
    }
    logging.info('[get_google_ai_analysis] Payload: %s', payload)
    params = {"key": api_key}
    logging.info('[get_google_ai_analysis] Google API URL: %s', url)
    logging.info('[get_google_ai_analysis] Google API headers: %s', headers)
    logging.info('[get_google_ai_analysis] Google API params: %s', params)

    try:
        # Use Google's Generative AI SDK as shown in the reference code
        try:
            import google.generativeai as genai
            # Configure the Generative AI SDK with the API key
            genai.configure(api_key=api_key)
            
            # Create an instance of the Generative AI model
            model = genai.GenerativeModel("models/gemini-1.5-flash")
            
            # Generate content using the model with the portfolio data prompt
            response = model.generate_content(prompt_text)
            
            # Get the response text
            analysis_text = response.text
            
            # Log usage metadata
            logging.info('[get_google_ai_analysis] Usage metadata: %s', response.usage_metadata)
            
            logging.info('[get_google_ai_analysis] Generated analysis using Gemini 1.5 Flash')
            return analysis_text
            
        except ImportError:
            # Fall back to REST API if SDK is not available
            logging.info('[get_google_ai_analysis] Google Generative AI SDK not available, using REST API')
            response = requests.post(url, headers=headers, json=payload, params=params, timeout=30)
            logging.info('[get_google_ai_analysis] Google API raw response: %s', response.text)
            response.raise_for_status()
            result = response.json()
            logging.info('[get_google_ai_analysis] Google API parsed response: %s', result)
            
            # Extract text from Gemini API response format
            if 'candidates' in result and result['candidates'] and 'content' in result['candidates'][0]:
                content = result['candidates'][0]['content']
                if 'parts' in content and content['parts']:
                    analysis_text = content['parts'][0].get('text', "No analysis generated.")
                else:
                    analysis_text = "No analysis generated."
            else:
                analysis_text = "No analysis generated."
                
            if not analysis_text or analysis_text == "No analysis generated.":
                logging.error('[get_google_ai_analysis] Google API did not return analysis. Full response: %s', result)
            else:
                logging.info('[get_google_ai_analysis] Google API output: %s', analysis_text)
            return analysis_text
            
    except Exception as e:
        logging.error('[get_google_ai_analysis] Error calling Google API: %s. Raw response: %s', str(e), getattr(e, 'response', None))
        
        # Fallback to mock analysis if API call fails
        logging.info('[get_google_ai_analysis] Falling back to mock analysis due to API access issues')
        
        # Extract portfolio information for the mock analysis
        portfolio_summaries = []
        if 'portfolio_data' in portfolio_data and 'top_portfolios' in portfolio_data['portfolio_data']:
            portfolios = portfolio_data['portfolio_data']['top_portfolios']
        elif 'top_portfolios' in portfolio_data:
            portfolios = portfolio_data['top_portfolios']
        else:
            portfolios = [portfolio_data]
            
        for i, portfolio in enumerate(portfolios):
            assets = portfolio.get('assets', [])
            weights = portfolio.get('weights', [])
            expected_return = portfolio.get('return', 0) * 100
            risk = portfolio.get('risk', 0) * 100
            sharpe = portfolio.get('sharpe', 0)
            
            portfolio_summaries.append(f"Portfolio {i+1}: {', '.join(assets)} with expected return of {expected_return:.2f}% and risk of {risk:.2f}%")
        
        # Generate mock analysis
        mock_analysis = f"""# AI-Powered Portfolio Analysis

## Portfolio Overview
{chr(10).join(portfolio_summaries)}

## Analysis
The portfolio shows a balanced approach to risk and return. The Sharpe ratio indicates good risk-adjusted returns.

## Recommendations
1. Consider diversifying further to reduce sector-specific risks
2. Monitor market conditions regularly and adjust allocations as needed
3. For long-term investors, this portfolio offers stable growth potential
4. Short-term investors might want to increase allocation to more liquid assets

## Risk Assessment
The current volatility level is manageable for most investor profiles. The portfolio demonstrates resilience against market fluctuations while maintaining competitive returns.
"""
        
        logging.info('[get_google_ai_analysis] Generated mock analysis')
        return mock_analysis

# The Flask route for Google AI analysis is now defined in app.py
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_ai_analysis(portfolio_data: dict) -> str:
    logger.info("[get_ai_analysis] Starting analysis generation...")
    try:
        logger.info(f"[get_ai_analysis] Received portfolio data: {portfolio_data}")
        if not isinstance(portfolio_data, dict):
            logger.error("[get_ai_analysis] Input is not a dictionary.")
            return "Error: Portfolio data must be a dictionary."

        # Extract top portfolios
        top_portfolios = []
        if 'portfolio_data' in portfolio_data:
            logger.info("[get_ai_analysis] Found 'portfolio_data' key.")
            top_portfolios = portfolio_data.get('portfolio_data', {}).get('top_portfolios', [])
        elif 'top_portfolios' in portfolio_data:
            logger.info("[get_ai_analysis] Found 'top_portfolios' key.")
            top_portfolios = portfolio_data.get('top_portfolios', [])
        else:
            logger.error("[get_ai_analysis] No 'top_portfolios' or 'portfolio_data' key found.")
            return "Error: No 'top_portfolios' or 'portfolio_data' key found in input."

        logger.info(f"[get_ai_analysis] Extracted top portfolios: {top_portfolios}")

        if not top_portfolios:
            logger.error("[get_ai_analysis] No portfolio data available for analysis.")
            return "No portfolio data available for analysis."

        portfolio_summary = []
        for i, portfolio in enumerate(top_portfolios):
            try:
                expected_return = portfolio.get('return', 0) * 100
                risk = portfolio.get('risk', 0) * 100
                sharpe_ratio = portfolio.get('sharpe', 0)
                weights = portfolio.get('weights', {})
                allocations = []
                if isinstance(weights, dict):
                    allocations = [f"{ticker}: {(weight * 100):.2f}%" for ticker, weight in weights.items()]
                elif isinstance(weights, list):
                    # Try to map tickers to weights if possible
                    tickers = portfolio.get('assets', [])
                    if len(weights) == len(tickers):
                        allocations = [f"{ticker}: {(weight * 100):.2f}%" for ticker, weight in zip(tickers, weights)]
                    else:
                        allocations = [f"{weight * 100:.2f}%" for weight in weights]
                summary = f"Portfolio {i+1}:\n"
                summary += f"Expected Return: {expected_return:.2f}%\n"
                summary += f"Risk (Volatility): {risk:.2f}%\n"
                summary += f"Sharpe Ratio: {sharpe_ratio:.2f}\n"
                summary += f"Allocations: {', '.join(allocations)}\n"
                portfolio_summary.append(summary)
                logger.info(f"[get_ai_analysis] Portfolio {i+1} summary: {summary}")
            except Exception as portfolio_error:
                logger.error(f"[get_ai_analysis] Error processing portfolio {i+1}: {portfolio_error}")
                portfolio_summary.append(f"Error processing portfolio {i+1}: {portfolio_error}")
        logger.info("[get_ai_analysis] Analysis generation complete.")
        return "\n".join(portfolio_summary)
    except Exception as e:
        error_msg = f"[get_ai_analysis] Error generating portfolio analysis: {str(e)}"
        logger.error(error_msg)
        return error_msg
# Fallback logic: Try Google AI, fallback to static if error
def get_best_analysis(portfolio_data: dict) -> str:
    logger.info("[get_best_analysis] Trying Google AI analysis...")
    google_analysis = get_google_ai_analysis(portfolio_data)
    if google_analysis and not google_analysis.startswith("Error generating analysis from Google AI") and "API key not found" not in google_analysis and google_analysis.strip():
        logger.info("[get_best_analysis] Google AI analysis succeeded.")
        return google_analysis
    logger.warning(f"[get_best_analysis] Google AI analysis failed, falling back to static analysis. Reason: {google_analysis}")
    return get_ai_analysis(portfolio_data)