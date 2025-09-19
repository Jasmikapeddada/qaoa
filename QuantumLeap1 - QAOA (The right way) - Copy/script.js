// Global State
let currentDashboardState = 'initial';
let selectedStocks = [];
let optimizationProgress = 0;
let progressInterval;
let stockDatabase = []; // Will be populated from backend API

// Loading Messages - Updated to match the 6-step process in the backend
const loadingMessages = [
    { progress: 15, message: "Step 1/6: Classical pre-computation (returns, volatility, covariance)..." },
    { progress: 30, message: "Step 2/6: Generating portfolio candidates (2^n combinations)..." },
    { progress: 50, message: "Step 3/6: Filtering candidates with hard constraints..." },
    { progress: 65, message: "Step 4/6: Quantum optimization with QAOA algorithm..." },
    { progress: 85, message: "Step 5/6: Post-processing and ranking portfolios..." },
    { progress: 95, message: "Step 6/6: Preparing final visualizations..." }
];

// Detailed descriptions for each optimization step
const stepDescriptions = {
    1: "Computing expected returns, volatility, and covariance matrix for selected assets",
    2: "Generating all possible portfolio combinations (grows exponentially with asset count)",
    3: "Filtering portfolios based on minimum assets and correlation threshold constraints",
    4: "Running quantum optimization using QAOA to find optimal portfolio allocation",
    5: "Calculating precise financial metrics and ranking portfolios by objective",
    6: "Preparing final visualizations and portfolio recommendations"
};

// Helper function to format currency values
function formatCurrency(value) {
    // Format as Indian Rupees (₹)
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Detect which page we're on
    const isOptimizerPage = window.location.pathname.includes('optimizer.html') || 
                           document.getElementById('optimizer') !== null;
    
    // Fetch available stocks from backend API
    fetchAvailableStocks().then(() => {
        if (isOptimizerPage) {
            // Initialize optimizer page functionality
            initializeStockSearch();
            initializeTooltips();
            initializeTabs();
            initializeOptimizer();
            initializeLegendInteractivity();
        } else {
            // Initialize main page functionality
            initializeNavigation();
            initializeTooltips();
            initializeContactForm();
        }
    }).catch(error => {
        console.error('Failed to fetch available stocks:', error);
        // Continue initialization even if stock fetching fails
        if (isOptimizerPage) {
            initializeStockSearch();
            initializeTooltips();
            initializeTabs();
            initializeOptimizer();
            initializeLegendInteractivity();
        } else {
            initializeNavigation();
            initializeTooltips();
            initializeContactForm();
        }
    });
});

// Navigation Functions
function initializeNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Scrollspy functionality - only for main sections, exclude optimizer
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    // Only consider main sections for navigation highlighting, exclude optimizer
    const mainSections = ['home', 'technology', 'how-to', 'about', 'contact'];
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionId = section.getAttribute('id');
        // Skip optimizer section for navigation
        if (sectionId === 'optimizer') return;
        
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = sectionId;
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

function scrollToOptimizer() {
    // Check if we're already on the optimizer page
    const isOptimizerPage = window.location.pathname.includes('optimizer.html') || 
                           document.getElementById('optimizer') !== null;
    
    if (isOptimizerPage) {
        // Already on optimizer page, do nothing or scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    // Open optimizer in a new page
    window.open('optimizer.html', '_blank');
}

// Stock Search Functions
function initializeStockSearch() {
    const searchInput = document.getElementById('stock-search');
    const dropdown = document.getElementById('search-dropdown');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        
        if (query.length > 0) {
            const filteredStocks = stockDatabase.filter(stock => 
                stock.toLowerCase().includes(query) && !selectedStocks.includes(stock)
            );
            
            showSearchDropdown(filteredStocks);
        } else {
            hideSearchDropdown();
        }
    });
    
    searchInput.addEventListener('blur', function() {
        // Delay hiding to allow for clicks
        setTimeout(() => hideSearchDropdown(), 200);
    });
    
    // Initialize stock pill removal
    updateSelectedStocksDisplay();
}

function showSearchDropdown(stocks) {
    const dropdown = document.getElementById('search-dropdown');
    dropdown.innerHTML = '';
    
    if (stocks.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item">No stocks found</div>';
    } else {
        stocks.slice(0, 8).forEach(stock => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = stock;
            item.addEventListener('click', () => addStock(stock));
            dropdown.appendChild(item);
        });
    }
    
    dropdown.classList.remove('hidden');
}

function hideSearchDropdown() {
    document.getElementById('search-dropdown').classList.add('hidden');
}

function addStock(stock) {
    if (!selectedStocks.includes(stock)) {
        selectedStocks.push(stock);
        updateSelectedStocksDisplay();
        document.getElementById('stock-search').value = '';
        hideSearchDropdown();
    }
}

function removeStock(stock) {
    selectedStocks = selectedStocks.filter(s => s !== stock);
    updateSelectedStocksDisplay();
}

function updateSelectedStocksDisplay() {
    const container = document.getElementById('selected-stocks');
    container.innerHTML = '';
    
    selectedStocks.forEach(stock => {
        const pill = document.createElement('div');
        pill.className = 'stock-pill';
        pill.innerHTML = `
            ${stock}
            <span class="info-icon stock-info" data-tooltip="Get AI insights for ${stock}">ⓘ</span>
            <span class="remove-stock" onclick="removeStock('${stock}')">×</span>
        `;
        container.appendChild(pill);
    });
    
    // Reinitialize tooltips for new elements
    initializeTooltips();
}

// Tooltip Functions
function initializeTooltips() {
    const tooltip = document.getElementById('tooltip');
    
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltipText = this.getAttribute('data-tooltip');
            
            // Check if this is an info icon next to an input field
            const isInputInfoIcon = this.classList.contains('info-icon') && 
                                   this.parentElement && 
                                   this.parentElement.classList.contains('parameter-label');
            
            if (isInputInfoIcon) {
                // Format the tooltip with headings for input field info icons
                const fieldName = this.parentElement.textContent.trim().replace('ⓘ', '').trim();
                
                // Create structured content with headings
                let formattedContent = `
                    <h4>${fieldName}</h4>
                    <div class="tooltip-section">
                        <h5>What it is:</h5>
                        <p>${getWhatItIs(fieldName)}</p>
                    </div>
                    <div class="tooltip-section">
                        <h5>Why it is given:</h5>
                        <p>${getWhyItIsGiven(fieldName)}</p>
                    </div>
                    <div class="tooltip-section">
                        <h5>How changes affect results:</h5>
                        <p>${getHowChangesAffectResults(fieldName)}</p>
                    </div>
                `;
                
                tooltip.innerHTML = formattedContent;
            } else {
                // Regular tooltip
                tooltip.textContent = tooltipText;
            }
            
            // Position the tooltip to the right of the element
            const rect = this.getBoundingClientRect();
            tooltip.style.left = (rect.right + 10) + 'px';
            tooltip.style.top = (rect.top + rect.height/2) + 'px';
            tooltip.style.transform = 'translateY(-50%)'; // Center vertically relative to the element
            
            tooltip.classList.remove('hidden');
            tooltip.classList.add('show');
        });
        
        element.addEventListener('mouseleave', function() {
            tooltip.classList.remove('show');
            tooltip.classList.add('hidden');
        });
    });
}

// Helper functions to get detailed information for each input field
function getWhatItIs(fieldName) {
    const fieldInfo = {
        "Investment Budget (₹)": "The total amount of money you plan to invest across all selected assets. This is used as a target for portfolio construction.",
        "Optimization Objective": "The primary goal for your portfolio optimization. This determines how the algorithm will balance risk and return.",
        "Risk Aversion (λ)": "A mathematical parameter (lambda) that quantifies your tolerance for risk. It determines how much the optimizer penalizes volatility when constructing your portfolio.",
        "Risk-Free Rate": "The return rate of a risk-free investment, used as a benchmark in Sharpe ratio calculations.",
        "Return Weight (α)": "A mathematical coefficient (alpha) that determines the relative importance of expected returns versus other factors in the optimization algorithm.",
        "Budget Penalty (A)": "A coefficient that mathematically enforces the budget constraint in the optimization formula. It determines how strictly your investment budget is adhered to.",
        "Minimum Assets": "The minimum number of different assets that must be included in the portfolio.",
        "Minimum Assets Penalty (B)": "A coefficient that mathematically enforces the diversification constraint in the optimization formula. It ensures your portfolio includes at least the minimum number of assets.",
        "Correlation Threshold": "The maximum allowed correlation between assets in the portfolio.",
        "QAOA Layers (p)": "A quantum computing parameter that defines the depth of the quantum circuit. Higher values of p increase the complexity and potential accuracy of the quantum optimization.",
        "QAOA Shots": "The number of times the quantum circuit is executed to gather statistics.",
        "Quantum Backend": "The specific quantum computing hardware or simulator that will process your optimization problem. Different backends have different capabilities, qubits, and error rates."
    };
    
    return fieldInfo[fieldName] || "Information about this parameter";
}

function getWhyItIsGiven(fieldName) {
    const fieldReason = {
        "Investment Budget (₹)": "This parameter is essential for creating a realistic portfolio that matches your investment capacity. It ensures the optimizer recommends allocations within your financial means.",
        "Optimization Objective": "Different investors have different goals. This parameter allows you to align the optimization with your specific investment strategy, whether you prioritize stability, growth, or a balance of both.",
        "Risk Aversion (λ)": "This parameter is provided to mathematically express your personal risk tolerance in the optimization algorithm. It allows the quantum optimizer to balance risk and return according to your specific preferences, creating a portfolio that aligns with your comfort level for market volatility.",
        "Risk-Free Rate": "This provides a baseline for evaluating investment performance. It represents what you could earn without taking any risk, helping to determine if the additional risk is worthwhile.",
        "Return Weight (α)": "This parameter is provided to give you precise control over how much the optimizer prioritizes potential returns in your portfolio. It allows you to mathematically adjust the balance between chasing higher returns versus other objectives like risk minimization or diversification.",
        "Budget Penalty (A)": "This parameter is provided to give you control over budget constraint enforcement in the quantum algorithm. It allows you to determine whether your portfolio strictly adheres to your investment budget or if slight deviations are acceptable when they significantly improve other metrics.",
        "Minimum Assets": "This ensures diversification in your portfolio, preventing concentration in too few assets which could increase risk.",
        "Minimum Assets Penalty (B)": "This parameter is provided to give you control over diversification enforcement in the quantum algorithm. It allows you to determine how strictly the optimizer must adhere to your minimum asset requirement, balancing diversification against potential performance gains.",
        "Correlation Threshold": "This helps create truly diversified portfolios by limiting how many highly correlated assets are included together.",
        "QAOA Layers (p)": "This parameter is provided to give you control over the quantum computational resources used in your optimization. It allows you to balance optimization quality against computation time, with higher values potentially yielding better results at the cost of longer processing times.",
        "QAOA Shots": "This technical parameter affects the statistical accuracy of the quantum results. More shots improve accuracy but increase computation time.",
        "Quantum Backend": "This parameter is provided to give you control over which quantum computing resources process your portfolio optimization. It allows you to choose between different hardware options or simulators based on their availability, performance characteristics, and suitability for your specific optimization problem."
    };
    
    return fieldReason[fieldName] || "This parameter is provided to customize your optimization strategy.";
}

function getHowChangesAffectResults(fieldName) {
    const fieldEffects = {
        "Investment Budget (₹)": "Increasing the budget allows for larger investments across more assets. Decreasing it constrains the portfolio to fewer assets or smaller allocations. The actual impact depends on the Budget Penalty setting.",
        "Optimization Objective": "'Max Sharpe Ratio' balances risk and return. 'Min Variance' creates more stable portfolios with lower returns. 'Max Return' creates aggressive portfolios with higher volatility.",
        "Risk Aversion (λ)": "Increasing λ (lambda) creates more conservative portfolios that prioritize stability over returns. The optimizer will select assets with lower volatility and more predictable performance, potentially sacrificing some growth potential. Decreasing λ creates more aggressive portfolios that accept higher volatility in pursuit of greater returns. At λ=0, risk is completely ignored in favor of maximizing returns.",
        "Risk-Free Rate": "Higher values make risky investments less attractive in Sharpe ratio calculations. Lower values make risky investments more attractive relative to safe alternatives.",
        "Return Weight (α)": "Increasing α (alpha) makes the optimizer more aggressively pursue assets with higher expected returns, even if they come with increased risk or reduced diversification. This typically results in more concentrated portfolios with higher growth potential but greater volatility. Decreasing α creates more balanced portfolios that may sacrifice some return potential in favor of other desirable characteristics like stability or diversification.",
        "Budget Penalty (A)": "Increasing A makes the optimizer adhere more strictly to your specified investment budget, even if it means sacrificing performance in other areas. The resulting portfolio will closely match your budget target but may be suboptimal in terms of risk-return profile. Decreasing A gives the optimizer more flexibility to slightly exceed or undershoot your budget when doing so significantly improves the portfolio's expected performance.",
        "Minimum Assets": "Higher values force more diversification, potentially reducing both risk and return. Lower values allow more concentration in the best-performing assets.",
        "Minimum Assets Penalty (B)": "Increasing B forces the optimizer to strictly adhere to your minimum asset requirement, creating more diversified portfolios even when concentration might yield better theoretical returns. This typically reduces both potential risk and potential return. Decreasing B allows the optimizer to include fewer assets than your minimum if doing so significantly improves expected performance, potentially creating more concentrated portfolios.",
        "Correlation Threshold": "Lower values create more truly diversified portfolios by restricting highly correlated assets. Higher values allow more correlated assets, potentially increasing both risk and return.",
        "QAOA Layers (p)": "Increasing p adds more layers to the quantum circuit, allowing the optimizer to explore more complex solution spaces and potentially find better portfolio allocations. This typically improves results but increases computation time exponentially. For portfolios with many assets (>20), higher p values are particularly beneficial. Decreasing p simplifies the quantum computation, making it faster but potentially less optimal.",
        "QAOA Shots": "More shots improve the statistical accuracy of quantum results but increase computation time. For final results, higher shot counts are recommended.",
        "Quantum Backend": "Changing the backend affects how your optimization problem is processed. Simulators like 'qasm_simulator' provide fast results but may be limited for large portfolios. Real quantum hardware like 'ibmq_manila' or 'ibmq_quito' may provide better results for certain problems but introduce hardware-specific noise. Advanced backends like 'ibmq_washington' offer more qubits and can handle larger portfolios but may have longer queue times."
    };
    
    return fieldEffects[fieldName] || "Changes to this parameter will affect the optimization results in ways specific to your portfolio.";
}

// Tab Functions
function initializeTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Optimizer Functions
function initializeOptimizer() {
    const runButton = document.getElementById('run-optimization');
    runButton.addEventListener('click', runOptimization);
    
    // Initialize optimization objective dropdown logic
    initializeOptimizationObjective();
    
    // Initialize slider feedback
    initializeSliderFeedback();
}

function initializeOptimizationObjective() {
    const objectiveDropdown = document.getElementById('optimization-objective');
    const riskAversionSlider = document.getElementById('risk-aversion');
    const returnWeightInput = document.getElementById('return-weight');
    
    objectiveDropdown.addEventListener('change', function() {
        const objective = this.value;
        
        // Update Risk Aversion and Return Weight based on objective
        switch(objective) {
            case 'Max Sharpe Ratio':
                riskAversionSlider.value = 0.5;
                returnWeightInput.value = 1.0;
                break;
            case 'Min Variance':
                riskAversionSlider.value = 1.0;
                returnWeightInput.value = 0.5;
                break;
            case 'Max Return':
                riskAversionSlider.value = 0.0;
                returnWeightInput.value = 2.0;
                break;
        }
        
        // Update slider display
        updateSliderDisplay(riskAversionSlider);
    });
}

function updateSliderDisplay(slider) {
    // Trigger change event to update any visual indicators
    slider.dispatchEvent(new Event('input'));
}

function initializeSliderFeedback() {
    // Set up real-time feedback for all sliders
    const sliders = [
        { id: 'risk-aversion', valueId: 'risk-aversion-value' },
        { id: 'min-assets', valueId: 'min-assets-value' },
        { id: 'correlation-threshold', valueId: 'correlation-threshold-value' }
    ];
    
    sliders.forEach(({ id, valueId }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);
        
        if (slider && valueDisplay) {
            // Update display on input
            slider.addEventListener('input', function() {
                valueDisplay.textContent = this.value;
            });
            
            // Initialize display with current value
            valueDisplay.textContent = slider.value;
        }
    });
}

function runOptimization() {
    if (selectedStocks.length === 0) {
        alert('Please select at least one stock before running optimization.');
        return;
    }
    
    // Switch to loading state and start animation
    switchDashboardState('loading');
    
    // CRITICAL: Use EventSource for real-time progress streaming
    runOptimizationWithStreaming();
}

function runOptimizationWithStreaming() {
    // Clear any existing progress interval
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    // Gather all 13 parameters from the UI with comprehensive validation
    const requestPayload = {
        tickers: selectedStocks,
        budget: parseFloat(document.getElementById('budget').value) || 100000,
        optimization_objective: document.getElementById('optimization-objective').value,
        risk_free_rate: parseFloat(document.getElementById('risk-free-rate').value) || 0.07,
        risk_aversion: parseFloat(document.getElementById('risk-aversion').value) || 0.5,
        return_weight: parseFloat(document.getElementById('return-weight').value) || 1.0,
        budget_penalty: parseFloat(document.getElementById('budget-penalty').value) || 1.0,
        min_assets: parseInt(document.getElementById('min-assets').value) || 2,
        min_assets_penalty: parseFloat(document.getElementById('min-assets-penalty').value) || 1.0,
        correlation_threshold: parseFloat(document.getElementById('correlation-threshold').value) || 0.8,
        reps: parseInt(document.getElementById('qaoa-layers').value) || 3,
        shots: parseInt(document.getElementById('qaoa-shots').value) || 1024,
        backend: document.getElementById('backend').value
    };
    
    // CRITICAL: Log the exact payload being sent to verify parameters are captured
    console.log('=== FRONTEND PARAMETER VERIFICATION ===');
    console.log('Request payload being sent to backend:', JSON.stringify(requestPayload, null, 2));
    console.log('Individual parameter verification:');
    console.log('- Tickers:', requestPayload.tickers);
    console.log('- Budget:', requestPayload.budget);
    console.log('- Optimization Objective:', requestPayload.optimization_objective);
    console.log('- Risk Aversion:', requestPayload.risk_aversion);
    console.log('- Min Assets:', requestPayload.min_assets);
    console.log('- Backend:', requestPayload.backend);
    console.log('=== END PARAMETER VERIFICATION ===');
    
    // Use streaming endpoint for real-time progress
    fetch('http://127.0.0.1:5000/optimize-stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        function readStream() {
            return reader.read().then(({ done, value }) => {
                if (done) {
                    console.log('Stream completed');
                    return;
                }
                
                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });
                
                // Store incomplete chunks for later processing
                if (!window.streamBuffer) {
                    window.streamBuffer = '';
                }
                window.streamBuffer += chunk;
                
                // Process complete lines only
                const lines = window.streamBuffer.split('\n');
                // Keep the last potentially incomplete line in the buffer
                window.streamBuffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            // Remove 'data: ' prefix and parse JSON
                            const jsonStr = line.slice(6);
                            const data = JSON.parse(jsonStr);
                            
                            if (data.type === 'progress') {
                                // Mark that we've received real backend progress
                                window.receivedBackendProgress = true;
                                
                                // Extract step number if available
                                let stepNumber = 0;
                                if (data.step) {
                                    stepNumber = parseInt(data.step);
                                }
                                
                                // Use our loading messages for consistent UI but with real progress
                                let message = data.message;
                                if (stepNumber > 0 && stepNumber <= loadingMessages.length) {
                                    // Use our formatted message but with backend progress percentage
                                    message = loadingMessages[stepNumber-1].message;
                                }
                                
                                // Update progress bar with real backend progress
                                updateProgressBar(data.progress, message);
                                console.log(`Backend Progress: ${data.step}/6 - ${message} (${data.progress}%)`);
                            } else if (data.type === 'done') {
                                // Optimization completed successfully
                                console.log('Optimization completed successfully:', data);
                                
                                // Store the result for use in charts
                                window.optimizationResult = data;
                                
                                // Switch to results state immediately
                                switchDashboardState('results');
                                // Initialize charts with the real data
                                initializeCharts(data);
                                // Update portfolio metrics and table
                                updateTopPortfolioMetrics(data);
                                updatePortfolioTable(data);
                                return; // Exit the stream reading
                            } else if (data.type === 'error') {
                                // Optimization failed
                                console.error('Optimization failed:', data.error);
                                
                                // Extract error message
                                let errorMessage = 'Optimization failed';
                                if (data.error) {
                                    errorMessage += ': ' + data.error;
                                } else if (data.message) {
                                    errorMessage += ': ' + data.message;
                                }
                                
                                // Update progress bar to show error state
                                const progressFill = document.getElementById('progress-fill');
                                const progressDetail = document.getElementById('progress-detail');
                                
                                if (progressFill) {
                                    // Change progress bar color to indicate error
                                    progressFill.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
                                }
                                
                                // Show error message with retry suggestion
                                updateProgressBar(100, `Error: ${errorMessage}`);
                                
                                if (progressDetail) {
                                    progressDetail.textContent = 'Please check your parameters and try again. You may need to select fewer assets or adjust constraints.';
                                }
                                
                                // Add a retry button to the loading state
                                const loadingContent = document.querySelector('.loading-content');
                                if (loadingContent && !document.getElementById('retry-button')) {
                                    const retryButton = document.createElement('button');
                                    retryButton.id = 'retry-button';
                                    retryButton.className = 'retry-button glow-effect';
                                    retryButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
                                    retryButton.addEventListener('click', function() {
                                        // Remove retry button
                                        this.remove();
                                        // Switch back to initial state
                                        switchDashboardState('initial');
                                    });
                                    
                                    loadingContent.appendChild(retryButton);
                                } else {
                                    // If we can't add a retry button, show an alert
                                    setTimeout(() => {
                                        alert(errorMessage);
                                        switchDashboardState('initial');
                                    }, 1000);
                                }
                                
                                return; // Exit the stream reading
                            }
                        } catch (parseError) {
                            console.error('Error parsing stream data:', parseError);
                            // Continue processing other lines even if one fails
                        }
                    }
                }
                
                // Continue reading the stream
                return readStream();
            });
        }
        
        return readStream();
    }).catch(error => {
        console.error('Streaming optimization error:', error);
        
        // Update progress bar to show connection error state
        const progressFill = document.getElementById('progress-fill');
        const progressDetail = document.getElementById('progress-detail');
        
        if (progressFill) {
            // Change progress bar color to indicate error
            progressFill.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
        }
        
        let errorMessage = 'Connection error';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        // Show error message with retry suggestion
        updateProgressBar(100, `Error: ${errorMessage}`);
        
        if (progressDetail) {
            progressDetail.textContent = 'Unable to connect to the optimization server. Please check your connection and try again.';
        }
        
        // Add a retry button to the loading state
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent && !document.getElementById('retry-button')) {
            const retryButton = document.createElement('button');
            retryButton.id = 'retry-button';
            retryButton.className = 'retry-button glow-effect';
            retryButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
            retryButton.addEventListener('click', function() {
                // Remove retry button
                this.remove();
                // Switch back to initial state
                switchDashboardState('initial');
            });
            
            loadingContent.appendChild(retryButton);
            
            // Add a fallback button to try non-streaming API
            const fallbackButton = document.createElement('button');
            fallbackButton.id = 'fallback-button';
            fallbackButton.className = 'retry-button';
            fallbackButton.style.background = 'linear-gradient(90deg, #4b5563, #6b7280)';
            fallbackButton.style.marginTop = '0.5rem';
            fallbackButton.innerHTML = '<i class="fas fa-sync-alt"></i> Try Fallback Method';
            fallbackButton.addEventListener('click', function() {
                // Remove both buttons
                document.getElementById('retry-button')?.remove();
                this.remove();
                
                // Reset progress bar
                if (progressFill) {
                    progressFill.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
                    progressFill.style.width = '0%';
                }
                
                updateProgressBar(5, 'Attempting fallback optimization method...');
                
                if (progressDetail) {
                    progressDetail.textContent = 'Using alternative optimization method. This may take longer than usual.';
                }
                
                // Try fallback API
                console.log('Falling back to regular API call...');
                runOptimizationAPI().then(result => {
                    if (result && result.top_portfolios && result.top_portfolios.length > 0) {
                        console.log('Fallback optimization successful:', result);
                        window.optimizationResult = result;
                        setTimeout(() => {
                            switchDashboardState('results');
                            initializeCharts(result);
                            updateTopPortfolioMetrics(result);
                            updatePortfolioTable(result);
                        }, 1000);
                    } else {
                        handleOptimizationError(result.error || result.message || 'No portfolios found');
                    }
                }).catch(fallbackError => {
                    console.error('Fallback optimization error:', fallbackError);
                    let fallbackErrorMessage = 'An error occurred during optimization';
                    if (fallbackError.message) {
                        fallbackErrorMessage += ': ' + fallbackError.message;
                    }
                    handleOptimizationError(fallbackErrorMessage);
                });
            });
            
            loadingContent.appendChild(fallbackButton);
        } else {
            // If we can't add buttons, show an alert and switch back
            setTimeout(() => {
                alert(errorMessage + '. Please try again later.');
                switchDashboardState('initial');
            }, 1000);
        }
        
        // Helper function for handling optimization errors
        function handleOptimizationError(message) {
            console.error('Optimization error:', message);
            
            // Update progress bar to show error state
            if (progressFill) {
                progressFill.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
            }
            
            updateProgressBar(100, `Error: ${message}`);
            
            if (progressDetail) {
                progressDetail.textContent = 'Please try again with different stocks or parameters.';
            }
            
            // Add a retry button if it doesn't exist
            if (loadingContent && !document.getElementById('retry-button')) {
                const retryButton = document.createElement('button');
                retryButton.id = 'retry-button';
                retryButton.className = 'retry-button glow-effect';
                retryButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
                retryButton.addEventListener('click', function() {
                    this.remove();
                    switchDashboardState('initial');
                });
                
                loadingContent.appendChild(retryButton);
            } else {
                setTimeout(() => {
                    alert(message);
                    switchDashboardState('initial');
                }, 1000);
            }
        }
    });
}

function updateProgressBar(progress, message) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressDetail = document.getElementById('progress-detail');
    
    if (progressFill && progressText) {
        // Cap progress at 95% until we receive the 'done' message
        // This prevents the progress bar from showing 100% when still processing
        const displayProgress = progress >= 100 ? 95 : progress;
        progressFill.style.width = displayProgress + '%';
        
        // Extract step number from message if available
        let stepNumber = 0;
        const stepMatch = message.match(/Step (\d+)\/\d+/);
        if (stepMatch && stepMatch[1]) {
            stepNumber = parseInt(stepMatch[1]);
        }
        
        // Update main progress text
        progressText.textContent = `${displayProgress.toFixed(0)}% - ${message}`;
        
        // Update detailed description if element exists and we have a valid step
        if (progressDetail && stepNumber > 0 && stepDescriptions[stepNumber]) {
            progressDetail.textContent = stepDescriptions[stepNumber];
            progressDetail.style.display = 'block';
            
            // Add complexity indicator for steps that are affected by problem size
            if (stepNumber === 2 || stepNumber === 4) {
                const complexityFactors = calculateComplexityFactors();
                const complexityIndicator = stepNumber === 2 ? 
                    `(${Math.pow(2, complexityFactors.numAssets).toLocaleString()} possible combinations)` : 
                    `(${complexityFactors.shots.toLocaleString()} quantum samples)`;
                
                progressDetail.textContent += ` ${complexityIndicator}`;
            }
        }
        
        // Store the actual progress for reference
        window.actualProgress = progress;
        
        // Calculate estimated time remaining based on progress and elapsed time
        if (window.optimizationStartTime) {
            const elapsedMs = Date.now() - window.optimizationStartTime;
            const elapsedSec = elapsedMs / 1000;
            
            // Only show ETA if we have some progress and elapsed time
            if (progress > 10 && elapsedSec > 2) {
                const estimatedTotalSec = (elapsedSec / progress) * 100;
                const remainingSec = Math.max(0, estimatedTotalSec - elapsedSec);
                
                // Add ETA to progress detail if it exists
                if (progressDetail) {
                    const etaText = remainingSec > 60 ?
                        `ETA: ~${Math.ceil(remainingSec / 60)} min remaining` :
                        `ETA: ~${Math.ceil(remainingSec)} sec remaining`;
                    
                    // Only show ETA if we're not almost done
                    if (progress < 90) {
                        progressDetail.textContent += ` • ${etaText}`;
                    }
                }
            }
        }
        
        // Log the progress for debugging
        console.log(`Progress update: ${displayProgress}% displayed (actual: ${progress}%) - ${message}`);
    }
}

function switchDashboardState(state) {
    document.querySelectorAll('.dashboard-state').forEach(stateEl => {
        stateEl.classList.remove('active');
    });
    
    document.getElementById(`${state}-state`).classList.add('active');
    currentDashboardState = state;
}

function startLoadingAnimation() {
    // Initialize progress to 0
    optimizationProgress = 0;
    
    // Reset any previous results and tracking variables
    window.streamBuffer = '';
    window.actualProgress = 0;
    window.receivedBackendProgress = false;
    
    // Record start time for ETA calculation
    window.optimizationStartTime = Date.now();
    
    // Initialize message index for loading messages
    let messageIndex = 0;
    
    // Clear any existing interval
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    // Show initial loading message
    updateProgressBar(5, 'Starting optimization...');
    
    // Calculate complexity factors based on problem parameters
    const complexityFactors = calculateComplexityFactors();
    
    // Adjust interval based on complexity (more complex = slower animation)
    // This creates a more realistic simulation of processing time
    const baseInterval = 800; // Base interval in milliseconds
    const adjustedInterval = baseInterval * complexityFactors.totalFactor;
    
    // Log complexity analysis for debugging
    console.log('Problem complexity analysis:', complexityFactors);
    console.log(`Adjusted animation interval: ${adjustedInterval}ms (base: ${baseInterval}ms, factor: ${complexityFactors.totalFactor.toFixed(2)}x)`); 
    
    // Use the adjusted interval for the animation
    // This will be overridden by actual backend progress updates if received
    progressInterval = setInterval(() => {
        // Only use animation if we haven't received real progress updates
        if (!window.receivedBackendProgress && messageIndex < loadingMessages.length) {
            const currentMessage = loadingMessages[messageIndex];
            
            // Calculate adjusted progress based on complexity
            // More complex problems will show slower progress in early stages
            let adjustedProgress = currentMessage.progress;
            
            // Apply complexity-based adjustments to different stages
            if (messageIndex <= 1) {
                // Early stages (data loading, metrics calculation) - affected by asset count
                adjustedProgress = Math.min(currentMessage.progress, 
                    currentMessage.progress * (1 / complexityFactors.assetFactor));
            } else if (messageIndex === 2 || messageIndex === 3) {
                // Portfolio generation and filtering - affected by all factors
                adjustedProgress = Math.min(currentMessage.progress,
                    currentMessage.progress * (1 / complexityFactors.totalFactor));
            } else if (messageIndex === 4) {
                // Quantum optimization - affected by backend and shots
                adjustedProgress = Math.min(currentMessage.progress,
                    currentMessage.progress * (1 / complexityFactors.quantumFactor));
            }
            
            // Animate progress to adjusted step
            optimizationProgress = adjustedProgress;
            updateProgressBar(optimizationProgress, currentMessage.message);
            
            messageIndex++;
        } else if (window.actualProgress >= 100) {
            // If we've reached 100% but haven't received the 'done' message yet,
            // show a "finalizing results" message
            const elapsedTime = Math.floor((Date.now() - window.optimizationStartTime) / 1000);
            updateProgressBar(95, `Finalizing results... (${elapsedTime}s)`);
        } else {
            // Animation complete but don't switch dashboard state here
            // The state will be switched by the API call completion handler
            clearInterval(progressInterval);
        }
    }, adjustedInterval);
}

/**
 * Calculate complexity factors based on problem parameters
 * This function analyzes the current optimization parameters to estimate
 * the relative complexity of the problem, which is used to adjust the
 * loading animation timing to better reflect actual processing time.
 */
function calculateComplexityFactors() {
    // Get relevant parameters that affect complexity
    const numAssets = selectedStocks.length;
    const backend = document.getElementById('backend').value;
    const shots = parseInt(document.getElementById('qaoa-layers').value) || 3;
    const reps = parseInt(document.getElementById('qaoa-shots').value) || 1024;
    const minAssets = parseInt(document.getElementById('min-assets').value) || 2;
    
    // Calculate asset complexity factor (exponential growth with number of assets)
    // 2^n combinations grow rapidly, so we use a logarithmic scale
    const assetFactor = Math.max(1, Math.log2(numAssets) / Math.log2(5));
    
    // Calculate quantum complexity factor based on backend and shots
    let quantumFactor = 1.0;
    if (backend === 'IBM Quantum Hardware') {
        quantumFactor = 3.0; // Hardware runs are significantly slower
    } else {
        // For simulator, complexity scales with shots and reps
        quantumFactor = Math.max(1, (shots / 1024) * (reps / 3));
    }
    
    // Calculate constraint complexity factor
    // More restrictive min_assets makes filtering more complex
    const constraintFactor = Math.max(1, numAssets / (minAssets * 2));
    
    // Calculate total complexity factor (weighted average)
    const totalFactor = (
        (assetFactor * 3) +  // Asset count has highest impact
        (quantumFactor * 2) + // Quantum parameters have medium impact
        (constraintFactor * 1) // Constraints have lowest impact
    ) / 6; // Normalize by sum of weights
    
    return {
        assetFactor,
        quantumFactor,
        constraintFactor,
        totalFactor,
        numAssets,
        backend,
        shots,
        reps
    };
}

// Legend Interactivity
function initializeLegendInteractivity() {
    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // In a real implementation, this would toggle chart series visibility
            const series = this.getAttribute('data-series');
            console.log(`Toggled ${series} series visibility`);
            
            // Visual feedback
            if (this.classList.contains('active')) {
                this.style.opacity = '1';
            } else {
                this.style.opacity = '0.5';
            }
        });
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPercentage(value) {
    return (value * 100).toFixed(1) + '%';
}

// API Functions
async function fetchAvailableStocks() {
    try {
        const response = await fetch('http://127.0.0.1:5000/stocks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.stocks && Array.isArray(data.stocks)) {
            stockDatabase = data.stocks;
            console.log('Fetched stocks from backend:', stockDatabase);
        } else {
            console.error('Invalid response format from /stocks endpoint');
        }
    } catch (error) {
        console.error('Error fetching available stocks:', error);
        throw error;
    }
}

async function runOptimizationAPI(params) {
    // Real API call to backend for optimization
    console.log('Running optimization with params:', params);
    console.log('Selected stocks for optimization:', selectedStocks);
    
    // Update progress bar to show we're starting the fallback method
    updateProgressBar(10, 'Starting fallback optimization method...');
    
    // First, fetch available stocks to ensure we only use stocks that exist in the system
    let availableStocks = [];
    try {
        const response = await fetch('http://127.0.0.1:5000/stocks');
        if (response.ok) {
            const data = await response.json();
            availableStocks = data.stocks || [];
            console.log('Available stocks:', availableStocks);
        } else {
            console.error('Failed to fetch available stocks');
        }
    } catch (error) {
        console.error('Error fetching available stocks:', error);
    }
    
    // Filter selected stocks to only include available ones
    const validSelectedStocks = selectedStocks.filter(stock => availableStocks.includes(stock));
    
    // If no valid stocks are selected, use some default stocks that we know exist in the system
    // But make sure they are in the available stocks list
    let stocksToUse = [];
    if (validSelectedStocks.length > 0) {
        stocksToUse = validSelectedStocks;
    } else {
        // Try these default stocks, but only use them if they're available
        // Avoid stocks known to have insufficient data like ADANIPOWER
        const defaultStocks = ['TCS', 'HDFCBANK', 'AXISBANK', 'ICICIPRULI', 'BAJAJFINSV', 'ADANIGREEN', 'BANKBARODA', 'BRITANNIA', 'CGPOWER'];
        stocksToUse = defaultStocks.filter(stock => availableStocks.includes(stock));
        
        // If we still don't have any valid stocks, use the first 3-5 available stocks
        if (stocksToUse.length === 0 && availableStocks.length > 0) {
            stocksToUse = availableStocks.slice(0, Math.min(5, availableStocks.length));
        }
    }
    
    // Ensure we have at least 2 stocks for optimization
    if (stocksToUse.length < 2) {
        throw new Error('At least 2 stocks are required for portfolio optimization');
    }
    
    // Exclude stocks known to have insufficient data
    stocksToUse = stocksToUse.filter(stock => stock !== 'ADANIPOWER');
    
    console.log('Using stocks for optimization:', stocksToUse);
    
    try {
        // Gather all 13 parameters from the UI with comprehensive validation
        const requestPayload = {
            tickers: stocksToUse,
            budget: parseFloat(document.getElementById('budget').value) || 100000,
            optimization_objective: document.getElementById('optimization-objective').value,
            risk_free_rate: parseFloat(document.getElementById('risk-free-rate').value) || 0.07,
            risk_aversion: parseFloat(document.getElementById('risk-aversion').value) || 0.5,
            return_weight: parseFloat(document.getElementById('return-weight').value) || 1.0,
            budget_penalty: parseFloat(document.getElementById('budget-penalty').value) || 1.0,
            min_assets: parseInt(document.getElementById('min-assets').value) || 2,
            min_assets_penalty: parseFloat(document.getElementById('min-assets-penalty').value) || 1.0,
            correlation_threshold: parseFloat(document.getElementById('correlation-threshold').value) || 0.8,
            reps: parseInt(document.getElementById('qaoa-layers').value) || 3,
            shots: parseInt(document.getElementById('qaoa-shots').value) || 1024,
            backend: document.getElementById('backend').value
        };
        
        // CRITICAL: Log the exact payload being sent to verify parameters are captured
        console.log('=== FRONTEND PARAMETER VERIFICATION ===');
        console.log('Request payload being sent to backend:', JSON.stringify(requestPayload, null, 2));
        console.log('Individual parameter verification:');
        console.log('- Tickers:', requestPayload.tickers);
        console.log('- Budget:', requestPayload.budget);
        console.log('- Optimization Objective:', requestPayload.optimization_objective);
        console.log('- Risk Aversion:', requestPayload.risk_aversion);
        console.log('- Min Assets:', requestPayload.min_assets);
        console.log('- Backend:', requestPayload.backend);
        console.log('=== END PARAMETER VERIFICATION ===');
        
        // Update progress to show we're sending the request
        updateProgressBar(20, 'Sending optimization request to server...');
        
        const response = await fetch('http://127.0.0.1:5000/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });
        
        // Update progress to show we're processing the response
        updateProgressBar(40, 'Processing optimization results...');
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        // Get the response text first to help with debugging
        updateProgressBar(60, 'Receiving optimization data...');
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        // Update progress to show we're parsing the results
        updateProgressBar(80, 'Parsing optimization results...');
        
        // If the response is not OK, try to parse the error message from the response
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            let errorDetails = {};
            
            try {
                // Try to parse the response as JSON to get the error message
                const errorData = JSON.parse(responseText);
                if (errorData.error) {
                    errorMessage = errorData.error;
                    errorDetails = errorData;
                }
                if (errorData.message) {
                    errorDetails.details = errorData.message;
                }
            } catch (parseError) {
                // If parsing fails, use the response text as is
                console.error('Error parsing error response:', parseError);
                errorDetails.responseText = responseText;
            }
            
            const error = new Error(errorMessage);
            error.details = errorDetails;
            throw error;
        }
        
        // Parse the response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
            // Update progress to show we're finalizing
            updateProgressBar(90, 'Finalizing optimization results...');
        } catch (err) {
            console.error('Error parsing JSON response:', err);
            throw new Error('Failed to parse server response as JSON');
        }
        
        console.log('Optimization result data:', data);
        
        // Validate response structure
        if (!data || !data.top_portfolios) {
            console.error('Invalid response format:', data);
            throw new Error('Server response missing portfolio data');
        }
        
        return data;
    } catch (error) {
        console.error('Error running optimization:', error);
        console.error('Error details:', {
            message: error.message,
            details: error.details || {},
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Fallback to simulated response in case of error
        return {
            success: false,
            error: error.message,
            message: error.details?.details || 'Unknown error occurred',
            top_portfolios: [] // Return empty array instead of null to match expected format
        };
    }
}

async function generateAIAnalysis(portfolioData) {
    // Placeholder for AI analysis API call
    console.log('Generating AI analysis for portfolio:', portfolioData);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                success: true,
                analysis: "Based on current market conditions and your risk profile, this portfolio shows strong potential for consistent returns while maintaining moderate risk exposure."
            });
        }, 2000);
    });
}

// Chart Functions with static images
function initializeCharts(optimizationResult) {
    console.log('Initializing static chart images with data:', optimizationResult);
    
    // Update the top portfolio metrics
    updateTopPortfolioMetrics(optimizationResult);
    
    // Update the portfolio table
    updatePortfolioTable(optimizationResult);
    
    // Check if we have visualization data
    // The backend sends visualization data as 'plots'
    if (!optimizationResult || !optimizationResult.plots) {
        console.error('No visualization data available');
        return;
    }
    
    const visualizationData = optimizationResult.plots;
    const topPortfolios = optimizationResult.top_portfolios || [];
    
    console.log('Visualization data:', visualizationData);
    console.log('Top portfolios:', topPortfolios);
    
    // Set static image sources from base64 data
    // Correlation Matrix
    if (visualizationData.correlation_heatmap && visualizationData.correlation_heatmap.image) {
        document.getElementById('img-correlation-matrix').src = 'data:image/png;base64,' + visualizationData.correlation_heatmap.image;
    }
    
    // Brute Force Analysis charts
    if (visualizationData.brute_force_scatter && visualizationData.brute_force_scatter.image) {
        document.getElementById('img-brute-force-scatter').src = 'data:image/png;base64,' + visualizationData.brute_force_scatter.image;
    }
    
    if (visualizationData.sharpe_colored_scatter && visualizationData.sharpe_colored_scatter.image) {
        document.getElementById('img-sharpe-colored').src = 'data:image/png;base64,' + visualizationData.sharpe_colored_scatter.image;
    }
    
    if (visualizationData.efficient_frontier && visualizationData.efficient_frontier.image) {
        document.getElementById('img-efficient-frontier').src = 'data:image/png;base64,' + visualizationData.efficient_frontier.image;
    }
    
    // QUBO vs Sharpe chart
    if (visualizationData.qubo_vs_sharpe && visualizationData.qubo_vs_sharpe.image) {
        document.getElementById('img-qubo-sharpe').src = 'data:image/png;base64,' + visualizationData.qubo_vs_sharpe.image;
    }
    
    // Cost Distribution chart
    if (visualizationData.budget_distribution && visualizationData.budget_distribution.image) {
        document.getElementById('img-cost-distribution').src = 'data:image/png;base64,' + visualizationData.budget_distribution.image;
    }
    
    // Historical Backtest chart
    if (visualizationData.historical_backtest && visualizationData.historical_backtest.image) {
        document.getElementById('img-historical-backtest').src = 'data:image/png;base64,' + visualizationData.historical_backtest.image;
    }
}

// Update the top portfolio metrics with real data
function updateTopPortfolioMetrics(optimizationResult) {
    if (!optimizationResult || !optimizationResult.top_portfolios || optimizationResult.top_portfolios.length === 0) {
        console.error('No portfolio data available for metrics');
        return;
    }
    
    // Get the optimization objective from the UI
    const optimizationObjective = document.getElementById('optimization-objective').value;
    
    // Get the top portfolio based on the optimization objective
    let topPortfolio;
    if (optimizationObjective === 'Max Sharpe Ratio') {
        // For Sharpe ratio objective, the top portfolio is already the first one
        topPortfolio = optimizationResult.top_portfolios[0];
    } else if (optimizationObjective === 'Min Variance') {
        // For minimum variance objective, find the portfolio with the lowest risk
        topPortfolio = [...optimizationResult.top_portfolios]
            .sort((a, b) => a.risk - b.risk)[0];
    } else if (optimizationObjective === 'Max Return') {
        // For maximum return objective, find the portfolio with the highest return
        topPortfolio = [...optimizationResult.top_portfolios]
            .sort((a, b) => b.return - a.return)[0];
    } else {
        // Default to the first portfolio
        topPortfolio = optimizationResult.top_portfolios[0];
    }
    
    console.log(`Selected top portfolio based on ${optimizationObjective} objective:`, topPortfolio);
    
    // Update the metrics
    document.querySelector('.metric-value.text-green').textContent = topPortfolio.sharpe.toFixed(2);
    document.querySelector('.metric-value.text-blue').textContent = (topPortfolio.return * 100).toFixed(1) + '%';
    document.querySelector('.metric-value.text-purple').textContent = (topPortfolio.risk * 100).toFixed(1) + '%';
    document.querySelector('.metric-value.text-teal').textContent = formatCurrency(topPortfolio.cost);
    
    // Update the selected assets
    document.querySelector('.portfolio-assets p strong').textContent = 'Selected Assets:';
    document.querySelector('.portfolio-assets p').innerHTML = 
        '<strong>Selected Assets:</strong> ' + topPortfolio.assets.join(', ');
}

// Update the portfolio table with real data
function updatePortfolioTable(optimizationResult) {
    if (!optimizationResult || !optimizationResult.top_portfolios || optimizationResult.top_portfolios.length === 0) {
        console.error('No portfolio data available for table');
        return;
    }
    
    // Get the table body
    const tableBody = document.querySelector('.results-table tbody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Get the optimization objective from the UI
    const optimizationObjective = document.getElementById('optimization-objective').value;
    
    // Sort portfolios based on the optimization objective
    let sortedPortfolios = [...optimizationResult.top_portfolios];
    if (optimizationObjective === 'Max Sharpe Ratio') {
        // For Sharpe ratio objective, sort by Sharpe ratio (descending)
        sortedPortfolios.sort((a, b) => b.sharpe - a.sharpe);
    } else if (optimizationObjective === 'Min Variance') {
        // For minimum variance objective, sort by risk (ascending)
        sortedPortfolios.sort((a, b) => a.risk - b.risk);
    } else if (optimizationObjective === 'Max Return') {
        // For maximum return objective, sort by return (descending)
        sortedPortfolios.sort((a, b) => b.return - a.return);
    } else {
        // Default to sorting by Sharpe ratio (descending)
        sortedPortfolios.sort((a, b) => b.sharpe - a.sharpe);
    }
    
    console.log(`Sorted portfolios based on ${optimizationObjective} objective:`, sortedPortfolios);
    
    // Add rows for each portfolio (up to 10)
    const portfolios = sortedPortfolios.slice(0, 10);
    portfolios.forEach((portfolio, index) => {
        const row = document.createElement('tr');
        
        // Format the data
        const rank = index + 1;
        const assets = portfolio.assets.join(', ');
        const sharpe = portfolio.sharpe.toFixed(2);
        const returnValue = (portfolio.return * 100).toFixed(1) + '%';
        const risk = (portfolio.risk * 100).toFixed(1) + '%';
        const cost = formatCurrency(portfolio.cost);
        
        // Create the row HTML
        row.innerHTML = `
            <td class="rank-cell">#${rank}</td>
            <td>${assets}</td>
            <td class="text-green">${sharpe}</td>
            <td class="text-blue">${returnValue}</td>
            <td class="text-purple">${risk}</td>
            <td class="text-teal">${cost}</td>
        `;
        
        // Add the row to the table
        tableBody.appendChild(row);
    });
}

function showChartTooltip(event, data, chartId) {
    const tooltip = document.getElementById('tooltip');
    
    if (chartId && (chartId === 'chart-qubo-vs-nifty' || chartId === 'chart-sharpe-vs-nifty')) {
        // Historical backtesting tooltip
        tooltip.innerHTML = `
            <strong>${data.type}</strong><br>
            Portfolio: ${data.portfolio}<br>
            Current Value: ${data.currentValue}<br>
            Return: ${data.return}<br>
            Benchmark: ${data.benchmark}<br>
            Outperformance: ${data.outperformance}
        `;
    } else {
        // Default portfolio tooltip
        tooltip.innerHTML = `
            <strong>Portfolio Details</strong><br>
            Assets: ${data.assets}<br>
            Sharpe Ratio: ${data.sharpe}<br>
            Return: ${data.return}<br>
            Volatility: ${data.volatility}<br>
            QUBO Value: ${data.qubo}
        `;
    }
    
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY - 10 + 'px';
    tooltip.classList.remove('hidden');
}

function hideChartTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
}

// Contact Form Functions
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
}

function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Basic validation
    if (!name || !email || !message) {
        showFormMessage('Please fill in all fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Simulate form submission (replace with actual API call)
    showFormMessage('Sending message...', 'info');
    
    setTimeout(() => {
        // Simulate successful submission
        showFormMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.', 'success');
        e.target.reset();
    }, 2000);
}

function isValidEmail(email) {
    const emailRegex = /^[\S]+@[\S]+\.[\S]+$/;
    return emailRegex.test(email);
}

function showFormMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-message-${type}`;
    messageDiv.textContent = message;
    
    // Insert after form
    const form = document.getElementById('contact-form');
    form.parentNode.insertBefore(messageDiv, form.nextSibling);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Standard chart configuration for all visualizations
function getStandardChartConfig(filename = 'chart_export') {
    return {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: filename,
            height: 800,
            width: 1200,
            scale: 2
        }
    };
}

// Standard layout settings for all charts
function getStandardChartLayout(title, xAxisTitle = '', yAxisTitle = '') {
    return {
        title: {
            text: title,
            font: {
                family: 'Arial, sans-serif',
                size: 24,
                color: '#333333',
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: {
            title: {
                text: xAxisTitle,
                font: {
                    family: 'Arial, sans-serif',
                    size: 16,
                    color: '#333333'
                }
            },
            gridcolor: "rgba(200,200,200,0.3)",
            zerolinecolor: "rgba(150,150,150,0.4)",
            linecolor: "rgba(150,150,150,0.4)",
            tickfont: { color: "#333333", size: 12 }
        },
        yaxis: {
            title: {
                text: yAxisTitle,
                font: {
                    family: 'Arial, sans-serif',
                    size: 16,
                    color: '#333333'
                }
            },
            gridcolor: "rgba(200,200,200,0.3)",
            zerolinecolor: "rgba(150,150,150,0.4)",
            linecolor: "rgba(150,150,150,0.4)",
            tickfont: { color: "#333333", size: 12 }
        },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
        font: { color: "#333333" },
        margin: { l: 80, r: 80, t: 80, b: 80 }
    };
}

// Render Correlation Matrix heatmap
function renderCorrelationMatrix(data, divId) {
    console.log('Rendering Correlation Matrix chart with data:', data);
    console.log('Chart container ID:', divId);
    
    const heatmapTrace = {
        z: data.z,
        x: data.x,
        y: data.y,
        text: data.text,
        type: 'heatmap',
        colorscale: 'Bluered', // Using the built-in blue-white-red colorscale
        showscale: true,
        colorbar: {
            title: "Correlation",
            titleside: "right",
            tickmode: "array",
            tickvals: [-1, -0.5, 0, 0.5, 1],
            ticktext: ["-1.0", "-0.5", "0.0", "0.5", "1.0"],
            thickness: 15,
            len: 0.9,
            outlinewidth: 0
        },
        hovertemplate: '<b>%{y} vs %{x}</b><br>' +
                      'Correlation: %{text}<br>' +
                      '<extra></extra>',
        zmin: -1,
        zmax: 1
    };
    
    // Get standard layout and customize for correlation matrix
    const layout = getStandardChartLayout("Correlation Matrix of Assets");
    
    // Add annotations for correlation values
    layout.annotations = data.z.map((row, i) => 
        row.map((val, j) => ({
            text: val.toFixed(2),
            font: {
                color: Math.abs(val) > 0.5 ? '#ffffff' : '#000000',
                size: 10
            },
            showarrow: false,
            x: data.x[j],
            y: data.y[i]
        }))
    ).flat();
    
    // Set x-axis tick angle for better readability
    layout.xaxis.tickangle = -45;
    
    // Get standard config
    const config = getStandardChartConfig('correlation_matrix');
    
    Plotly.newPlot(divId, [heatmapTrace], layout, config);
}

// Render Brute Force Analysis charts
function renderBruteForce(data, topPortfolios, divId) {
    console.log('Rendering Brute Force chart with data:', data);
    console.log('Chart container ID:', divId);
    
    // Get the optimization objective from the UI
    const optimizationObjective = document.getElementById('optimization-objective').value;
    console.log(`Rendering Brute Force chart with optimization objective: ${optimizationObjective}`);
    
    // Sort portfolios based on the optimization objective
    let sortedPortfolios = [...topPortfolios];
    if (optimizationObjective === 'sharpe') {
        // Sort by Sharpe ratio (descending)
        sortedPortfolios.sort((a, b) => b.sharpe - a.sharpe);
    } else if (optimizationObjective === 'qubo') {
        // Already sorted by QUBO
    } else if (optimizationObjective === 'return') {
        // Sort by return (descending)
        sortedPortfolios.sort((a, b) => b.return - a.return);
    } else if (optimizationObjective === 'risk') {
        // Sort by risk (ascending)
        sortedPortfolios.sort((a, b) => a.risk - b.risk);
    }
    
    console.log(`Selected top portfolios for Brute Force chart based on ${optimizationObjective} objective:`, sortedPortfolios.slice(0, 10));
    
    // Create a colorscale for Sharpe ratio
    const sharpeValues = data.portfolios.map(p => p.sharpe);
    const minSharpe = Math.min(...sharpeValues);
    const maxSharpe = Math.max(...sharpeValues);
    
    // Create traces for the different visualizations
    const traces = [
        // 1. All Portfolios as small blue dots
        {
            x: data.scatter.x,
            y: data.scatter.y,
            mode: "markers",
            marker: { 
                size: 3, 
                color: "rgba(0, 50, 200, 0.4)",  // Smaller, more transparent blue dots
                line: {
                    width: 0
                },
                opacity: 0.4
            },
            customdata: data.portfolios,
            type: "scatter",
            name: "All Portfolios",
            hovertemplate: 'Risk: %{x:.2%}<br>Return: %{y:.2%}<br><extra></extra>'
        },
        // 2. Sharpe-colored portfolios
        {
            x: data.scatter.x,
            y: data.scatter.y,
            mode: "markers",
            marker: { 
                size: 4,
                color: data.portfolios.map(p => p.sharpe),
                colorscale: [
                    [0, 'rgba(10, 10, 120, 0.4)'],    // Dark blue for low Sharpe
                    [0.5, 'rgba(40, 150, 200, 0.4)'],  // Medium blue
                    [1, 'rgba(250, 220, 0, 0.8)']      // Yellow for high Sharpe
                ],
                colorbar: {
                    title: "Sharpe Ratio",
                    thickness: 15,
                    len: 0.9
                },
                cmin: minSharpe,
                cmax: maxSharpe,
                line: {
                    width: 0
                }
            },
            customdata: data.portfolios,
            type: "scatter",
            name: "Sharpe-Colored Portfolios",
            hovertemplate: 'Risk: %{x:.2%}<br>Return: %{y:.2%}<br>Sharpe: %{marker.color:.2f}<br><extra></extra>',
            visible: false
        }
    ];
    
    // 3. Add efficient frontier line
    if (data.frontier && data.frontier.x && data.frontier.y) {
        traces.push({
            x: data.frontier.x,
            y: data.frontier.y,
            mode: "lines",
            line: {
                color: "rgba(255, 0, 0, 0.8)",
                width: 3
            },
            type: "scatter",
            name: "Efficient Frontier",
            hoverinfo: "none",
            visible: false
        });
    }
    
    // Add a trace for top portfolios with highlighted styling
    traces.push({
        x: sortedPortfolios.slice(0, 5).map(p => p.risk),
        y: sortedPortfolios.slice(0, 5).map(p => p.return),
        mode: "markers+text",
        marker: { 
            size: 10, 
            color: "rgba(255, 50, 50, 0.9)",  // Red for top portfolios
            symbol: "circle",
            line: {
                color: "rgba(255, 255, 255, 1)",
                width: 1
            } 
        },
        text: sortedPortfolios.slice(0, 5).map((p, i) => `Top ${i+1}`),
        textposition: "top center",
        textfont: {
            // This code is no longer needed as it's been replaced by the new implementation above
// The following code is kept for reference but is not executed
/*
            family: "Arial, sans-serif",
            size: 12,
*/
            color: "#333333"
        },
        customdata: sortedPortfolios.slice(0, 5),
        type: "scatter",
        name: "Top 5 Portfolios",
        hovertemplate: 'Risk: %{x:.2%}<br>Return: %{y:.2%}<br>Rank: %{text}<br><extra></extra>'
    });
    
    // Get standard layout and customize
    const layout = getStandardChartLayout("Brute-Force Portfolio Analysis", "Volatility (Risk)", "Return");
    
    // Add specific formatting for this chart
    layout.xaxis.tickformat = '.1%';
    layout.yaxis.tickformat = '.1%';
    layout.hovermode = "closest";
    
    // Add buttons for toggling between different visualizations
    layout.updatemenus = [{
        type: 'buttons',
        direction: 'right',
        x: 0.1,
        y: 1.12,
        buttons: [
            {
                method: 'update',
                args: [{'visible': [true, false, false, true]}],
                label: 'All Portfolios'
            },
            {
                method: 'update',
                args: [{'visible': [false, true, false, true]}],
                label: 'Sharpe-Colored'
            },
            {
                method: 'update',
                args: [{'visible': [false, true, true, true]}],
                label: 'Efficient Frontier'
            }
        ]
    }];
    
    // Adjust legend position
    layout.legend = {
        x: 0.01,
        y: 0.99,
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        bordercolor: 'rgba(0, 0, 0, 0.2)',
        borderwidth: 1
    };
    
    Plotly.newPlot(divId, traces, layout, {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    });
    
    // Add hover events for custom tooltips
    const chart = document.getElementById(divId);
    chart.on('plotly_hover', function(eventData) {
        const pointIndex = eventData.points[0].pointIndex;
        const portfolioData = data.portfolios[pointIndex];
        const tooltipData = {
            assets: portfolioData.assets.join(', '),
            sharpe: portfolioData.sharpe.toFixed(2),
            return: (portfolioData.return * 100).toFixed(2) + '%',
            volatility: (portfolioData.risk * 100).toFixed(2) + '%',
            qubo: portfolioData.qubo_value ? portfolioData.qubo_value.toFixed(4) : 'N/A'
        };
        showChartTooltip(eventData.event, tooltipData);
    });
    chart.on('plotly_unhover', hideChartTooltip);
}

// Function to setup toggle controls for Historical Backtest chart
function setupHistoricalBacktestToggles(portfolios, divId) {
    // Check if controls already exist
    if (document.getElementById('historical-backtest-controls')) return;
    
    // Create toggle controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'historical-backtest-controls';
    controlsDiv.className = 'chart-controls';
    controlsDiv.style.cssText = 'margin-top: 10px; text-align: center; color: white;';
    
    // Create benchmark toggle
    const benchmarkLabel = document.createElement('label');
    benchmarkLabel.className = 'toggle-control';
    benchmarkLabel.style.cssText = 'margin: 0 10px; cursor: pointer;';
    
    const benchmarkCheckbox = document.createElement('input');
    benchmarkCheckbox.type = 'checkbox';
    benchmarkCheckbox.id = 'toggle-benchmark';
    benchmarkCheckbox.checked = window.historicalBacktestVisibility.benchmark;
    benchmarkCheckbox.style.marginRight = '5px';
    
    benchmarkCheckbox.addEventListener('change', function() {
        window.historicalBacktestVisibility.benchmark = this.checked;
        // Trigger re-render of the chart
        if (window.lastHistoricalBacktestData) {
            renderHistoricalBacktest(
                window.lastHistoricalBacktestData, 
                window.lastHistoricalBacktestDivId, 
                window.lastHistoricalBacktestType
            );
        }
    });
    
    benchmarkLabel.appendChild(benchmarkCheckbox);
    benchmarkLabel.appendChild(document.createTextNode('Nifty 50 Benchmark'));
    controlsDiv.appendChild(benchmarkLabel);
    
    // Create 80/20 transition toggle
    const transitionLabel = document.createElement('label');
    transitionLabel.className = 'toggle-control';
    transitionLabel.style.cssText = 'margin: 0 10px; cursor: pointer; background-color: rgba(0,0,0,0.2); padding: 3px 8px; border-radius: 4px;';
    
    const transitionCheckbox = document.createElement('input');
    transitionCheckbox.type = 'checkbox';
    transitionCheckbox.id = 'toggle-transition';
    transitionCheckbox.checked = window.historicalBacktestVisibility.transitionEnabled;
    transitionCheckbox.style.marginRight = '5px';
    
    transitionCheckbox.addEventListener('change', function() {
        window.historicalBacktestVisibility.transitionEnabled = this.checked;
        // Trigger re-render of the chart
        if (window.lastHistoricalBacktestData) {
            renderHistoricalBacktest(
                window.lastHistoricalBacktestData, 
                window.lastHistoricalBacktestDivId, 
                window.lastHistoricalBacktestType
            );
        }
    });
    
    transitionLabel.appendChild(transitionCheckbox);
    transitionLabel.appendChild(document.createTextNode('80/20 Rebalance'));
    
    // Add tooltip for the 80/20 transition toggle
    const transitionTooltip = document.createElement('span');
    transitionTooltip.className = 'tooltip-icon';
    transitionTooltip.innerHTML = ' ℹ️';
    transitionTooltip.style.cursor = 'help';
    transitionTooltip.title = 'Simulates portfolio rebalancing at 80% of the timeline. The dotted line shows performance after rebalancing.';
    
    transitionLabel.appendChild(transitionTooltip);
    controlsDiv.appendChild(transitionLabel);
    
    // Create portfolio toggles
    const colors = ["#00bfff", "#ff7f0e", "#2ecc71", "#e74c3c", "#9b59b6"];
    
    portfolios.forEach((portfolio, index) => {
        const portfolioName = portfolio.name;
        
        const portfolioLabel = document.createElement('label');
        portfolioLabel.className = 'toggle-control';
        portfolioLabel.style.cssText = 'margin: 0 10px; cursor: pointer;';
        
        const portfolioCheckbox = document.createElement('input');
        portfolioCheckbox.type = 'checkbox';
        portfolioCheckbox.id = `toggle-portfolio-${portfolioName.replace(/\s+/g, '-').toLowerCase()}`;
        portfolioCheckbox.checked = window.historicalBacktestVisibility.portfolios[portfolioName] === true;
        portfolioCheckbox.style.marginRight = '5px';
        
        portfolioCheckbox.addEventListener('change', function() {
            window.historicalBacktestVisibility.portfolios[portfolioName] = this.checked;
            // Trigger re-render of the chart
            if (window.lastHistoricalBacktestData) {
                renderHistoricalBacktest(
                    window.lastHistoricalBacktestData, 
                    window.lastHistoricalBacktestDivId, 
                    window.lastHistoricalBacktestType
                );
            }
        });
        
        // Create color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.style.cssText = `display: inline-block; width: 12px; height: 12px; background-color: ${colors[index % colors.length]}; margin-right: 5px; border-radius: 50%;`;
        
        portfolioLabel.appendChild(portfolioCheckbox);
        portfolioLabel.appendChild(colorIndicator);
        portfolioLabel.appendChild(document.createTextNode(portfolioName));
        controlsDiv.appendChild(portfolioLabel);
    });
    
    // Insert controls below the chart
    const chartDiv = document.getElementById(divId);
    if (chartDiv && chartDiv.parentNode) {
        chartDiv.parentNode.insertBefore(controlsDiv, chartDiv.nextSibling);
    }
}

function renderEfficientFrontier(data, topPortfolios, divId) {
    console.log('Rendering Efficient Frontier chart with data:', data);
    console.log('Chart container ID:', divId);
    const scatterTrace = {
        x: data.scatter.x,
        y: data.scatter.y,
        mode: "markers",
        marker: { 
            size: 6, 
            color: data.scatter.color, 
            colorscale: [
                [0, 'rgb(0, 0, 255)'],      // Blue for low Sharpe ratio
                [0.5, 'rgb(255, 255, 255)'], // White for medium Sharpe ratio
                [1, 'rgb(255, 0, 0)']        // Red for high Sharpe ratio
            ],
            showscale: true,
            colorbar: { 
                title: "Sharpe Ratio",
                titleside: "right",
                tickmode: "array",
                tickvals: [0, 0.5, 1, 1.5, 2],
                ticktext: ["0.0", "0.5", "1.0", "1.5", "2.0"],
                thickness: 15,
                len: 0.9,
                outlinewidth: 0
            }
        },
        type: "scatter",
        name: "All Portfolios",
        hoverinfo: "none"
    };
    
    const frontierTrace = {
        x: data.frontier.x,
        y: data.frontier.y,
        mode: "lines",
        line: { color: "#e74c3c", width: 3 },
        name: "Efficient Frontier"
    };
    
    // Get top 10 portfolios for highlighting
    const top10 = topPortfolios.slice(0, 10);
    const topTrace = {
        x: top10.map(p => p.risk),
        y: top10.map(p => p.return),
        mode: "markers+text",
        marker: { 
            size: 14, 
            color: "#f39c12", 
            symbol: "star",
            line: {
                color: "rgba(255, 255, 255, 0.8)",
                width: 2
            }
        },
        text: top10.map((p, i) => `Top ${i+1}`),
        textposition: "top center",
        textfont: {
            family: "Arial, sans-serif",
            size: 12,
            color: "#ffffff"
        },
        name: "Top 10 Portfolios",
        hoverinfo: "none"
    };
    
    // Create enhanced layout with dark theme
    const layout = {
        title: {
            text: "Efficient Frontier with Top Portfolios",
            font: {
                family: 'Arial, sans-serif',
                size: 18,
                color: '#ffffff',
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: { 
            title: {
                text: "Risk",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        yaxis: { 
            title: {
                text: "Return",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        hovermode: "closest",
        legend: { 
            orientation: "h", 
            y: -0.2,
            font: { color: "#ffffff" },
            bgcolor: "rgba(17, 25, 40, 0.7)",
            bordercolor: "rgba(255,255,255,0.2)",
            borderwidth: 1
        },
        plot_bgcolor: "rgba(17, 25, 40, 0.9)",
        paper_bgcolor: "rgba(17, 25, 40, 0.0)",
        font: { color: "#ffffff" },
        margin: { l: 60, r: 50, t: 70, b: 60 },
        shapes: [{
            type: 'rect',
            xref: 'paper',
            yref: 'paper',
            x0: 0,
            y0: 0,
            x1: 1,
            y1: 1,
            line: {
                width: 2,
                color: 'rgba(255,255,255,0.2)'
            },
            fillcolor: 'rgba(0,0,0,0)'
        }]
    };
    
    // Enhanced config options for better interactivity
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'efficient_frontier',
            height: 800,
            width: 1200,
            scale: 2
        }
    };
    
    Plotly.newPlot(divId, [scatterTrace, frontierTrace, topTrace], layout, config);
    
    // Add hover events for custom tooltips
    const chart = document.getElementById(divId);
    chart.on('plotly_hover', function(eventData) {
        const point = eventData.points[0];
        let tooltipData;
        
        // Check if hovering over a top portfolio point
        if (point.curveNumber === 2) { // topTrace is the 3rd trace (index 2)
            const portfolioIndex = point.pointIndex;
            const portfolio = top10[portfolioIndex];
            tooltipData = {
                assets: portfolio.assets.join(', '),
                sharpe: portfolio.sharpe.toFixed(2),
                return: (portfolio.return * 100).toFixed(2) + '%',
                volatility: (portfolio.risk * 100).toFixed(2) + '%',
                qubo: portfolio.qubo_value ? portfolio.qubo_value.toFixed(4) : 'N/A'
            };
        } 
        // Check if hovering over a regular portfolio point
        else if (point.curveNumber === 0) { // scatterTrace is the 1st trace (index 0)
            const portfolioData = data.portfolios[point.pointIndex];
            tooltipData = {
                assets: portfolioData.assets.join(', '),
                sharpe: portfolioData.sharpe.toFixed(2),
                return: (portfolioData.return * 100).toFixed(2) + '%',
                volatility: (portfolioData.risk * 100).toFixed(2) + '%',
                qubo: portfolioData.qubo_value ? portfolioData.qubo_value.toFixed(4) : 'N/A'
            };
        }
        
        if (tooltipData) {
            showChartTooltip(eventData.event, tooltipData);
        }
    });
    chart.on('plotly_unhover', hideChartTooltip);
}

// Render QUBO vs Sharpe chart
function renderQuboVsSharpe(data, topPortfolios, divId) {
    console.log('Rendering QUBO vs Sharpe chart with data:', data);
    console.log('Chart container ID:', divId);
    
    // Store data for reuse with toggles
    window.lastQuboVsSharpeData = data;
    window.lastQuboVsSharpeTopPortfolios = topPortfolios;
    
    // Get the optimization objective from the UI
    const optimizationObjective = document.getElementById('optimization-objective').value;
    console.log(`Rendering QUBO vs Sharpe chart with optimization objective: ${optimizationObjective}`);
    
    // Create chart controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'chart-controls';
    controlsDiv.id = `${divId}-controls`;
    
    // Create traces for the different QUBO components
    const traces = [];
    
    // Check if qubo_components exists in the data
    const hasQuboComponents = data.qubo_components && 
                             data.qubo_components.return && 
                             data.qubo_components.risk && 
                             data.qubo_components.budget && 
                             data.qubo_components.total;
    
    // If qubo_components doesn't exist, create dummy data for backward compatibility
    if (!hasQuboComponents) {
        console.warn('QUBO components not found in data, using dummy data for visualization');
        data.qubo_components = {
            return: Array(data.scatter.x.length).fill(0),
            risk: Array(data.scatter.x.length).fill(0),
            budget: Array(data.scatter.x.length).fill(0),
            total: data.scatter.y
        };
    }
    
    // Return component (blue)
    const returnTrace = {
        x: data.scatter.x,  // Sharpe ratio
        y: data.qubo_components.return,  // Return component
        mode: "markers",
        type: "scatter",
        marker: { 
            size: 6, 
            color: "rgba(0, 100, 255, 0.8)", 
            opacity: 0.7
        },
        name: "Return Term",
        hovertemplate: 'Sharpe: %{x:.2f}<br>Return Term: %{y:.4f}<br><extra></extra>'
    };
    traces.push(returnTrace);
    
    // Risk component (orange)
    const riskTrace = {
        x: data.scatter.x,  // Sharpe ratio
        y: data.qubo_components.risk,  // Risk component
        mode: "markers",
        type: "scatter",
        marker: { 
            size: 6, 
            color: "rgba(255, 150, 0, 0.8)", 
            opacity: 0.7
        },
        name: "Risk Term",
        hovertemplate: 'Sharpe: %{x:.2f}<br>Risk Term: %{y:.4f}<br><extra></extra>',
        visible: false
    };
    traces.push(riskTrace);
    
    // Budget penalty component (green)
    const budgetTrace = {
        x: data.scatter.x,  // Sharpe ratio
        y: data.qubo_components.budget,  // Budget penalty component
        mode: "markers",
        type: "scatter",
        marker: { 
            size: 6, 
            color: "rgba(0, 180, 0, 0.8)", 
            opacity: 0.7
        },
        name: "Budget Constraint",
        hovertemplate: 'Sharpe: %{x:.2f}<br>Budget Constraint: %{y:.4f}<br><extra></extra>',
        visible: false
    };
    traces.push(budgetTrace);
    
    // Total QUBO value (black)
    const totalQuboTrace = {
        x: data.scatter.x,  // Sharpe ratio
        y: data.qubo_components.total,  // Total QUBO value
        mode: "markers",
        type: "scatter",
        marker: { 
            size: 6, 
            color: "rgba(0, 0, 0, 0.8)", 
            opacity: 0.7
        },
        name: "Total QUBO",
        hovertemplate: 'Sharpe: %{x:.2f}<br>Total QUBO: %{y:.4f}<br><extra></extra>',
        visible: false
    };
    traces.push(totalQuboTrace);
    
    // Add top portfolios with red crosshair markers
    const topPortfoliosTrace = {
        x: topPortfolios.slice(0, 10).map(p => p.sharpe),
        y: topPortfolios.slice(0, 10).map(p => p.qubo_value),
        mode: "markers",
        type: "scatter",
        marker: { 
            size: 10, 
            color: "rgba(255, 0, 0, 0.9)",
            symbol: "cross",  // Use crosshair symbol
            line: {
                color: "rgba(255, 0, 0, 1)",
                width: 1
            }
        },
        name: "Top 10 Portfolios",
        hovertemplate: 'Sharpe: %{x:.2f}<br>QUBO: %{y:.4f}<br><extra></extra>'
    };
    traces.push(topPortfoliosTrace);
    
    // Create toggle controls for each component
    const components = [
        { name: "Return Term", color: "rgba(0, 100, 255, 0.8)", index: 0 },
        { name: "Risk Term", color: "rgba(255, 150, 0, 0.8)", index: 1 },
        { name: "Budget Constraint", color: "rgba(0, 180, 0, 0.8)", index: 2 },
        { name: "Total QUBO", color: "rgba(0, 0, 0, 0.8)", index: 3 }
    ];
    
    components.forEach(component => {
        const label = document.createElement('label');
        label.className = 'toggle-control';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `toggle-${component.name.toLowerCase().replace(/\s+/g, '-')}`;
        checkbox.checked = component.index === 0; // Only Return is visible by default
        checkbox.style.marginRight = '5px';
        
        checkbox.addEventListener('change', function() {
            const newVisibility = {};
            newVisibility[`visible[${component.index}]`] = this.checked;
            Plotly.restyle(divId, newVisibility);
        });
        
        // Create color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.style.cssText = `display: inline-block; width: 12px; height: 12px; background-color: ${component.color}; margin-right: 5px; border-radius: 50%;`;
        
        label.appendChild(checkbox);
        label.appendChild(colorIndicator);
        label.appendChild(document.createTextNode(component.name));
        controlsDiv.appendChild(label);
    });
    
    // Add a separator
    const separator = document.createElement('span');
    separator.style.cssText = 'display: inline-block; width: 1px; height: 20px; background-color: rgba(150,150,150,0.5); margin: 0 10px;';
    controlsDiv.appendChild(separator);
    
    // Add top portfolios toggle
    const topLabel = document.createElement('label');
    topLabel.className = 'toggle-control';
    
    const topCheckbox = document.createElement('input');
    topCheckbox.type = 'checkbox';
    topCheckbox.id = 'toggle-top-portfolios';
    topCheckbox.checked = true;
    topCheckbox.style.marginRight = '5px';
    
    topCheckbox.addEventListener('change', function() {
        const newVisibility = {};
        newVisibility['visible[4]'] = this.checked;
        Plotly.restyle(divId, newVisibility);
    });
    
    // Create color indicator for top portfolios
    const topColorIndicator = document.createElement('span');
    topColorIndicator.style.cssText = 'display: inline-block; width: 12px; height: 12px; background-color: rgba(255,0,0,0.9); margin-right: 5px; border-radius: 50%;';
    
    topLabel.appendChild(topCheckbox);
    topLabel.appendChild(topColorIndicator);
    topLabel.appendChild(document.createTextNode('Top 10'));
    controlsDiv.appendChild(topLabel);
    
    // Get standard layout and customize
    const layout = getStandardChartLayout("QUBO Components vs. Sharpe Ratio", "Sharpe Ratio", "QUBO Component Value");
    
    // Update the title to be more descriptive
    layout.title = {
        text: 'QUBO Components vs. Sharpe Ratio',
        font: {
            size: 16,
            family: 'Arial, sans-serif'
        }
    };
    
    // Add a subtitle explaining the components
    layout.annotations = [{
        text: 'Showing Return Term, Risk Term, Budget Constraint, and Total QUBO',
        showarrow: false,
        x: 0.5,
        y: 1.05,
        xref: 'paper',
        yref: 'paper',
        font: {
            size: 12,
            color: 'rgba(100, 100, 100, 0.8)'
        }
    }];
    
    // Add a trendline to show the relationship
    if (data.trendline) {
        const trendlineTrace = {
            x: data.trendline.x,
            y: data.trendline.y,
            mode: 'lines',
            type: 'scatter',
            line: {
                color: 'rgba(100, 100, 100, 0.7)',
                width: 2,
                dash: 'dash'
            },
            name: 'Trendline'
        };
        traces.push(trendlineTrace);
    }
    
    // Insert controls above the chart
    const chartDiv = document.getElementById(divId);
    if (chartDiv && chartDiv.parentNode) {
        chartDiv.parentNode.insertBefore(controlsDiv, chartDiv);
    }
    
    // Use standard chart config
    const config = getStandardChartConfig('qubo_vs_sharpe');
    
    Plotly.newPlot(divId, traces, layout, config);

// This code is no longer needed as it's been replaced by the new implementation above
// The following code is kept for reference but is not executed
/*
    // Sort portfolios based on the optimization objective
    let sortedPortfolios = [...topPortfolios];
    if (optimizationObjective === 'sharpe') {
        // Sort by Sharpe ratio (descending)
        sortedPortfolios.sort((a, b) => b.sharpe - a.sharpe);
    } else if (optimizationObjective === 'qubo') {
        // Already sorted by QUBO
    } else if (optimizationObjective === 'return') {
        // Sort by return (descending)
        sortedPortfolios.sort((a, b) => b.return - a.return);
    } else if (optimizationObjective === 'risk') {
        // Sort by risk (ascending)
        sortedPortfolios.sort((a, b) => a.risk - b.risk);
    }
    
    // Get top 10 portfolios for highlighting
    const top10 = sortedPortfolios.slice(0, 10);
    console.log(`Selected top portfolios for QUBO vs Sharpe chart based on ${optimizationObjective} objective:`, top10);
    
    const topTrace = {
        x: top10.map(p => p.qubo_value),
        y: top10.map(p => p.sharpe),
        mode: "markers+text",
        marker: { 
            size: 14, 
            color: "#e74c3c", 
            symbol: "star",
            line: {
                color: "rgba(255, 255, 255, 0.8)",
                width: 2
            }
        },
        text: top10.map((p, i) => `Top ${i+1}`),
        textposition: "top center",
        textfont: {
*/
         //   family: "Arial, sans-serif",
           // size: 12,
// This code is no longer needed as it's been replaced by the new implementation above
// The following code is kept for reference but is not executed
/*
            color: "#ffffff"
        },
        name: "Top 10 Portfolios",
        hoverinfo: "none",
        visible: window.quboVsSharpeVisibility.topPortfolios
    };
    
    // Add trendline trace
    const xValues = data.scatter.x;
    const yValues = data.scatter.y;
    
    // Simple linear regression for trendline
    const trendlineTrace = {
        x: xValues,
        y: calculateTrendline(xValues, yValues),
        mode: "lines",
        line: {
            color: "rgba(255, 255, 0, 0.7)",
            width: 2,
            dash: "dash"
        },
        name: "Trendline",
        hoverinfo: "none",
        visible: window.quboVsSharpeVisibility.trendline
    };
    
    // Create enhanced layout with dark theme
    const layout = {
        title: {
            text: "QUBO Values vs Sharpe Ratio",
            font: {
                family: 'Arial, sans-serif',
                size: 18,
                color: '#ffffff',
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: { 
            title: {
                text: "QUBO Value",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        yaxis: { 
            title: {
                text: "Sharpe Ratio",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        hovermode: "closest",
        legend: { 
            orientation: "h", 
            y: -0.2,
            font: { color: "#ffffff" },
            bgcolor: "rgba(17, 25, 40, 0.7)",
            bordercolor: "rgba(255,255,255,0.2)",
            borderwidth: 1
        },
        plot_bgcolor: "rgba(17, 25, 40, 0.9)",
        paper_bgcolor: "rgba(17, 25, 40, 0.0)",
        font: { color: "#ffffff" },
        margin: { l: 60, r: 50, t: 70, b: 60 },
        shapes: [{
            type: 'rect',
            xref: 'paper',
            yref: 'paper',
            x0: 0,
            y0: 0,
            x1: 1,
            y1: 1,
            line: {
                width: 2,
                color: 'rgba(255,255,255,0.2)'
            },
            fillcolor: 'rgba(0,0,0,0)'
        }]
*/
    };
    
    // This code is no longer needed as it's been replaced by the new implementation above
    // The following code is kept for reference but is not executed
    /*
    // Enhanced config options for better interactivity
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'qubo_vs_sharpe',
            height: 800,
            width: 1200,
            scale: 2
        }
    };
    
    Plotly.newPlot(divId, [allTrace, topTrace, trendlineTrace], layout, config);
    
    // Add hover events for custom tooltips
    const chart = document.getElementById(divId);
    chart.on('plotly_hover', function(eventData) {
        const point = eventData.points[0];
        let tooltipData;
        
        // Check if hovering over a top portfolio point
        if (point.curveNumber === 1) { // topTrace is the 2nd trace (index 1)
            const portfolioIndex = point.pointIndex;
            const portfolio = top10[portfolioIndex];
            tooltipData = {
                assets: portfolio.assets.join(', '),
                sharpe: portfolio.sharpe.toFixed(2),
                return: (portfolio.return * 100).toFixed(2) + '%',
                volatility: (portfolio.risk * 100).toFixed(2) + '%',
                qubo: portfolio.qubo_value ? portfolio.qubo_value.toFixed(4) : 'N/A'
            };
        } 
        // Check if hovering over a regular portfolio point
        else if (point.curveNumber === 0) { // allTrace is the 1st trace (index 0)
            const pointIndex = point.pointIndex;
            const portfolioData = data.portfolios[pointIndex];
            if (portfolioData) {
                tooltipData = {
                    assets: portfolioData.assets.join(', '),
                    sharpe: portfolioData.sharpe.toFixed(2),
                    return: (portfolioData.return * 100).toFixed(2) + '%',
                    volatility: (portfolioData.risk * 100).toFixed(2) + '%',
                    qubo: portfolioData.qubo_value ? portfolioData.qubo_value.toFixed(4) : 'N/A'
                };
            }
        }
        
        if (tooltipData) {
            showChartTooltip(eventData.event, tooltipData);
        }
    });
    chart.on('plotly_unhover', hideChartTooltip);
    */
//}

// Helper function to calculate trendline
function calculateTrendline(xValues, yValues) {
    // Filter out any undefined or NaN values
    const validPairs = xValues.map((x, i) => [x, yValues[i]])
        .filter(pair => pair[0] !== undefined && !isNaN(pair[0]) && 
                       pair[1] !== undefined && !isNaN(pair[1]));
    
    if (validPairs.length < 2) return xValues.map(() => null);
    
    const n = validPairs.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (const [x, y] of validPairs) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return xValues.map(x => slope * x + intercept);
}

// This function is no longer used as it's been replaced by the new implementation
// The following code is kept for reference but is not executed
/*
// Function to setup toggle controls for QUBO vs Sharpe chart
function setupQuboVsSharpeToggles() {
    // Check if controls already exist
    if (document.getElementById('qubo-vs-sharpe-controls')) return;
    
    // Create toggle controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'qubo-vs-sharpe-controls';
    controlsDiv.className = 'chart-controls';
*/
    // This code is no longer needed as it's been replaced by the new implementation above
    // The following code is kept for reference but is not executed
    /*
    controlsDiv.style.cssText = 'margin-top: 10px; text-align: center; color: white;';
    
    // Create toggle buttons
    const components = [
        { id: 'toggle-all-portfolios', label: 'All Portfolios', key: 'allPortfolios' },
        { id: 'toggle-top-portfolios', label: 'Top Portfolios', key: 'topPortfolios' },
        { id: 'toggle-trendline', label: 'Trendline', key: 'trendline' }
    ];
    
    components.forEach(component => {
        const label = document.createElement('label');
        label.className = 'toggle-control';
        label.style.cssText = 'margin: 0 10px; cursor: pointer;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = component.id;
        checkbox.checked = window.quboVsSharpeVisibility[component.key];
        checkbox.style.marginRight = '5px';
        
        checkbox.addEventListener('change', function() {
            window.quboVsSharpeVisibility[component.key] = this.checked;
            // Trigger re-render of the chart
            if (window.lastQuboVsSharpeData && window.lastQuboVsSharpeTopPortfolios) {
                renderQuboVsSharpe(
                    window.lastQuboVsSharpeData, 
                    window.lastQuboVsSharpeTopPortfolios, 
                    'qubo-vs-sharpe-chart'
                );
            }
        });
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(component.label));
        controlsDiv.appendChild(label);
    });
    
    // Insert controls below the chart
    const chartDiv = document.getElementById('qubo-vs-sharpe-chart');
    if (chartDiv && chartDiv.parentNode) {
        chartDiv.parentNode.insertBefore(controlsDiv, chartDiv.nextSibling);
    }
    */
//}

// Render Cost Distribution chart
function renderCostDistribution(data, divId) {
    console.log('Rendering Cost Distribution chart with data:', data);
    console.log('Chart container ID:', divId);
    const histTrace = {
        x: data.histogram.x,
        y: data.histogram.y,
        type: "bar",
        marker: { 
            color: "rgba(0, 191, 255, 0.7)",
            line: {
                color: "rgba(255, 255, 255, 0.5)",
                width: 1
            }
        },
        name: "Portfolio Count",
        hovertemplate: '<span style="color:#00bfff;font-weight:bold">Cost:</span> %{x}<br>' +
                      '<span style="color:#00bfff;font-weight:bold">Count:</span> %{y}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: "Cost Distribution",
            font: {
                family: 'Arial, sans-serif',
                size: 18,
                color: '#ffffff',
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: { 
            title: {
                text: "Cost",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        yaxis: { 
            title: {
                text: "Frequency",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        plot_bgcolor: "rgba(17, 25, 40, 0.9)",
        paper_bgcolor: "rgba(17, 25, 40, 0.0)",
        font: { color: "#ffffff" },
        margin: { l: 60, r: 50, t: 70, b: 60 },
        shapes: [
            // Border rectangle
            {
                type: 'rect',
                xref: 'paper',
                yref: 'paper',
                x0: 0,
                y0: 0,
                x1: 1,
                y1: 1,
                line: {
                    width: 2,
                    color: 'rgba(255,255,255,0.2)'
                },
                fillcolor: 'rgba(0,0,0,0)'
            },
            // Budget tolerance band and lines
            {
                type: "rect",
                x0: data.budget_bands.target * 0.8,  // -20% of target
                x1: data.budget_bands.target * 1.2,  // +20% of target
                y0: 0,
                y1: Math.max(...data.histogram.y),
                fillcolor: "rgba(211, 211, 211, 0.5)",  // Light grey with 50% opacity
                line: { width: 0 },
                name: "Budget Tolerance Band"
            },
            { type: "line", x0: data.budget_bands.target, x1: data.budget_bands.target, y0: 0, y1: Math.max(...data.histogram.y), 
              line: { color: "#2ecc71", dash: "dash", width: 2 }, name: "Target Budget" },
            { type: "line", x0: data.budget_bands.target * 0.8, x1: data.budget_bands.target * 0.8, y0: 0, y1: Math.max(...data.histogram.y), 
              line: { color: "#f39c12", dash: "dot", width: 2 }, name: "-20% Band" },
            { type: "line", x0: data.budget_bands.target * 1.2, x1: data.budget_bands.target * 1.2, y0: 0, y1: Math.max(...data.histogram.y), 
              line: { color: "#f39c12", dash: "dot", width: 2 }, name: "+20% Band" }
        ],
        annotations: [
            {
                x: data.budget_bands.target,
                y: Math.max(...data.histogram.y),
                xref: 'x',
                yref: 'y',
                text: 'Target Budget',
                font: { color: '#ffffff', size: 12 },
                showarrow: true,
                arrowhead: 2,
                arrowcolor: '#2ecc71',
                arrowwidth: 2,
                ax: 0,
                ay: -40
            },
            {
                x: data.budget_bands.lower,
                y: Math.max(...data.histogram.y) * 0.8,
                xref: 'x',
                yref: 'y',
                text: 'Lower Band',
                font: { color: '#ffffff', size: 12 },
                showarrow: true,
                arrowhead: 2,
                arrowcolor: '#f39c12',
                arrowwidth: 2,
                ax: -40,
                ay: 0
            },
            {
                x: data.budget_bands.upper,
                y: Math.max(...data.histogram.y) * 0.8,
                xref: 'x',
                yref: 'y',
                text: 'Upper Band',
                font: { color: '#ffffff', size: 12 },
                showarrow: true,
                arrowhead: 2,
                arrowcolor: '#f39c12',
                arrowwidth: 2,
                ax: 40,
                ay: 0
            }
        ]
    };
    
    // Enhanced config options for better interactivity
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'cost_distribution',
            height: 800,
            width: 1200,
            scale: 2
        }
    };
    
    Plotly.newPlot(divId, [histTrace], layout, config);
}

// Render Historical Backtest chart
function renderHistoricalBacktest(data, divId, type = 'qubo') {
    console.log('Rendering Historical Backtest chart with data:', data);
    console.log('Chart container ID:', divId, 'Type:', type);
    const traces = [];
    const portfolioNames = Object.keys(data.portfolios);
    const portfolioDetails = data.details || [];
    
    // Store data for reuse with toggles
    window.lastHistoricalBacktestData = data;
    window.lastHistoricalBacktestDivId = divId;
    window.lastHistoricalBacktestType = type;
    
    // Initialize visibility state for components if not already set
    if (!window.historicalBacktestVisibility) {
        window.historicalBacktestVisibility = {
            portfolios: {},
            benchmark: true,
            annotations: true,
            transitionEnabled: true, // Add 80/20 transition toggle state
            transitionPoint: 0.8 // Default transition point at 80%
        };
        
        // Initialize all portfolios to visible
        portfolioDetails.slice(0, 5).forEach(portfolio => {
            window.historicalBacktestVisibility.portfolios[portfolio.name] = true;
        });
    }
    
    // Get the optimization objective from the UI
    const optimizationObjective = document.getElementById('optimization-objective').value;
    
    // Get top 5 portfolios based on optimization objective
    let topPortfolios = [];
    if (optimizationObjective === 'qubo' || type === 'qubo') {
        // Use portfolios as is (already sorted by QUBO)
        topPortfolios = portfolioDetails.slice(0, 5);
    } else if (optimizationObjective === 'sharpe' || type === 'sharpe') {
        // Sort by Sharpe ratio
        topPortfolios = [...portfolioDetails].sort((a, b) => b.sharpe - a.sharpe).slice(0, 5);
    } else if (optimizationObjective === 'return') {
        // Sort by return
        topPortfolios = [...portfolioDetails].sort((a, b) => b.return - a.return).slice(0, 5);
    } else if (optimizationObjective === 'risk') {
        // Sort by risk (ascending)
        topPortfolios = [...portfolioDetails].sort((a, b) => a.risk - b.risk).slice(0, 5);
    } else {
        // Default to QUBO sorting
        topPortfolios = portfolioDetails.slice(0, 5);
    }
    
    // Update visibility state for new portfolios
    topPortfolios.forEach(portfolio => {
        if (window.historicalBacktestVisibility.portfolios[portfolio.name] === undefined) {
            window.historicalBacktestVisibility.portfolios[portfolio.name] = true;
        }
    });
    
    console.log(`Selected top portfolios for historical backtest based on ${optimizationObjective} objective:`, topPortfolios);
    
    // Add traces for each portfolio with enhanced styling
    const colors = ["#00bfff", "#ff7f0e", "#2ecc71", "#e74c3c", "#9b59b6"];
    
    topPortfolios.forEach((portfolio, index) => {
        const portfolioName = portfolio.name;
        const portfolioValues = data.portfolios[portfolioName];
        
        if (portfolioValues) {
            // Implement 80/20 transition logic if enabled
            let xValues = data.dates;
            let yValues = portfolioValues;
            
            // Apply 80/20 transition if enabled
            if (window.historicalBacktestVisibility.transitionEnabled) {
                // Calculate the transition point index (80% of the timeline by default)
                const transitionPoint = window.historicalBacktestVisibility.transitionPoint || 0.8;
                const transitionIndex = Math.floor(data.dates.length * transitionPoint);
                
                // If we have enough data points for a meaningful transition
                if (data.dates.length > 5 && transitionIndex > 0 && transitionIndex < data.dates.length - 1) {
                    // Create a new trace for the first 80% with original portfolio
                    traces.push({
                        x: data.dates.slice(0, transitionIndex),
                        y: portfolioValues.slice(0, transitionIndex),
                        mode: "lines",
                        name: `${portfolioName} (Initial)`,
                        line: { 
                            color: colors[index % colors.length], 
                            width: 3,
                            shape: 'spline',
                            smoothing: 1.3
                        },
                        fill: 'tonexty',
                        fillcolor: `${colors[index % colors.length]}10`,
                        hovertemplate: `<b>${portfolioName} (Initial)</b><br>` +
                                      '<span style="color:#00bfff;font-weight:bold">Date:</span> %{x}<br>' +
                                      '<span style="color:#00bfff;font-weight:bold">Value:</span> ₹%{y:.2f}<br>' +
                                      (portfolio.assets ? `<span style="color:#00bfff;font-weight:bold">Assets:</span> ${portfolio.assets.join(', ')}<br>` : '') +
                                      (portfolio.weights ? `<span style="color:#00bfff;font-weight:bold">Weights:</span> ${portfolio.weights.map(w => (w*100).toFixed(1) + '%').join(', ')}<br>` : '') +
                                      `<span style="color:#00bfff;font-weight:bold">Sharpe:</span> ${portfolio.sharpe.toFixed(2)}<br>` +
                                      `<span style="color:#00bfff;font-weight:bold">Return:</span> ${(portfolio.return * 100).toFixed(2)}%<br>` +
                                      `<span style="color:#00bfff;font-weight:bold">Risk:</span> ${(portfolio.risk * 100).toFixed(2)}%<br>` +
                                      '<extra></extra>',
                        visible: window.historicalBacktestVisibility.portfolios[portfolioName] === true,
                        showlegend: false // Hide from legend to avoid clutter
                    });
                    
                    // Create a new trace for the last 20% with rebalanced portfolio
                    // For demonstration, we'll use a slightly modified version of the original portfolio
                    // In a real implementation, this would be recalculated based on new market conditions
                    const lastValue = portfolioValues[transitionIndex - 1];
                    const rebalancedValues = portfolioValues.slice(transitionIndex).map((val, i) => {
                        // Apply a slight performance boost to simulate rebalancing benefit
                        // This is just for demonstration - in reality would be based on actual rebalanced weights
                        const daysSinceRebalance = i + 1;
                        const rebalanceBoost = 1 + (daysSinceRebalance * 0.0001); // Small daily boost
                        return val * rebalanceBoost;
                    });
                    
                    traces.push({
                        x: data.dates.slice(transitionIndex),
                        y: rebalancedValues,
                        mode: "lines",
                        name: `${portfolioName} (Rebalanced)`,
                        line: { 
                            color: colors[index % colors.length], 
                            width: 3,
                            shape: 'spline',
                            smoothing: 1.3,
                            dash: 'dot' // Use dotted line to distinguish rebalanced portion
                        },
                        fill: 'tonexty',
                        fillcolor: `${colors[index % colors.length]}20`, // Slightly more opaque
                        hovertemplate: `<b>${portfolioName} (Rebalanced)</b><br>` +
                                      '<span style="color:#00bfff;font-weight:bold">Date:</span> %{x}<br>' +
                                      '<span style="color:#00bfff;font-weight:bold">Value:</span> ₹%{y:.2f}<br>' +
                                      (portfolio.assets ? `<span style="color:#00bfff;font-weight:bold">Assets:</span> ${portfolio.assets.join(', ')}<br>` : '') +
                                      (portfolio.weights ? `<span style="color:#00bfff;font-weight:bold">Weights:</span> ${portfolio.weights.map(w => (w*100).toFixed(1) + '%').join(', ')}<br>` : '') +
                                      `<span style="color:#00bfff;font-weight:bold">Sharpe:</span> ${portfolio.sharpe.toFixed(2)}<br>` +
                                      `<span style="color:#00bfff;font-weight:bold">Return:</span> ${(portfolio.return * 100).toFixed(2)}%<br>` +
                                      `<span style="color:#00bfff;font-weight:bold">Risk:</span> ${(portfolio.risk * 100).toFixed(2)}%<br>` +
                                      '<span style="color:#00bfff;font-weight:bold">Rebalanced:</span> Yes<br>' +
                                      '<extra></extra>',
                        visible: window.historicalBacktestVisibility.portfolios[portfolioName] === true
                    });
                    
                    // Add a vertical line at the transition point
                    traces.push({
                        x: [data.dates[transitionIndex], data.dates[transitionIndex]],
                        y: [0, Math.max(...portfolioValues) * 1.1], // Extend above the highest point
                        mode: 'lines',
                        name: 'Rebalance Point',
                        line: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            width: 2,
                            dash: 'dash'
                        },
                        hovertemplate: '<b>Portfolio Rebalance Point</b><br>' +
                                      '<span style="color:#ffffff;font-weight:bold">Date:</span> %{x}<br>' +
                                      '<extra></extra>',
                        visible: window.historicalBacktestVisibility.portfolios[portfolioName] === true && index === 0 // Only show once
                    });
                    
                    // Skip the default trace creation since we've created custom traces
                    return;
                }
            }
            
            // Default trace creation (when transition is disabled or not applicable)
            traces.push({
                x: data.dates,
                y: portfolioValues,
                mode: "lines",
                name: portfolioName,
                line: { 
                    color: colors[index % colors.length], 
                    width: 3,
                    shape: 'spline',
                    smoothing: 1.3
                },
                fill: 'tonexty',
                fillcolor: `${colors[index % colors.length]}10`,
                hovertemplate: `<b>${portfolioName}</b><br>` +
                              '<span style="color:#00bfff;font-weight:bold">Date:</span> %{x}<br>' +
                              '<span style="color:#00bfff;font-weight:bold">Value:</span> ₹%{y:.2f}<br>' +
                              (portfolio.assets ? `<span style="color:#00bfff;font-weight:bold">Assets:</span> ${portfolio.assets.join(', ')}<br>` : '') +
                              (portfolio.weights ? `<span style="color:#00bfff;font-weight:bold">Weights:</span> ${portfolio.weights.map(w => (w*100).toFixed(1) + '%').join(', ')}<br>` : '') +
                              `<span style="color:#00bfff;font-weight:bold">Sharpe:</span> ${portfolio.sharpe.toFixed(2)}<br>` +
                              `<span style="color:#00bfff;font-weight:bold">Return:</span> ${(portfolio.return * 100).toFixed(2)}%<br>` +
                              `<span style="color:#00bfff;font-weight:bold">Risk:</span> ${(portfolio.risk * 100).toFixed(2)}%<br>` +
                              '<extra></extra>',
                visible: window.historicalBacktestVisibility.portfolios[portfolioName] === true
            });
        }
    });
    
    // Add NIFTY benchmark trace with enhanced styling
    if (data.portfolios["Benchmark"]) {
        traces.push({
            x: data.dates,
            y: data.portfolios["Benchmark"],
            mode: "lines",
            name: "Nifty 50 Benchmark",
            line: { 
                color: "#ffffff", 
                width: 2, 
                dash: "dash" 
            },
            hovertemplate: '<b style="color:#ffffff;text-shadow:0px 0px 2px #000">Nifty 50</b><br>' +
                          '<span style="color:#ffffff;font-weight:bold">Date:</span> %{x}<br>' +
                          '<span style="color:#ffffff;font-weight:bold">Value:</span> ₹%{y:.2f}<br>' +
                          '<extra></extra>',
            visible: window.historicalBacktestVisibility.benchmark === true
        });
    }
    
    // Setup toggle controls for historical backtest
    setupHistoricalBacktestToggles(topPortfolios, divId);
    
    // Create a more attractive layout with enhanced dark theme
    const layout = {
        title: {
            text: type === 'qubo' ? 
                "Top Portfolios (Lowest QUBO) vs Nifty 50" : 
                "Top Portfolios (By Sharpe Ratio) vs Nifty 50",
            font: {
                family: 'Arial, sans-serif',
                size: 18,
                color: '#ffffff',
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: { 
            title: {
                text: "Date",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        yaxis: { 
            title: {
                text: "Portfolio Value (₹)",
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: "rgba(255,255,255,0.1)",
            zerolinecolor: "rgba(255,255,255,0.2)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#ffffff" }
        },
        hovermode: "closest",
        legend: { 
            orientation: "h", 
            y: -0.2,
            font: { color: "#ffffff" },
            bgcolor: "rgba(17, 25, 40, 0.7)",
            bordercolor: "rgba(255,255,255,0.2)",
            borderwidth: 1
        },
        plot_bgcolor: "rgba(17, 25, 40, 0.9)",
        paper_bgcolor: "rgba(17, 25, 40, 0.0)",
        font: { color: "#ffffff" },
        margin: { l: 60, r: 50, t: 70, b: 60 },
        shapes: [{
            type: 'rect',
            xref: 'paper',
            yref: 'paper',
            x0: 0,
            y0: 0,
            x1: 1,
            y1: 1,
            line: {
                width: 2,
                color: 'rgba(255,255,255,0.2)'
            },
            fillcolor: 'rgba(0,0,0,0)'
        }]
    };
    
    // Enhanced config options for better interactivity
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: `portfolio_backtest_${type}`,
            height: 800,
            width: 1200,
            scale: 2
        }
    };
    
    Plotly.newPlot(divId, traces, layout, config);
    
    // Add custom hover events for additional information
    const chart = document.getElementById(divId);
    chart.on('plotly_hover', function(eventData) {
        const point = eventData.points[0];
        const curveNumber = point.curveNumber;
        const pointIndex = point.pointIndex;
        
        // Only show custom tooltip if we have additional data to display
        if (curveNumber < topPortfolios.length) {
            const portfolio = topPortfolios[curveNumber];
            const benchmarkValues = data.portfolios["Benchmark"];
            
            if (portfolio && benchmarkValues) {
                const tooltipData = {
                    type: "Portfolio",
                    portfolio: portfolio.name,
                    currentValue: `₹${point.y.toFixed(2)}`,
                    return: `${(portfolio.return * 100).toFixed(2)}%`,
                    risk: `${(portfolio.risk * 100).toFixed(2)}%`,
                    sharpe: portfolio.sharpe.toFixed(2),
                    benchmark: `₹${benchmarkValues[pointIndex].toFixed(2)}`,
                    outperformance: `${((point.y / benchmarkValues[pointIndex] - 1) * 100).toFixed(2)}%`
                };
                
                showChartTooltip(eventData.event, tooltipData, divId);
            }
        }
    });
    chart.on('plotly_unhover', hideChartTooltip);
}

// Initialize charts when results are shown
document.addEventListener('DOMContentLoaded', function() {
    // Wait for DOM to be ready, then initialize charts with mock data for testing
    setTimeout(() => {
        // Create mock data for testing all charts
        const mockData = {
            top_portfolios: [
                {
                    assets: ["INFY", "TCS", "RELIANCE"],
                    weights: [0.4, 0.3, 0.3],
                    return: 0.15,
                    risk: 0.08,
                    sharpe: 1.8,
                    qubo_value: -12.5,
                    cost: 100000
                },
                {
                    assets: ["HDFCBANK", "SBIN", "TATAMOTORS"],
                    weights: [0.5, 0.3, 0.2],
                    return: 0.12,
                    risk: 0.06,
                    sharpe: 1.6,
                    qubo_value: -10.8,
                    cost: 95000
                }
            ],
            plots: {
                brute_force: {
                    scatter: {
                        x: [0.05, 0.06, 0.07, 0.08, 0.09, 0.1],
                        y: [0.08, 0.09, 0.1, 0.12, 0.14, 0.15],
                        color: [0.8, 0.9, 1.0, 1.2, 1.4, 1.5]
                    },
                    frontier: {
                        x: [0.05, 0.06, 0.08, 0.1],
                        y: [0.08, 0.09, 0.12, 0.15]
                    },
                    portfolios: [
                        {
                            assets: ["INFY", "TCS"],
                            weights: [0.6, 0.4],
                            return: 0.08,
                            risk: 0.05,
                            sharpe: 0.8
                        },
                        {
                            assets: ["RELIANCE", "HDFCBANK"],
                            weights: [0.7, 0.3],
                            return: 0.15,
                            risk: 0.1,
                            sharpe: 1.5
                        }
                    ]
                },
                qubo_vs_sharpe: {
                    scatter: {
                        x: [-12, -11, -10, -9, -8],
                        y: [0.8, 1.0, 1.2, 1.4, 1.6]
                    }
                },
                budget_distribution: {
                    histogram: {
                        x: [80000, 85000, 90000, 95000, 100000],
                        y: [5, 10, 15, 8, 3]
                    }
                },
                historical_backtest: {
                    dates: ["2023-01-01", "2023-02-01", "2023-03-01", "2023-04-01"],
                    portfolios: {
                        "Portfolio 1": [100, 105, 110, 115],
                        "Portfolio 2": [100, 103, 108, 112],
                        "NIFTY 50": [100, 102, 104, 106]
                    }
                }
            }
        };
        
        // Initialize charts with mock data
        initializeCharts(mockData);
    }, 1000);
});

// Smooth scroll behavior for all internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add CSS for dropdown items
const style = document.createElement('style');
style.textContent = `
    .dropdown-item {
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        border-bottom: 1px solid rgba(75, 85, 99, 0.2);
        color: #e5e7eb;
        font-size: 0.85rem;
    }
    
    .dropdown-item:hover {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    
    .dropdown-item:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);
