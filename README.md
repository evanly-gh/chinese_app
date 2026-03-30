# chinese_app
eas.json is ready. Now here's the complete sequence to run in your terminal:


# 1. Install EAS CLI (one-time, global)
npm install -g eas-cli

# 2. Log in to your Expo account (free signup at expo.dev)
eas login

# 3. Go to the app folder
cd c:\Users\eliotli2\Documents\github\evanly-gh\chinese_app

# 4. Trigger the cloud build (~10 min, free)
eas build -p android --profile preview
EAS will ask you to link the project to your Expo account the first time — just say yes. When the build finishes it gives you a QR code and download link. Open that link on your phone, install the APK, and you're done — it's a real native app that:

Never needs npx expo start
Works on any network (WiFi, mobile data)
Stays signed in between sessions
Syncs to Supabase in the background
For future code updates (without reinstalling), just run:


eas update --branch preview --message "what changed"
The app will silently pick up the update on next launch