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

echo ""
echo "🔐 Adding Firebase Admin SDK credentials..."

echo "Adding FIREBASE_PROJECT_ID..."
echo "digitalmsa2-e71de" | vercel env add FIREBASE_PROJECT_ID production

echo "Adding FIREBASE_CLIENT_EMAIL..."
echo "firebase-adminsdk-fbsvc@digitalmsa2-e71de.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production

echo "Adding FIREBASE_PRIVATE_KEY..."
cat .env.local | grep "FIREBASE_PRIVATE_KEY=" | cut -d'=' -f2- | vercel env add FIREBASE_PRIVATE_KEY production

echo "Adding DMSA_TOKEN_SALT..."
echo "wCifQ761RHErotwLFDKVmx3qb6Db6YjYsv4SX0QSqo0=" | vercel env add DMSA_TOKEN_SALT production

echo ""
echo "✅ All Firebase environment variables (client + admin) added to Vercel production!"
echo "🚀 Now you can redeploy your app with: vercel --prod"