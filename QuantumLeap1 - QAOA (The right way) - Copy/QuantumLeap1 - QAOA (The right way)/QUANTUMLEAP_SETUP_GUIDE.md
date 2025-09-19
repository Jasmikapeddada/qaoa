# QuantumLeap Portfolio Optimization - Complete Setup Guide

## 🚀 Quick Start Summary
This guide will help you set up the QuantumLeap portfolio optimization platform on your laptop. The project uses quantum-inspired algorithms (QAOA) to optimize investment portfolios for Indian stock markets.

## ✨ New Features (Latest Update)

### Advanced Control Panel
- **13 Comprehensive Parameters**: Complete control over optimization strategy
- **Interactive Tooltips**: Detailed explanations for each parameter
- **Smart Defaults**: Optimization objectives automatically configure related parameters

### Dual Backend Support
- **Aer Simulator**: Fast local quantum simulation (default)
- **IBM Quantum Hardware**: Real quantum computer execution
- **Automatic Fallback**: Graceful degradation if quantum hardware fails

### Enhanced Parameters
- **Optimization Objectives**: Max Sharpe Ratio, Min Variance, Max Return
- **Risk Management**: Risk-free rate, correlation thresholds, minimum assets
- **Budget Control**: Flexible budget adherence with penalty tuning
- **Quantum Settings**: Configurable QAOA layers and shot counts

## 📁 Required File Structure

Create the following folder structure on your laptop:

```
QuantumLeap1/
├── index.html
├── optimizer.html
├── style.css
├── script.js
├── app.py
├── requirements.txt
├── run_backend.py
├── stocks_response.json
└── backend/
    ├── __init__.py
    ├── data_manager.py
    ├── optimizer.py
    ├── visualization.py
    ├── sample_data.py
    ├── api_response_schema.py
    ├── test_backend.py
    ├── README.md
    └── data/
        ├── ABB.csv
        ├── ADANIENSOL.csv
        ├── ADANIENT.csv
        ├── ADANIGREEN.csv
        ├── ADANIPORTS.csv
        ├── AMBUJACEM.csv
        ├── APOLLOHOSP.csv
        ├── ASIANPAINT.csv
        ├── AXISBANK.csv
        ├── BAJAJ-AUTO.csv
        ├── BAJAJFINSV.csv
        ├── BAJAJHFL.csv
        ├── BAJAJHLDNG.csv
        ├── BAJFINANCE.csv
        ├── BANKBARODA.csv
        ├── BEL.csv
        ├── BHARTIARTL.csv
        ├── BOSCHLTD.csv
        ├── BPCL.csv
        ├── BRITANNIA.csv
        ├── CANBK.csv
        ├── CGPOWER.csv
        ├── CHOLAFIN.csv
        ├── CIPLA.csv
        ├── COALINDIA.csv
        ├── DABUR.csv
        ├── DIVISLAB.csv
        ├── DLF.csv
        ├── DMART.csv
        ├── DRREDDY.csv
        ├── EICHERMOT.csv
        ├── ETERNAL.csv
        ├── GAIL.csv
        ├── GODREJCP.csv
        ├── GRASIM.csv
        ├── HAL.csv
        ├── HAVELLS.csv
        ├── HCLTECH.csv
        ├── HDFCBANK.csv
        ├── HDFCLIFE.csv
        ├── HEROMOTOCO.csv
        ├── HYUNDAI.csv
        ├── ICICIGI.csv
        ├── ICICIPRULI.csv
        ├── INDHOTEL.csv
        ├── INDIGO.csv
        ├── IOC.csv
        ├── IRFC.csv
        ├── ITC.csv
        ├── JINDALSTEL.csv
        ├── JSWENERGY.csv
        ├── JSWSTEEL.csv
        ├── LICI.csv
        ├── LODHA.csv
        ├── LTIM.csv
        ├── M&M.csv
        ├── MARUTI.csv
        ├── MOTHERSON.csv
        ├── NAUKRI.csv
        ├── NIFTY.csv
        ├── ONGC.csv
        ├── PFC.csv
        ├── PIDILITIND.csv
        ├── PNB.csv
        ├── RECLTD.csv
        ├── SHREECEM.csv
        ├── SIEMENS.csv
        ├── SUNPHARMA.csv
        ├── SWIGGY.csv
        ├── TATACONSUM.csv
        ├── TATAMOTORS.csv
        ├── TATAPOWER.csv
        ├── TATASTEEL.csv
        ├── TCS.csv
        ├── TECHM.csv
        ├── TITAN.csv
        ├── TORNTPHARM.csv
        ├── TRENT.csv
        ├── TVSMOTOR.csv
        ├── ULTRACEMCO.csv
        ├── UNITDSPR.csv
        ├── VBL.csv
        ├── VEDL.csv
        ├── WIPRO.csv
        └── ZYDUSLIFE.csv
```

## 🛠️ Step-by-Step Setup Instructions

### Step 1: Create the Project Directory
```bash
# Create main project folder
mkdir QuantumLeap1
cd QuantumLeap1

# Create backend folder
mkdir backend
mkdir backend/data
```

### Step 2: Place All Files in Correct Locations

**Root Directory Files (QuantumLeap1/):**
- Place `index.html` in the root directory
- Place `optimizer.html` in the root directory  
- Place `style.css` in the root directory
- Place `script.js` in the root directory
- Place `app.py` in the root directory
- Place `requirements.txt` in the root directory
- Place `run_backend.py` in the root directory
- Place `stocks_response.json` in the root directory

**Backend Directory Files (QuantumLeap1/backend/):**
- Place `__init__.py` in the backend folder
- Place `data_manager.py` in the backend folder
- Place `optimizer.py` in the backend folder
- Place `visualization.py` in the backend folder
- Place `sample_data.py` in the backend folder
- Place `api_response_schema.py` in the backend folder
- Place `test_backend.py` in the backend folder
- Place `README.md` in the backend folder

**Data Directory Files (QuantumLeap1/backend/data/):**
- Place all the CSV files (ABB.csv, ADANIENSOL.csv, etc.) in the backend/data folder

### Step 3: Install Python (if not already installed)

**For Windows:**
1. Download Python 3.8+ from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Verify installation: `python --version`

**For macOS:**
```bash
# Using Homebrew (recommended)
brew install python3

# Or download from python.org
# Verify installation
python3 --version
```

**For Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3 python3-pip
python3 --version
```

### Step 4: Install Python Dependencies

```bash
# Navigate to project directory
cd QuantumLeap1

# Install all required packages
pip install -r requirements.txt
```

**If you encounter any issues, install packages individually:**
```bash
pip install flask==2.3.3
pip install flask-cors==4.0.0
pip install numpy==1.24.3
pip install pandas==2.0.3
pip install scipy==1.11.2
pip install qiskit==0.44.1
pip install qiskit-aer==0.12.2
pip install matplotlib==3.7.2
pip install plotly==5.16.1
pip install gunicorn==21.2.0
pip install python-dotenv==1.0.0
pip install celery==5.3.1
pip install redis==4.6.0
```

### Step 5: Verify Data Files

Make sure all CSV files are in the `backend/data/` directory. Each CSV file should have:
- `Date` column (format: DD-MM-YYYY or YYYY-MM-DD)
- `Close` column (stock closing prices)

**To verify data files are working:**
```bash
cd QuantumLeap1
python -c "from backend.data_manager import DataManager; dm = DataManager(); print('Available stocks:', len(dm.get_available_stocks()))"
```

### Step 6: Run the Application

**Option 1: Using the provided run script**
```bash
cd QuantumLeap1
python run_backend.py
```

**Option 2: Direct Flask execution**
```bash
cd QuantumLeap1
python app.py
```

**Option 3: Using Flask command**
```bash
cd QuantumLeap1
export FLASK_APP=app.py
flask run
```

### Step 7: Access the Application

1. **Backend API**: http://localhost:5000
   - Health check: http://localhost:5000/health
   - Available stocks: http://localhost:5000/stocks

2. **Frontend Application**: 
   - Open `index.html` in your web browser
   - Or serve it using a local server:
   ```bash
   # Using Python's built-in server
   python -m http.server 8000
   # Then access: http://localhost:8000
   ```

## 🔧 Troubleshooting

### Common Issues and Solutions

**1. "Module not found" errors:**
```bash
# Make sure you're in the correct directory
cd QuantumLeap1

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

**2. "No module named 'backend'" error:**
```bash
# Make sure you're running from the QuantumLeap1 directory
# The backend folder should be inside QuantumLeap1/
ls backend/  # Should show the Python files
```

**3. "CSV file not found" errors:**
```bash
# Check if data files are in the correct location
ls backend/data/  # Should show all CSV files
```

**4. Port already in use:**
```bash
# Kill any process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

**5. Qiskit installation issues:**
```bash
# Install Qiskit with specific version
pip install qiskit==0.44.1 --no-deps
pip install qiskit-aer==0.12.2
```

## 🚀 Testing the Application

### 1. Test Backend API
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test stocks endpoint
curl http://localhost:5000/stocks
```

### 2. Test Frontend
1. Open `index.html` in your browser
2. Click "Launch Optimizer" button
3. Select some stocks (e.g., TCS, INFY, HDFCBANK)
4. Click "Run Quantum Optimization"
5. Wait for results and explore visualizations

### 3. Test Portfolio Optimization
1. Go to optimizer page
2. Select 3-5 stocks
3. Set budget (e.g., 100000)
4. Adjust risk aversion slider
5. Click "Run Quantum Optimization"
6. Wait for processing (30-60 seconds)
7. Explore the results and charts

## 📊 Expected Results

After successful setup, you should see:
- **Home page**: Company information with animated particles
- **Optimizer page**: Interactive portfolio optimization interface
- **Results**: Top 10 portfolios with financial metrics
- **Visualizations**: Interactive charts showing risk-return analysis
- **Backend API**: Responding to requests on port 5000

## 🎯 Key Features to Test

1. **Stock Search**: Type stock names to search and select
2. **Parameter Adjustment**: Use sliders to adjust risk and budget settings
3. **Optimization**: Run quantum-inspired portfolio optimization
4. **Visualizations**: Explore different chart tabs
5. **Responsive Design**: Test on different screen sizes

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all files are in the correct locations
3. Ensure Python dependencies are installed
4. Check that CSV data files are present
5. Make sure no other application is using port 5000

## 🎉 Success!

Once everything is running, you'll have a fully functional quantum-inspired portfolio optimization platform that can:
- Analyze Indian stock markets
- Run quantum algorithms (QAOA)
- Generate optimal investment portfolios
- Provide interactive visualizations
- Compare classical vs quantum approaches

Enjoy exploring the future of portfolio optimization! 🚀
