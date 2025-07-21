# AIBE_Team5

## 목차

- [📖 프로젝트 소개](#-프로젝트-소개)
- [🌟 서비스 소개](#-서비스-소개)
- [🚀 배포 링크](#-배포-링크)
- [📅 개발기간](#-개발기간)
- [👩‍💻 개발자 소개 / 역할](#-개발자-소개--역할)
- [💻 개발 환경](#-개발-환경)
- [🔧 기술 스택](#-기술-스택)
- [🧩 ERD](#-erd)
- [📂 프로젝트 파일 구조](#-프로젝트-파일-구조)

## 📖 프로젝트 소개

사용자가 원하는 국가/도시를 쉽게 검색하고, 각 여행지의 세부정보를 확인할 수 있는 직관적인 인터페이스를 제공하는 플랫폼입니다!

## 🌟 서비스 소개

- 사용자 인증 및 프로필 관리(google, github, kakao 소셜 로그인 지원)
- 여행지 검색 및 상세 정보 제공
- 여행 일정 생성 및 Google Maps 활용 관리
- AI 채팅을 통한 여행 일정 생성 기능
- 여행 후기 작성, 수정, 삭제, 검색 기능

## 🚀 배포 링크

## 📅 개발기간

7월 15일~ 7월 22일

## 👩‍💻 개발자 소개 / 역할
| 이름   | 역할                |
| ------ | ------------------- |
| 김도하 | 회원가입 / 로그인 |
| 이연서 | 메인 화면, 여행지 리스트 출력 |
| 임창기 | AI 여행 추천 채팅 |
| 박세웅 | 여행 일정 생성 / 관리 |
| 주권영 | 여행지 정보 상세 출력 |
| 최원제 | 여행지 별 후기 / 이미지 업로드 |

## 💻 개발 환경

## 🔧 기술 스택
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage)
- **디자인/생성 툴**: ERDCloud, V0
- **협업/관리**: Git, GitHub, Notion

## 🧩 ERD
<img width="2113" height="957" alt="erd" src="https://github.com/user-attachments/assets/c4cec71f-4b98-4e2f-ba14-f3ec965be6b6" />
https://www.erdcloud.com/d/kgdtqitSQGS9eDpEJ


## 📂 프로젝트 파일 구조
```bash
aibe3-project1-team5/
├── app/                        # 주요 페이지, 라우트, 레이아웃 등
│   ├── api/                    # API 라우트 
│   ├── chat/                   # 채팅 관련 페이지
│   ├── components/             # 페이지 전용 컴포넌트
│   ├── destinations/           # 여행지 관련 페이지
│   ├── login/                  # 로그인 페이지
│   ├── my-trips/               # 내 여행 관리 페이지
│   ├── planner/                # 여행 플래너 페이지
│   ├── providers/              # 전역 Provider
│   ├── reviews/                # 리뷰 관련 페이지
│   ├── setprofile/             # 프로필 설정 페이지
│   ├── signup/                 # 회원가입 페이지
│   ├── globals.css             # 전역 스타일
│   ├── layout.tsx              # 전체 레이아웃
│   └── page.tsx                # 메인 페이지
│
├── components/                 # 재사용 가능한 UI 컴포넌트
│   ├── chat/                   # 채팅 UI 컴포넌트
│   ├── destination/            # 여행지 UI 컴포넌트
│   ├── home/                   # 홈 화면 UI 컴포넌트
│   ├── reviews/                # 리뷰 UI 컴포넌트
│   ├── trip-details/           # 여행 상세 UI 컴포넌트
│   └── ui/                     # 공통 UI 컴포넌트(버튼, 입력창 등)
│
├── hooks/                      # 커스텀 훅
├── lib/                        # 라이브러리, 유틸 함수, 서비스
├── utils/                      # 유틸리티 함수, 상수, 타입 등
├── public/                     # 정적 파일(이미지, 아이콘 등)
├── styles/                     # 추가 스타일 파일
│
├── package.json                
├── package-lock.json           
├── tailwind.config.ts         
└── ...
```
