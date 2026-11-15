import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (fullName: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: SupabaseUser = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { full_name: 'Demo Architect' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@mycloud.io',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const DEMO_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@mycloud.io',
  full_name: 'Demo Architect',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  const fetchProfile = async (userId: string, email: string) => {
    if (!isSupabaseConfigured) {
      setProfile(DEMO_PROFILE);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
      } else {
        // Fallback profile if record not yet created by trigger
        const newProfile: Profile = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(newProfile);

        // Auto-create in database so foreign keys on files & folders succeed
        try {
          await supabase.from('profiles').upsert(newProfile);
          await supabase.from('storage_usage').upsert({
            user_id: userId,
            used_bytes: 0,
            quota_bytes: 10737418240,
            file_count: 0,
            folder_count: 0,
          });
        } catch (syncErr) {
          console.warn('Initial profile sync note:', syncErr);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In demo mode with no Supabase credentials, auto-authenticate demo user
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    // Initialize session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setIsDemoMode(true);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      const newUser = { ...DEMO_USER, email, user_metadata: { full_name: fullName } };
      setUser(newUser);
      setProfile({ ...DEMO_PROFILE, email, full_name: fullName });
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const updateProfile = async (fullName: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    if (!isSupabaseConfigured) {
      if (profile) setProfile({ ...profile, full_name: fullName });
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, full_name: fullName });
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

