// 인증 관련 입력값 검증 유틸
import { supabase } from './supabase';

export function isValidEmail(email: string): boolean {
  // 간단한 이메일 정규식
  return /^[\w-.]+@[\w-]+\.[a-z]{2,}$/i.test(email);
}

export function isValidPassword(password: string): boolean {
  // 6~20자, 소문자/숫자/특수문자만 허용
  // 특수문자: !@#$%^&*()
  return /^[a-z0-9!@#$%^&*()]{6,20}$/.test(password);
}

export function isValidName(name: string): boolean {
  // 2~15자, 한글/영문/숫자/_ 만 허용
  return /^[가-힣a-zA-Z0-9_]{2,15}$/.test(name);
}

export function isPasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

export async function isNameDuplicated(name: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('name', name)
    .single();
  // data가 있으면 중복, 없으면 중복 아님
  return !!data;
}
