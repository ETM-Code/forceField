# ForceField

A mobile app for real-time concussion detection in hurling, built as part of the [Patch](https://patch.ie/) programme.

ForceField connects to ESP-32 mesh network sensors embedded in hurling helmets (see [ESP-Now-Node](https://github.com/ETM-Code/ESP-Now-Node)) and displays accelerometer data in real-time, helping coaches and medical staff monitor impact forces during training and matches.

## Features

- Real-time accelerometer data display from helmet sensors
- Session recording and playback
- Team management with per-player monitoring
- Impact event detection and alerts

## Tech Stack

- **React Native** (Expo) with TypeScript
- **NativeWind** (Tailwind CSS for React Native)
- File-based routing via Expo Router
- AsyncStorage for session persistence

## Getting Started

```bash
bun install
bunx expo start
```
