import { useState, useEffect } from 'react';
import { ListMusic, Mail, Phone, Lock, Hash } from 'lucide-react';
import { apiFetch, setToken } from './lib/api';
import { auth, googleProvider, setupRecaptcha } from './lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber
} from 'firebase/auth';

export default function LandingPage({ onLogin }) {
  const [method, setMethod] = useState(null); // 'email' | 'phone' | 'otp'
  const [inputValue, setInputValue] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (method === 'phone') {
      setupRecaptcha('recaptcha-container');
    }
  }, [method]);

  const handleFirebaseUser = async (user) => {
    try {
      const idToken = await user.getIdToken();
      // Send token to our backend to get our app's JWT
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
      setToken(res.token);
      onLogin(res.user);
    } catch (err) {
      setError('Backend login failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleFirebaseUser(result.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue || !password) return;
    setLoading(true);
    setError('');
    try {
      try {
        const result = await signInWithEmailAndPassword(auth, inputValue, password);
        await handleFirebaseUser(result.user);
      } catch (loginErr) {
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
          const result = await createUserWithEmailAndPassword(auth, inputValue, password);
          await handleFirebaseUser(result.user);
        } else {
          throw loginErr;
        }
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue) return;
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPhoneNumber(auth, inputValue, window.recaptchaVerifier);
      setConfirmationResult(result);
      setMethod('otp');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      await handleFirebaseUser(result.user);
    } catch (err) {
      setError('Invalid code. ' + err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08070C] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#8B5CF6]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#2DD9C8]/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2DD9C8] flex items-center justify-center shrink-0">
            <ListMusic className="w-6 h-6 text-white" />
          </div>
          <span className="text-4xl font-bold tracking-tight">SAREGAMA</span>
        </div>
        
        <p className="text-[#9490A8] text-lg text-center mb-12">
          Your personal space for sound.<br/>No ads, just music.
        </p>

        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          {method === 'email' && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <button type="button" onClick={() => setMethod(null)} className="text-sm text-[#9490A8] hover:text-white self-start mb-2 transition-colors">
                ← Back
              </button>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#9490A8]">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9490A8]" />
                  <input type="email" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="you@example.com" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors" required autoFocus />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-medium text-[#9490A8]">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9490A8]" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors" required minLength={6} />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-white text-black font-semibold rounded-xl py-3 mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50">
                {loading ? 'Authenticating...' : 'Continue'}
              </button>
            </form>
          )}

          {method === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              <button type="button" onClick={() => setMethod(null)} className="text-sm text-[#9490A8] hover:text-white self-start mb-2 transition-colors">
                ← Back
              </button>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#9490A8]">Phone Number (with country code)</label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9490A8]" />
                  <input type="tel" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="+1 555 123 4567" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors" required autoFocus />
                </div>
              </div>
              <div id="recaptcha-container"></div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-white text-black font-semibold rounded-xl py-3 mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50">
                {loading ? 'Sending Code...' : 'Send SMS Code'}
              </button>
            </form>
          )}

          {method === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
              <button type="button" onClick={() => { setMethod('phone'); setOtp(''); }} className="text-sm text-[#9490A8] hover:text-white self-start mb-2 transition-colors">
                ← Back to Phone
              </button>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#9490A8]">Enter 6-digit Code</label>
                <div className="relative">
                  <Hash className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9490A8]" />
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors text-center tracking-widest text-lg font-bold" required autoFocus maxLength={6} />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-white text-black font-semibold rounded-xl py-3 mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          {!method && (
            <div className="flex flex-col gap-3">
              <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl py-3 hover:bg-gray-200 transition-colors disabled:opacity-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? 'Opening Google...' : 'Continue with Google'}
              </button>
              
              <button onClick={() => setMethod('email')} className="w-full flex items-center justify-center gap-3 bg-white/10 text-white font-semibold rounded-xl py-3 hover:bg-white/20 transition-colors">
                <Mail className="w-5 h-5" />
                Continue with Email
              </button>
              
              <button onClick={() => setMethod('phone')} className="w-full flex items-center justify-center gap-3 bg-white/10 text-white font-semibold rounded-xl py-3 hover:bg-white/20 transition-colors">
                <Phone className="w-5 h-5" />
                Continue with Phone
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
