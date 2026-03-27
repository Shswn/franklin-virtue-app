"use client";
import React, { useEffect, useMemo, useState } from "react";
import { virtues } from "../data/virtues";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";

type FailureLog = {
  date: string;
  virtue: string;
  note: string;
};

const toDateKey = (d: Date) => d.toLocaleDateString("en-CA");

export default function VirtueTracker() {
  const [logs, setLogs] = useState<FailureLog[]>([]);
  const [weekStartKey, setWeekStartKey] = useState<string>(() => toDateKey(new Date()));

  useEffect(() => {
    try {
      const savedFailures = localStorage.getItem("franklin_failures");
      if (savedFailures) setLogs(JSON.parse(savedFailures));
      const savedWeekStart = localStorage.getItem("franklin_week_start");
      if (savedWeekStart) setWeekStartKey(savedWeekStart);
    } catch {}
  }, []);

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

      return { 
        weekNum: i + 1, 
        dateStr: toDateKey(weekStart), 
        virtue: virtues[i % 14],
        days
      };
    });
  }, [weekStartKey]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B2B3A] font-sans p-6 md:p-12 selection:bg-[#7B1B1B] selection:text-white">
      <div className="mx-auto" style={{ width: '90%', maxWidth: '1400px' }}>
        
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#7B1B1B] mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Return to Command Center
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-12 text-[#1B2B3A] tracking-tight">Virtue <span className="text-[#7B1B1B] italic">Lab</span></h1>

        {/* 核心重构：52-Week Curriculum 全局热力网格图 */}
        <div className="bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] shadow-sm mb-16">
          <h2 className="text-3xl font-serif font-bold mb-10 text-[#1B2B3A] flex items-center border-b border-slate-100 pb-6">
            <Calendar size={28} className="mr-4 text-[#7B1B1B]" /> 52-Week Curriculum Map
          </h2>
          
          <div 
             className="grid gap-3 md:gap-4" 
             style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))' }}
          >
            {weeks.map(w => (
              <div key={w.weekNum} className="flex flex-col bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:border-[#7B1B1B]/50 hover:bg-white hover:shadow-md transition-all p-3 relative group min-h-[100px]">
                
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">W{w.weekNum}</span>
                  <span className="text-2xl text-[#7B1B1B] leading-none">{w.virtue.guaXiang}</span>
                </div>
                
                {/* 核心修改点1：单词名字换为中文， ensured 完全显示 */}
                <div className="text-[11px] font-bold text-[#1B2B3A] font-serif truncate w-full mb-1" title={w.virtue.name}>{w.virtue.chineseName}</div>
                
                <div className="text-[9px] text-slate-400 font-mono mb-1">{w.dateStr.slice(5)}</div>
                
                {/* 核心修改点2：短板可视化进度槽 */}
                <div className="flex justify-between gap-[2px] mt-auto">
                  {w.days.map((dayDate) => {
                     // 判断这一天是否有关于这个美德的失败记录
                     const dayLogEntry = logs.find(log => log.date === dayDate && log.virtue === w.virtue.name);
                     
                     // 用于显示在 Hover 上的信息
                     const tooltipText = dayLogEntry ? `${dayDate}: Shortfall Logged - "${dayLogEntry.note.slice(0, 30)}..."` : `${dayDate}: Clear`;

                     return (
                       <div 
                         key={dayDate} 
                         className={`flex-1 aspect-square rounded-full transition-colors ${dayLogEntry ? 'bg-[#1B2B3A]' : 'bg-slate-200'}`} 
                         title={tooltipText}
                       ></div>
                     );
                  })}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 14 Virtues 作为底部字典参考保留 */}
        <div>
          <h2 className="text-3xl font-serif font-bold mb-8 text-[#1B2B3A] flex items-center border-b border-slate-100 pb-6">
            <BookOpen size={28} className="mr-4 text-[#7B1B1B]" /> The 14 Virtues Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {virtues.map(v => (
              <div key={v.name} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col h-full">
                <div className="absolute -right-4 -bottom-6 text-7xl text-slate-50 opacity-[0.03] group-hover:opacity-10 transition-opacity font-serif pointer-events-none">
                  {v.guaXiang}
                </div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#1B2B3A] tracking-tight">{v.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{v.guaName}</p>
                  </div>
                  <div className="text-4xl text-[#7B1B1B] leading-none">{v.guaXiang}</div>
                </div>
                
                <div className="border-t border-slate-100 pt-4 mt-auto relative z-10">
                  <p className="text-xs text-slate-600 italic leading-relaxed font-serif">
                    "{v.franklinDefinition}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}