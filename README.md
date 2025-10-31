# geoPhoto

A React Native / Expo app that captures photos with geolocation data and optionally saves them to the device’s gallery.  
Built with the Expo SDK for rapid development, camera + location integration, and cross-platform deployment.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npx expo start
```

You can then choose to open the app in:
- **Expo Go** on your Android or iOS device (scan the QR code)  
- **Android emulator** via Android Studio  
- **iOS simulator** on macOS  
- or a **development build** (your own native binary)

The app uses [file-based routing](https://docs.expo.dev/router/introduction/): every file in the `/app` directory corresponds to a screen.

---

## Key Libraries

### [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
Provides access to GPS coordinates, letting each photo capture include latitude / longitude metadata.

### [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)
Renders the front or back camera preview and supports image capture via the `CameraView` component.

### [expo-media-library](https://docs.expo.dev/versions/latest/sdk/media-library/)
Used to save captured photos into the device’s gallery (Camera Roll).  
Requires explicit Android permissions for media access on Android 13 (Tiramisu) and above.

---

## Android Media-Library Note

> **Why this matters:** Android 13 introduced granular photo/video permissions that the public **Expo Go** app does not declare.  
> Because of that, saving to the gallery **cannot work** inside Expo Go on newer Android versions.

### Development Options

| Environment | Camera | GPS | Save to Gallery | Notes |
|--------------|:------:|:--:|:---------------:|-------|
| **Expo Go (Android 13+)** | ✅ | ✅ | 🚫 | Limited media permissions |
| **Expo Dev Build / EAS Build** | ✅ | ✅ | ✅ | Uses your manifest + permissions |

### How to test gallery saves

Build your own client that uses the permissions defined in `app.json`:

```bash
npx expo run:android       # local dev build
# or
eas build -p android       # cloud build for QA / release
```

Your `app.json` includes:
```jsonc
"android": {
  "permissions": [
    "CAMERA",
    "READ_MEDIA_IMAGES",
    "READ_MEDIA_VIDEO",
    "WRITE_EXTERNAL_STORAGE"
  ]
}
```

The app detects when it’s running inside **Expo Go** and skips the gallery-save step gracefully, displaying a friendly message instead of crashing.  
This allows fast iteration in Expo Go while still supporting full functionality in production.

---

## Development Environment Setup (macOS + Android Device)

1. **Install Node ≥ 18, Watchman, and Expo CLI**  
   ```bash
   brew install node watchman
   npm install -g expo-cli
   ```

2. **Install Android Studio** – includes the Android SDK and `adb` tools.  
   Add to your `~/.zshrc`:
   ```bash
   export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
   ```

3. **Install Java 17**  
   ```bash
   brew install openjdk@17
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17
   export PATH="$JAVA_HOME/bin:$PATH"
   ```

4. **Enable Developer Mode + USB Debugging on your Pixel**  
   - Settings → About phone → tap *Build number* 7 times  
   - System → Developer options → turn on *USB debugging*  
   - Connect via USB and run `adb devices` to verify connection

---

## Typical Workflow

1. Edit your screen or hook files under `/app` and `/hooks`
2. Save → Expo Go (or your dev build) auto-refreshes
3. For gallery testing → `npx expo run:android`
4. Confirm saved photos appear in your Pixel’s **geoPhoto** album

---

## Reset the Project

```bash
npm run reset-project
```
Moves starter code to `/app-example` and creates a blank `/app` directory.

---

## Learn More

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)

---

## Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
