'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface Profile {
  name: string;
  modified_at: string;
  created_at: string;
  user_id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  profile: Profile | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGithub: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithKakao: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const getProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data as Profile;
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await getProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      // 세션과 프로필 모두 완료된 후에 로딩 상태 해제
      setIsLoading(false);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await getProfile(session.user.id);
        setProfile(profileData);

        // 프로필이 없으면 /setprofile로, 있으면 /로 이동
        if (!profileData) {
          router.push('/setprofile');
        } else {
          router.push('/');
        }
      } else {
        setProfile(null);
      }

      // 세션과 프로필 모두 완료된 후에 로딩 상태 해제
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password });

    if (!error && data.user && name) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          user_id: data.user.id,
          name: name,
        },
      ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    // 회원가입 후 세션 강제 로그아웃
    await supabase.auth.signOut();

    if (!error) {
      router.push('/login');
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      // 로그인 성공 시 profile 갱신
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
      }
      // 로그인 성공 시에만 홈화면으로 이동
      router.push('/');
    }
    // 로그인 성공/실패와 관계없이 프로필 로딩 완료 후 로딩 상태 해제
    setIsLoading(false);
    return { error };
  };

  const signInWithGithub = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/setprofile`,
      },
    });

    if (!error) {
      // GitHub 로그인 성공 시 profile 갱신
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
      }
      // 로그인 성공 시에만 홈화면으로 이동
      router.push('/');
    }

    // 로그인 성공/실패와 관계없이 프로필 로딩 완료 후 로딩 상태 해제
    setIsLoading(false);
    return { error };
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/setprofile`,
      },
    });

    if (!error) {
      // Google 로그인 성공 시 profile 갱신
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
      }
      // 로그인 성공 시에만 홈화면으로 이동
      router.push('/');
    }

    // 로그인 성공/실패와 관계없이 프로필 로딩 완료 후 로딩 상태 해제
    setIsLoading(false);
    return { error };
  };

  const signInWithKakao = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/setprofile`,
      },
    });

    if (!error) {
      // Kakao 로그인 성공 시 profile 갱신
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
      }
      // 로그인 성공 시에만 홈화면으로 이동
      router.push('/');
    }

    // 로그인 성공/실패와 관계없이 프로필 로딩 완료 후 로딩 상태 해제
    setIsLoading(false);
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await getProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value = {
    user,
    isLoading,
    profile,
    signUp,
    signIn,
    signInWithGithub,
    signInWithGoogle,
    signInWithKakao,
    refreshProfile,
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
