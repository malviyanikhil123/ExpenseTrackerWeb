import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

export const GlobalLoadingBar: React.FC = () => {
  const location = useLocation()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setWidth(20)

    // Simulate navigation progress
    const t1 = setTimeout(() => setWidth(60), 100)
    const t2 = setTimeout(() => {
      setWidth(100)
      const t3 = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 300)
      return () => clearTimeout(t3)
    }, 400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [location.pathname])

  if (!visible && width === 0) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: `${width}%`,
        backgroundColor: "var(--primary)",
        boxShadow: "0 0 8px var(--primary)",
        transition: "width 0.3s ease-out, opacity 0.3s ease-out",
        opacity: width === 100 ? 0 : 1,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  )
}
