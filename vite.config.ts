import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Let Vite keep the dynamic ThreeScene import separate. Manual vendor grouping
// can pull shared helpers into the 3D chunk and accidentally preload it on mobile.
export default defineConfig({ plugins: [react()] })
