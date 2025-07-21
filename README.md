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
- **협업/관리**: Git, GitHub, Figma, Notion

## 🧩 ERD
<img width="2113" height="957" alt="erd" src="https://github.com/user-attachments/assets/c4cec71f-4b98-4e2f-ba14-f3ec965be6b6" />
https://www.erdcloud.com/d/kgdtqitSQGS9eDpEJ


## 📂 프로젝트 파일 구조
```bash
aibe3-project1-team5/
├── app/
│ ├── chat/
│ ├── components/
│ │ └── inputForm/
│ ├── destinations/
│ ├── login/
│ ├── planner/
│ ├── providers/
│ ├── reviews/
│ ├── setprofile/
│ ├── signup/
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── chat/
│ ├── reviews/
│ ├── SearchForm.tsx
│ ├── theme-provider.tsx
│ └── ui/
├── hooks/
├── lib/
├── public/
├── styles/
├── package.json
├── README.md
└── ...
```
