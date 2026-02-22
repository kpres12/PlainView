import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Press</Button>)
    fireEvent.click(screen.getByText('Press'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Disabled</Button>)
    fireEvent.click(screen.getByText('Disabled'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies size classes', () => {
    const { container } = render(<Button size="sm">Small</Button>)
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('text-xs')
  })
})
