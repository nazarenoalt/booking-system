import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

const defaultProps = {
  message: 'Are you sure you want to delete this booking?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmDialog', () => {
  describe('when open is false', () => {
    it('does not render dialog content', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />)
      expect(screen.queryByText(defaultProps.message)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument()
    })
  })

  describe('when open is true', () => {
    it('renders the message', () => {
      render(<ConfirmDialog {...defaultProps} open={true} />)
      expect(screen.getByText(defaultProps.message)).toBeInTheDocument()
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      render(<ConfirmDialog {...defaultProps} open={true} onConfirm={onConfirm} onCancel={onCancel} />)

      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      expect(onConfirm).toHaveBeenCalledOnce()
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      render(<ConfirmDialog {...defaultProps} open={true} onConfirm={onConfirm} onCancel={onCancel} />)

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onCancel).toHaveBeenCalledOnce()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })
})
