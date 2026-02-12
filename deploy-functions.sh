#!/bin/bash

# Firebase Functions Deployment Script
# Run this from your GovtJobApp directory

set -e  # Exit on any error

echo "🚀 Firebase Functions Deployment Script"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the GovtJobApp directory"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Firebase CLI. Try running with sudo:"
        echo "   sudo npm install -g firebase-tools"
        exit 1
    fi
fi

# Clear any cached credentials that might be causing issues
echo "🧹 Clearing Firebase cache..."
firebase logout --debug 2>/dev/null || true

# Login with explicit options to avoid update check issues
echo "🔐 Logging into Firebase..."
echo "This will open your browser for authentication..."
sleep 2

# Use specific flags to avoid update check issues
firebase login --no-localhost --debug

if [ $? -ne 0 ]; then
    echo "❌ Firebase login failed. Trying alternative method..."
    echo "Please visit this URL manually and copy the token:"
    firebase login --reauth --debug
fi

# Set the Firebase project
echo "🎯 Setting Firebase project..."
firebase use govtjobs-3173b

if [ $? -ne 0 ]; then
    echo "❌ Failed to set Firebase project. Make sure you have access to govtjobs-3173b"
    exit 1
fi

# Check if firebase.json exists, if not initialize
if [ ! -f "firebase.json" ]; then
    echo "⚙️  Initializing Firebase project..."
    firebase init functions --debug
else
    echo "✅ Firebase project already initialized"
fi

# Install function dependencies
echo "📦 Installing function dependencies..."
cd firebase-functions
npm install
cd ..

# Deploy functions
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions --debug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firebase Functions deployed successfully!"
    echo ""
    echo "🎉 Your push notification system is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Add a job via your admin website"
    echo "2. Check that users with enabled notifications receive push notifications"
    echo "3. Monitor function logs: firebase functions:log"
    echo ""
    echo "Function URLs:"
    firebase functions:list 2>/dev/null || echo "Run 'firebase functions:list' to see your function URLs"
else
    echo "❌ Deployment failed. Check the errors above."
    echo "Try running: firebase functions:log"
    exit 1
fi