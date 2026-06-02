import React, { useState, useEffect } from 'react';
import { ArchiveRecord } from '../types';
import { Printer, Layers, FileText, ExternalLink, AlertTriangle } from 'lucide-react';

interface PrintCardModalProps {
  record: ArchiveRecord;
  allRecordsInBox: ArchiveRecord[];
  onClose: () => void;
}

export const PrintCardModal: React.FC<PrintCardModalProps> = ({ record, allRecordsInBox, onClose }) => {
  const totalInBox = allRecordsInBox.length;
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9_%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1.svg/1280px-%D8%B4%D8%B9%D8%A7%D8%B1_%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8I%D8%A9_%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1.svg.png"; // Fallback URL, let's keep exact string from view_file
  
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Handles direct high-fidelity printing bypassing iframe sandboxing via window.open + document.write
  const handlePrint = () => {
    // Generate clean table rows
    const tableRowsHtml = allRecordsInBox.map((item) => `
      <tr style="border: 1.5px solid black;">
        <td style="border: 1.5px solid black; padding: 6px 4px; font-family: monospace; font-weight: bold; text-align: center; font-size: 11px; background-color: #fafafa;">
          ${item.subFileNumber}
        </td>
        <td style="border: 1.5px solid black; padding: 6px 8px; font-size: 11px; text-align: right; font-weight: 600;">
          ${item.producer || ''}
        </td>
        <td style="border: 1.5px solid black; padding: 6px 8px; font-size: 11.5px; text-align: right; font-weight: bold; color: black;">
          ${item.title || ''}
        </td>
        <td style="border: 1.5px solid black; padding: 6px 4px; font-family: monospace; text-align: center; font-size: 10.5px; white-space: nowrap;">
          ${item.ultimateDates || ''}
        </td>
        <td style="border: 1.5px solid black; padding: 6px 8px; font-size: 10px; text-align: right; color: #000;">
          ${item.remark || ''}
        </td>
      </tr>
    `).join('');

    // Fill remaining table spaces to make exactly 10 rows for clean official paper format
    const fillCount = Math.max(0, 10 - allRecordsInBox.length);
    const placeholdersHtml = Array.from({ length: fillCount }).map((_, idx) => {
      const rowNum = allRecordsInBox.length + idx + 1;
      return `
        <tr style="height: 24px; border: 1.5px solid black;">
          <td style="border: 1.5px solid black; padding: 6px 4px; text-align: center; font-family: monospace; font-size: 11px; color: #555; background-color: #fcfcfc;">
            ${String(rowNum).padStart(2, '0')}
          </td>
          <td style="border: 1.5px solid black; padding: 6px 8px; text-align: right; color: #777; font-size: 10px; font-style: italic;">
            ...................................................
          </td>
          <td style="border: 1.5px solid black; padding: 6px 8px; text-align: right; color: #777; font-size: 10px; font-style: italic;">
            ........................................................................................................
          </td>
          <td style="border: 1.5px solid black; padding: 6px 4px; text-align: center; color: #777; font-size: 10px; font-style: italic;">
            ..............
          </td>
          <td style="border: 1.5px solid black; padding: 6px 8px; text-align: right; color: #777; font-size: 10px; font-style: italic;">
            ........................
          </td>
        </tr>
      `;
    }).join('');

    // Complete isolated, zero-dependency printable HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar">
        <head>
          <meta charset="utf-8">
          <title>بطاقة التشخيص - علبة ${record.boxNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;850;950&family=Amiri:wght@400;700&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 0 !important; /* Removes browser default headers and footers (site link, date, etc.) */
            }
            
            html, body {
              margin: 0;
              padding: 0;
              width: 210mm;
              height: 297mm;
              background-color: white;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              padding: 12mm 15mm !important; /* Safety margins inside the page bounds to escape physical printer crop */
              box-sizing: border-box;
              font-family: 'Cairo', sans-serif;
            }

            /* Container outer borders matching standard Ministry forms */
            .card-outer-frame {
              border: 4px double black;
              padding: 18px;
              box-sizing: border-box;
              background-color: white;
              height: 270mm; /* Fit completely in A4 */
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }

            .republic-title {
              text-align: center;
              font-family: 'Cairo', sans-serif;
              font-size: 15px;
              font-weight: 950;
              margin-bottom: 12px;
              letter-spacing: 0.5px;
              color: black;
            }

            .header-info-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              border-bottom: 2.5px solid black;
              padding-bottom: 10px;
            }

            .ministry-block {
              text-align: right;
              line-height: 1.5;
            }

            .ministry-title {
              font-family: 'Cairo', sans-serif;
              font-size: 14px;
              font-weight: 950;
              color: black;
            }

            .ministry-subtitle {
              font-family: 'Cairo', sans-serif;
              font-size: 11.5px;
              font-weight: 700;
              color: black;
            }

            .ministry-subsubtitle {
              font-family: 'Cairo', sans-serif;
              font-size: 11.5px;
              font-weight: 700;
              color: black;
            }

            .seal-block {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .tag-title-centered {
              text-align: center;
              margin: 10px 0 16px 0;
            }

            .title-box {
              display: inline-block;
              border: 3.5px double black;
              padding: 6px 50px;
              font-family: 'Cairo', sans-serif;
              font-size: 21px;
              font-weight: 955;
              background-color: #fdfdfd;
              letter-spacing: 0.5px;
              color: black;
              box-sizing: border-box;
            }

            .meta-block {
              border: 1.5px solid black;
              padding: 12px 18px;
              margin-bottom: 14px;
              background: #fff;
              box-sizing: border-box;
            }

            .meta-item {
              display: flex;
              align-items: flex-end;
              margin-bottom: 8px;
              font-size: 13.5px;
            }

            .meta-item:last-child {
              margin-bottom: 0;
            }

            .m-label {
              font-weight: 850;
              width: 105px;
              text-align: right;
              color: black;
              flex-shrink: 0;
            }

            .m-value {
              flex-grow: 1;
              border-bottom: 1.5px dotted black;
              padding-bottom: 1px;
              padding-right: 8px;
              font-weight: 800;
              color: black;
              font-size: 13.5px;
              min-height: 18px;
              text-align: right;
            }

            .m-value-bold {
              font-family: monospace;
              font-size: 14.5px;
              font-weight: 955;
            }

            .table-caption-bar {
              border-bottom: 2px solid black;
              margin-top: 10px;
              margin-bottom: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 3px;
            }

            .table-caption-text {
              font-family: 'Cairo', sans-serif;
              font-weight: bold;
              font-size: 11.5px;
              color: black;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              border: 1.5px solid black;
            }

            .items-table th {
              border: 1.5px solid black;
              background-color: #f1f5f9;
              padding: 6px 4px;
              font-weight: 950;
              font-size: 11px;
              text-align: center;
              color: black;
            }
            .items-table td {
              border: 1px solid black;
            }
          </style>
        </head>
        <body dir="rtl">
          <div class="card-outer-frame">
            <div>
              <div class="republic-title">الجمهورية الجزائرية الديمقراطية الشعبية</div>
              
              <div class="header-info-container">
                <div class="ministry-block">
                  <div class="ministry-title">وزارة الماليَّة</div>
                  <div class="ministry-subtitle">المديرية العامة للميزانية</div>
                  <div class="ministry-subsubtitle">المديرية الجهوية للميزانية ورقلة</div>
                </div>

                <div class="seal-block">
                  <img src="${logoUrl}" 
                       alt="شعار وزارة المالية" width="80" height="80" style="object-fit: contain;">
                </div>
              </div>

              <div class="tag-title-centered">
                <span class="title-box">بطاقة التشخيص</span>
              </div>

              <div class="meta-block">
                <div class="meta-item">
                  <div class="m-label">المصلحة:</div>
                  <div class="m-value">${record.department || 'أرشيف المديرية الجهوية للميزانية ورقلة'}</div>
                </div>
                <div class="meta-item">
                  <div class="m-label">اسم الأرشيفي:</div>
                  <div class="m-value">${record.archivistName || '...........................................................................'}</div>
                </div>
                <div class="meta-item">
                  <div class="m-label">رقم البطاقة:</div>
                  <div class="m-value m-value-bold">${record.cardNumber || '...........................................................................'}</div>
                </div>
                <div class="meta-item">
                  <div class="m-label">عنوان الرصيد:</div>
                  <div class="m-value" style="font-weight: bold;">${record.fundTitle || '...........................................................................'}</div>
                </div>
                <div class="meta-item">
                  <div class="m-label">رقم العلية:</div>
                  <div class="m-value m-value-bold">${record.boxNumber || '...........................................................................'}</div>
                </div>
              </div>

              <div class="table-caption-bar">
                <div class="table-caption-text">📁 جدول محتويات المخرجات الأرشيفية للعلبة:</div>
                <div style="font-size: 10.5px; font-family: monospace; color: #000; font-weight: bold;">
                  (${totalInBox} ملفات مدرجة)
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 10%; text-align: center;">رقم الملف</th>
                    <th style="width: 25%; text-align: right; padding-right: 6px;">المصدر / المنتج</th>
                    <th style="width: 40%; text-align: right; padding-right: 6px;">عنوان الملف / عنوان الملف الفرعي</th>
                    <th style="width: 12%; text-align: center;">التواريخ القصوى</th>
                    <th style="width: 13%; text-align: right; padding-right: 4px;">الملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                  ${placeholdersHtml}
                </tbody>
              </table>
            </div>
          </div>

          <script>
            // Automatically prompt print dialog and auto close if they complete or cancel it
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    // Attempt to open a top-level independent popup to bypass iframe sandbox block (allowed as user gesture)
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        throw new Error("Popup blocked by browser privacy controls");
      }
    } catch (err) {
      console.warn("Direct window open blocked or failed. Attempting frame document print fallback.", err);
      // Fallback: If window.open is strictly blocked, try window.print() of the current document as a safe backup
      window.print();
    }
  };

  return (
    <>
      {/* 1. Modal Dialog visible ONLY on screen */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
        
        {/* Container */}
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
          
          {/* Modal Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-700/60 text-emerald-400 rounded-lg">
                <Printer size={20} />
              </span>
              <div>
                <h3 className="font-bold text-base font-sans">معاينة بطاقة التشخيص للطباعة</h3>
                <p className="text-xs text-slate-300 font-sans mt-0.5">الملصق التلقائي لبطاقات التشخيص الأرشيفية للعلب والرفوف</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 cursor-pointer text-sm font-bold"
            >
              إغلاق ✕
            </button>
          </div>

          {/* ⚠️ Dynamic Sandbox Navigation Banner only rendered when inside AI Studio workspace iframe */}
          {isInIframe && (
            <div className="bg-red-50 border-b border-red-200/50 p-5 text-red-900 select-none">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle size={22} />
                  </span>
                  <div className="text-right">
                    <h4 className="font-extrabold text-sm text-red-950 font-sans">⚠️ متصفح Google Chrome يحظر الطباعة داخل نافذة المعاينة!</h4>
                    <p className="text-xs text-red-800 font-sans mt-1 leading-relaxed">
                      بما أنك تتصفح النظام حالياً من داخل إطار المعاينة الجانبي لـ <strong className="font-extrabold underline">Google AI Studio</strong>، فإن متصفح الكروم يمنع تشغيل أمر الطباعة حماية لكم.
                      <br />
                      للطباعة بنجاح، <strong>اضغط فوراً على الزر الأحمر المقابل</strong> لفتح هذا النظام في نافذة مستقلة كاملة، ومن هناك ادخل وسيتم تفعيل ميزة الطباعة بنجاح وبسرعة 100%!
                    </p>
                  </div>
                </div>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-3.5 px-6 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-700/10 transition-all active:scale-95 text-center justify-center font-sans w-full md:w-auto hover:scale-[1.03]"
                >
                  <ExternalLink size={15} />
                  افتح النظام في نافذة مستقلة للطباعة بنجاح ↗
                </a>
              </div>
            </div>
          )}

          {/* Modal Info Prompt */}
          <div className="bg-amber-50 border-b border-amber-200/60 p-4 text-xs text-amber-800 flex items-start gap-2.5 select-none">
            <Layers size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">ميزة المطابقة الذكية ورصد بطاقة التشخيص:</span> يقوم المعالج تلقائياً بتجميع كافة الملفات الفرعية (عددها <strong className="underline">{totalInBox}</strong> ملفات) المخزنة في قاعدة البيانات تحت رقم العلبة <strong className="underline">{record.boxNumber}</strong> لإنتاج ملصق جرد شامل ومطهر بمحتوى العلبة لتلصق كبطاقة تشخيص على وجه العلبة الخارجي، تماماً كما في النموذج الرسمي للوزارة.
            </div>
          </div>

          {/* Screen Mockup Area */}
          <div className="p-6 overflow-y-auto max-h-[600px] bg-slate-100 flex-1 flex justify-center">
            
            {/* Aesthetic Mockup representing exactly what will be printed */}
            <div className="bg-white p-8 border-4 border-double border-slate-950 shadow-lg mx-auto w-full max-w-3xl text-right font-sans relative select-none animate-in fade-in duration-300" style={{ minHeight: '940px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <div>
                {/* Republic Header Centered */}
                <div className="text-center font-sans text-sm md:text-base font-extrabold text-slate-900 mb-3 border-b border-slate-350 pb-2 leading-relaxed">
                  الجمهورية الجزائرية الديمقراطية الشعبية
                </div>

                {/* Ministry Grid */}
                <div className="flex justify-between items-center text-xs mb-4 font-sans pb-3 border-b-2 border-slate-950">
                  <div className="text-right flex flex-col gap-0.5">
                    <div className="font-black text-slate-900 text-sm">وزارة الماليَّة</div>
                    <div className="text-[11px] text-slate-700 font-medium">المديرية العامة للميزانية</div>
                    <div className="text-[11.5px] text-slate-800 font-semibold">المديرية الجهوية للميزانية ورقلة</div>
                  </div>
                  
                  {/* Left Logo Side with enlarged logo as requested */}
                  <div className="flex items-center">
                    <img 
                      src={logoUrl} 
                      alt="شعار وزارة المالية"
                      width="80"
                      height="80"
                      style={{ objectFit: 'contain' }}
                      className="shrink-0 transition-transform hover:scale-105"
                    />
                  </div>
                </div>

                {/* Title Centered */}
                <div className="text-center mb-5">
                  <span className="text-lg md:text-xl font-black border-2 md:border-3 border-black border-double px-10 py-1.5 inline-block font-sans bg-slate-50 shadow-xs tracking-wider" style={{ borderStyle: 'double', borderWidth: '3.5px' }}>
                    بطاقة التشخيص
                  </span>
                </div>

                {/* Custom Sticker Card Layout exactly matching image upper portion in authentic dotted style */}
                <div className="bg-white p-4 font-sans text-xs mb-5 rounded-xs" style={{ border: '1.5px solid black' }}>
                  <div className="space-y-3.5">
                    
                    <div className="flex items-center justify-start gap-2">
                      <span className="font-bold text-slate-950 w-24 shrink-0 text-right font-sans" style={{ width: '100px' }}>المصلحة:</span>
                      <span className="text-slate-850 font-bold flex-1 border-b border-dotted border-black pb-0.5 text-[13px]" style={{ borderBottom: '1.5px dotted black' }}>
                        {record.department || 'أرشيف المديرية الجهوية للميزانية ورقلة'}
                      </span>
                    </div>

                    <div className="flex items-center justify-start gap-2">
                      <span className="font-bold text-slate-950 w-24 shrink-0 text-right font-sans" style={{ width: '100px' }}>اسم الأرشيفي:</span>
                      <span className="text-slate-800 font-semibold flex-1 border-b border-dotted border-black pb-0.5" style={{ borderBottom: '1.5px dotted black' }}>
                        {record.archivistName || '...........................................................................................................'}
                      </span>
                    </div>

                    <div className="flex items-center justify-start gap-2">
                      <span className="font-bold text-slate-950 w-24 shrink-0 text-right font-sans" style={{ width: '100px' }}>رقم البطاقة:</span>
                      <span className="text-slate-900 font-mono font-bold flex-1 border-b border-dotted border-black pb-0.5 text-[12px]" style={{ borderBottom: '1.5px dotted black' }}>
                        {record.cardNumber || '...........................................................................................................'}
                      </span>
                    </div>

                    <div className="flex items-center justify-start gap-2">
                      <span className="font-bold text-slate-950 w-24 shrink-0 text-right font-sans" style={{ width: '100px' }}>عنوان الرصيد:</span>
                      <span className="text-slate-850 font-bold flex-1 border-b border-dotted border-black pb-0.5 text-[13px]" style={{ borderBottom: '1.5px dotted black' }}>
                        {record.fundTitle || '...........................................................................................................'}
                      </span>
                    </div>

                    <div className="flex items-center justify-start gap-2">
                      <span className="font-bold text-slate-950 w-24 shrink-0 text-right font-sans" style={{ width: '100px' }}>رقم العلبة:</span>
                      <span className="text-slate-950 font-mono font-extrabold text-sm flex-1 border-b border-dotted border-black pb-0.5" style={{ borderBottom: '1.5px dotted black' }}>
                        {record.boxNumber || '...........................................................................................................'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Sub-files listed under this box */}
                <div>
                  <div className="flex items-center justify-between border-b pb-1 mb-2" style={{ borderBottom: '2px solid black' }}>
                    <span className="font-bold text-xs font-sans text-slate-900 flex items-center gap-1.5" style={{ fontWeight: 'bold', fontSize: '11px' }}>
                      <FileText size={13} className="text-slate-600" /> جدول جرد المحتويات الأرشيفية للعلبة:
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">({totalInBox} سطر مسجل)</span>
                  </div>

                  <table className="w-full text-[11px] border-collapse font-sans" style={{ direction: 'rtl', width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="bg-slate-100 select-none">
                        <th className="p-1.5 font-black w-16 text-[10.5px] text-center" style={{ border: '1px solid black', backgroundColor: '#f1f5f9' }}>رقم الملف</th>
                        <th className="p-1.5 font-black w-36 text-[10.5px] text-right" style={{ border: '1px solid black', backgroundColor: '#f1f5f9' }}>المصدر / المنتج</th>
                        <th className="p-1.5 font-black text-[10.5px] text-right" style={{ border: '1px solid black', backgroundColor: '#f1f5f9' }}>عنوان الملف / عنوان الملف الفرعي</th>
                        <th className="p-1.5 font-black w-24 text-[10.5px] text-center" style={{ border: '1px solid black', backgroundColor: '#f1f5f9' }}>التواريخ القصوى</th>
                        <th className="p-1.5 font-black w-24 text-[10.5px] text-right" style={{ border: '1px solid black', backgroundColor: '#f1f5f9' }}>الملاحظة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Real rows */}
                      {allRecordsInBox.map((item) => (
                        <tr key={item.id} className="border border-slate-950">
                          <td className="p-1.5 font-mono font-bold text-center text-[10.5px]" style={{ border: '1px solid black' }}>
                            {item.subFileNumber}
                          </td>
                          <td className="p-1.5 text-slate-800 text-[10.5px] font-medium text-right" style={{ border: '1px solid black' }}>
                            {item.producer}
                          </td>
                          <td className="p-1.5 text-slate-900 text-[11px] font-bold text-right" style={{ border: '1px solid black' }}>
                            {item.title}
                          </td>
                          <td className="p-1.5 text-center font-mono text-[10px]" style={{ border: '1px solid black' }}>
                            {item.ultimateDates}
                          </td>
                          <td className="p-1.5 text-slate-700 text-[10px] text-right" style={{ border: '1px solid black' }}>
                            {item.remark || '...................'}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Padded placeholder dotted rows */}
                      {Array.from({ length: Math.max(0, 10 - allRecordsInBox.length) }).map((_, idx) => {
                        const rowNum = allRecordsInBox.length + idx + 1;
                        return (
                          <tr key={`placeholder-${idx}`} style={{ border: '1px solid black' }}>
                            <td className="p-1.5 font-mono text-center text-slate-400 text-[10.5px]" style={{ border: '1px solid black' }}>
                              {String(rowNum).padStart(2, '0')}
                            </td>
                            <td className="p-1.5 text-slate-400 text-[10px] italic text-right" style={{ border: '1px solid black' }}>
                              ...................................................
                            </td>
                            <td className="p-1.5 text-slate-400 text-[10px] italic text-right" style={{ border: '1px solid black' }}>
                              ........................................................................................................
                            </td>
                            <td className="p-1.5 text-center text-slate-400 text-[10px] italic" style={{ border: '1px solid black' }}>
                              ..............
                            </td>
                            <td className="p-1.5 text-slate-400 text-[10px] italic text-right" style={{ border: '1px solid black' }}>
                              ........................
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>

          {/* Action controls footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between select-none">
            <button
              onClick={onClose}
              className="p-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors active:scale-95"
            >
              إلغاء المعاينة
            </button>
            
            <button
              onClick={handlePrint}
              className="p-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-700/10 transition-all active:scale-95"
            >
              <Printer size={16} />
              إرسال مباشر إلى الطابعة (Print)
            </button>
          </div>

        </div>
      </div>

      {/* 2. Absolute High-fidelity Print-only Output Area */}
      {/* Centered card mockup built using official parameters for direct print */}
      <div className="only-print-layout printable-card-target font-sans" dir="rtl">
        <div className="printable-card-target-inner">
          
          <div>
            {/* Republic Header Centered */}
            <div className="republic-title">الجمهورية الجزائرية الديمقراطية الشعبية</div>
            
            {/* Ministry Grid info */}
            <div className="header-info-container">
              <div className="ministry-block">
                <div className="ministry-title">وزارة الماليَّة</div>
                <div className="ministry-subtitle">المديرية العامة للميزانية</div>
                <div className="ministry-subsubtitle">المديرية الجهوية للميزانية ورقلة</div>
              </div>

              <div className="seal-block">
                <img 
                  src={logoUrl} 
                  alt="شعار وزارة المالية" 
                  width="85" 
                  height="85" 
                  style={{ objectFit: 'contain' }} 
                />
              </div>
            </div>

            {/* Title Border Box */}
            <div className="tag-title-centered">
              <div className="title-box">بطاقة التشخيص</div>
            </div>

            {/* Upper custom meta labels styled exactly with physical template dotted bounds */}
            <div className="meta-block">
              <div className="meta-item">
                <div className="m-label">المصلحة:</div>
                <div className="m-value">{record.department || 'أرشيف المديرية الجهوية للميزانية ورقلة'}</div>
              </div>
              <div className="meta-item">
                <div className="m-label">اسم الأرشيفي:</div>
                <div className="m-value">{record.archivistName || '...........................................................................'}</div>
              </div>
              <div className="meta-item">
                <div className="m-label">رقم البطاقة:</div>
                <div className="m-value m-value-bold">{record.cardNumber || '...........................................................................'}</div>
              </div>
              <div className="meta-item">
                <div className="m-label">عنوان الرصيد:</div>
                <div className="m-value" style={{ fontWeight: 'bold' }}>{record.fundTitle || '...........................................................................'}</div>
              </div>
              <div className="meta-item">
                <div className="m-label">رقم الععلبة:</div>
                <div className="m-value m-value-bold">{record.boxNumber || '...........................................................................'}</div>
              </div>
            </div>

            {/* Section separator banner */}
            <div className="table-caption-bar">
              <div className="table-caption-text">📁 جدول محتويات المخرجات الأرشيفية للعلبة:</div>
              <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#000', fontWeight: 'bold' }}>
                ({totalInBox} ملفات مدرجة)
              </div>
            </div>

            {/* Database catalog layout inside box */}
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '10%', textAlign: 'center' }}>رقم الملف</th>
                  <th style={{ width: '25%', textAlign: 'right', paddingRight: '6px' }}>المصدر / المنتج</th>
                  <th style={{ width: '40%', textAlign: 'right', paddingRight: '6px' }}>عنوان الملف / عنوان الملف الفرعي</th>
                  <th style={{ width: '13%', textAlign: 'center' }}>التواريخ القصوى</th>
                  <th style={{ width: '12%', textAlign: 'right', paddingRight: '4px' }}>الملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {allRecordsInBox.map((item) => (
                  <tr key={item.id} style={{ border: '1.5px solid black' }}>
                    <td style={{ border: '1px solid black', padding: '5px 4px', fontFamily: 'monospace', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', backgroundColor: '#fafafa' }}>
                      {item.subFileNumber}
                    </td>
                    <td style={{ border: '1px solid black', padding: '5px 8px', fontSize: '11px', textAlign: 'right', fontWeight: 600 }}>
                      {item.producer || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '5px 8px', fontSize: '11.5px', textAlign: 'right', fontWeight: 'bold', color: 'black' }}>
                      {item.title || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '5px 4px', fontFamily: 'monospace', textAlign: 'center', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                      {item.ultimateDates || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '5px 8px', fontSize: '10px', textAlign: 'right', color: '#000' }}>
                      {item.remark || ''}
                    </td>
                  </tr>
                ))}
                
                {/* Placeholders */}
                {Array.from({ length: Math.max(0, 10 - allRecordsInBox.length) }).map((_, idx) => {
                  const rowNum = allRecordsInBox.length + idx + 1;
                  return (
                    <tr key={`print-placeholder-${idx}`} style={{ border: '1.5px solid black', height: '24px' }}>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#555', backgroundColor: '#fcfcfc' }}>
                        {String(rowNum).padStart(2, '0')}
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right', color: '#777', fontSize: '10px' }}>
                        ...................................................
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right', color: '#777', fontSize: '10px' }}>
                        ........................................................................................................
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', color: '#777', fontSize: '10px' }}>
                        ..............
                      </td>
                      <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right', color: '#777', fontSize: '10px' }}>
                        ........................
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Embedded style tags dynamically applied during printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hidden on normal screen mode */
        @media screen {
          .only-print-layout {
            display: none !important;
          }
        }

        /* Highly specialized, raw CSS targeting high-fidelity paper print */
        @media print {
          
          /* Remove default browser headers (URL, webpage title) and footers (page/date counts) */
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }

          /* Hide ALL standard webpage contents safely */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            visibility: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #root, #root * {
            visibility: hidden !important;
          }

          /* Force high-fidelity printable target and nested labels to be fully visible and rendered */
          .only-print-layout, .only-print-layout * {
            visibility: visible !important;
            color: black !important;
          }

          .only-print-layout {
            display: flex !important;
            box-sizing: border-box !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 12mm 15mm !important; /* Perfect physical margin safe for all printers */
            background-color: white !important;
            z-index: 999999999 !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          .printable-card-target-inner {
            border: 4px double black !important;
            padding: 18px !important;
            box-sizing: border-box !important;
            height: 270mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background-color: white !important;
          }

          .republic-title {
            text-align: center !important;
            font-family: 'Cairo', sans-serif !important;
            font-size: 15px !important;
            font-weight: 955 !important;
            margin-bottom: 12px !important;
            letter-spacing: 0.5px !important;
            width: 100% !important;
          }

          .header-info-container {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 12px !important;
            border-bottom: 2.5px solid black !important;
            padding-bottom: 10px !important;
          }

          .ministry-block {
            text-align: right !important;
            line-height: 1.5 !important;
          }

          .ministry-title {
            font-family: 'Cairo', sans-serif !important;
            font-size: 14.5px !important;
            font-weight: 955 !important;
          }

          .ministry-subtitle {
            font-family: 'Cairo', sans-serif !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            color: black !important;
          }

          .ministry-subsubtitle {
            font-family: 'Cairo', sans-serif !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            color: black !important;
          }

          .seal-block {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .tag-title-centered {
            text-align: center !important;
            margin: 10px 0 16px 0 !important;
          }

          .title-box {
            display: inline-block !important;
            border: 3.5px double black !important;
            padding: 6px 50px !important;
            font-family: 'Cairo', sans-serif !important;
            font-size: 21px !important;
            font-weight: 955 !important;
            background-color: #fdfdfd !important;
            letter-spacing: 0.5px !important;
          }

          .meta-block {
            border: 1.5px solid black !important;
            padding: 12px 18px !important;
            margin-bottom: 14px !important;
            background: #fff !important;
            box-sizing: border-box !important;
          }

          .meta-item {
            display: flex !important;
            align-items: flex-end !important;
            margin-bottom: 8px !important;
            font-size: 13.5px !important;
          }

          .meta-item:last-child {
            margin-bottom: 0 !important;
          }

          .m-label {
            font-weight: 850 !important;
            width: 105px !important;
            text-align: right !important;
            color: black !important;
            flex-shrink: 0 !important;
          }

          .m-value {
            flex-grow: 1 !important;
            border-bottom: 1.5px dotted black !important;
            padding-bottom: 1px !important;
            padding-right: 8px !important;
            font-weight: 800 !important;
            color: black !important;
            font-size: 13.5px !important;
            min-height: 18px !important;
          }

          .m-value-bold {
            font-family: monospace !important;
            font-size: 14.5px !important;
            font-weight: 955 !important;
          }

          .table-caption-bar {
            border-bottom: 2px solid black !important;
            margin-top: 10px !important;
            margin-bottom: 6px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding-bottom: 3px !important;
          }

          .table-caption-text {
            font-family: 'Cairo', sans-serif !important;
            font-weight: bold !important;
            font-size: 12px !important;
            color: black !important;
          }

          .items-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid black !important;
          }

          .items-table th {
            border: 1.5px solid black !important;
            background-color: #f1f5f9 !important;
            padding: 6px 4px !important;
            font-weight: 955 !important;
            font-size: 11.5px !important;
            text-align: center !important;
          }

          .items-table td {
            border: 1px solid black !important;
          }
        }
      ` }} />
    </>
  );
};

export default PrintCardModal;
