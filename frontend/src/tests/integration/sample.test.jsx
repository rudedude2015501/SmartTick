import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../App.jsx'

global.fetch = vi.fn()  // mock fetch for api calls 

describe('Sample Integration Test', () => {
    beforeEach(() => {
        fetch.mockClear()
    })

    it('switch between view modes and show correct view contents', () => {
        render(<App />)

        // start in home view
        expect(screen.getByText('SmartTick')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /home view/i })).toHaveAttribute('aria-pressed', 'true')

        // click on the stock view button 
        const stocksButton = screen.getByRole('button', { name: /stock view/i })
        fireEvent.click(stocksButton)

        // look for search bar in stock view
        expect(screen.getByPlaceholderText('Enter Ticker Symbol...')).toBeInTheDocument()
        expect(stocksButton).toHaveAttribute('aria-pressed', 'true')
    })
})