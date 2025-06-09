"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, ArrowRight, AlertTriangle } from "lucide-react"

interface Topic {
  id: string
  name: string
  biasScore: number
  misinfoRisk: number
  trendDirection: "up" | "down" | "stable"
  trendPercentage: number
  sources: number
  category: string
}

interface Article {
  _id: string
  title: string
  category?: string
  bias_score?: number
  misinformation_risk?: number
  source_name?: string
  published_at: string
  content_preview?: string
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/mongodb")
        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.statusText}`)
        }
        const data = await response.json()
        const articles: Article[] = data.articles || []

        const groupedByCategory = articles.reduce((acc, article) => {
          const category = article.category || "General"
          if (!acc[category]) {
            acc[category] = []
          }
          acc[category].push(article)
          return acc
        }, {} as Record<string, Article[]>)

        const transformedTopics: Topic[] = Object.entries(groupedByCategory).map(([categoryName, categoryArticles]) => {
          const totalBiasScore = categoryArticles.reduce((sum, article) => sum + (article.bias_score || 0), 0)
          const totalMisinfoRisk = categoryArticles.reduce((sum, article) => sum + (article.misinformation_risk || 0), 0)
          const uniqueSources = new Set(categoryArticles.map(article => article.source_name).filter(Boolean))

          return {
            id: categoryName,
            name: categoryName,
            biasScore: categoryArticles.length > 0 ? totalBiasScore / categoryArticles.length : 0,
            misinfoRisk: categoryArticles.length > 0 ? totalMisinfoRisk / categoryArticles.length : 0,
            trendDirection: "stable", // TODO: calculate actual trend
            trendPercentage: 0, // TODO: calculate trend %
            sources: uniqueSources.size,
            category: categoryName,
          }
        })

        setTopics(transformedTopics)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopics()
  }, [])

  const filteredTopics = selectedCategory ? topics.filter(topic => topic.category === selectedCategory) : topics
  const categories = Array.from(new Set(topics.map(topic => topic.category)))

  const getBiasColor = (score: number) => {
    if (score < 0.3) return "bg-green-100 text-green-800"
    if (score < 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "bg-green-100 text-green-800"
    if (score < 0.5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getTrendColor = (direction: string) => {
    if (direction === "up") return "text-red-600"
    if (direction === "down") return "text-green-600"
    return "text-gray-600"
  }

  const getTrendIcon = (direction: string) => {
    if (direction === "up") return <TrendingUp className="h-4 w-4 rotate-45" />
    if (direction === "down") return <TrendingUp className="h-4 w-4 -rotate-45" />
    return <TrendingUp className="h-4 w-4 rotate-0" />
  }

  return (
      <div className="space-y-6">
        {isLoading && <p>Loading trending topics...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!isLoading && !error && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                >
                  All Topics
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                ))}
              </div>

              {filteredTopics.length === 0 && <p>No trending topics found.</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map((topic) => (
                    <Card key={topic.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg mb-1">{topic.name}</h3>
                              <Badge variant="outline">{topic.category}</Badge>
                            </div>
                            <div className={`flex items-center space-x-1 ${getTrendColor(topic.trendDirection)}`}>
                              {getTrendIcon(topic.trendDirection)}
                              <span className="font-bold">{topic.trendPercentage}%</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Bias Score:</span>
                              <Badge className={getBiasColor(topic.biasScore)}>{(topic.biasScore * 100).toFixed(0)}%</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Misinfo Risk:</span>
                              <Badge className={getRiskColor(topic.misinfoRisk)}>{(topic.misinfoRisk * 100).toFixed(0)}%</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Sources:</span>
                              <span className="text-sm font-medium">{topic.sources} outlets</span>
                            </div>
                          </div>

                          {topic.misinfoRisk > 0.6 && (
                              <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                <span className="text-xs text-red-800">High misinformation activity detected in this topic</span>
                              </div>
                          )}
                        </div>

                        <div className="border-t p-4 bg-gray-50">
                          <Button variant="ghost" size="sm" className="w-full justify-between">
                            View Topic Analysis
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </>
        )}
      </div>
  )
}
