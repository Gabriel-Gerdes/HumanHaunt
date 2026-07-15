# HumanHaunt

Human Haunt contains:

- `apps-script/`: the original Google Apps Script web app for the lockout sheet.
- `mobile/`: the React Native app for iOS and Android.
- `docs/`: design notes and project documentation.

For Apps Script setup, see `apps-script/README.md`.

## Mobile Dev Environment

The mobile app is a bare React Native project in `mobile/`.

### Prerequisites

Install:

- [Node.js](https://nodejs.org/) `22.11.0` or newer
- npm, installed with Node.js
- Git
- JDK 17
- Android Studio
- Android SDK Platform Tools
- An Android emulator from Android Studio Device Manager

Verify the core tools:

```powershell
node -v
npm -v
git --version
java -version
adb devices
```

If PowerShell blocks `npm`, `npx`, or React Native scripts, allow local scripts
for your Windows user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Install Dependencies

From the repo root:

```powershell
cd mobile
npm install
```

### Android Environment Variables

React Native expects the Android SDK location to be available. On Windows with
the default Android Studio install, use:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
```

If `adb` is not found, install Android SDK Platform Tools through Android Studio
or `winget`:

```powershell
winget install --id Google.PlatformTools -e
```

Then open a new terminal and verify:

```powershell
adb devices
```

### Run On Android

1. Start an emulator in Android Studio: `Tools > Device Manager`.
2. Start Metro from the mobile folder:

   ```powershell
   cd mobile
   npm.cmd start
   ```

3. In another terminal, build and install the app:

   ```powershell
   cd mobile
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   $env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
   $env:GRADLE_USER_HOME = "C:\gradle-cache"
   npm run android -- --no-packager
   ```

`GRADLE_USER_HOME` is set to a short path to avoid Windows path length issues
during native builds.

If the app launches but cannot connect to Metro, run:

```powershell
adb reverse tcp:8081 tcp:8081
adb shell am force-stop com.mobile
adb shell am start -n com.mobile/.MainActivity
```

### Useful Commands

Run checks from `mobile/`:

```powershell
npm test -- --runInBand
npx.cmd tsc --noEmit
npm run lint
```

### iOS Notes

The same React Native project contains the iOS app under `mobile/ios/`, but iOS
builds require macOS and Xcode. From a Mac, install pods before running iOS:

```bash
cd mobile/ios
bundle install
bundle exec pod install
cd ..
npm run ios
```
