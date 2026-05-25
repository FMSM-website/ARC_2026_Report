import React from 'react';
import { AlgerianLogo } from './AlgerianLogo';

interface OfficialHeaderProps {
  minimal?: boolean;
}

export const OfficialHeader: React.FC<OfficialHeaderProps> = ({ minimal = false }) => {
  return (
    <div className={`w-full bg-white border-b border-slate-200 p-4 md:p-6 shadow-sm relative overflow-hidden ${minimal ? 'py-3' : ''}`}>
      {/* Decorative top strip in Algerian National Flag Colors (Green, White, Red) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="bg-emerald-600 flex-1" />
        <div className="bg-white w-10" />
        <div className="bg-red-600 flex-1" />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Right side: Traditional Algerian Administrative Stack */}
        <div className="text-right flex flex-col gap-1 select-none md:w-1/3">
          <span className="text-[12px] font-bold text-emerald-800 font-serif tracking-tight">الْجُمْهُورِيَّة الْجَزَائِرِيَّة الدِّيمقْرَاطِيَّة الشَّعْبِيَّة</span>
          <span className="text-[17px] font-bold text-slate-800 tracking-tight font-serif">وزارة المالية</span>
          <span className="text-[15px] font-semibold text-slate-700 font-serif">المديرية العامة للميزانية</span>
          <span className="text-[14px] font-medium text-emerald-800 font-serif">المديرية الجهوية للميزانية - ولاية ورقلة</span>
          <span className="text-[14px] font-bold text-amber-700 font-serif tracking-wide">مصلحة الأرشيف</span>
        </div>

        {/* Center: Official Title and Republic Line */}
        <div className="flex flex-col items-center text-center flex-1">
          {!minimal && (
            <>
              {/* Grand centered Republic text */}
              <h1 className="text-emerald-700 font-serif text-[19px] md:text-[23px] font-bold border-b-2 border-emerald-600 pb-1 mb-2 tracking-wide">
                المنصة الرقمية للبحث الأرشيفي المستعرض
              </h1>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                النظام الموحد لوثائق وجرد أرشيف المديرية الجهوية للميزانية - ورقلة
              </p>
            </>
          )}
          {minimal && (
            <h1 className="text-emerald-700 font-serif text-lg font-bold border-b border-emerald-600 pb-0.5 mb-1">
              المنصة الرقمية للبحث الأرشيفي الذكي
            </h1>
          )}
        </div>

        {/* Left side: Official Stamp and Logo */}
        <div className="flex items-center gap-4 justify-end md:w-1/3">
          <div className="flex flex-col text-left font-serif items-end">
            <div className="flex gap-1">
              <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-emerald-50 text-emerald-700 rounded-sm border border-emerald-200">
                مؤمن
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-slate-50 text-slate-600 rounded-sm border border-slate-200">
                داخلي
              </span>
            </div>
          </div>
          <AlgerianLogo size={minimal ? 140 : 210} className="hover:scale-105 transition-transform duration-300" />
        </div>

      </div>
    </div>
  );
};
export default OfficialHeader;
