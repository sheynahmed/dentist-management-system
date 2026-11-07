#!/bin/bash
cd "$(dirname "$0")"
echo "==================================================="
echo "Starting DentoCare Clinic App Launcher for macOS"
echo "==================================================="
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed on this Mac."
    echo "Please download and install Node.js from: https://nodejs.org"
    echo "Press Enter to exit..."
    read
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed on this Mac."
    echo "Press Enter to exit..."
    read
    exit 1
fi
if [ ! -d "node_modules" ]; then
    echo "First-time setup: Installing dependencies (this may take a minute)..."
    npm install
fi
echo "Starting the application server..."
npm run dev &
SERVER_PID=$!
echo "Waiting for the server to start..."
sleep 5
echo "Opening http://localhost:3000 in your browser..."
open http://localhost:3000
echo ""
echo "==================================================="
echo "DentoCare Clinic App is now running!"
echo "Please keep this Terminal window open."
echo "Press Enter here to stop the server and exit..."
echo "==================================================="
read
echo "Stopping server..."
kill $SERVER_PID
echo "Done!"