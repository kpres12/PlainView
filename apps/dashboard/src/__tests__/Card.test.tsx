import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies highlighted styling', () => {
    const { container } = render(<Card highlighted>Highlighted</Card>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('border-pv-amber')
  })

  it('forwards className prop', () => {
    const { container } = render(<Card className="custom-class">Test</Card>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('custom-class')
  })
})
