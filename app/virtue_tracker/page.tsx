"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Virtue, virtues } from "../data/virtues";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Lock, Unlock, Loader2, Sparkles, X } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type LogEntry = {
  date: string;
  virtue: string;
  note: string;
};

const toDateKey = (d: Date) => d.toLocaleDateString("en-CA");

export default function VirtueTracker() {
  const { user, isLoaded } = useUser();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [triumphLogs, setTriumphLogs] = useState<LogEntry[]>([]);
  const [weekStartKey, setWeekStartKey] = useState<string>(() => toDateKey(new Date()));
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [selectedVirtue, setSelectedVirtue] = useState<Virtue | null>(null);

  useEffect(() => {
    const savedWeekStart = localStorage.getItem("franklin_week_start");
    if (savedWeekStart) setWeekStartKey(savedWeekStart);
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkAccessAndLoadData = async () => {
      const { data: accessData } = await supabase.from("user_access").select("*").eq("user_id", user.id).single();

      if (accessData) {
        setIsAuthorized(true);
        const { data: logsData } = await supabase.from("failure_logs").select("date, virtue, note").eq("user_id", user.id);
        if (logsData) setLogs(logsData);
        
        const { data: triumphData } = await supabase.from("triumph_logs").select("date, virtue, note").eq("user_id", user.id);
        if (triumphData) setTriumphLogs(triumphData);
      } else {
        setIsAuthorized(false);
      }
    };

    checkAccessAndLoadData();
  }, [isLoaded, user]);

  const weeks = useMemo(() => {
    const start = new Date(weekStartKey);
    start.setHours(0,0,0,0);
    return Array.from({ length: 52 }).map((_, i) => {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const days = Array.from({ length: 7 }).map((_, j) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + j);
        return toDateKey(d);
      });
      return { weekNum: i + 1, dateStr: toDateKey(weekStart), virtue: virtues[i % 14], days };
    });
  }, [weekStartKey]);

  const handleVerifyCode = async () => {
    if (!inviteCode.trim() || !user) return;
    setIsVerifying(true);
    setAuthError("");
    const codeUpper = inviteCode.trim().toUpperCase();

    const { data: codeData } = await supabase.from("invite_codes").select("*").eq("code", codeUpper).single();

    if (!codeData || codeData.used_count >= codeData.max_uses) {
      setAuthError("Invalid or fully claimed access code.");
      setIsVerifying(false);
      return;
    }

    await supabase.from("invite_codes").update({ used_count: codeData.used_count + 1 }).eq("id", codeData.id);
    await supabase.from("user_access").insert({ user_id: user.id, code_used: codeUpper });

    setIsAuthorized(true);
    setIsVerifying(false);
  };

  if (!isLoaded || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#1B2B3A]">
        <Loader2 className="animate-spin text-[#7B1B1B] mr-3" size={24} /> 
        <span className="font-serif italic text-lg">Consulting the Ledger...</span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-[#1B2B3A] selection:bg-[#7B1B1B] selection:text-white relative">
        <div className="absolute top-8 right-8"><UserButton /></div>
        <Link href="/" className="absolute top-8 left-8 inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#7B1B1B] transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Return
        </Link>
        <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl border border-slate-200 w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
            <Lock size={32} className="text-[#7B1B1B]" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-3 tracking-tight">Restricted Access</h2>
          <p className="text-sm text-slate-500 font-serif leading-relaxed mb-8">
            This Virtue Lab is currently in private beta. Please enter your exclusive access code to unlock the curriculum.
          </p>
          <input 
            type="text" 
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            placeholder="e.g. MASTER-FRANKLIN"
            className="w-full text-center px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 font-mono uppercase tracking-widest text-sm outline-none focus:border-[#1B2B3A] transition-colors"
          />
          {authError && <p className="text-xs text-[#7B1B1B] font-bold mb-4 animate-pulse">{authError}</p>}
          <button 
            onClick={handleVerifyCode}
            disabled={isVerifying || !inviteCode}
            className="w-full bg-[#1B2B3A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer"
          >
            {isVerifying ? <Loader2 className="animate-spin" size={16} /> : "Unlock the Lab"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B2B3A] font-sans p-6 md:p-12 selection:bg-[#7B1B1B] selection:text-white animate-in fade-in duration-700 relative">
      
      {/* 14 美德详情弹窗 */}
      {selectedVirtue && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-[#1B2B3A]/80 backdrop-blur-sm" onClick={() => setSelectedVirtue(null)}></div>
          
          <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedVirtue(null)} 
              className="absolute top-6 right-6 md:right-auto md:left-6 z-10 bg-slate-100 p-2 rounded-full text-slate-400 hover:text-[#1B2B3A] hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="p-10 lg:p-14 flex flex-col bg-white pt-16 md:pt-14">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 flex items-center gap-2">
                <BookOpen size={14} className="text-[#1B2B3A]" /> The Reference
              </span>
              <div className="mb-10">
                <h1 className="text-5xl font-serif font-bold text-[#1B2B3A] tracking-tight mb-2">{selectedVirtue.name}</h1>
                <span className="text-2xl text-[#7B1B1B] font-serif">{selectedVirtue.chineseName}</span>
              </div>
              <div className="pl-6 border-l-2 border-slate-200 mb-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">The Definition</span>
                <p className="text-lg text-slate-600 italic font-serif">"{selectedVirtue.franklinDefinition}"</p>
              </div>
              <div className="mt-auto bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B1B1B] block mb-4">How to practice</span>
                <ul className="space-y-3">
                  {selectedVirtue.actionableSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700 font-serif leading-relaxed">
                      <span className="text-[#7B1B1B] font-bold">{idx + 1}.</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="p-10 lg:p-14 flex flex-col bg-[#FDFBF7] border-t md:border-t-0 md:border-l border-slate-100">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-600" /> I-Ching Philosophy
              </span>
              <div className="mb-8">
                <div className="text-[#1B2B3A] font-light mb-4 text-6xl">{selectedVirtue.guaXiang}</div>
                <span className="text-2xl text-[#7B1B1B] font-serif">{selectedVirtue.guaName}</span>
              </div>
              <div className="pl-6 border-l-2 border-[#7B1B1B]/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B1B1B] block mb-3">彖辞 (Tuan Ci)</span>
                <p className="text-base text-slate-700 font-serif leading-relaxed text-justify">{selectedVirtue.tuanCi}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto" style={{ width: '90%', maxWidth: '1400px' }}>
        
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#7B1B1B] transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Return to Command Center
          </Link>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border-2 border-slate-200 shadow-sm" } }} />
        </div>
        
        <div className="flex items-center gap-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1B2B3A] tracking-tight">Virtue <span className="text-[#7B1B1B] italic">Lab</span></h1>
          <span className="bg-[#1B2B3A] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1"><Unlock size={10} /> Authorized</span>
        </div>

        <div className="bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] shadow-sm mb-16">
          <h2 className="text-3xl font-serif font-bold mb-10 text-[#1B2B3A] flex items-center border-b border-slate-100 pb-6">
            <Calendar size={28} className="mr-4 text-[#7B1B1B]" /> 52-Week Curriculum Map
          </h2>
          
          <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))' }}>
            {weeks.map(w => {
              const weekTriumphs = triumphLogs.filter(log => log.virtue === w.virtue.name && w.days.includes(log.date));
              const hasTriumph = weekTriumphs.length > 0;

              return (
                <div key={w.weekNum} className="flex flex-col bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:border-[#7B1B1B]/50 hover:bg-white hover:shadow-md transition-all p-3 relative group min-h-[100px]">
                  {hasTriumph && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow-md z-10" title={`Triumph: ${weekTriumphs[0].note}`}>
                      <Sparkles size={12} className="fill-white" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">W{w.weekNum}</span>
                    <span className="text-2xl text-[#7B1B1B] leading-none">{w.virtue.guaXiang}</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#1B2B3A] font-serif truncate w-full mb-1" title={w.virtue.name}>{w.virtue.chineseName}</div>
                  <div className="text-[9px] text-slate-400 font-mono mb-1">{w.dateStr.slice(5)}</div>
                  
                  <div className="flex justify-between gap-[2px] mt-auto">
                    {w.days.map((dayDate) => {
                       const dayLogEntry = logs.find(log => log.date === dayDate && log.virtue === w.virtue.name);
                       const tooltipText = dayLogEntry ? `${dayDate}: Shortfall Logged - "${dayLogEntry.note.slice(0, 30)}..."` : `${dayDate}: Clear`;
                       return (
                         <div key={dayDate} className={`flex-1 aspect-square rounded-full transition-colors ${dayLogEntry ? 'bg-[#1B2B3A]' : 'bg-slate-200'}`} title={tooltipText}></div>
                       );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-serif font-bold mb-8 text-[#1B2B3A] flex items-center border-b border-slate-100 pb-6">
            <BookOpen size={28} className="mr-4 text-[#7B1B1B]" /> The 14 Virtues Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {virtues.map(v => (
              <div 
                key={v.name} 
                onClick={() => setSelectedVirtue(v)}
                className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col h-full cursor-pointer hover:border-[#7B1B1B]/30"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                   <ArrowLeft size={16} className="rotate-135" />
                </div>
                <div className="absolute -right-4 -bottom-6 text-7xl text-slate-50 opacity-[0.03] group-hover:opacity-10 transition-opacity font-serif pointer-events-none">{v.guaXiang}</div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#1B2B3A] tracking-tight">{v.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{v.guaName}</p>
                  </div>
                  <div className="text-4xl text-[#7B1B1B] leading-none">{v.guaXiang}</div>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-auto relative z-10">
                  <p className="text-xs text-slate-600 italic leading-relaxed font-serif line-clamp-3">"{v.franklinDefinition}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}