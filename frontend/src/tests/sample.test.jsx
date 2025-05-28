import { render, screen } from '@testing-library/react'
import App from '../App.jsx'

describe('Sample Test Case', () => {
    it('render app title', () => {
        render(<App />)
        expect(screen.getByText('SmartTick')).toBeInTheDocument()
    })
})