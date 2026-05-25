import React, { useState } from 'react';
import { ArchiveRecord, SheetTab, UserArchivist } from '../types';
import { SHEET_TABS } from '../data/initialData';
import { Table, Upload, AlertCircle, Sparkles, CheckSquare, PlusCircle, HelpCircle, FileSpreadsheet, Layers, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportWizardProps {
  activeUser: UserArchivist;
  onImportCompleted: (importedRecords: ArchiveRecord[]) => void;
  onClose: () => void;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({ activeUser, onImportCompleted, onClose }) => {
  const [targetSheet, setTargetSheet] = useState<string>('employees');
  const [boxNumber, setBoxNumber] = useState<string>('N1/824');
  const [cardNumber, setCardNumber] = useState<string>('824');
  const [fundTitle, setFundTitle] = useState<string>('ملفات مستخدمين');
  const [detectedArchivist, setDetectedArchivist] = useState<string>('');
  const [detectedDept, setDetectedDept] = useState<string>('');

  const [pasteContent, setPasteContent] = useState<string>('');
  const [parsedRecords, setParsedRecords] = useState<Partial<ArchiveRecord>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // حالة الملف المرفوع
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [currentWorkbook, setCurrentWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [importMode, setImportMode] = useState<'single' | 'all'>('single');
  const [sheetBreakdown, setSheetBreakdown] = useState<{ name: string; count: number; box: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // بنية نتيجة تحليل صفحة واحدة
  interface ParsedSheetResult {
    records: Partial<ArchiveRecord>[];
    metadata: {
      dept: string;
      archivist: string;
      card: string;
      box: string;
      fund: string;
    };
  }

  // دالة ذكية ومصقولة لتحليل ورقة إكسل منفردة بشكل كامل مع مسح خطي معزز وكشف للعلب والبطاقات المتعددة المتراصة عمودياً بذكاء
  const parseSingleSheet = (wb: XLSX.WorkBook, sName: string): ParsedSheetResult => {
    const ws = wb.Sheets[sName];
    const result: ParsedSheetResult = {
      records: [],
      metadata: {
        dept: activeUser.matsaleh || 'أرشيف المديرية الجهوية للميزانية',
        archivist: activeUser.fullName,
        card: sName.match(/\d+/) ? sName.match(/\d+/)![0] : '824',
        box: sName, // القيمة الافتراضية للعلبة هي اسم الشيت نفسه
        fund: 'ملفات مستخدمين'
      }
    };

    if (!ws) return result;

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    if (rawRows.length === 0) return result;

    // المؤشرات وال trackers الدوارة (Running States) لتمثيل الكتل المتعددة عمودياً
    let sheetDept = result.metadata.dept;
    let sheetArchivist = result.metadata.archivist;
    let sheetCard = result.metadata.card;
    let sheetBox = result.metadata.box;
    let sheetFund = result.metadata.fund;

    // تحديد سطر ترويسة الجدول ديناميكياً
    let colSubFile = 0;
    let colProducer = 1;
    let colTitle = 2;
    let colDates = 3;
    let colRemark = 4;

    let activeHeaderSeen = false;
    const itemsList: Partial<ArchiveRecord>[] = [];

    // دالة مساعدة للتحقق من وجود ميتاداتا لعلبة معينة وتحديث قيمها الجارية
    const parseMetadataRow = (row: any[]): boolean => {
      let isMeta = false;
      for (let c = 0; c < Math.min(row.length, 10); c++) {
        const cellStr = String(row[c] || '').trim();
        if (!cellStr) continue;

        // دالة مساعدة لانتشال الميتاداتا بذكاء تواصل مرن للفصل بين التسمية والقيمة
        const getMetaValue = (keyword: string): string | null => {
          if (!cellStr.includes(keyword)) return null;
          isMeta = true;
          // فحص لو القيمة مدمجة بالخلية بحظر المقطعين بواسطة كولون
          if (cellStr.includes(':') || cellStr.includes('：')) {
            const parts = cellStr.split(/[:：]/);
            // الجزء الأول هو التسمية (الاسم مثلا)، والثاني يجب أن يحمل القيمة
            if (parts.length > 1) {
              const possibleVal = parts[1].trim();
              // التأكد من أن القيمة ليست مجرد تكرار لاسم الحقل أو فارغة
              if (possibleVal && possibleVal !== keyword && !possibleVal.includes(keyword)) {
                return possibleVal;
              }
            }
          }
          // إذا لم تكن مدمجة، أو كانت جزئية فارغة، فالقيمة بالخلية الموالية
          if (row[c + 1] !== undefined) {
            const nextVal = String(row[c + 1] || '').trim();
            if (nextVal && !nextVal.includes(keyword)) {
              return nextVal;
            }
          }
          return null;
        };

        const deptVal = getMetaValue('المصلحة');
        if (deptVal !== null) {
          sheetDept = deptVal;
          continue;
        }

        const archivistVal = getMetaValue('اسم الارشيفي') || getMetaValue('اسم الأرشيفي') || getMetaValue('الأرشيفي');
        if (archivistVal !== null) {
          sheetArchivist = archivistVal;
          continue;
        }

        const cardVal = getMetaValue('رقم البطاقة') || getMetaValue('البطاقة');
        if (cardVal !== null) {
          sheetCard = cardVal;
          continue;
        }

        const boxVal = getMetaValue('رقم العتبة') || getMetaValue('العلبة') || getMetaValue('علبة رقم') || getMetaValue('رقم الععلبة') || getMetaValue('العلبة الأرشيفية') || getMetaValue('العلبه');
        if (boxVal !== null) {
          sheetBox = boxVal;
          continue;
        }

        const fundVal = getMetaValue('عنوان الرصيد') || getMetaValue('الرصيد') || getMetaValue('عنوان رصيد');
        if (fundVal !== null) {
          sheetFund = fundVal;
          continue;
        }
      }
      return isMeta;
    };

    // دالة مساعدة لاكتشاف سطر ترويسة الأعمدة وتحديث توازيها ومواقعها
    const checkHeaderRow = (row: any[]): boolean => {
      let matchesInRow = 0;
      row.forEach(cell => {
        const s = String(cell || '').trim();
        if (
          s.includes('رقم الملف') || 
          s.includes('الملف الفرعي') || 
          s.includes('المستند') || 
          s.includes('المصدر') || 
          s.includes('المنتج') || 
          s.includes('عنوان الملف') || 
          s.includes('العنوان المعزز') || 
          s.includes('التواريخ') || 
          s.includes('الأقصى') || 
          s.includes('ملاحظة') || 
          s.includes('ملاحظات')
        ) {
          matchesInRow++;
        }
      });

      if (matchesInRow >= 2) {
        row.forEach((cell, idx) => {
          const s = String(cell || '').trim();
          if ((s.includes('رقم الملف') || s.includes('الملف الفرعي') || s.includes('رقم المستند')) && !s.includes('عنوان')) {
            colSubFile = idx;
          } else if (s.includes('المصدر') || s.includes('المنتج') || s.includes('طبيعة')) {
            colProducer = idx;
          } else if (s.includes('عنوان الملف') || s.includes('العنوان') || s.includes('الموضوع')) {
            colTitle = idx;
          } else if (s.includes('تاريخ') || s.includes('التواريخ') || s.includes('الأقصى') || s.includes('السنة')) {
            colDates = idx;
          } else if (s.includes('ملاحظة') || s.includes('ملاحظات') || s.includes('الوضعية')) {
            colRemark = idx;
          }
        });
        return true;
      }
      return false;
    };

    // تحليل الكلاسور سطر سطر بشكل تفرعي
    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r] || [];
      if (row.length === 0) continue;

      // ١. كشف سطور ميتادات الفهرس للعلب
      const isMeta = parseMetadataRow(row);
      if (isMeta) {
        activeHeaderSeen = false; // تم تبديل العلبة، ننتظر الترويسة الخاصة بالعلبة الجديدة
        continue;
      }

      // ٢. كشف سطر ترويسة الأعمدة (مثلا: "رقم الملف الفرعي", "المصدر", ...)
      const isHeader = checkHeaderRow(row);
      if (isHeader) {
        activeHeaderSeen = true;
        continue;
      }

      // ٣. تعبئة السجل الفعلي إذا كان الترويسة نشطة ومستكشفة
      if (activeHeaderSeen) {
        const subFile = String(row[colSubFile] !== undefined ? row[colSubFile] : '').trim();
        const producer = String(row[colProducer] !== undefined ? row[colProducer] : '').trim();
        const title = String(row[colTitle] !== undefined ? row[colTitle] : '').trim();
        const dates = String(row[colDates] !== undefined ? row[colDates] : '').trim();
        const remark = String(row[colRemark] !== undefined ? row[colRemark] : '').trim();

        // تخطي الحالات الشاغرة
        if (!title && !subFile && !producer) continue;

        // تصفية أسطر الفهارس والخطوط والأمور الحاشية والجامعة
        if (
          subFile.includes('رقم الملف') || 
          title.includes('عنوان الملف') || 
          title.includes('المجموع') || 
          title.includes('الوضعية') ||
          subFile.includes('المصلحة') ||
          title.includes('امضاء') ||
          title.includes('توقيع') ||
          title.includes('الاستمارة') ||
          title.includes('بطاقة تشخيص') ||
          producer.includes('المجموع') ||
          producer.includes('امضاء') ||
          producer.includes('توقيع')
        ) {
          continue;
        }

        itemsList.push({
          id: `excel-${Date.now()}-${sName}-${r}-${Math.round(Math.random() * 1000000)}`,
          subFileNumber: subFile || 'مستمر',
          producer: producer || 'غير محدد',
          title: title || 'ملف أرشيفي فرعي غير مسمى',
          ultimateDates: dates || 'غير متوفر',
          remark: remark || '',
          boxNumber: sheetBox || sName,
          cardNumber: sheetCard || '824',
          fundTitle: sheetFund || 'ملفات مستخدمين',
          archivistName: sheetArchivist || activeUser.fullName,
          department: sheetDept || activeUser.matsaleh,
          sheet: sName,
          createdAt: new Date().toISOString()
        });
      }
    }

    // القيمة الافتراضية للورقة ككل تمثل آخر ميتاداتا مكتشفة لضمان التوافقية
    result.metadata = {
      dept: sheetDept,
      archivist: sheetArchivist,
      card: sheetCard,
      box: sheetBox,
      fund: sheetFund
    };

    result.records = itemsList;
    return result;
  };

  // معالجة قراءة الملف الذكي والتوزيع بناء على خيار الاستيراد (ورقة أم أوراق متعددة)
  const applyProcessing = (wb: XLSX.WorkBook, mode: 'single' | 'all', singleSheet: string) => {
    setError(null);
    setSuccessMsg(null);
    setIsAnalyzing(true);

    // Defer computation using setTimeout to optimize INP (Interaction to Next Paint) and render loading spinner immediately
    setTimeout(() => {
      try {
        if (mode === 'single') {
          const res = parseSingleSheet(wb, singleSheet);
          setBoxNumber(res.metadata.box);
          setCardNumber(res.metadata.card);
          setFundTitle(res.metadata.fund);
          setDetectedArchivist(res.metadata.archivist);
          setDetectedDept(res.metadata.dept);
          setParsedRecords(res.records);
          setSheetBreakdown([]);

          if (res.records.length === 0) {
            setError(`تعذر استنباط سجلات صالحة تحت الصفحة "${singleSheet}". يرجى التحقق من الملف.`);
          } else {
            setSuccessMsg(`القراءة والتحليل التلقائي تم بنجاح! تم استيراد ${res.records.length} ملفاً فرعياً من الورقة "${singleSheet}". العلبة: (${res.metadata.box}).`);
          }
        } else {
          // جرد الكلاسور بكامل أوراقه دفعة واحدة دون تكرار وعناء التبديل اليدوي
          const allRecords: Partial<ArchiveRecord>[] = [];
          const breakdown: { name: string; count: number; box: string }[] = [];

          wb.SheetNames.forEach(sName => {
            const res = parseSingleSheet(wb, sName);
            if (res.records.length > 0) {
              allRecords.push(...res.records);
              breakdown.push({
                name: sName,
                count: res.records.length,
                box: res.metadata.box
              });
            }
          });

          setParsedRecords(allRecords);
          setSheetBreakdown(breakdown);

          if (allRecords.length === 0) {
            setError(`جرد كامل الأوراق: لم يتم العثور على أي ملفات فرعية صالحة في جميع تبويبات الكلاسور الـ (${wb.SheetNames.length}). يرجى التحقق من الهيكل.`);
          } else {
            const uniqueBoxes = Array.from(new Set(allRecords.map(r => r.boxNumber).filter(Boolean)));
            setSuccessMsg(`تم الانتهاء من فحص وجرد الكلاسور المجمع بنجاح تام! مسحنا ${wb.SheetNames.length} ورقة عمل دفعة واحدة، واستحصدنا ${allRecords.length} ملفاً أرشيفياً فرعياً موزعاً على ${uniqueBoxes.length} علب أرشيفية متفرقة!`);
          }
        }
      } catch (err: any) {
        setError(`وقع خطأ ما خلال معالجة خلايا الكلاسور: ${err.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    }, 50);
  };

  // دالة قراءة وتحليل ملف إكسل حقيقي مرفوع
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        // القراءة الثنائية للملف
        const wb = XLSX.read(data, { type: 'binary' });
        setCurrentWorkbook(wb);
        setSheetsList(wb.SheetNames);
        
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheetName(firstSheet);
          applyProcessing(wb, importMode, firstSheet);
        }
      } catch (err: any) {
        console.error(err);
        setError(`فشل قراءة الملف المرفوع: ${err.message || 'تأكد من أنه ملف إكسل سليم وصالح'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // تبديل الشيت الفعلي للعمل الحقيقي
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheetName(sheetName);
    if (currentWorkbook) {
      applyProcessing(currentWorkbook, importMode, sheetName);
    }
  };

  const handleModeChange = (mode: 'single' | 'all') => {
    setImportMode(mode);
    if (currentWorkbook) {
      applyProcessing(currentWorkbook, mode, selectedSheetName);
    }
  };

  // معالجة اللصق التلقائي من إكسل (الخيار اليدوي الكلاسيكي)
  const handleParsePasteData = () => {
    setError(null);
    setSuccessMsg(null);
    
    if (!pasteContent.trim()) {
      setError('يرجى لصق بيانات إكسل في الحقل المخصص أولاً!');
      return;
    }

    try {
      const lines = pasteContent.split('\n').filter(line => line.trim());
      const tempRecords: Partial<ArchiveRecord>[] = [];

      lines.forEach((line, index) => {
        // أعمدة إكسل مفصولة بـ Tab عند نسخها من الجداول
        const cols = line.split('\t').map(c => c.trim());
        
        if (cols.length > 0) {
          const subFile = cols[0] || '';
          const producer = cols[1] || '';
          const title = cols[2] || '';
          const remark = cols[3] || '';
          const dates = cols[4] || '';

          // تخطي رأس الجدول والخطوط غير الضرورية
          if (
            subFile.includes('رقم الملف') || 
            title.includes('عنوان الملف') || 
            title.includes('المصلحة') ||
            title === 'عنوان الملف/عنوان الملف الفرعي' ||
            subFile.includes('المستند')
          ) {
            return; 
          }

          tempRecords.push({
            id: `paste-${Date.now()}-${index}`,
            subFileNumber: subFile,
            producer: producer || 'غير محدد',
            title: title || cols.join(' ') || 'ملف أرشيفي فرعي',
            ultimateDates: dates || 'غير متوفر',
            remark: remark || '',
            boxNumber: boxNumber || 'N1/824',
            cardNumber: cardNumber || '824',
            fundTitle: fundTitle || 'ملفات مستخدمين',
            archivistName: activeUser.fullName,
            department: activeUser.matsaleh,
            sheet: targetSheet,
            createdAt: new Date().toISOString()
          });
        }
      });

      if (tempRecords.length === 0) {
        setError('تعذر قراءة أسطر الخلايا المنسوخة. تأكد من تحديد ولصق الجدول بشكل صحيح.');
      } else {
        setParsedRecords(tempRecords);
        setSuccessMsg(`تم تفكيك وقراءة عدد ${tempRecords.length} سطراً من كلاسور إكسل الملصق بنجاح من الحافظة!`);
      }
    } catch (e) {
      setError('عذراً، فشل تحليل محتوى الحافظة كخلايا إكسل منسقة.');
    }
  };

  // التثبيت النهائي للبيانات في الكلاسور النشط للبرنامج ومزامنتها محلياً
  const handleFinalImport = () => {
    if (parsedRecords.length === 0) return;
    
    let finalRecords: ArchiveRecord[] = [];
    const uniqueBoxes = Array.from(new Set(parsedRecords.map(r => r.boxNumber).filter(Boolean)));
    const hasMultipleBoxes = uniqueBoxes.length > 1;
    
    if (importMode === 'single') {
      // تطبيق الحقول المدخلة يدوياً للملف الفردي
      finalRecords = parsedRecords.map(rec => {
        // نفضل دائماً السجلات المشتقة ذاتياً من الإكسل لكل سجل منفرد، مع الرجوع لقيم الحقول والمدخلات كبديل
        const finalBox = rec.boxNumber || boxNumber.trim() || 'غير محدد';
        const finalCard = rec.cardNumber || cardNumber.trim() || '824';
        const finalFund = rec.fundTitle || fundTitle.trim() || 'ملفات مستخدمين';
        const finalArchivist = rec.archivistName || detectedArchivist || activeUser.fullName;
        const finalDept = rec.department || detectedDept || activeUser.matsaleh;

        return {
          ...rec,
          boxNumber: finalBox,
          cardNumber: finalCard,
          fundTitle: finalFund,
          sheet: targetSheet,
          archivistName: finalArchivist,
          department: finalDept
        };
      }) as ArchiveRecord[];
    } else {
      // للمصنف بالكامل: نحتفظ بالعلب والبطاقات المستخلصة ذاتياً لكل ورقة وسجل
      finalRecords = parsedRecords.map(rec => ({
        ...rec,
        sheet: targetSheet, // استخدام التبويب النشط بالبرنامج كهدف للدمج المجمع
        archivistName: rec.archivistName || activeUser.fullName,
        department: rec.department || activeUser.matsaleh
      })) as ArchiveRecord[];
    }

    onImportCompleted(finalRecords);
  };

  const loadSampleTemplate = () => {
    const sample = `01/1997\tمكتب المستخدمين\tملف ترقية الموظف (سليمان بن علي) منظفة مؤقتة الرقابة المالية تمنراست\t1997\tتم التثبيت
02/2006\tالمديرية الجهوية للميزانية\tملف تقاعد الموظف (بلخيري أحمد) حارس مؤقت الرقابة المالية الوادي\t2006\tكامل المستحقات
03/1997\tالرقابة المالية إيليزي\tملف استقالة السيد (زهرة جبار) مساعد إدارة رئيسي الرقابة المالية اليزي\t1997\tمستقر بالرفوف`;
    setPasteContent(sample);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      
      {/* Container Dialog */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-700 text-emerald-100 rounded-xl">
              <FileSpreadsheet size={22} />
            </span>
            <div>
              <h3 className="font-bold text-base font-sans">معالج استيراد كلاسورات الأرشفة الذكي المعتمد</h3>
              <p className="text-xs text-emerald-200 font-sans mt-0.5">ارفع ملف الإكسل (.xlsx) الخاص بك مباشرة، أو الصق محتوى الخلايا لمطابقتها آلياً وتصنيفها بالثانية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-emerald-900/70 text-emerald-200 hover:text-white rounded-md hover:bg-emerald-950 cursor-pointer text-sm"
          >
            إغلاق ✕
          </button>
        </div>

        {/* content area */}
        <div className="p-6 overflow-y-auto max-h-[580px] space-y-6 text-right">

          {/* Guide diagram of the Excel Sheet Structure */}
          {showGuide && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-amber-950 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 mb-2">
                <span className="font-bold flex items-center gap-1">
                  <HelpCircle size={15} /> دليل مطابقة خلايا إكسل المعتمدة بالمديرية (شرح مفصل):
                </span>
                <button 
                  onClick={() => setShowGuide(false)} 
                  className="p-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold cursor-pointer"
                >
                  إخفاء الدليل المستمر ✕
                </button>
              </div>
              <p className="leading-relaxed mb-3">
                يتعرف النظام بشكل تلقائي ذكي على هيكل ملفات <strong className="font-bold">الإكسل لبطاقة تشخيص النموذج المعتمد</strong> الموفرة من مصلحتكم. إليك كيف يتم تنظيم وقراءة البيانات:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual grid layout indicator */}
                <div className="bg-white p-3 rounded-lg border border-amber-200 font-mono text-[10px] leading-relaxed text-slate-700">
                  <div className="text-center font-bold text-emerald-800 border-b pb-1 mb-1">تخطيط البيانات الأعلى (من السطر 1 إلى 20)</div>
                  <div>• سطر ١٠: [المصلحة: ارشيف المديرية الجهوية للميزانية] <span className="text-emerald-700 font-bold">← يتم جردها كـ "المصلحة"</span></div>
                  <div>• سطر ١١: [اسم الارشيفي: بن أودينة زينب] <span className="text-emerald-700 font-bold">← يتم جردها كـ "الأرشيفي"</span></div>
                  <div>• سطر ١٢: [رقم البطاقة: 824] <span className="text-emerald-700 font-bold">← يعين بـ "البطاقة"</span></div>
                  <div>• سطر ١٣: [عنوان الرصيد: ملفات مستخدمين] <span className="text-emerald-700 font-bold">← يعين بـ "الرصيد"</span></div>
                  <div>• سطر ١٤: [رقم الععلبة: N1/824] <span className="text-emerald-700 font-bold">← يعين كـ "العلبة"</span></div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200 font-mono text-[10px] leading-relaxed text-slate-700">
                  <div className="text-center font-bold text-emerald-800 border-b pb-1 mb-1">ترتيب أعمدة الجدول المعتمد (بدءاً من السطر 20)</div>
                  <div>• العمود A (جندرة ١): <strong>رقم الملف الفرعي</strong> (مثال: <span className="text-slate-500">01/1997</span>)</div>
                  <div>• العمود B (جندرة ٢): <strong>المصدر / المنتج للملف</strong> (مثال: <span className="text-slate-500">مكتب المستخدمين</span>)</div>
                  <div>• العمود C (جندرة ٣): <strong>عنوان الملف / عنوان الملف الفرعي المكتمل المعزز</strong></div>
                  <div>• العمود D (جندرة ٤): <strong>التواريخ القصوى لملف الأرشيف</strong> (مثال: <span className="text-slate-500">1997</span>)</div>
                  <div>• العمود E (جندرة ٥): <strong>ملاحظة الموثق</strong> (مثال: <span className="text-slate-500">تم التثبيت بالرف</span>)</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-amber-900 bg-amber-100/40 p-2 rounded-lg leading-normal">
                <Info size={12} className="shrink-0" />
                <p>
                  <strong>بشرى ميسرة:</strong> في حال ارفاق ملف Excel حقيقي، سيقوم البرنامج بالنيابة عنك بقراءة كافة هذه المعايير وتصفيتها دون أن تفعل أي مجهود يدوي متعب.
                </p>
              </div>
            </div>
          )}

          {/* TWO METHODS TABS TOGGLER */}
          <div className="border bg-slate-50 p-1.5 rounded-2xl flex gap-1.5 justify-center">
            <span className="text-slate-400 text-xs self-center font-bold px-4">اختر طريقة الإدخال المريحة:</span>
            <div className="flex-1 max-w-sm flex gap-1">
              <button
                type="button"
                className={`flex-1 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sheetsList.length > 0 || currentWorkbook
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-250 hover:bg-slate-100'
                }`}
                onClick={() => {
                  setParsedRecords([]);
                  setError(null);
                  setSuccessMsg(null);
                }}
              >
                📁 رفع ملف إكسل رسمي
              </button>
              <button
                type="button"
                className={`flex-1 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sheetsList.length === 0 && !currentWorkbook
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-250 hover:bg-slate-100'
                }`}
                onClick={() => {
                  setCurrentWorkbook(null);
                  setSheetsList([]);
                  setParsedRecords([]);
                  setError(null);
                  setSuccessMsg(null);
                }}
              >
                📋 لصق خلايا منسوخة
              </button>
            </div>
          </div>

          {sheetsList.length > 0 || currentWorkbook ? (
            // METHOD A: DIRECT FILE UPLOADING
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="bg-emerald-50/40 border border-emerald-150 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📂</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">الملف نشط بقاعدة البيانات المؤقتة للمتصفح</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">عدد الصفحات المكتشفة: {sheetsList.length} ورقة عمل</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">الصفحة النشطة الجاري قراءتها:</label>
                  <select
                    className="p-2 text-xs rounded-xl bg-white border border-slate-350 focus:ring-1 focus:ring-emerald-700 disabled:bg-slate-100 disabled:text-slate-400"
                    value={selectedSheetName}
                    disabled={importMode === 'all'}
                    onChange={(e) => handleSheetChange(e.target.value)}
                  >
                    {sheetsList.map((name, idx) => (
                      <option key={idx} value={name}>ورقة: {name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentWorkbook(null);
                    setSheetsList([]);
                    setParsedRecords([]);
                    setError(null);
                    setSuccessMsg(null);
                    setImportMode('single');
                    setSheetBreakdown([]);
                  }}
                  className="p-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إلغاء الملف المرفوع ✕
                </button>
              </div>

              {/* اختيار نطاق الاستيراد بالكامل بأعلى مستوى من الاحترافية */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                <div className="flex items-center gap-2">
                  <Layers className="text-emerald-700 shrink-0" size={16} />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">نطاق فحص وجرد الكلاسور المرفوع:</span>
                    <span className="text-[10px] text-slate-400">تحكم بقراءة ورقة منفردة حالاً أو حصد الـ 100+ ورقة معاً دفعة واحدة</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleModeChange('single')}
                    disabled={isAnalyzing}
                    className={`flex-1 sm:flex-initial p-2 px-4 rounded-xl text-[11px] font-bold transition-all border ${
                      isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      importMode === 'single'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📄 استيراد ورقة عمل واحدة فقط ({selectedSheetName})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('all')}
                    disabled={isAnalyzing}
                    className={`flex-1 sm:flex-initial p-2 px-4 rounded-xl text-[11px] font-bold transition-all border ${
                      isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      importMode === 'all'
                        ? 'bg-gradient-to-r from-emerald-800 to-teal-700 text-white border-emerald-850 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📚 جرد وحصد كامل أوراق الكلاسور مجمعاً ({sheetsList.length} ورقة)
                  </button>
                </div>
              </div>

              {/* تفصيل جرد أوراق العمل تحت وضع المجمع لمعالجة 100+ ورقة */}
              {importMode === 'all' && sheetBreakdown.length > 0 && (
                <div className="bg-emerald-50/15 rounded-2xl p-4 border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-emerald-600 animate-spin-slow" />
                      تفصيل وجرد أوراق الكلاسور المجمعة تلقائياً ({sheetBreakdown.length} ورقة تحوي أسطراً منتجة):
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      مجموع السجلات: {parsedRecords.length} ملف
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 text-right">
                    {sheetBreakdown.map((sh, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition-all text-[10px] flex flex-col justify-center">
                        <span className="font-bold text-slate-800 truncate" title={sh.name}>📃 {sh.name}</span>
                        <div className="flex items-center justify-between text-emerald-700 font-bold mt-1.5">
                          <span>📦 {sh.count} ملف</span>
                          <span className="text-slate-400 font-mono text-[9px] truncate max-w-[50px]" title={sh.box}>ع: {sh.box}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            // METHOD B: MANUAL UPLOADER / SELECTOR OR PASTE CONTENT
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Drag and Drop File input */}
              <div className="border-3 border-dashed border-emerald-250 hover:border-emerald-600 rounded-2xl bg-emerald-50/15 p-8 text-center transition-all cursor-pointer relative group flex flex-col items-center justify-center min-h-[160px]">
                <input
                  type="file"
                  accept=".xlsx, .xls, .ods"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleFileUpload}
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold mb-3 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-black text-slate-800 font-sans">اسحب وأفلت كلاسور الإكسل المعتمد (.xlsx)</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  انقر هنا لتصفح ملف الكلاسور الفعلي المستخرج من جهاز الكمبيوتر لتعريضه للمطابقة الآلية
                </p>
              </div>

              {/* Paste code area */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">أو الصق الخلايا المنسوخة من إكسل هنا:</label>
                  <button
                    type="button"
                    onClick={loadSampleTemplate}
                    className="p-1 px-2.5 bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    💡 تحميل نموذج جاهز للاختبار
                  </button>
                </div>
                
                <textarea
                  className="w-full h-28 p-3 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-700 font-mono text-right"
                  placeholder={`اسم الملف الفرعي\tالمصدر\tعنوان الملف فرعي المكتمل\tالتاريخ الأقصى\tملاحظات`}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                />

                <div className="text-left">
                  <button
                    onClick={handleParsePasteData}
                    className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    حلل وفكك السطور المنسوخة ⚙️
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* DYNAMIC METADATA CONTROLS (Read from the Excel cell or Customizable manually) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
              <Layers className="text-emerald-700" size={15} /> البيانات المكتشفة من الكلاسور (مع قابليتها للتعديل اليدوي):
            </h4>

            {(() => {
              const detectedBoxes = Array.from(new Set(parsedRecords.map(r => r.boxNumber).filter(Boolean)));
              if (detectedBoxes.length > 1) {
                return (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2.5 shadow-2xs leading-relaxed animate-in fade-in duration-200">
                    <Sparkles size={18} className="shrink-0 mt-0.5 text-emerald-700 animate-pulse" />
                    <div>
                      <strong className="font-bold text-emerald-800 block mb-0.5">✨ ميزة الاستيراد الذكي للفهرس المتعدد:</strong>
                      تم اكتشاف <strong className="text-emerald-900 font-bold underline font-mono">{detectedBoxes.length} علب أرشيفية متفرقة</strong> في صفحة العمل هذه ببطاقات تشخيص مخصصة ومستقلة (<strong className="font-mono text-teal-950">{detectedBoxes.join(' ، ')}</strong>). 
                      سيقوم البرنامج بدمج كل علبة مع الحماية الكاملة لبياناتها الفرعية لتمكينك من طباعة "بطاقة تشخيص العلبة" على حدة كأهم خيار بالمنصة!
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الورقة المستهدفة بالبرنامج:</label>
                <select
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  value={targetSheet}
                  onChange={(e) => setTargetSheet(e.target.value)}
                >
                  {SHEET_TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم العلبة الأرشيفية:</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-250 font-mono focus:ring-1 focus:ring-emerald-600"
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  placeholder="مثال: N1/824"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم البطاقة الأرشيفية:</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-250 font-mono focus:ring-1 focus:ring-emerald-600"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="مثال: 824"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رصيد الأرشيف العام:</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-250 focus:ring-1 focus:ring-emerald-600"
                  value={fundTitle}
                  onChange={(e) => setFundTitle(e.target.value)}
                  placeholder="مثال: ملفات مستخدمين"
                />
              </div>
            </div>

            {/* Read department info */}
            {(detectedArchivist || detectedDept) && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-emerald-800">
                <span>👤 الأرشيفي بكلاسور إكسل: <strong className="font-bold">{detectedArchivist || activeUser.fullName}</strong></span>
                <span>🏛️ الجهة المستخلصة: <strong className="font-bold">{detectedDept || activeUser.matsaleh}</strong></span>
              </div>
            )}
          </div>

          {/* PARSED PREVIEW AREA */}
          {isAnalyzing && (
            <div className="p-8 rounded-2xl border border-emerald-100 bg-emerald-50/10 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in duration-300">
              <div className="w-10 h-10 border-4 border-emerald-700/35 border-t-emerald-700 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-emerald-800">جاري مسح وقراءة كلاسور الإكسل آلياً...</p>
              <p className="text-[10px] text-slate-400">نقوم الآن بفحص هيكل الخلايا وجرد محتويات الأرواق المحددة دون عرقلة أداء حاسوبك</p>
            </div>
          )}

          {!isAnalyzing && parsedRecords.length > 0 && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="text-emerald-700" size={15} /> معاينة السجلات المستكشفة بنجاح ({parsedRecords.length} ملف فرعي):
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56 bg-white shadow-inner">
                <table className="w-full text-[11px] text-right border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-slate-700 font-bold border-l">رقم الملف الفرعي</th>
                      <th className="p-2 text-slate-700 font-bold border-l">المصدر / المنتج</th>
                      <th className="p-2 text-slate-700 font-bold border-l">عنوان الملف الأرشيفي المكتمل بالتفاصيل والاسم</th>
                      <th className="p-2 text-slate-700 font-bold border-l">التواريخ القصوى</th>
                      <th className="p-2 text-slate-700 font-bold">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRecords.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/75 odd:bg-slate-50/15">
                        <td className="p-2 text-slate-900 font-mono font-bold border-l">{rec.subFileNumber}</td>
                        <td className="p-2 text-slate-600 border-l">{rec.producer}</td>
                        <td className="p-2 text-slate-900 font-medium font-sans border-l leading-relaxed">{rec.title}</td>
                        <td className="p-2 text-slate-500 font-mono border-l">{rec.ultimateDates}</td>
                        <td className="p-2 text-slate-400 font-sans">{rec.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-150/60 text-red-800 text-xs rounded-xl flex items-start gap-2 animate-pulse">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-150/60 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="p-2 px-4 bg-white hover:bg-slate-100 border border-slate-350 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            {showGuide ? 'إخفاء دليل الخلايا' : 'طلب قراءة شروط الإكسل 💡'}
          </button>

          <button
            onClick={handleFinalImport}
            disabled={parsedRecords.length === 0 || isAnalyzing}
            className={`p-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              parsedRecords.length > 0 && !isAnalyzing
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/10' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <PlusCircle size={16} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? 'جاري تحليل خلايا الكلاسور...' : 'تأكيد دمج السجلات مع قاعدة الكلاسور النشط'}
          </button>
        </div>

      </div>
    </div>
  );
};
export default ExcelImportWizard;
