import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react' 

export default defineConfig({
    plugins: [react()], 
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: '.src/testsetup.js',
        coverage: {
            provider: 'instanbul',
            reporter: ['text', 'json', 'html']
        }
    }
})