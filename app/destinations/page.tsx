"use client"

import { useState } from "react"
import { Search, MapPin, Star, Heart, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"

const destinations = [
  {
    id: 1,
    name: "제주도",
    country: "대한민국",
    region: "국내",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.8,
    reviewCount: 1247,
    description: "아름다운 자연과 독특한 문화가 어우러진 섬으로, 한라산과 성산일출봉 등의 명소가 있습니다.",
    highlights: ["한라산", "성산일출봉", "우도", "협재해수욕장"],
    bestTime: "4월-6월, 9월-11월",
    budget: "중간",
    tags: ["자연", "해변", "하이킹", "가족여행"],
    isPopular: true,
  },
  {
    id: 2,
    name: "부산",
    country: "대한민국",
    region: "국내",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.6,
    reviewCount: 892,
    description: "해운대 해수욕장과 감천문화마을로 유명한 항구도시입니다.",
    highlights: ["해운대", "광안리", "감천문화마을", "자갈치시장"],
    bestTime: "5월-6월, 9월-10월",
    budget: "저렴",
    tags: ["해변", "도시", "맛집", "야경"],
    isPopular: true,
  },
  {
    id: 3,
    name: "교토",
    country: "일본",
    region: "아시아",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.9,
    reviewCount: 2156,
    description: "전통과 현대가 공존하는 고풍스러운 도시로 수많은 사찰과 정원이 있습니다.",
    highlights: ["기요미즈데라", "후시미이나리", "아라시야마", "기온"],
    bestTime: "3월-5월, 10월-11월",
    budget: "높음",
    tags: ["문화", "사찰", "전통", "벚꽃"],
    isPopular: true,
  },
  {
    id: 4,
    name: "파리",
    country: "프랑스",
    region: "유럽",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.7,
    reviewCount: 3421,
    description: "로맨틱한 분위기의 예술과 문화의 도시입니다.",
    highlights: ["에펠탑", "루브르박물관", "노트르담", "샹젤리제"],
    bestTime: "4월-6월, 9월-10월",
    budget: "높음",
    tags: ["예술", "문화", "로맨틱", "박물관"],
    isPopular: true,
  },
  {
    id: 5,
    name: "발리",
    country: "인도네시아",
    region: "아시아",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.5,
    reviewCount: 1876,
    description: "열대 낙원의 휴양지로 아름다운 해변과 사원이 있습니다.",
    highlights: ["우붓", "탄나롯사원", "쿠타해변", "테갈랄랑"],
    bestTime: "4월-10월",
    budget: "중간",
    tags: ["해변", "휴양", "사원", "스파"],
    isPopular: false,
  },
  {
    id: 6,
    name: "방콕",
    country: "태국",
    region: "아시아",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.4,
    reviewCount: 1543,
    description: "활기찬 거리와 맛있는 음식, 화려한 사원이 있는 도시입니다.",
    highlights: ["왓포", "차투착시장", "카오산로드", "왕궁"],
    bestTime: "11월-2월",
    budget: "저렴",
    tags: ["도시", "맛집", "사원", "쇼핑"],
    isPopular: false,
  },
  {
    id: 7,
    name: "로마",
    country: "이탈리아",
    region: "유럽",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.6,
    reviewCount: 2987,
    description: "고대 로마의 유적과 바티칸이 있는 영원한 도시입니다.",
    highlights: ["콜로세움", "바티칸", "트레비분수", "판테온"],
    bestTime: "4월-6월, 9월-10월",
    budget: "높음",
    tags: ["역사", "문화", "유적", "예술"],
    isPopular: false,
  },
  {
    id: 8,
    name: "뉴욕",
    country: "미국",
    region: "북미",
    image: "/placeholder.svg?height=300&width=400",
    rating: 4.5,
    reviewCount: 4521,
    description: "잠들지 않는 도시로 브로드웨이와 센트럴파크가 유명합니다.",
    highlights: ["타임스퀘어", "센트럴파크", "자유의여신상", "브루클린브릿지"],
    bestTime: "4월-6월, 9월-11월",
    budget: "높음",
    tags: ["도시", "쇼핑", "뮤지컬", "마천루"],
    isPopular: false,
  },
]

const regions = ["전체", "국내", "아시아", "유럽", "북미", "남미", "오세아니아", "아프리카"]
const budgets = ["전체", "저렴", "중간", "높음"]

export default function DestinationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("전체")
  const [selectedBudget, setSelectedBudget] = useState("전체")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showPopularOnly, setShowPopularOnly] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])

  const filteredDestinations = destinations.filter((destination) => {
    const matchesSearch =
      destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRegion = selectedRegion === "전체" || destination.region === selectedRegion
    const matchesBudget = selectedBudget === "전체" || destination.budget === selectedBudget
    const matchesPopular = !showPopularOnly || destination.isPopular

    return matchesSearch && matchesRegion && matchesBudget && matchesPopular
  })

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">여행지 둘러보기</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            전 세계의 아름다운 여행지를 발견하고 다음 여행을 계획해보세요
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="여행지, 국가, 키워드로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="지역" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="예산" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget} value={budget}>
                          {budget}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showPopularOnly ? "default" : "outline"}
                    onClick={() => setShowPopularOnly(!showPopularOnly)}
                    className="flex items-center space-x-2"
                  >
                    <Star className="h-4 w-4" />
                    <span>인기 여행지만</span>
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredDestinations.length}</span>개의 여행지를
            찾았습니다
          </p>
        </div>

        {/* Destinations Grid/List */}
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDestinations.map((destination) => (
                <Card
                  key={destination.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={destination.image || "/placeholder.svg"}
                      alt={destination.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 flex space-x-2">
                      {destination.isPopular && <Badge className="bg-red-500 text-white">인기</Badge>}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(destination.id)
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(destination.id) ? "text-red-500 fill-current" : "text-gray-600"
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-white/90 rounded-full px-2 py-1 flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{destination.rating}</span>
                      <span className="text-xs text-gray-500 ml-1">({destination.reviewCount})</span>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{destination.name}</CardTitle>
                        <CardDescription className="flex items-center text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {destination.country}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {destination.budget}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{destination.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {destination.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">최적 시기:</span> {destination.bestTime}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredDestinations.map((destination) => (
                <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex">
                    <div className="relative w-64 h-48 flex-shrink-0">
                      <img
                        src={destination.image || "/placeholder.svg"}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        {destination.isPopular && <Badge className="bg-red-500 text-white">인기</Badge>}
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{destination.name}</h3>
                          <div className="flex items-center text-gray-500 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{destination.country}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium">{destination.rating}</span>
                            <span className="text-gray-500 ml-1">({destination.reviewCount})</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(destination.id)
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 mr-1 ${
                                favorites.includes(destination.id) ? "text-red-500 fill-current" : "text-gray-600"
                              }`}
                            />
                            찜하기
                          </Button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{destination.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">주요 명소:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {destination.highlights.slice(0, 4).map((highlight, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">최적 시기:</span>
                          <p className="text-sm text-gray-600 mt-1">{destination.bestTime}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {destination.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* No Results */}
        {filteredDestinations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 mb-4">다른 검색어나 필터를 시도해보세요</p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedRegion("전체")
                  setSelectedBudget("전체")
                  setShowPopularOnly(false)
                }}
              >
                필터 초기화
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
