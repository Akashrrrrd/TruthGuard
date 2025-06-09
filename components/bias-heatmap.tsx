"use client"
import { useEffect, useState } from "react"

const topics = ["Politics", "Economy", "Healthcare", "Technology", "Environment", "Sports"]
const sources = ["CNN", "Fox News", "Reuters", "BBC", "MSNBC", "AP News"]

export function BiasHeatmap() {
  const [biasData, setBiasData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBiasData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/analytics")
        if (!res.ok) throw new Error("Failed to fetch bias data")
        const data = await res.json()
        setBiasData(data.bias_breakdown || [])
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchBiasData()
  }, [])

  const getBiasColor = (bias: number) => {
    if (bias < 0.2) return "#10b981" // Green
    if (bias < 0.4) return "#84cc16" // Light green
    if (bias < 0.6) return "#eab308" // Yellow
    if (bias < 0.8) return "#f97316" // Orange
    return "#ef4444" // Red
  }

  if (loading) return <div>Loading bias heatmap...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-sm">
        <div></div>
        {sources.map((source) => (
          <div key={source} className="text-center font-medium p-2">
            {source}
          </div>
        ))}

        {topics.map((topic, topicIndex) => (
          <div key={topic} className="contents">
            <div className="font-medium p-2 text-right">{topic}</div>
            {sources.map((source, sourceIndex) => {
              const dataPoint = biasData.find((d) => d.topic === topic && d.source === source)
              return (
                <div
                  key={source}
                  className="h-8 w-8 flex items-center justify-center rounded"
                  style={{ background: dataPoint ? getBiasColor(dataPoint.bias) : "#e5e7eb" }}
                  title={dataPoint ? `Bias: ${(dataPoint.bias * 100).toFixed(1)}%` : "No data"}
                >
                  {dataPoint ? (dataPoint.bias * 100).toFixed(0) : "-"}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
