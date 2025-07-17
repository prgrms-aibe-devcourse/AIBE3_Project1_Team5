import { useState } from 'react';
import { isValidName, isValidEmail, isValidPassword, isPasswordMatch } from '@/lib/authValidator';

export function useInputValidator() {
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleNameChange = (value: string) => {
    if (!value.trim()) setNameError('이름을 입력해주세요.');
    else if (!isValidName(value))
      setNameError('이름은 2~15자, 한글/영문/숫자/_만 사용할 수 있습니다.');
    else setNameError('');
  };

  const handleEmailChange = (value: string) => {
    if (!value.trim()) setEmailError('이메일을 입력해주세요.');
    else if (!isValidEmail(value)) setEmailError('유효한 이메일 주소를 입력해주세요.');
    else setEmailError('');
  };

  const handlePasswordChange = (value: string, confirmPassword: string) => {
    if (!value.trim()) setPasswordError('비밀번호를 입력해주세요.');
    else if (!isValidPassword(value))
      setPasswordError('비밀번호는 6~20자, 소문자/숫자/특수문자(!@#$%^&*())만 사용할 수 있습니다.');
    else setPasswordError('');
    // 비밀번호가 바뀌면 비밀번호 확인도 다시 검사
    if (confirmPassword && !isPasswordMatch(value, confirmPassword))
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    else setConfirmPasswordError('');
  };

  const handleConfirmPasswordChange = (password: string, value: string) => {
    if (!value.trim()) setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
    else if (!isPasswordMatch(password, value))
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    else setConfirmPasswordError('');
  };

  return {
    nameError,
    emailError,
    passwordError,
    confirmPasswordError,
    handleNameChange,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    setNameError,
    setEmailError,
    setPasswordError,
    setConfirmPasswordError,
  };
}
