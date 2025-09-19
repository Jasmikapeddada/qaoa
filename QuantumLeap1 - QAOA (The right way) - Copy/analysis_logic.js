// Google AI Analysis button integration is now handled in the main DOMContentLoaded event

function triggerGoogleAnalysis() {
  // Use the same portfolio data logic as the normal analysis
  if (!window.optimizationResult || !window.optimizationResult.top_portfolios) {
    alert('No portfolio data available. Please run optimization first.');
    return;
  }
  const dataToSend = {
    portfolio_data: {
      top_portfolios: window.optimizationResult.top_portfolios
    }
  };
  const button = document.querySelector('.ai-button.google-analysis');
  const originalButtonText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Google AI Analysis...';
  button.disabled = true;
  
  // Show the modal with loading state
  const modal = document.getElementById('analysis-modal');
  if (modal) {
    modal.classList.add('active');
    
    // Update the modal title for Google AI Analysis
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) modalTitle.textContent = 'Portfolio Analysis';
    
    // Show loading indicator
    const loadingElement = modal.querySelector('.analysis-loading');
    const errorElement = modal.querySelector('.analysis-error');
    const contentElement = modal.querySelector('.analysis-content');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (errorElement) errorElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'none';
  }

  console.log('Sending data for Google AI analysis:', dataToSend);

  fetch('http://127.0.0.1:5000/generate-google-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataToSend)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Received Google AI analysis:', data);
    updateAnalysisContent(data.analysis);
  })
  .catch(error => {
    console.error('Error generating Google AI analysis:', error);
    showAnalysisError(`Failed to generate Google AI analysis: ${error.message}`);
  })
  .finally(() => {
    const googleButton = document.querySelector('.ai-button.google-analysis');
    if (googleButton) {
      googleButton.innerHTML = originalButtonText;
      googleButton.disabled = false;
    }
  });
}
/**
 * Analysis Logic for QuantumLeap Portfolio Optimizer
 * 
 * This file contains the JavaScript code to handle the "Generate Analysis" button
 * functionality, making API calls to the backend and updating the UI with the results.
 */

// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Find the existing buttons and attach event listeners
    const regularAnalysisButton = document.querySelector('.ai-button.regular-analysis');
    const googleAnalysisButton = document.querySelector('.ai-button.google-analysis');
    
    if (regularAnalysisButton && googleAnalysisButton) {
        // Attach event listeners to the existing buttons
        regularAnalysisButton.addEventListener('click', triggerAnalysis);
        googleAnalysisButton.addEventListener('click', triggerGoogleAnalysis);
        
        console.log('Analysis buttons event listeners attached');
    } else {
        console.error('Analysis buttons not found');
    }
    
    // Add event listeners to close the modal
    const modal = document.getElementById('analysis-modal');
    if (modal) {
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                modal.classList.remove('active');
            });
        }
        
        // Close modal when clicking outside the content
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    } else {
        console.log('Modal not found in DOM, will be created dynamically if needed');
    }
}); 

/**
 * Main function to trigger the portfolio analysis
 * This is called when the Test Data button is clicked
 */
function triggerAnalysis() {
    // Check if optimization results are available
    if (!window.optimizationResult || !window.optimizationResult.top_portfolios) {
        alert('No portfolio data available. Please run optimization first.');
        return;
    }
    
    // Show the loading state
    const button = document.querySelector('.ai-button.regular-analysis');
    const originalButtonText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;
    
    // Show the modal with loading state
    const modal = document.getElementById('analysis-modal');
    if (modal) {
        modal.classList.add('active');
        
        // Show loading indicator
        const loadingElement = modal.querySelector('.analysis-loading');
        const errorElement = modal.querySelector('.analysis-error');
        const contentElement = modal.querySelector('.analysis-content');
        
        if (loadingElement) loadingElement.style.display = 'flex';
        if (errorElement) errorElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'none';
    }
    
    // Prepare the data to send to the backend
    const portfolioData = window.optimizationResult;
    
    // Check if optimization result exists
    if (!portfolioData) {
        showAnalysisError('No optimization results available. Please run optimization first.');
        return;
    }
    
    // For Test Data button, directly display the portfolio data without making an API call
    setTimeout(() => {
        try {
            // Create a formatted display of the portfolio data
            const portfolios = portfolioData.top_portfolios;
            console.log('Portfolio data for analysis:', portfolios);
            let formattedPortfolioData = '<h2>Portfolio Test Data</h2>';
            
            portfolios.forEach((portfolio, index) => {
                if (!portfolio) return;
                formattedPortfolioData += `<h3>Portfolio ${index + 1}</h3>`;
                
                // Handle expected return with proper null/NaN checking
                // Try both expected_return and return fields (backend uses 'return', frontend might expect 'expected_return')
                const expectedReturn = portfolio.expected_return || portfolio.return;
                let formattedExpectedReturn = 'N/A';
                if (expectedReturn !== undefined && expectedReturn !== null && !isNaN(parseFloat(expectedReturn))) {
                    // Always show the value even if it's zero
                    formattedExpectedReturn = `${(parseFloat(expectedReturn) * 100).toFixed(2)}%`;
                }
                formattedPortfolioData += `<p>Expected Return: ${formattedExpectedReturn}</p>`;
                
                // Handle risk with proper null/NaN checking
                const risk = portfolio.risk;
                formattedPortfolioData += `<p>Risk (Volatility): ${(risk !== undefined && risk !== null && !isNaN(parseFloat(risk))) ? parseFloat(risk).toFixed(2) : 'N/A'}%</p>`;
                
                // Handle sharpe ratio with proper null/NaN checking
                // Try both sharpe_ratio and sharpe fields (backend uses 'sharpe', frontend might expect 'sharpe_ratio')
                const sharpeRatio = portfolio.sharpe_ratio || portfolio.sharpe;
                let formattedSharpeRatio = 'N/A';
                if (sharpeRatio !== undefined && sharpeRatio !== null && !isNaN(parseFloat(sharpeRatio))) {
                    // Always show the value even if it's zero
                    formattedSharpeRatio = parseFloat(sharpeRatio).toFixed(2);
                }
                formattedPortfolioData += `<p>Sharpe Ratio: ${formattedSharpeRatio}</p>`;
                
                formattedPortfolioData += '<p>Allocations:</p><ul>';
                
                // Calculate total allocation to verify it sums to 100%
                let totalAllocation = 0; // This will track the sum of all allocations
                
                // Always prioritize using ticker names instead of indices
                if (portfolio.weights) {
                    // First, try to get the selected assets directly if available
                    if (Array.isArray(portfolio.assets) && portfolio.assets.length > 0) {
                        // If we have assets array with ticker names
                        const selectedAssets = portfolio.assets;
                        console.log('Found assets array:', selectedAssets);
                        
                        // Match assets with weights
                        if (Array.isArray(portfolio.weights)) {
                            // If weights is an array, match by index
                            for (let i = 0; i < Math.min(selectedAssets.length, portfolio.weights.length); i++) {
                                const ticker = selectedAssets[i];
                                const allocation = portfolio.weights[i];
                                
                                if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                    const allocationValue = parseFloat(allocation);
                                    totalAllocation += allocationValue;
                                    formattedPortfolioData += `<li>${ticker}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                                } else {
                                    // Display 0% allocation for assets with undefined or null allocation
                                    formattedPortfolioData += `<li>${ticker}: 0.00%</li>`;
                                }
                            }
                        } else if (typeof portfolio.weights === 'object') {
                            // If weights is an object, try to match by ticker name
                            for (const ticker of selectedAssets) {
                                const allocation = portfolio.weights[ticker];
                                
                                if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                    const allocationValue = parseFloat(allocation);
                                    totalAllocation += allocationValue;
                                    formattedPortfolioData += `<li>${ticker}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                                } else {
                                    // Display 0% allocation for assets with undefined or null allocation
                                    formattedPortfolioData += `<li>${ticker}: 0.00%</li>`;
                                }
                            }
                        }
                    }
                    // If no assets array or no allocations were displayed, try other methods
                    else if (Array.isArray(portfolio.tickers)) {
                        // Use the tickers array for display names
                        for (let i = 0; i < portfolio.tickers.length; i++) {
                            const ticker = portfolio.tickers[i];
                            // Try to get allocation either by index or by ticker name
                            let allocation = null;
                            if (Array.isArray(portfolio.weights)) {
                                allocation = portfolio.weights[i];
                            } else {
                                allocation = portfolio.weights[ticker];
                            }
                            
                            if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                const allocationValue = parseFloat(allocation);
                                totalAllocation += allocationValue;
                                formattedPortfolioData += `<li>${ticker}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                            } else {
                                // Display 0% allocation for assets with undefined or null allocation
                                formattedPortfolioData += `<li>${ticker}: 0.00%</li>`;
                            }
                        }
                    } else if (typeof portfolio.weights === 'object' && !Array.isArray(portfolio.weights)) {
                        // If weights is an object with ticker keys
                        for (const [ticker, allocation] of Object.entries(portfolio.weights)) {
                            if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                const allocationValue = parseFloat(allocation);
                                totalAllocation += allocationValue;
                                formattedPortfolioData += `<li>${ticker}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                            }
                        }
                    } else if (Array.isArray(portfolio.weights)) {
                        // Fallback if we only have an array of weights without tickers
                        // Try to get tickers from the window.optimizationResult
                        const allTickers = window.optimizationResult.tickers || [];
                        
                        // If we have a selection array, use it to determine which tickers to display
                        if (Array.isArray(portfolio.selection)) {
                            const selection = portfolio.selection;
                            let displayedAssets = 0;
                            
                            for (let i = 0; i < selection.length; i++) {
                                if (selection[i] === 1 && i < portfolio.weights.length) {
                                    const allocation = portfolio.weights[i];
                                    if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                        // Use ticker name if available, otherwise use index
                                        const tickerName = (allTickers && i < allTickers.length) ? allTickers[i] : `Asset ${i + 1}`;
                                        const allocationValue = parseFloat(allocation);
                                        totalAllocation += allocationValue;
                                        formattedPortfolioData += `<li>${tickerName}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                                        displayedAssets++;
                                    } else {
                                        // Display 0% allocation for assets with undefined or null allocation
                                        const tickerName = (allTickers && i < allTickers.length) ? allTickers[i] : `Asset ${i + 1}`;
                                        formattedPortfolioData += `<li>${tickerName}: 0.00%</li>`;
                                        displayedAssets++;
                                    }
                                }
                            }
                            
                            // If no assets were displayed, fall back to showing all weights
                            if (displayedAssets === 0) {
                                portfolio.weights.forEach((allocation, idx) => {
                                    if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                        // Use ticker name if available, otherwise use index
                                        const tickerName = (allTickers && idx < allTickers.length) ? allTickers[idx] : `Asset ${idx + 1}`;
                                        const allocationValue = parseFloat(allocation);
                                        totalAllocation += allocationValue;
                                        formattedPortfolioData += `<li>${tickerName}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                                    } else {
                                        // Display 0% allocation for assets with undefined or null allocation
                                        const tickerName = (allTickers && idx < allTickers.length) ? allTickers[idx] : `Asset ${idx + 1}`;
                                        formattedPortfolioData += `<li>${tickerName}: 0.00%</li>`;
                                    }
                                });
                            }
                        } else {
                            // If no selection array, just show all weights
                            portfolio.weights.forEach((allocation, idx) => {
                                if (allocation !== undefined && allocation !== null && !isNaN(parseFloat(allocation))) {
                                    // Use ticker name if available, otherwise use index
                                    const tickerName = (allTickers && idx < allTickers.length) ? allTickers[idx] : `Asset ${idx + 1}`;
                                    const allocationValue = parseFloat(allocation);
                                    totalAllocation += allocationValue;
                                    formattedPortfolioData += `<li>${tickerName}: ${(allocationValue * 100).toFixed(2)}%</li>`;
                                } else {
                                    // Display 0% allocation for assets with undefined or null allocation
                                    const tickerName = (allTickers && idx < allTickers.length) ? allTickers[idx] : `Asset ${idx + 1}`;
                                    formattedPortfolioData += `<li>${tickerName}: 0.00%</li>`;
                                }
                            });
                        }
                    }
                }
                // Add total allocation display
                formattedPortfolioData += `<li><strong>Total Allocation: ${(totalAllocation * 100).toFixed(2)}%</strong></li>`;
                formattedPortfolioData += '</ul>';
            });
            
            // Update the modal content
            const modal = document.getElementById('analysis-modal');
            if (modal) {
                // Update the modal title for Test Data
                const modalTitle = modal.querySelector('.modal-title');
                if (modalTitle) modalTitle.textContent = 'Portfolio Test Data';
                
                const loadingElement = modal.querySelector('.analysis-loading');
                const contentElement = modal.querySelector('.analysis-content');
                
                if (loadingElement) loadingElement.style.display = 'none';
                if (contentElement) {
                    contentElement.innerHTML = formattedPortfolioData;
                    contentElement.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error displaying portfolio data:', error);
            showAnalysisError(`Failed to display portfolio data: ${error.message}`);
        } finally {
            // Reset the button state
            const regularButton = document.querySelector('.ai-button.regular-analysis');
            if (regularButton) {
                regularButton.innerHTML = originalButtonText;
                regularButton.disabled = false;
            }
        }
    }, 500); // Short delay to show loading indicator
}

/**
 * Updates the analysis content in the modal
 * @param {string} analysisText - The analysis text from the API
 */
function updateAnalysisContent(analysisText) {
    console.log('Updating analysis content with:', analysisText);
    
    const modal = document.getElementById('analysis-modal');
    if (!modal) {
        console.error('Analysis modal not found, initializing it now');
        initializeAnalysisModal();
        // Try to get the modal again
        const newModal = document.getElementById('analysis-modal');
        if (!newModal) {
            console.error('Failed to initialize analysis modal');
            return;
        }
        // Make sure the modal is visible
        newModal.classList.add('active');
    } else {
        // Make sure the modal is visible
        modal.classList.add('active');
    }
    
    // Get the modal again in case it was just initialized
    const currentModal = document.getElementById('analysis-modal');
    
    const loadingElement = currentModal.querySelector('.analysis-loading');
    const errorElement = currentModal.querySelector('.analysis-error');
    const contentElement = currentModal.querySelector('.analysis-content');
    
    // Hide loading and error elements
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
    
    // Update and show content
    if (contentElement) {
        // Format the text with markdown-like syntax
        const formattedText = formatAnalysisText(analysisText);
        contentElement.innerHTML = formattedText;
        contentElement.style.display = 'block';
        console.log('Analysis content updated successfully');
        
        // For Test Data button, display raw portfolio data
        if (analysisText.includes('Portfolio Data:')) {
            // Display the raw portfolio data in a more readable format
            const portfolioData = window.optimizationResult.top_portfolios;
            let formattedPortfolioData = '<h2>Portfolio Test Data</h2>';
            
            portfolioData.forEach((portfolio, index) => {
                formattedPortfolioData += `<h3>Portfolio ${index + 1}</h3>`;
                formattedPortfolioData += `<p>Expected Return: ${portfolio.expected_return.toFixed(2)}%</p>`;
                formattedPortfolioData += `<p>Risk (Volatility): ${portfolio.risk.toFixed(2)}%</p>`;
                formattedPortfolioData += `<p>Sharpe Ratio: ${portfolio.sharpe_ratio.toFixed(2)}</p>`;
                
                formattedPortfolioData += '<p>Allocations:</p><ul>';
                for (const [asset, allocation] of Object.entries(portfolio.weights)) {
                    if (allocation > 0) {
                        formattedPortfolioData += `<li>${asset}: ${(allocation * 100).toFixed(2)}%</li>`;
                    }
                }
                formattedPortfolioData += '</ul>';
            });
            
            contentElement.innerHTML = formattedPortfolioData;
        }
    } else {
        console.error('Analysis content element not found');
    }
}

/**
 * Shows an error message in the analysis modal
 * @param {string} errorMessage - The error message to display
 */
function showAnalysisError(errorMessage) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    
    const loadingElement = modal.querySelector('.analysis-loading');
    const errorElement = modal.querySelector('.analysis-error');
    const contentElement = modal.querySelector('.analysis-content');
    
    // Hide loading and content elements
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'none';
    
    // Show error message
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
    }
}

/**
 * Formats the analysis text with basic markdown-like syntax
 * @param {string} text - The raw text from the API
 * @returns {string} - Formatted HTML
 */
function formatAnalysisText(text) {
    if (!text) return '';
    
    // Replace markdown-like syntax with HTML
    return text
        .replace(/# (.+)/g, '<h1>$1</h1>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/- (.+)/g, '<li>$1</li>')
        .replace(/\n\n/g, '<br><br>');
}

/**
 * Initializes the analysis modal if it doesn't exist
 */
function initializeAnalysisModal() {
    // Check if the modal already exists
    if (document.getElementById('analysis-modal')) {
        console.log('Analysis modal already exists, skipping initialization');
        return;
    }
    
    console.log('Initializing analysis modal');
    
    // We don't need to create the modal HTML or add CSS styles since they are now in the HTML and CSS files
    
    // Add event listeners to close the modal
    const modal = document.getElementById('analysis-modal');
    if (modal) {
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                modal.classList.remove('active');
            });
        }
        
        // Close modal when clicking outside the content
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        console.log('Analysis modal initialized successfully');
    } else {
        console.error('Failed to find analysis modal element after initialization');
    }
}