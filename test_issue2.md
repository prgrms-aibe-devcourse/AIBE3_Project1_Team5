fetch.js:30  GET https://exbimetzhyeddpkjnlyt.supabase.co/rest/v1/session_parameters?select=*&chat_session_id=eq.bc7b5381-479e-4dc2-acc1-38e3e2e59990 406 (Not Acceptable)
eval @ fetch.js:30
eval @ fetch.js:51
fulfilled @ fetch.js:11
Promise.then
step @ fetch.js:13
eval @ fetch.js:14
__awaiter @ fetch.js:10
eval @ fetch.js:41
then @ PostgrestBuilder.js:65Understand this error
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\lib\travelPlanService.ts:199 🆕 새로운 세션 파라미터 생성
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:1429 💾 파라미터 저장 결과: 성공
5localhost/:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was receivedUnderstand this error
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:753 📨 sendMessage called with: {content: '여수맛집투어', user: true, currentSession: true}
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:754 🔐 Authentication state: {userId: 'd697459d-9323-4dee-9aae-5d93b746ef3d', sessionId: 'bc7b5381-479e-4dc2-acc1-38e3e2e59990'}
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:770 🔍 Attempting to get session parameters for session: bc7b5381-479e-4dc2-acc1-38e3e2e59990
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\components\chat\TravelListModal.tsx:143 🔄 TravelListModal - Loading travels for user: d697459d-9323-4dee-9aae-5d93b746ef3d
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\components\chat\TravelListModal.tsx:160 🔍 Starting to load travels...
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:784 ❌ getSessionParameters 에러: Error: getSessionParameters timeout
    at useChat.useCallback[sendMessage] (C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:776:35)
overrideMethod @ hook.js:608
error @ intercept-console-error.js:50
useChat.useCallback[sendMessage] @ C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:784Understand this error
C:\Users\82109\aibe\vsCode\aibe3_project1_team5\hooks\useChat.ts:787 🔄 에러 무시하고 빈 파라미터로 계속 진행