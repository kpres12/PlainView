import { create } from 'zustand'

export interface AppState {
  activeView: 'command-center' | 'missions' | 'asset' | 'analytics' | 'alerts' | 'settings'
  selectedAssetId: string | null
  timelinePosition: number // 0-100
  mapZoom: number
  
  setActiveView: (view: AppState['activeView']) => void
  setSelectedAssetId: (id: string | null) => void
  setTimelinePosition: (position: number) => void
  setMapZoom: (zoom: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'command-center',
  selectedAssetId: null,
  timelinePosition: 100,
  mapZoom: 1,
  
  setActiveView: (view) => set({ activeView: view }),
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),
  setTimelinePosition: (position) => set({ timelinePosition: position }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
}))
