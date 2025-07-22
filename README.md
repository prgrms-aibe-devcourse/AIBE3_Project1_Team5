# AIBE_Team5

## 목차

- [📖 프로젝트 소개](#-프로젝트-소개)
- [🌟 서비스 소개](#-서비스-소개)
- [📅 개발기간](#-개발기간)
- [👩‍💻 개발자 소개 / 역할](#-개발자-소개--역할)
- [💻 개발 환경](#-개발-환경)
- [🛠️ 설치 및 실행 방법](#-설치-및-실행-방법)
- [🔧 기술 스택](#-기술-스택)
- [🧩 ERD](#-erd)
- [📂 프로젝트 파일 구조](#-프로젝트-파일-구조)

## 📖 프로젝트 소개

__“여행 계획의 시작, 한눈에 보는 여행지 정보!”__
사용자가 원하는 국가 또는 도시를 쉽게 검색하고,
각 여행지의 상세 정보를 직관적인 UI로 확인할 수 있는 여행 플랫폼입니다. __AI와 연동된 맞춤형 여행 일정 추천__ 기능과 __일정 생성기능__ 도 제공합니다.

## 🌟 서비스 소개

- __🔐 소셜 로그인 및 사용자 인증__
Google, GitHub, Kakao를 통한 간편 로그인 / 로그아웃
사용자 프로필 관리 기능 포함
- __🗺️ 여행지 검색 및 상세 정보 제공__
국가/도시 기준 검색
이미지, 설명, 팁, 여행 최적 시기 등의 상세 정보 제공
- __🧭 여행 일정 생성 및 관리__
Google Maps 기반 인터페이스로 직관적인 일정 구성
일정에 장소 추가/수정/삭제 가능
- __🤖 AI 여행 일정 추천__
AI 챗봇을 통해 사용자 맞춤 여행 일정 자동 생성
프롬프트 바탕 여행 일정 정보 열람 및 다운로드
- __📝 여행 후기 시스템__
여행지별 후기 작성 / 수정 / 삭제 / 검색 기능 제공
이미지 업로드 가능

## 📸 시연 화면
| 홈 화면 | 여행지 상세 |로그인 |
|--------|--------------|----|
| <img width="320" height="180" alt="image" src="https://github.com/user-attachments/assets/11950728-93e6-4d9e-9d8c-dba613a84a2c" /> |<img width="320" height="180" alt="image" src="https://github.com/user-attachments/assets/7bbc990a-3e9a-457a-8e26-356f55e1c186" />|<img width="320" height="180" alt="image" src="https://github.com/user-attachments/assets/f44f0014-b495-4e20-af67-b6ca2581e1ff" />|


## 📅 개발기간

2025년 7월 15일 ~ 2025년 7월 22일 (7일간)

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
```
OS:  Windows, macOS
협업 도구: Git, GitHub, Notion
디자인 툴: V0 (AI UI Generator)
```

## 🛠️ 설치 및 실행 방법

```bash
# 1. 레포지토리 클론
git clone https://github.com/your-org/AIBE3_Project1_Team5.git

# 2. 패키지 설치
cd AIBE3_Project1_Team5
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase 키 등 채우기

# 4. 개발 서버 실행
npm run dev
```

## 🔧 기술 스택
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage)
- **디자인/생성 툴**: V0
- **AI** : OpenAI API (챗봇 기반 추천)
- **지도** : Google Maps API
- **협업/관리**: Git, GitHub, Notion

## 🧩 ERD
<img width="1435" height="756" alt="스크린샷 2025-07-22 오전 8 59 15" src="https://github.com/user-attachments/assets/dacce637-df0c-46be-be76-2916a41bd3a9" />
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
