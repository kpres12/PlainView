import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Html, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

export interface TerrainAsset {
  id: string
  name: string
  type: 'roustabout' | 'drone' | 'watchtower' | 'sensor'
  position?: [number, number, number]
}

interface TerrainSceneProps {
  assets: TerrainAsset[]
  onAssetClick?: (assetId: string) => void
  onBackgroundClick?: () => void
}

const typeColor: Record<TerrainAsset['type'], string> = {
  roustabout: '#5FFF96',
  drone: '#2E9AFF',
  watchtower: '#F5A623',
  sensor: '#FF8040',
}

// Simple representative models built from primitives (no external assets)
function DroneModel({ color = '#2E9AFF' }: { color?: string }) {
  return (
    <group>
      {/* body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.25, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* arms */}
      {[[-0.6, 0, -0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6], [0.6, 0, 0.6]].map((p, i) => (
        <group key={i} position={[p[0], 0.1, p[2]] as any}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.8]} />
            <meshStandardMaterial color={'#8CA8C8'} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* rotors */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
            <meshStandardMaterial color={'#CFE6FF'} metalness={0.2} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function WatchtowerModel({ color = '#F5A623' }: { color?: string }) {
  return (
    <group>
      {/* tower */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.25, 3, 12]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color={'#EED9B7'} metalness={0.1} roughness={0.8} />
      </mesh>
      {/* dish */}
      <mesh position={[0.5, 1.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.35, 0.2, 24]} />
        <meshStandardMaterial color={'#FFD08A'} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  )
}

function SensorModel({ color = '#FF8040' }: { color?: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.8, 16]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={'#FFD2BF'} roughness={0.8} />
      </mesh>
    </group>
  )
}

function RoustaboutModel({ color = '#5FFF96' }: { color?: string }) {
  return (
    <group>
      {/* body */}
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.4, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* cab */}
      <mesh castShadow position={[0.3, 0.6, 0]}>
        <boxGeometry args={[0.6, 0.35, 0.8]} />
        <meshStandardMaterial color={'#BFFFD7'} roughness={0.7} />
      </mesh>
      {/* wheels */}
      {[[-0.6, 0, -0.4],[0.6, 0, -0.4],[-0.6, 0, 0.4],[0.6, 0, 0.4]].map((p, i) => (
<mesh key={i} position={[p[0], 0.18, p[2]] as any} castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.2, 24]} />
          <meshStandardMaterial color={'#202428'} metalness={0.1} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function AssetMarker({ asset, onClick }: { asset: TerrainAsset; onClick?: (id: string) => void }) {
  const color = typeColor[asset.type]
  const pos = asset.position || [0, 0.5, 0]

  return (
    <group position={pos as any} onPointerDown={(e) => { e.stopPropagation(); onClick?.(asset.id) }}>
      <group scale={asset.type === 'watchtower' ? 0.8 : asset.type === 'drone' ? 1 : 1}>
        {asset.type === 'drone' && <DroneModel color={color} />}
        {asset.type === 'watchtower' && <WatchtowerModel color={color} />}
        {asset.type === 'sensor' && <SensorModel color={color} />}
        {asset.type === 'roustabout' && <RoustaboutModel color={color} />}
      </group>
      <Html distanceFactor={10} position={[0, asset.type === 'watchtower' ? 2.2 : 1.1, 0]} occlude>
        <div style={{
          background: 'rgba(12,12,14,0.8)',
          border: '1px solid rgba(46,154,255,0.5)',
          color: '#E4E4E4',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
        }}>
          {asset.name}
        </div>
      </Html>
    </group>
  )
}

export function TerrainScene({ assets, onAssetClick, onBackgroundClick }: TerrainSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [10, 8, 10], fov: 50 }}
        onPointerMissed={() => { onBackgroundClick?.() }}
        gl={{ antialias: true }}
      >
        {/* scene background and fog */}
        <color attach="background" args={["#0B0B0D"]} />
        <fog attach="fog" args={["#0B0B0D", 30, 80]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[12, 14, 8]} intensity={1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

        {/* Environment lighting */}
        <Environment preset="warehouse" />

        {/* Ground pad */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 40]} />
          <meshStandardMaterial color={'#0F0F12'} />
        </mesh>

        {/* Grid overlay */}
        <Grid args={[60, 60]} sectionColor={'#2E2E34'} cellColor={'#1F2022'} />

        {/* Simple pipe run */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[20, 0.4, 0.4]} />
          <meshStandardMaterial color={'#555'} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[10, 0.3, 5]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 0.4, 0.4]} />
          <meshStandardMaterial color={'#555'} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Assets */}
        {assets.map((a) => (
          <AssetMarker key={a.id} asset={a} onClick={onAssetClick} />
        ))}

        {/* Grounding */}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={80} blur={2.5} far={20} />

        {/* Controls with smoothing */}
        <OrbitControls makeDefault enablePan enableRotate enableZoom enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  )
}
