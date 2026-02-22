import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../components/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>ONLINE</Badge>)
    expect(screen.getByText('ONLINE')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    const { container } = render(<Badge>DEFAULT</Badge>)
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-pv-green')
  })

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">WARN</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-pv-amber')
  })

  it('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">ERR</Badge>)
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-pv-red')
  })
})
