import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAlertStore } from '../store/alertStore'

describe('useAlertStore', () => {
  beforeEach(() => {
    useAlertStore.setState({ alerts: [], timelineEvents: [] })
  })

  it('addAlert adds an alert and returns its id', () => {
    const id = useAlertStore.getState().addAlert({
      message: 'Test alert',
      severity: 'warning',
    })
    expect(id).toBeTruthy()
    const alerts = useAlertStore.getState().alerts
    expect(alerts).toHaveLength(1)
    expect(alerts[0].message).toBe('Test alert')
    expect(alerts[0].severity).toBe('warning')
  })

  it('addAlert also logs a timeline event', () => {
    useAlertStore.getState().addAlert({
      message: 'Timeline test',
      severity: 'info',
    })
    const events = useAlertStore.getState().timelineEvents
    expect(events).toHaveLength(1)
    expect(events[0].message).toBe('Timeline test')
    expect(events[0].type).toBe('alert')
  })

  it('removeAlert removes by id', () => {
    const id = useAlertStore.getState().addAlert({
      message: 'Remove me',
      severity: 'error',
    })
    expect(useAlertStore.getState().alerts).toHaveLength(1)
    useAlertStore.getState().removeAlert(id)
    expect(useAlertStore.getState().alerts).toHaveLength(0)
  })

  it('clearTimeline empties timeline events', () => {
    useAlertStore.getState().addAlert({ message: 'A', severity: 'info' })
    useAlertStore.getState().addAlert({ message: 'B', severity: 'warning' })
    expect(useAlertStore.getState().timelineEvents.length).toBeGreaterThan(0)
    useAlertStore.getState().clearTimeline()
    expect(useAlertStore.getState().timelineEvents).toHaveLength(0)
  })

  it('auto-dismiss works with duration', async () => {
    vi.useFakeTimers()
    useAlertStore.getState().addAlert({
      message: 'Auto dismiss',
      severity: 'success',
      duration: 1000,
    })
    expect(useAlertStore.getState().alerts).toHaveLength(1)
    vi.advanceTimersByTime(1100)
    expect(useAlertStore.getState().alerts).toHaveLength(0)
    vi.useRealTimers()
  })
})
