'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, AlertCircle, Loader2, X, ShieldCheck } from 'lucide-react';
import { verifyCardPassword } from '@/lib/dataService';

interface PasswordModalProps {
  isOpen: boolean;
  cardId: string; // 'admin', 'checkin', '401'..'408'
  cardTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PasswordModal({
  isOpen,
  cardId,
  cardTitle,
  onSuccess,
  onClose,
}: PasswordModalProps) {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, cardId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter passcode');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyCardPassword(cardId, passcode);
      if (isValid) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`auth_card_${cardId}`, 'true');
        }
        onSuccess();
      } else {
        setError('Incorrect passcode. Please try again.');
        inputRef.current?.select();
      }
    } catch (err) {
      setError('Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-xl border border-zinc-800 bg-[#09090b] p-6 shadow-2xl ring-1 ring-zinc-700/30">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center mb-3 text-zinc-200">
            {cardId === 'admin' ? (
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            ) : (
              <Lock className="w-6 h-6 text-zinc-300" />
            )}
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Security Check: {cardTitle}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Enter authorized passcode to access this section
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                ref={inputRef}
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter passcode..."
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 font-mono tracking-wider transition-colors disabled:opacity-50"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !passcode.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Unlock Access'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
