'use client';
import { useState } from 'react';
import { supabase } from '../utils/supabase';

function cleanUsername(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

export default function AuthModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setMsg('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        const finalUsername = cleanUsername(username);

        if (finalUsername.length < 3 || finalUsername.length > 20) {
          throw new Error('Username must be 3-20 characters. Use letters, numbers, or underscores only.');
        }

        const { data: existingUsername, error: usernameCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', finalUsername)
          .maybeSingle();

        if (usernameCheckError) throw usernameCheckError;

        if (existingUsername) {
          throw new Error('That username is already taken.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: finalUsername,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: finalUsername,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`,
              explicit_filter_on: true,
              username_edit_count: 0,
            });

          if (profileError) throw profileError;
        }

        setMsg('Profile generated! Check your email inbox to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;
        window.location.reload();
      }
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white font-bold text-xs"
        >
          x
        </button>

        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4">
          {isSignUp ? 'Generate Studio Profile' : 'Authenticate Credentials'}
        </h3>

        <form onSubmit={handleAuth} className="flex flex-col gap-3 text-xs">
          {isSignUp && (
            <input
              type="text"
              placeholder="Pick Unique Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
            required
          />

          <input
            type="password"
            placeholder="Account Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-orange-600 text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {submitting ? 'Working...' : 'Execute Operation'}
          </button>
        </form>

        {msg && (
          <p className="text-[11px] text-center text-orange-400 mt-3 font-medium bg-orange-950/20 p-2 rounded-lg border border-orange-900/30">
            {msg}
          </p>
        )}

        <p className="text-zinc-500 text-center text-[11px] mt-4">
          {isSignUp ? 'Already have an active workspace?' : 'Need a studio profile?'}

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMsg('');
            }}
            className="text-orange-500 font-bold hover:underline ml-1"
          >
            {isSignUp ? 'Login' : 'Register Free'}
          </button>
        </p>
      </div>
    </div>
  );
}