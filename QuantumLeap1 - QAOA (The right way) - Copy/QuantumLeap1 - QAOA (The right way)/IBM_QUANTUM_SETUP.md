# IBM Quantum Hardware Setup Guide

This guide explains how to set up IBM Quantum Hardware access for the QuantumLeap Portfolio Optimizer.

## Prerequisites

1. **IBM Quantum Account**: You need a free IBM Quantum account
   - Sign up at: https://quantum-computing.ibm.com/
   - Verify your email address

2. **API Token**: Generate an API token from your IBM Quantum account
   - Log into your IBM Quantum account
   - Go to "Account" → "API token"
   - Click "Generate token" and copy the token

## Environment Setup

### Option 1: Environment Variable (Recommended)

Set the `IBM_QUANTUM_TOKEN` environment variable:

**Windows (PowerShell):**
```powershell
$env:IBM_QUANTUM_TOKEN="your_token_here"
```

**Windows (Command Prompt):**
```cmd
set IBM_QUANTUM_TOKEN=your_token_here
```

**Linux/Mac:**
```bash
export IBM_QUANTUM_TOKEN="your_token_here"
```

### Option 2: .env File

Create a `.env` file in the project root:
```
IBM_QUANTUM_TOKEN=your_token_here
```

## Usage

1. **Aer Simulator (Default)**: Works out of the box, no setup required
2. **IBM Quantum Hardware**: Requires the API token setup above

## Important Notes

- **Cost**: IBM Quantum Hardware has usage limits on free accounts
- **Queue Times**: Real quantum hardware may have queue times
- **Recommended**: Use Aer Simulator for development and testing
- **Production**: Use IBM Quantum Hardware only for small-scale experiments (2-5 tickers)

## Troubleshooting

### "IBM_QUANTUM_TOKEN environment variable not set"
- Make sure you've set the environment variable correctly
- Restart your terminal/command prompt after setting the variable
- Verify the token is valid in your IBM Quantum account

### "No backends available"
- Check your IBM Quantum account status
- Ensure you have access to quantum hardware (not just simulators)
- Try again later if all systems are busy

### Performance Issues
- IBM Quantum Hardware is slower than simulators
- Use fewer shots (e.g., 100-500) for faster results
- Consider using Aer Simulator for large portfolios

## Security

- **Never commit your API token to version control**
- **Keep your token secure and don't share it**
- **Regenerate your token if it's compromised**
