#!/bin/bash

echo "🚀 Setting up My Bet Visualizer..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check for Yarn
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn first."
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install JavaScript dependencies
echo "📦 Installing JavaScript dependencies..."
yarn install

# Set up Python virtual environment
echo "🐍 Setting up Python environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Run: yarn dev"
echo "  2. Open http://localhost:3000 in your browser"
echo ""
echo "Don't forget to configure your OpenAI API key in Settings!"

