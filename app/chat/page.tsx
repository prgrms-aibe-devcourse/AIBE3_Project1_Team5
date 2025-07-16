"use client"

import type React from "react"

import { useState } from "react"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  "제주도 3박 4일 여행 계획을 세워줘",
  "일본 벚꽃 시즌 여행 추천해줘",
  "유럽 배낭여행 루트 추천",
  "가족 여행지 추천해줘",
  "혼자 여행하기 좋은 곳은?",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content:
        "안녕하세요! 여행 계획 AI 어시스턴트입니다. 어떤 여행을 계획하고 계신가요? 목적지, 기간, 예산, 선호하는 활동 등을 알려주시면 맞춤형 여행 계획을 도와드릴게요! ✈️",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        type: "bot",
        content: `"${message}"에 대한 답변입니다. 실제 구현에서는 AI API를 연결하여 실시간으로 여행 계획을 생성하고 추천해드릴 수 있습니다. 예를 들어, 목적지 정보, 숙박 추천, 맛집 정보, 관광지 추천 등을 제공할 수 있습니다.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsLoading(false)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputMessage)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 여행 어시스턴트</h1>
          <p className="text-gray-600">AI와 함께 완벽한 여행 계획을 세워보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Suggested Questions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                  추천 질문
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-3 text-wrap bg-transparent"
                    onClick={() => handleSendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  여행 AI 채팅
                </CardTitle>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === "bot" && <Bot className="h-4 w-4 mt-1 text-blue-600" />}
                          {message.type === "user" && <User className="h-4 w-4 mt-1" />}
                          <div>
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-blue-600" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="여행에 대해 무엇이든 물어보세요..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
