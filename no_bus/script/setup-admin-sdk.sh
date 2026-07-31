#!/bin/bash

# Firebase Admin SDK Setup Script
# This script generates a service account and updates environment variables

set -e

PROJECT_ID="digitalmsa2-e71de"
SERVICE_ACCOUNT_FILE="service-account-key.json"

echo "🔧 Setting up Firebase Admin SDK for project: $PROJECT_ID"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Run: firebase login"
    exit 1
fi

# Generate service account (this requires project owner permissions)
echo "🔑 Generating service account key..."
gcloud iam service-accounts keys create $SERVICE_ACCOUNT_FILE \
    --iam-account firebase-adminsdk-$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" | head -c 5)@$PROJECT_ID.iam.gserviceaccount.com \
    --project $PROJECT_ID 2>/dev/null || {
    
    echo "⚠️  gcloud method failed, trying alternative approach..."
    echo ""
    echo "Please manually create a service account:"
    echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/serviceaccounts/adminsdk"
    echo "2. Click 'Generate new private key'"
    echo "3. Save the JSON file as '$SERVICE_ACCOUNT_FILE' in this directory"
    echo "4. Run this script again"
    echo ""
    
    if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
        exit 1
    fi
}

if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Service account file not found: $SERVICE_ACCOUNT_FILE"
    exit 1
fi

echo "✅ Service account key generated: $SERVICE_ACCOUNT_FILE"

# Extract values from JSON
echo "📋 Extracting credentials..."
PROJECT_ID_FROM_FILE=$(cat $SERVICE_ACCOUNT_FILE | grep '"project_id"' | sed 's/.*"project_id": "\(.*\)".*/\1/')
CLIENT_EMAIL=$(cat $SERVICE_ACCOUNT_FILE | grep '"client_email"' | sed 's/.*"client_email": "\(.*\)".*/\1/')
PRIVATE_KEY=$(cat $SERVICE_ACCOUNT_FILE | grep '"private_key"' | sed 's/.*"private_key": "\(.*\)".*/\1/' | sed 's/\\n/\\n/g')

# Generate random salt for tokens
TOKEN_SALT=$(openssl rand -base64 32)

# Update .env.local file
echo "📝 Updating .env.local..."

# Backup existing .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "✅ Backup created: .env.local.backup"
fi

# Add Admin SDK variables to .env.local
echo "" >> .env.local
echo "# Firebase Admin SDK Configuration (Auto-generated)" >> .env.local
echo "FIREBASE_PROJECT_ID=$PROJECT_ID_FROM_FILE" >> .env.local
echo "FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL" >> .env.local
echo "FIREBASE_PRIVATE_KEY=\"$PRIVATE_KEY\"" >> .env.local
echo "" >> .env.local
echo "# Project Configuration" >> .env.local
echo "DMSA_TOKEN_SALT=$TOKEN_SALT" >> .env.local

echo "✅ Environment variables updated in .env.local"

# Clean up service account file (security)
echo "🧹 Cleaning up service account file..."
rm -f $SERVICE_ACCOUNT_FILE

echo ""
echo "🎉 Firebase Admin SDK setup complete!"
echo ""
echo "Next steps:"
echo "1. Test the setup: node scripts/admin-examine-data.js"
echo "2. Never commit .env.local to version control"
echo "3. For production, set these variables in Vercel dashboard"

echo ""
echo "⚠️  Security Notice:"
echo "The service account file has been deleted for security."
echo "The private key is now only in .env.local (which should be in .gitignore)"