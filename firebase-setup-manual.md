# Manual Firebase Setup Guide

If the automated script fails, follow these manual steps:

## Option 1: Fix Permission Issues

```bash
# Clear npm cache and fix permissions
sudo npm cache clean --force
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Then try installing Firebase CLI again
npm install -g firebase-tools
```

## Option 2: Use NPX (No Installation Needed)

Instead of installing Firebase CLI globally, use npx:

```bash
# Login (no installation needed)
npx firebase-tools login

# Initialize project
npx firebase-tools init functions

# Deploy functions
npx firebase-tools deploy --only functions
```

## Option 3: Use Yarn (Alternative Package Manager)

```bash
# Install yarn if you don't have it
npm install -g yarn

# Install Firebase CLI with yarn
yarn global add firebase-tools

# Continue with normal commands
firebase login
firebase init functions
firebase deploy --only functions
```

## Option 4: Docker Approach (Isolated Environment)

```bash
# Create Dockerfile for Firebase deployment
docker run -it --rm -v $(pwd):/workspace -w /workspace node:18 bash

# Inside container:
npm install -g firebase-tools
firebase login --no-localhost
firebase init functions
firebase deploy --only functions
```

## Option 5: GitHub Actions (Automated Deployment)

If local deployment continues to fail, I can set up GitHub Actions to automatically deploy when you push changes.

## Troubleshooting the Current Error

The error you're seeing is likely due to:

1. **Network/Proxy Issues**: Your network might be blocking Firebase CLI updates
2. **Permission Issues**: npm might not have write access to global modules
3. **Node.js Version**: Ensure you're using Node.js 16+

### Quick Fixes:

```bash
# 1. Skip update check and login directly
firebase login --no-localhost --debug

# 2. Set environment variable to skip updates
export FIREBASE_CLI_SKIP_UPDATE_CHECK=true
firebase login

# 3. Use older login method
firebase login --reauth

# 4. Clear all Firebase data and start fresh
rm -rf ~/.config/firebase
firebase login
```

## Verify Your Setup

After successful login, verify:

```bash
# Check if you're logged in
firebase projects:list

# Check your project
firebase use --add

# List your current project
firebase use
```

Choose the method that works best for your system!