'use client';

import { useEffect } from 'react';

export default function ErrorBoundary() {
  useEffect(() => {
    // 브라우저 확장 프로그램으로 인한 에러 필터링
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // 브라우저 확장 프로그램 관련 에러 필터링
      if (
        error?.message?.includes('message channel closed') ||
        error?.message?.includes('Extension context invalidated') ||
        error?.message?.includes('listener indicated an asynchronous response') ||
        error?.stack?.includes('chrome-extension://') ||
        error?.stack?.includes('moz-extension://')
      ) {
        console.warn('브라우저 확장 프로그램 관련 에러 무시됨:', error);
        event.preventDefault(); // 에러 로그 방지
        return;
      }
      
      // 실제 애플리케이션 에러는 그대로 처리
      console.error('Unhandled Promise Rejection:', error);
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // 브라우저 확장 프로그램 관련 에러 필터링
      if (
        event.message?.includes('message channel closed') ||
        event.message?.includes('Extension context invalidated') ||
        event.filename?.includes('chrome-extension://') ||
        event.filename?.includes('moz-extension://')
      ) {
        console.warn('브라우저 확장 프로그램 관련 에러 무시됨:', event.message);
        event.preventDefault();
        return;
      }
      
      // 실제 애플리케이션 에러는 그대로 처리
      console.error('JavaScript Error:', error);
    };

    // 전역 에러 핸들러 등록
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // 정리
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // UI 렌더링 없음
}