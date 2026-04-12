import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  describe('renders nothing for falsy messages', () => {
    it('renders nothing when message is null', () => {
      const { container } = render(<ErrorMessage message={null} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing when message is undefined', () => {
      const { container } = render(<ErrorMessage message={undefined} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing when message is empty string', () => {
      const { container } = render(<ErrorMessage message="" />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('renders the alert when message is provided', () => {
    it('renders the message text', () => {
      render(<ErrorMessage message="Something went wrong" />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('has role="alert"', () => {
      render(<ErrorMessage message="Something went wrong" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
