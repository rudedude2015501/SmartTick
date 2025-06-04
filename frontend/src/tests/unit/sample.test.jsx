import { render, screen } from '@testing-library/react'
import HomeView from '../../HomeView.jsx' 

globalThis.fetch = vi.fn()  // mock api call to avoid real requests 

describe('Sample Unit Test', () => {
    beforeEach(() => {
        fetch.mockClear()
    })

    it('render loading state initial', () => {
        // mock a pending fetch 
        fetch.mockResolvedValueOnce({
            ok:true,
            json: async () => []
        })

        render(<HomeView />)

        expect(screen.getByText('Recent Trades')).toBeInTheDocument()
    })
})