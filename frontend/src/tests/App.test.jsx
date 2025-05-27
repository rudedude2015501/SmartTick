import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
    it('render app title', () => {
        render(<App />)
        expect(screen.getByText('SmartTick')).toBeInTheDocument()
    })
})