import type { CSSProperties } from "react"

interface EcoLoaderProps {
  title?: string
  description?: string
  fullScreen?: boolean
  compact?: boolean
}

export function EcoLoader({
  title = "Getting things ready",
  description = "A greener campus starts with us.",
  fullScreen = false,
  compact = false,
}: EcoLoaderProps) {
  return (
    <div className={`eco-loader ${fullScreen ? "eco-loader--screen" : ""} ${compact ? "eco-loader--compact" : ""}`} role="status" aria-live="polite" aria-busy="true">
      <div className="eco-loader__content">
        <div className="eco-loader__scene" aria-hidden="true">
          <div className="eco-loader__grid" />
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="eco-loader__fall" style={{ "--x": `${12 + (i * 29) % 78}%`, "--delay": `${-i * 1.17}s`, "--duration": `${5 + (i % 4) * 0.8}s` } as CSSProperties}>
              <svg className="eco-loader__leaf" viewBox="0 0 16 16" width="24" height="24" shapeRendering="crispEdges">
                <path fill="currentColor" d="M8 1h5v2h2v5h-2v3h-2v2H6v-2H4V6h2V3h2z" />
                <path fill="var(--leaf-vein)" d="M11 4h2v2h-2v2H9v2H7v2H5v3H3v-2h2v-3h2V8h2V6h2z" />
                <path fill="#ffffff" opacity=".25" d="M8 3h3v2H8zM6 5h2v3H6z" />
              </svg>
            </span>
          ))}
          <svg className="eco-loader__sprout" viewBox="0 0 64 48" width="96" height="72" shapeRendering="crispEdges">
            <path fill="var(--leaf-vein)" d="M30 20h4v24h-4zM22 18h8v4h-8zM34 12h8v4h-8z" />
            <path fill="#608c52" d="M10 8h12v4h4v4h4v8H18v-4h-4v-4h-4z" />
            <path fill="#9cbd70" d="M10 8h12v4h4v4H18v-4h-8z" />
            <path fill="#426e42" d="M34 12V8h4V4h16v12h-4v4H38v-4h-4z" />
            <path fill="#8db467" d="M38 8V4h16v4h-8v4h-8v4h-4v-4z" />
            <path fill="#aa9670" d="M14 44h36v4H14z" />
            <path fill="#c5b58d" d="M22 40h20v4H22z" />
          </svg>
          <div className="eco-loader__ground" />
        </div>
        <p className="eco-loader__eyebrow">RHHS / ECO CHAMPION</p>
        <h2 className="eco-loader__title">{title}</h2>
        <p className="eco-loader__description">{description}</p>
        <div className="eco-loader__steps" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 160}ms` }} />)}
        </div>
      </div>
    </div>
  )
}
