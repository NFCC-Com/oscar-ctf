'use client'

import React, { useEffect, useState } from 'react'
import { Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Input, Label } from '@/shared/ui'
import { parseGeoFlagClient } from '@/features/challenges/lib'
import type { GeoCoordinates } from '@/shared/types'
import { BaseMap, adminPinIcon } from '@/shared/components/BaseMap'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

interface GeoMapSelectorProps {
  initialFlag: string
  onConfirm: (flag: string) => void
  onCancel: () => void
}

function MapClickEvents({ onMapClick }: { onMapClick: (coords: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

function MapMovementTracker({ onMovementChange }: { onMovementChange: (moving: boolean) => void }) {
  useMapEvents({
    movestart() {
      onMovementChange(true)
    },
    moveend() {
      onMovementChange(false)
    },
  })
  return null
}

function FlyToLocation({ coords }: { coords: GeoCoordinates | null }) {
  const map = useMap()
  const [hasFlewOnce, setHasFlewOnce] = useState(false)

  useEffect(() => {
    if (coords && !hasFlewOnce) {
      const timer = setTimeout(() => {
        const targetLatLng = L.latLng(coords.lat, coords.lng)
        const isTargetInView = map.getBounds().contains(targetLatLng)

        // Snappy duration: 0.4s if target coordinate is already visible in viewport, 0.8s if panning from outside
        const duration = isTargetInView ? 0.4 : 0.8

        map.flyTo(targetLatLng, 13, { duration })
        setHasFlewOnce(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [coords, hasFlewOnce, map])

  return null
}

export default function GeoMapSelector({
  initialFlag,
  onConfirm,
  onCancel,
}: GeoMapSelectorProps) {
  const [prefix, setPrefix] = useState('nxctf')
  const [radius, setRadius] = useState(1.5)
  const [coords, setCoords] = useState<GeoCoordinates | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFlag, setPendingFlag] = useState('')

  // Parse initial flag on mount — pre-populate prefix, radius, and coordinates
  useEffect(() => {
    const parsed = parseGeoFlagClient(initialFlag)
    if (parsed) {
      setPrefix(parsed.prefix)
      setRadius(parsed.radius_km)
      setCoords({ lat: parsed.lat, lng: parsed.lng })
    }
  }, [initialFlag])

  const handleMapClick = (latlng: L.LatLng) => {
    setCoords({ lat: latlng.lat, lng: latlng.lng })
  }

  const handleConfirm = () => {
    if (!coords) return
    const flagString = `${prefix}{geo:${coords.lat.toFixed(6)},${coords.lng.toFixed(6)},${radius.toFixed(3)}}`

    if (initialFlag && initialFlag.trim() !== '') {
      setPendingFlag(flagString)
      setConfirmOpen(true)
    } else {
      onConfirm(flagString)
    }
  }

  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const defaultZoom = 5

  return (
    <div className="flex flex-col gap-4 h-full min-h-[500px]">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-gray-500">Flag Prefix</Label>
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. nxctf"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-gray-500">Radius Toleransi (KM)</Label>
          <Input
            type="number"
            step="0.05"
            min="0.01"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value) || 0.1)}
            placeholder="e.g. 1.5"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Map display */}
      <div className="relative rounded-lg overflow-hidden border dark:border-gray-800 shadow-inner h-[380px] w-full">
        <BaseMap
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ width: '100%', height: '380px' }}
          className="z-10"
        >
          <MapClickEvents onMapClick={handleMapClick} />
          <MapMovementTracker onMovementChange={setIsMoving} />
          <FlyToLocation coords={coords} />

          {coords && (
            <>
              <Marker position={[coords.lat, coords.lng]} icon={adminPinIcon} />
              {!isMoving && (
                <Circle
                  center={[coords.lat, coords.lng]}
                  radius={(radius || 1.5) * 1000}
                  pathOptions={{
                    color: '#EF4444',
                    fillColor: '#EF4444',
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
              )}
            </>
          )}
        </BaseMap>
        <div className="absolute top-2 right-2 z-20 bg-white/95 dark:bg-black/90 border rounded p-2 text-[10px] text-gray-500 font-mono shadow pointer-events-none select-none">
          Click on map to select challenge location
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between border-t pt-3 dark:border-gray-800">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400">Selected Coordinates</span>
          {coords ? (
            <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </span>
          ) : (
            <span className="text-xs text-red-500 italic">No location selected</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!coords}
            onClick={handleConfirm}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            Select Location
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change Flag to Geo Flag"
        description="Do you want to change the flag to the selected location's geo flag?"
        onConfirm={() => {
          onConfirm(pendingFlag)
        }}
        confirmLabel="Change Flag"
        cancelLabel="Keep Current"
      />
    </div>
  )
}
