#!/bin/bash
echo "🔧 Setting up Vercel environment variables for Firebase..."

# Add Firebase environment variables to Vercel production
echo "Adding NEXT_PUBLIC_FIREBASE_API_KEY..."
echo "AIzaSyAN-FgBbn4MEcR9U6OQaNGzZvjtmU6yhnk" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production

echo "Adding NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..."
echo "digitalmsa2-e71de.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production

echo "Adding NEXT_PUBLIC_FIREBASE_PROJECT_ID..."
echo "digitalmsa2-e71de" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production

echo "Adding NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..."
echo "digitalmsa2-e71de.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production

echo "Adding NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..."
echo "940272072619" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production

echo "Adding NEXT_PUBLIC_FIREBASE_APP_ID..."
echo "1:940272072619:web:3cc45ad05686809ca4c4ee" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

echo "✅ All Firebase environment variables added to Vercel production!"
echo "🚀 Now you can redeploy your app with: vercel --prod"