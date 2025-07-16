"use client"

import { useState } from "react"
import { Star, ThumbsUp, MessageCircle, Search, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const reviews = [
  {
    id: 1,
    user: {
      name: "김여행",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "여행 마니아",
    },
    destination: "제주도",
    rating: 5,
    title: "제주도 3박 4일 완벽한 여행!",
    content:
      "제주도 여행이 정말 완벽했어요! 특히 성산일출봉에서 본 일출이 너무 아름다웠습니다. 현지 맛집들도 정말 맛있었고, 렌터카로 돌아다니기도 편했어요. 다음에 또 가고 싶은 곳이에요.",
    images: ["/placeholder.svg?height=200&width=300", "/placeholder.svg?height=200&width=300"],
    date: "2024-01-15",
    likes: 24,
    comments: 8,
    tags: ["가족여행", "렌터카", "맛집"],
  },
  {
    id: 2,
    user: {
      name: "박모험",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "여행 초보",
    },
    destination: "부산",
    rating: 4,
    title: "부산 해운대 바다가 최고!",
    content:
      "해운대 해수욕장에서 수영하고 광안리에서 야경 보는 게 정말 좋았어요. 자갈치시장에서 회도 먹고 감천문화마을도 구경했습니다. 다만 여름이라 너무 더웠어요.",
    images: ["/placeholder.svg?height=200&width=300"],
    date: "2024-01-10",
    likes: 18,
    comments: 5,
    tags: ["해수욕장", "야경", "시장"],
  },
  {
    id: 3,
    user: {
      name: "이문화",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "여행 전문가",
    },
    destination: "경주",
    rating: 5,
    title: "역사와 문화가 살아있는 경주",
    content:
      "불국사와 석굴암은 정말 감동적이었어요. 천년의 역사가 느껴지는 곳이었습니다. 첨성대에서 별도 보고, 대릉원에서 산책도 했어요. 역사를 좋아하는 분들께 강력 추천!",
    images: [
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
      "/placeholder.svg?height=200&width=300",
    ],
    date: "2024-01-08",
    likes: 32,
    comments: 12,
    tags: ["역사", "문화재", "사찰"],
  },
]

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDestination, setSelectedDestination] = useState("전체")
  const [sortBy, setSortBy] = useState("latest")
  const [showWriteReview, setShowWriteReview] = useState(false)

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDestination = !selectedDestination || review.destination === selectedDestination
    return matchesSearch && matchesDestination
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">여행 후기</h1>
            <p className="text-gray-600">실제 여행자들의 생생한 후기를 확인해보세요</p>
          </div>
          <Button onClick={() => setShowWriteReview(true)} className="bg-blue-600 hover:bg-blue-700">
            후기 작성하기
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="후기 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="목적지 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="제주도">제주도</SelectItem>
                  <SelectItem value="부산">부산</SelectItem>
                  <SelectItem value="경주">경주</SelectItem>
                  <SelectItem value="서울">서울</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="rating">평점순</SelectItem>
                  <SelectItem value="likes">좋아요순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Write Review Modal */}
        {showWriteReview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>후기 작성하기</CardTitle>
              <CardDescription>여행 경험을 다른 여행자들과 공유해보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">목적지</label>
                  <Input placeholder="여행한 목적지를 입력하세요" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">평점</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-6 w-6 text-yellow-400 fill-current cursor-pointer" />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <Input placeholder="후기 제목을 입력하세요" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">후기 내용</label>
                <Textarea placeholder="여행 경험을 자세히 작성해주세요..." rows={6} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowWriteReview(false)}>
                  취소
                </Button>
                <Button onClick={() => setShowWriteReview(false)}>후기 등록</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={review.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{review.user.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {review.user.level}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{review.destination}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{review.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h2 className="text-lg font-semibold mb-3">{review.title}</h2>
                <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>

                {/* Images */}
                {review.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image || "/placeholder.svg"}
                        alt={`여행 사진 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    ))}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {review.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      좋아요 {review.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      댓글 {review.comments}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    공유하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">검색 결과가 없습니다.</p>
              <Button onClick={() => setShowWriteReview(true)}>첫 번째 후기를 작성해보세요</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
