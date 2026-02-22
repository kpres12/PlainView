import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeView: 'command-center',
      selectedAssetId: null,
      timelinePosition: 100,
      mapZoom: 1,
    })
  })

  it('has correct initial state', () => {
    const state = useAppStore.getState()
    expect(state.activeView).toBe('command-center')
    expect(state.selectedAssetId).toBeNull()
    expect(state.timelinePosition).toBe(100)
    expect(state.mapZoom).toBe(1)
  })

  it('setActiveView updates the active view', () => {
    useAppStore.getState().setActiveView('missions')
    expect(useAppStore.getState().activeView).toBe('missions')
  })

  it('setSelectedAssetId updates the selected asset', () => {
    useAppStore.getState().setSelectedAssetId('r1')
    expect(useAppStore.getState().selectedAssetId).toBe('r1')

    useAppStore.getState().setSelectedAssetId(null)
    expect(useAppStore.getState().selectedAssetId).toBeNull()
  })

  it('setTimelinePosition updates timeline', () => {
    useAppStore.getState().setTimelinePosition(50)
    expect(useAppStore.getState().timelinePosition).toBe(50)
  })

  it('setMapZoom updates zoom', () => {
    useAppStore.getState().setMapZoom(3)
    expect(useAppStore.getState().mapZoom).toBe(3)
  })
})
