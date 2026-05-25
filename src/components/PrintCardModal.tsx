import React from 'react';
import { ArchiveRecord } from '../types';
import { Printer, Layers, FileText } from 'lucide-react';

interface PrintCardModalProps {
  record: ArchiveRecord;
  allRecordsInBox: ArchiveRecord[];
  onClose: () => void;
}

export const PrintCardModal: React.FC<PrintCardModalProps> = ({ record, allRecordsInBox, onClose }) => {
  const totalInBox = allRecordsInBox.length;
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%8وزارة_%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9_%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1.svg/1280px-%D8%B4%D8%B9%D8%A7%D8%B1_%D9%8وزارة_%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9_%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1.svg.png";

  // Handles high-fidelity print generation using an isolated dynamic iframe.
  // This bypasses iframe sandbox limits, completely hides site URL & dates,
  // and formats the page to exact A4 dimensions without parent layout pollution.
  const handlePrint = () => {
    // Generate clean table rows
    const tableRowsHtml = allRecordsInBox.map((item) => `
      <tr>
        <td style="border: 1.5px solid black; padding: 5px 4px; font-family: monospace; font-weight: bold; text-align: center; font-size: 11px; background-color: #fafafa;">
          ${item.subFileNumber}
        </td>
        <td style="border: 1.5px solid black; padding: 5px 8px; font-size: 11px; text-align: right; font-weight: 600;">
          ${item.producer || ''}
        </td>
        <td style="border: 1.5px solid black; padding: 5px 8px; font-size: 11.5px; text-align: right; font-weight: bold; color: black;">
          ${item.title || ''}
        </td>
        <td style="border: 1.5px solid black; padding: 5px 4px; font-family: monospace; text-align: center; font-size: 10.5px; white-space: nowrap;">
          ${item.ultimateDates || ''}
        </td>
        <td style="border: 1.5px solid black; padding: 5px 8px; font-size: 10px; text-align: right; color: #000;">
          ${item.remark || ''}
        </td>
      </tr>
    `).join('');

    // Fill remaining table spaces to make exactly 10 rows for clean official paper format
    const fillCount = Math.max(0, 10 - allRecordsInBox.length);
    const placeholdersHtml = Array.from({ length: fillCount }).map((_, idx) => {
      const rowNum = allRecordsInBox.length + idx + 1;
      return `
        <tr style="height: 24px;">
          <td style="border: 1.5px solid black; padding: 5px 4px; text-align: center; font-family: monospace; font-size: 11px; color: #777; background-color: #fcfcfc;">
            ${String(rowNum).padStart(2, '0')}
          </td>
          <td style="border: 1.5px solid black; padding: 5px 8px; text-align: right; color: #777; font-size: 10px; font-style: italic;">
            ...................................................
          </td>
          <td style="border: 1.5px solid black; padding: 5px 8px; text-align: right; color: #777; font-size: 10px; font-style: italic;">
            ........................................................................................................
          </td>
          <td style="border: 1.5px solid black; padding: 5px 4px; text-align: center; color: #777; font-size: 10px; font-style: italic;">
            ..............
          </td>
          <td style="border: 1.5px solid black; padding: 5px 8px; text-align: right; color: #777; font-size: 10px; font-style: italic;">
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
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;950&family=Amiri:wght@400;700&display=swap');
            
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
              font-weight: 950;
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
                  <div class="m-label">رقم العلبة:</div>
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
            // Ensure fonts and logo image are fully loaded inside the print-frame before popping the print dialog
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    // Try hidden iframe printing first (handles modern browsers & is pop-up blocker immune)
    try {
      let printFrame = document.getElementById('hidden-print-frame') as HTMLIFrameElement;
      if (printFrame) {
        printFrame.parentNode?.removeChild(printFrame);
      }

      printFrame = document.createElement('iframe') as HTMLIFrameElement;
      printFrame.id = 'hidden-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.left = '-9999px';
      printFrame.style.top = '-9999px';
      printFrame.style.width = '210mm';
      printFrame.style.height = '297mm';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();
      } else {
        throw new Error("Cannot access dynamic iframe document scope");
      }
    } catch (e) {
      console.warn("Dynamic iframe printing blocked/failed, opening standalone new tab fallback", e);
      // Failover to target standalone window.open trigger
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert('يرجى السماح بالنوافذ المنبثقة (Popups) لتتمكن من طباعة ومعاينة بطاقة التشخيص الرسمية.');
      }
    }
  };

  return (
    <>
      {/* Screen viewable interactive modal */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
        
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

          {/* Modal Info Prompt */}
          <div className="bg-amber-50 border-b border-amber-200/60 p-4 text-xs text-amber-800 flex items-start gap-2.5 select-none">
            <Layers size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">ميزة المطابقة الذكية ورصد بطاقة التشخيص:</span> يقوم المعالج تلقائياً بتجميع كافة الملفات الفرعية (عددها <strong className="underline">{totalInBox}</strong> ملفات) المخزنة في قاعدة البيانات تحت رقم الععلبة <strong className="underline">{record.boxNumber}</strong> لإنتاج ملصق جرد شامل ومطهر بمحتوى العلبة لتلصق كبطاقة تشخيص على وجه العلبة الخارجي، تماماً كما في النموذج الرسمي للوزارة.
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
                      className="shrink-0"
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
              className="p-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-700/10 transition-all active:scale-95 animate-pulse"
            >
              <Printer size={16} />
              إرسال مباشر إلى الطابعة (Print)
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default PrintCardModal;
