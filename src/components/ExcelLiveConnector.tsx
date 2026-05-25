import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ArchiveRecord, SheetTab } from '../types';
import { FileSpreadsheet, Upload, Check, AlertTriangle, HelpCircle, FileCheck2, RefreshCw, ClipboardType, ArrowLeftRight } from 'lucide-react';

interface ExcelLiveConnectorProps {
  onDataLoaded: (records: ArchiveRecord[], tabs: SheetTab[]) => void;
  currentRecordsCount: number;
}

export const ExcelLiveConnector: React.FC<ExcelLiveConnectorProps> = ({ onDataLoaded, currentRecordsCount }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // حقول اللصق المباشر لحماية حساسية الملفات
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pasteBoxNumber, setPasteBoxNumber] = useState('N7/877');
  const [pasteCardNumber, setPasteCardNumber] = useState('877');
  const [pasteFundTitle, setPasteFundTitle] = useState('ملفات مستخدمين');
  const [pasteSheetId, setPasteSheetId] = useState('employees');

  // دالة ذكية للبحث عن قيمة لحقل أرشيفي محدد من مصفوفة الخلايا
  const extractMetadataValue = (rows: any[][], keys: string[]): string => {
    for (let r = 0; r < Math.min(rows.length, 15); r++) { // نكتفي بالفحص في أول 15 صفاً
      const row = rows[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const cellVal = String(row[c] || '').trim();
        if (!cellVal) continue;
        
        // هل الخلية الحالية تحتوي على أحد الكلمات المفتاحية؟
        const matchedKey = keys.find(k => cellVal.toLowerCase().includes(k.toLowerCase()));
        if (matchedKey) {
          // الحالة أ: القيمة في نفس الخلية مثل "رقم العلبة: N7/877"
          if (cellVal.includes(':') || cellVal.includes('：')) {
            const splitChar = cellVal.includes(':') ? ':' : '：';
            const value = cellVal.split(splitChar)[1]?.trim();
            if (value) return value;
          }
          // الحالة ب: القيمة في الخلايا المجاورة (اليسار أو اليمين لتفادي اختلاف الاتجاه)
          const nextVal = String(row[c + 1] || '').trim();
          if (nextVal && !keys.some(k => nextVal.includes(k))) {
            return nextVal;
          }
          const prevVal = String(row[c - 1] || '').trim();
          if (prevVal && !keys.some(k => prevVal.includes(k))) {
            return prevVal;
          }
        }
      }
    }
    return '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setStatusMsg('جاري قراءة الملف وتفكيك الورقات المحددة...');

    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const loadedRecords: ArchiveRecord[] = [];
          const loadedTabs: SheetTab[] = [];
          
          const colors = ['emerald', 'blue', 'amber', 'indigo', 'purple', 'rose', 'cyan', 'orange'];

          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (rows.length === 0) return;

            // 1. استخلاص الميتاداتا الهامة التي تظهر في الجانب العلوي (مثل الصورة المرفقة)
            const boxNumber = extractMetadataValue(rows, ['رقم العلبة', 'العلبة', 'boxNumber', 'n7']) || 'غير محدد';
            const cardNumber = extractMetadataValue(rows, ['رقم البطاقة', 'البطاقة', 'cardNumber']) || 'غير محدد';
            const fundTitle = extractMetadataValue(rows, ['عنوان الرصيد', 'الرصيد', 'fundTitle']) || sheetName;
            const archivistName = extractMetadataValue(rows, ['اسم الارشيفي', 'الأرشيفي', 'archivistName']) || 'أرشيفي 1 (أمين بلقاسم)';
            const department = extractMetadataValue(rows, ['المصلحة', 'Department', 'مورد']) || 'أرشيف المديرية الجهوية ورقلة';

            // 2. البحث عن صف الرأس للجدول (الذي يحمل العناوين)
            let headerRowIndex = -1;
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              if (!row) continue;
              const rowStr = row.map(cell => String(cell || '').trim());
              
              const hasSubFile = rowStr.some(cell => cell.includes('الملف الفرعي') || cell.includes('الفرعي'));
              const hasTitle = rowStr.some(cell => cell.includes('عنوان الملف') || cell.includes('العنوان') || cell.includes('الموضوع'));
              
              if (hasSubFile || hasTitle) {
                headerRowIndex = r;
                break;
              }
            }

            const tableStartRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 12;

            let colSubFileIndex = 0;
            let colProducerIndex = 1;
            let colTitleIndex = 2;
            let colRemarkIndex = 3;
            let colDatesIndex = 4;

            if (headerRowIndex !== -1 && rows[headerRowIndex]) {
              const headerRow = rows[headerRowIndex];
              for (let c = 0; c < headerRow.length; c++) {
                const headVal = String(headerRow[c] || '').trim();
                if ((headVal.includes('الملف الفرعي') || headVal.includes('رقم الملف')) && !headVal.includes('عنوان')) colSubFileIndex = c;
                else if (headVal.includes('المصدر') || headVal.includes('المنتج')) colProducerIndex = c;
                else if (headVal.includes('عنوان الملف') || headVal.includes('العنوان') || headVal.includes('الموضوع')) colTitleIndex = c;
                else if (headVal.includes('تاريخ') || headVal.includes('التواريخ') || headVal.includes('السنة')) colDatesIndex = c;
                else if (headVal.includes('ملاحظة') || headVal.includes('ملاحظات')) colRemarkIndex = c;
              }
            }

            let recordsCountForSheet = 0;
            for (let r = tableStartRow; r < rows.length; r++) {
              const row = rows[r];
              if (!row) continue;
              
              const titleVal = String(row[colTitleIndex] || '').trim();
              const subFileVal = String(row[colSubFileIndex] || '').trim();
              
              if (!titleVal && !subFileVal) continue;

              const record: ArchiveRecord = {
                id: `xlsx-${sheetName}-${r}-${index}`,
                subFileNumber: subFileVal || 'غير مدرج',
                producer: String(row[colProducerIndex] || '').trim() || 'المديرية الجهوية للميزانية',
                title: titleVal || 'ملف أرشيفي فرعي غير مسمى',
                ultimateDates: String(row[colDatesIndex] || '').trim() || 'غير مؤرخ',
                remark: String(row[colRemarkIndex] || '').trim() || '',
                boxNumber: boxNumber,
                cardNumber: cardNumber,
                fundTitle: fundTitle,
                archivistName: archivistName,
                department: department,
                sheet: sheetName,
                createdAt: new Date().toISOString()
              };

              loadedRecords.push(record);
              recordsCountForSheet++;
            }

            loadedTabs.push({
              id: sheetName,
              name: sheetName,
              color: colors[index % colors.length],
              description: `تم استخراجها تلقائياً بـ ${recordsCountForSheet} ملف فرعي مفرز.`
            });
          });

          if (loadedRecords.length === 0) {
            setError('لم نعثر على أي سطور أرشيفية متوافقة في الملف المرفوع. يرجى مراجعة هيكله.');
            setLoading(false);
            return;
          }

          onDataLoaded(loadedRecords, loadedTabs);
          setStatusMsg(`✓ تم بنجاح توصيل وتحديث الكلاسور بـ ${loadedTabs.length} علامات تبويب و ${loadedRecords.length} فقرات أرشيفية.`);
          setError(null);
        } catch (err: any) {
          console.error(err);
          setError(`فشل قراءة ملف الميزانية: ${err.message || 'يرجى مراجعة وتعديل الصيغ.'}`);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(`خطأ تقني: ${err.message}`);
      setLoading(false);
    }
  };

  // معالجة اللصق المباشر لحساسية الملفات
  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);

    const textToParse = pastedText.trim();
    if (!textToParse) {
      setError('يرجى لصق الأسطر من الإكسل أولاً.');
      return;
    }

    try {
      const lines = textToParse.split('\n');
      const loadedRecords: ArchiveRecord[] = [];
      const loadedTabs: SheetTab[] = [];

      lines.forEach((line, rowIndex) => {
        if (!line.trim()) return;

        // فصل الأعمدة بالتاب tab (\t) كالعادة عند النسخ من الإكسل
        const columns = line.split('\t');

        let subFileVal = columns[0]?.trim() || '';
        let producerVal = columns[1]?.trim() || 'المديرية الجهوية لورقلة';
        let titleVal = columns[2]?.trim() || '';
        let datesVal = columns[3]?.trim() || 'غير مؤرخ';
        let remarkVal = columns[4]?.trim() || '';

        // إذا كان هناك مدخلات حقيقية
        if (!titleVal && !subFileVal) return;

        loadedRecords.push({
          id: `pasted-${Date.now()}-${rowIndex}`,
          subFileNumber: subFileVal || `${rowIndex + 1}`,
          producer: producerVal,
          title: titleVal || `سطر أرشيفي غير معنون رقم ${rowIndex + 1}`,
          ultimateDates: datesVal,
          remark: remarkVal,
          boxNumber: pasteBoxNumber || 'N7/877',
          cardNumber: pasteCardNumber || '877',
          fundTitle: pasteFundTitle || 'ملفات مستخدمين',
          archivistName: 'أرشيفي 1 (أمين بلقاسم)',
          department: 'أرشيف المديرية الجهوية ورقلة',
          sheet: pasteSheetId,
          createdAt: new Date().toISOString()
        });
      });

      if (loadedRecords.length === 0) {
        setError('فشل العثور على أسطر صالحة للمطابقة. يرجى نسخ الجدول بوضوح.');
        return;
      }

      loadedTabs.push({
        id: pasteSheetId,
        name: pasteSheetId === 'employees' ? 'ملفات المستخدمين' : pasteSheetId,
        color: 'emerald',
        description: `تم إدراجها باللصق المباشر من الحافظة بـ ${loadedRecords.length} ملف فرعي مفرز.`
      });

      onDataLoaded(loadedRecords, loadedTabs);
      setStatusMsg(`✓ نجاح كلي: تم قراءة وتحديث الكلاسور بـ ${loadedRecords.length} أسطر أرشيفية تم معالجتها بالمتصفح بأمان تام دون تخزين خارجي.`);
      setPastedText('');
    } catch (err: any) {
      setError(`وقع خطأ أثناء تفكيك حقول الإكسل: ${err.message}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      await processExcelFile(file);
    } else {
      setError('يرجى سحب وإلقاء ملف إكسل حقيقي فقط (.xlsx / .xls)');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      
      {/* Dynamic top tabs for switching Mode: Direct upload VS Clipboard paste for utmost security */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100 shadow-inner">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm font-sans flex items-center gap-2">
              ربط فوري وآمن بكلاسور الإكسل الخاص بـ ورقلة
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">١٠٠٪ أمان محلي</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              اختر الطريقة الأنسب لحساسية ملفك لتحديث السطور والبحث المباشر فيها محلياً بالكامل.
            </p>
          </div>
        </div>

        {/* Mode switcher buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setShowPasteMode(false); setError(null); }}
            className={`p-2 px-4 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              !showPasteMode
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📂 رفع ملف الكلاسور
          </button>
          
          <button
            type="button"
            onClick={() => { setShowPasteMode(true); setError(null); }}
            className={`p-2 px-4 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              showPasteMode
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 لصق خلايا إكسل مباشرة
          </button>
        </div>
      </div>

      {/* Mode A: Drag & Drop File */}
      {!showPasteMode ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-emerald-600 bg-emerald-50/20' 
              : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            id="excel-file-uploader"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 bg-white text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs border border-slate-100">
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <Upload className="w-5 h-5 text-emerald-700" />
              )}
            </div>

            <p className="text-xs font-bold text-slate-700">
              {loading ? 'الرجاء الانتظار، جاري معالجة الكلاسور بالكامل...' : 'انقر هنا لتصفح ملف الإكسل، أو اسحبه وألقه للربط المباشر'}
            </p>
            
            <p className="text-[10px] text-slate-400 font-sans">
              يتم قراءة كافة التبويبات والخلايا واستخراج "رقم العلبة" و "البطاقة" بذكاء محلياً بالكامل.
            </p>
          </div>
        </div>
      ) : (
        /* Mode B: Direct Tab-Separated Clipboard Paste Card */
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم العلبة للملصقات:</label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-center font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="مثال: N7/877"
                value={pasteBoxNumber}
                onChange={(e) => setPasteBoxNumber(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم البطاقة الأرشيفية:</label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-center font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="877"
                value={pasteCardNumber}
                onChange={(e) => setPasteCardNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">عنوان الرصيد بالأعلى:</label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-right bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="ملفات مستخدمين"
                value={pasteFundTitle}
                onChange={(e) => setPasteFundTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الورقة المستهدفة:</label>
              <select
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-right bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-bold text-emerald-800"
                value={pasteSheetId}
                onChange={(e) => setPasteSheetId(e.target.value)}
              >
                <option value="employees">📄 ملفات المستخدمين</option>
                <option value="budget">📄 الميزانية والمالية المحلية</option>
                <option value="investments">📄 التجهيز والاستثمارات العمومية</option>
                <option value="control">📄 الرقابة المالية والتأشيرة</option>
                <option value="contracts">📄 الصفقات العمومية والاتفاقيات</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
              <ClipboardType size={14} /> الصق هنا السطور المنسوخة بالكامل من الإكسل:
            </label>
            <textarea
              className="w-full h-28 text-xs p-3.5 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 bg-slate-50/50"
              placeholder="حدد الأسطر المطلوبة في الإكسل الخاص بالولاية ثم انسخها بالكامل (Ctrl+C) والصقها هنا مباشرة (Ctrl+V)..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            ⚡ تفكيك وحقن حقول الأرشيف في الكلاسور فوراً
          </button>
        </form>
      )}

      {/* Interactive Status Display */}
      {statusMsg && !error && (
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-emerald-800 text-xs flex items-center gap-2">
          <FileCheck2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold text-[11px]">{statusMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span className="font-semibold text-[11px]">{error}</span>
        </div>
      )}

      {/* Guide Checklist Box for Archivists */}
      <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-3.5 text-[11px] text-amber-900 font-sans leading-relaxed flex items-start gap-2">
        <HelpCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-amber-800 mb-0.5">تأمين كلي للخصوصية الأمنية الحساسة لولاية ورقلة:</span>
          <span>
            يتم فحص وقراءة كلاسور الإكسل أو السطور المنسوخة بالكامل داخل متصفح الإنترنت الخاص بك وعنصر ذاكرتك المؤقتة فقط. لا يتم تخزين أو نقل أي من سجلاتك الهامة لأي خوادم خارجية بما يضمن سرية ملفات التقاعد والاستقالات والوظائف للمستشارين والمدراء الجهويين.
          </span>
        </div>
      </div>

    </div>
  );
};
export default ExcelLiveConnector;
