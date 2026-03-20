'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'login_required' | 'accepting' | 'success' | 'error'>('loading');
  const [coachName, setCoachName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuthAndInvite();
  }, [token]);

  const checkAuthAndInvite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatus('login_required');
      return;
    }
    await acceptInvite(session.access_token);
  };

  const acceptInvite = async (accessToken: string) => {
    setStatus('accepting');
    const res = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (res.ok) {
      setCoachName(data.coach?.name || '你的教練');
      setStatus('success');
    } else {
      setMessage(data.error || '邀請連結無效');
      setStatus('error');
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/invite/${token}`,
        queryParams: { role: 'client' },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur border border-white/10 rounded-2xl p-8 w-full max-w-md text-center">

        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">驗證邀請連結中...</p>
          </>
        )}

        {status === 'login_required' && (
          <>
            <div className="text-5xl mb-4">💪</div>
            <h1 className="text-2xl font-bold text-white mb-2">教練邀請你加入</h1>
            <p className="text-gray-400 mb-6 text-sm">登入後即可連結到你的教練，開始同步訓練數據</p>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              使用 Google 帳號登入
            </button>
            <p className="text-gray-500 text-xs mt-4">登入即代表同意授權教練查看你的訓練數據</p>
          </>
        )}

        {status === 'accepting' && (
          <>
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">建立連結中...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-2">成功連結！</h1>
            <p className="text-gray-400 mb-6">你已成功連結到 <span className="text-purple-400 font-bold">{coachName}</span> 的管理系統</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              開始使用 →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">連結失敗</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              回到首頁
            </button>
          </>
        )}

      </div>
    </div>
  );
}
