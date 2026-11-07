#!/bin/bash
cd "$(dirname "$0")"
echo "==================================================="
echo "Starting DentoCare Clinic Desktop App for macOS"
echo "==================================================="
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed on this Mac."
    echo "Please download and install Node.js LTS from: https://nodejs.org"
    echo "Press Enter to exit..."
    read
    exit 1
fi
if [ ! -d "node_modules" ]; then
    echo "First-time setup: Installing clinic packages..."
    npm install
fi
echo "Starting the application..."
npm run dev &
SERVER_PID=$!
sleep 5
echo "Opening DentoCare Application Window..."
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args "--app=http://localhost:3000"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -na "Microsoft Edge" --args "--app=http://localhost:3000"
else
    open http://localhost:3000
fi
echo ""
echo "==================================================="
echo "DentoCare Clinic App is active!"
echo "Press Enter here to shut down the app..."
echo "==================================================="
read
kill $SERVER_PID
echo "Done!"