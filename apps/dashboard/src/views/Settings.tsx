import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings as SettingsIcon, Plus, Trash2, Edit2, Save, X, Globe, MapPin } from 'lucide-react'

interface Site {
  id: string
  name: string
  location: string
  assets: number
  status: 'healthy' | 'warning' | 'critical'
  coordinates: [number, number]
}

interface SettingsProps {
  sites?: Site[]
  onSitesChange?: (sites: Site[]) => void
}

const defaultSites: Site[] = [
  {
    id: 'site-01',
    name: 'Permian Basin',
    location: 'Texas, USA',
    assets: 24,
    status: 'healthy',
    coordinates: [31.8, -103.3],
  },
  {
    id: 'site-02',
    name: 'Eagle Ford',
    location: 'South Texas',
    assets: 18,
    status: 'warning',
    coordinates: [28.5, -97.8],
  },
  {
    id: 'site-03',
    name: 'Bakken',
    location: 'North Dakota',
    assets: 12,
    status: 'healthy',
    coordinates: [48.0, -102.0],
  },
  {
    id: 'site-04',
    name: 'Marcellus',
    location: 'Pennsylvania',
    assets: 16,
    status: 'critical',
    coordinates: [41.0, -76.5],
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return '#5FFF96'
    case 'warning': return '#F5A623'
    case 'critical': return '#FF4040'
    default: return '#2E9AFF'
  }
}

export function Settings({ sites = defaultSites, onSitesChange }: SettingsProps) {
  const [sitesList, setSitesList] = useState<Site[]>(sites)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    location: string
    assets: number
    status: 'healthy' | 'warning' | 'critical'
    latitude: number
    longitude: number
  }>({
    name: '',
    location: '',
    assets: 0,
    status: 'healthy',
    latitude: 0,
    longitude: 0,
  })

  const handleAddSite = () => {
    if (!formData.name || !formData.location) return

    const newSite: Site = {
      id: `site-${Date.now()}`,
      name: formData.name,
      location: formData.location,
      assets: formData.assets,
      status: formData.status,
      coordinates: [formData.latitude, formData.longitude],
    }

    const updatedSites = [...sitesList, newSite]
    setSitesList(updatedSites)
    onSitesChange?.(updatedSites)
    resetForm()
  }

  const handleDeleteSite = (id: string) => {
    const updatedSites = sitesList.filter((s) => s.id !== id)
    setSitesList(updatedSites)
    onSitesChange?.(updatedSites)
  }

  const handleEditSite = (site: Site) => {
    setEditingId(site.id)
    setFormData({
      name: site.name,
      location: site.location,
      assets: site.assets,
      status: site.status,
      latitude: site.coordinates[0],
      longitude: site.coordinates[1],
    })
  }

  const handleSaveEdit = () => {
    const updatedSites: Site[] = sitesList.map((s) =>
      s.id === editingId
        ? {
            ...s,
            name: formData.name,
            location: formData.location,
            assets: formData.assets,
            status: formData.status,
            coordinates: [formData.latitude, formData.longitude] as [number, number],
          }
        : s
    )
    setSitesList(updatedSites)
    onSitesChange?.(updatedSites)
    setEditingId(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      assets: 0,
      status: 'healthy',
      latitude: 0,
      longitude: 0,
    })
    setShowAddForm(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', backgroundColor: '#0C0C0E' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1F2022', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SettingsIcon size={20} color='#F5A623' />
        <h1 style={{ color: '#F5A623', fontSize: '16px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>SETTINGS</h1>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {/* Site Management Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: '#F5A623', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>
              MANAGED SITES
            </h2>
            {!showAddForm && !editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                style={{
                  background: '#5FFF96',
                  color: '#0C0C0E',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} />
                ADD SITE
              </motion.button>
            )}
          </div>

          {/* Add/Edit Form */}
          <AnimatePresence>
            {(showAddForm || editingId) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: '#1A1A1E',
                  border: '1px solid #2E9AFF',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <h3 style={{ color: '#2E9AFF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 16px 0' }}>
                  {editingId ? 'EDIT SITE' : 'ADD NEW SITE'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>SITE NAME</label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder='e.g., Permian Basin'
                      style={{
                        width: '100%',
                        background: '#0F0F12',
                        border: '1px solid #2E2E34',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#E4E4E4',
                        fontSize: '13px',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>LOCATION</label>
                    <input
                      type='text'
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder='e.g., Texas, USA'
                      style={{
                        width: '100%',
                        background: '#0F0F12',
                        border: '1px solid #2E2E34',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#E4E4E4',
                        fontSize: '13px',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>ASSETS</label>
                    <input
                      type='number'
                      value={formData.assets}
                      onChange={(e) => setFormData({ ...formData, assets: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        background: '#0F0F12',
                        border: '1px solid #2E2E34',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#E4E4E4',
                        fontSize: '13px',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>STATUS</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      style={{
                        width: '100%',
                        background: '#0F0F12',
                        border: '1px solid #2E2E34',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#E4E4E4',
                        fontSize: '13px',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    >
                      <option value='healthy'>Healthy</option>
                      <option value='warning'>Warning</option>
                      <option value='critical'>Critical</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>LATITUDE</label>
                    <input
                      type='number'
                      step='0.1'
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        background: '#0F0F12',
                        border: '1px solid #2E2E34',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#E4E4E4',
                        fontSize: '13px',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>LONGITUDE</label>
                    <input
                      type='number'
                      step='0.1'
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        background: '#0F0F12',
                        border: '1px solid #2E2E34',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#E4E4E4',
                        fontSize: '13px',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (editingId ? setEditingId(null) : resetForm())}
                    style={{
                      background: 'transparent',
                      color: '#999',
                      border: '1px solid #2E2E34',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    CANCEL
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (editingId ? handleSaveEdit() : handleAddSite())}
                    style={{
                      background: '#2E9AFF',
                      color: '#0C0C0E',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Save size={14} />
                    {editingId ? 'UPDATE' : 'CREATE'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sites List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {sitesList.map((site, idx) => (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: '#1A1A1E',
                    border: `1px solid ${getStatusColor(site.status)}40`,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Globe size={14} color={getStatusColor(site.status)} />
                      <h4 style={{ color: '#E4E4E4', fontSize: '14px', fontWeight: '600', margin: 0 }}>{site.name}</h4>
                      <div
                        style={{
                          background: getStatusColor(site.status),
                          color: '#0C0C0E',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        {site.status.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ color: '#999', fontSize: '12px', display: 'flex', gap: '16px' }}>
                      <span>📍 {site.location}</span>
                      <span>🔌 {site.assets} assets</span>
                      <span>📡 {site.coordinates[0].toFixed(1)}°, {site.coordinates[1].toFixed(1)}°</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditSite(site)}
                      style={{
                        background: '#2E9AFF',
                        border: 'none',
                        borderRadius: '6px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={14} color='#0C0C0E' />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteSite(site.id)}
                      style={{
                        background: '#FF4040',
                        border: 'none',
                        borderRadius: '6px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} color='#fff' />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
