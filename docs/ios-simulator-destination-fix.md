# Fix: "Unable to find a destination" when running `expo run:ios`

If you see:

```
xcodebuild: error: Unable to find a destination matching the provided destination specifier:
    { id:EAA446B0-66FF-4AE5-9C48-339030C1FF30 }
```

Expo is using a **cached simulator UDID** that no longer exists (simulator deleted or Xcode updated). Fix it in one of these ways:

---

## Option 1: Clear the Simulator app’s default device (recommended)

Expo reads the “current device” from the Simulator app’s preference. Clear it so Expo picks a valid simulator:

```bash
defaults delete com.apple.iphonesimulator CurrentDeviceUDID
```

Then run:

```bash
npx expo run:ios
```

Expo will use the first available simulator. You can also open **Simulator.app**, choose a device (e.g. iPhone 16), then run `npx expo run:ios` again so that device becomes the new default.

---

## Option 2: Force a specific simulator by name

Run with an explicit device name so the cached UDID is ignored:

```bash
npx expo run:ios --device "iPhone 16"
```

Use a name that exists on your machine (e.g. "iPhone 15", "iPhone 16 Pro"). List available simulators in Xcode under **Window → Devices and Simulators**.

Or use the project script (uses iPhone 16 by default):

```bash
npm run ios:simulator
```

Edit the `"ios:simulator"` script in `package.json` if you want a different device name.

---

## Option 3: Build from Xcode

1. Open the workspace:  
   `open ios/TinyRest.xcworkspace`
2. In the scheme bar, pick a **simulator** (e.g. iPhone 16).
3. Press **Run** (⌘R).

After a successful run from Xcode, `npx expo run:ios` may work again if the Simulator app’s default was updated.
