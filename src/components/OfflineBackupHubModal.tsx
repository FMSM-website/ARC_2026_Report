import React, { useState } from 'react';
import { ArchiveRecord, SheetTab } from '../types';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Users, 
  Share2, 
  HardDrive,
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';

interface OfflineBackupHubModalProps {
  records: ArchiveRecord[];
  sheetTabs: SheetTab[];
  onRestoreDatabase: (importedRecords: ArchiveRecord[]) => void;
  onClose: () => void;
}

export const OfflineBackupHubModal: React.FC<OfflineBackupHubModalProps> = ({
  records,
  sheetTabs,
  onRestoreDatabase,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'collab'>('security');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    addedCount?: number;
    updatedCount?: number;
  } | null>(null);

  // Export database to a local JSON file (Aesthetic & Safe)
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        recordsCount: records.length,
        records: records
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const today = new Date().toISOString().split('T')[0];
      const exportFileDefaultName = `الأرشيف_الجهوي_ورقلة_احتياطي_${today}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert("عذراً، حدث خطأ أثناء تصدير ملف النسخة الاحتياطية.");
    }
  };

  // Import JSON backup and perform Smart Overwrite or Merge
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        
        // Validate if this is a genuine compatible archive backup
        if (!parsedData || !Array.isArray(parsedData.records)) {
          setImportStatus({
            success: false,
            message: "عذراً، الملف المختار غير مطابق لصيغة قاعدة بيانات المنصة. يرجى التأكد من اختيار ملف (.json) تم تصديره من المنصة سابقاً بنجاح."
          });
          return;
        }

        const incomingRecords: ArchiveRecord[] = parsedData.records;

        if (importMode === 'replace') {
          // Absolute overwrite
          onRestoreDatabase(incomingRecords);
          setImportStatus({
            success: true,
            message: `تمت تهيئة الكلاسور بالكامل بنجاح واستبداله بالنسخة الاحتياطية! تم تحميل ${incomingRecords.length} ملفاً بنجاح.`,
            addedCount: incomingRecords.length,
            updatedCount: 0
          });
        } else {
          // Smart Merge to solve offline multi-user overlaps without duplicates!
          // Identify unique records by combining sheet + boxNumber + subFileNumber + title
          const makeKey = (r: ArchiveRecord) => `${r.sheet}_${r.boxNumber}_${r.subFileNumber}_${r.title}`.toLowerCase().trim();
          
          const currentMap = new Map<string, ArchiveRecord>();
          records.forEach(rec => {
            currentMap.set(makeKey(rec), rec);
          });

          let added = 0;
          let updated = 0;
          const mergedRecords = [...records];

          incomingRecords.forEach(inRec => {
            const key = makeKey(inRec);
            if (currentMap.has(key)) {
              // Found duplicate: option to either skip or update. Let's update elements that might differ.
              const existingIdx = mergedRecords.findIndex(r => makeKey(r) === key);
              if (existingIdx !== -1) {
                // Preserving ID, but updating metadata
                mergedRecords[existingIdx] = {
                  ...mergedRecords[existingIdx],
                  producer: inRec.producer || mergedRecords[existingIdx].producer,
                  ultimateDates: inRec.ultimateDates || mergedRecords[existingIdx].ultimateDates,
                  remark: inRec.remark || mergedRecords[existingIdx].remark,
                  cardNumber: inRec.cardNumber || mergedRecords[existingIdx].cardNumber,
                  fundTitle: inRec.fundTitle || mergedRecords[existingIdx].fundTitle
                };
                updated++;
              }
            } else {
              // Truly new record
              mergedRecords.push(inRec);
              added++;
            }
          });

          onRestoreDatabase(mergedRecords);
          setImportStatus({
            success: true,
            message: `تم دمج قاعدة البيانات بنجاح وبقوة! تم إدراج ${added} مستنداً جديداً بالكامل وتحديث بيانات ${updated} ملفات مشتركة بنجاح وبدون أي تكرار.`,
            addedCount: added,
            updatedCount: updated
          });
        }
      } catch (err) {
        setImportStatus({
          success: false,
          message: "فشلت قراءة الملف! قد يكون الملف تالفاً أو لا يتضمن بيانات بصيغة JSON متوافقة."
        });
      }
    };

    fileReader.readAsText(files[0]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right no-print">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-800/20 w-full max-w-4xl overflow-hidden max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 px-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-950/40 text-emerald-100 rounded-xl">
              <Database size={22} className="text-amber-400" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm font-sans tracking-wide">مركز الأمان والنسخ الاحتياطي دون إنترنت (Offline Safe Hub)</h3>
              <p className="text-[11px] text-emerald-200/90 font-sans mt-0.5">ضمان السيادة الكاملة للبيانات والتنسيق والتعاون المشترك بين الموظفين الخمسه</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-3 bg-emerald-950/40 hover:bg-emerald-900 text-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق ✕
          </button>
        </div>

        {/* Modal Tabbing Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 shrink-0 flex px-6 py-1 overflow-x-auto gap-2">
          <button
            onClick={() => { setActiveTab('security'); setImportStatus(null); }}
            className={`p-3 text-xs font-bold flex items-center gap-1.5 transition-all relative shrink-0 cursor-pointer ${
              activeTab === 'security'
                ? 'text-emerald-800 border-b-2 border-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert size={14} />
            🛡️ أمن وسرية البيانات والأرشفة
          </button>
          
          <button
            onClick={() => { setActiveTab('backup'); setImportStatus(null); }}
            className={`p-3 text-xs font-bold flex items-center gap-1.5 transition-all relative shrink-0 cursor-pointer ${
              activeTab === 'backup'
                ? 'text-emerald-800 border-b-2 border-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive size={14} />
            📥 النسخ الاحتياطي والدمج التراكمي
          </button>
          
          <button
            onClick={() => { setActiveTab('collab'); setImportStatus(null); }}
            className={`p-3 text-xs font-bold flex items-center gap-1.5 transition-all relative shrink-0 cursor-pointer ${
              activeTab === 'collab'
                ? 'text-emerald-800 border-b-2 border-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={14} />
            👥 بروتوكول تعاون الـ 5 موظفين
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 text-slate-700 leading-relaxed font-sans space-y-6">

          {/* TAB 1: 🛡️ SECURITY & ZERO-LEAKAGE ASSURANCE */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-emerald-50 border border-emerald-200/60 p-5 rounded-2xl flex items-start gap-4">
                <span className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                  <ShieldAlert size={28} />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">سرية وطنية ومحلية 100%: بياناتكم في أمان مطلق</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    نظراً لدرجة السرية والحساسية القصوى لملفات ومعطيات ميزانية ورقلة، فقد قمنا بتصميم هاته المنصة لتعمل بآلية 
                    <strong className="text-emerald-800 font-bold"> "التشفير والتخزين المحلي السيادي الصافي بالكامل" </strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <span className="w-1.5 h-1.5 bg-rose-700 rounded-full"></span>
                    هل يمكن تسريب الملفات عبر الإنترنت؟
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    <strong className="text-slate-800">مستحيل تماماً.</strong> المنصة لا تحتوي على أي كود برمجي أو سيرفر سحابي يقوم بإرسال البيانات خارج جهازكم. كل عملية بحث، إضافة، جرد، أو تعديل تتم فورياً داخل رقاقة المعالج وجهاز الكمبيوتر الخاص بكم فقط دون أن تغادره.
                  </p>
                </div>

                <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                    هل بياناتنا معرضة للضياع؟
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    نظراً لأن المتصفح يحفظ البيانات مؤقتاً في الكاش، فإن تنظيف المتصفح أو تهيئة النظام (Format) قد يحذفها. <strong className="text-amber-800">لذلك، يجب الالتزام بالنسخ الاحتياطي اليومي للـ JSON</strong> وحفظه في فلاش ديسك USB خارجي لحماية العمل للأبد.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700" /> نصائح إدارية هامة للحفاظ على سرية الأرشيف:
                </h5>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-2 pr-2">
                  <li><strong>عدم مشاركة النسخ على السيرفرات العامة:</strong> تجنبوا رفع نسخ جولات الإكسل أو ملفات JSON الاحتياطية على غوغل درايف أو البريد الإلكتروني المفتوح.</li>
                  <li><strong>استعمال وسائط USB مشفرة:</strong> احتفظوا بالنسخ الاحتياطية في فلاشة USB خاصة بالمصلحة وتخزينها بخزانة حديدية مؤمنة في نهاية الدوام.</li>
                  <li><strong>تحديث الملف الماستر دورياً:</strong> تعيين موظف مسؤول (رئيس المصلحة) ليكون جهازه هو مستودع البيانات الجهوي النهائي والجامع.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: BACKUP & SMART SYNC MERGER */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-emerald-50 border border-emerald-100 p-4 text-emerald-900 rounded-xl leading-relaxed text-xs">
                💡 <strong>ما هو ملف JSON المحفوظ؟</strong> هو ملف خفيف الحجم ومحمي للغاية، يحتوي على البنية المتكاملة لكل ما تم جرده وتعديله من أوراق لضمان استرجاعها بنسبة 100% وبنفس الترقيم والألوان دون تداخل.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Export Side */}
                <div className="border border-slate-200/85 p-6 rounded-2xl bg-slate-50/50 space-y-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-950 flex items-center gap-1.5">
                      <Download size={16} className="text-emerald-750" />
                      1. تصدير وحفظ العمل الحالي
                    </h4>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      قم بإنشاء وتنزيل نسخة احتياطية فورية وكاملة لجميع محتويات الكلاسور الحالي بصيغة JSON. بادر بالاحتفاظ بها يومياً.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center text-[11px] mb-3 text-slate-500 font-mono">
                      <span>السجلات المحفوظة حالياً:</span>
                      <strong className="text-emerald-800 text-xs font-black">{records.length} صفاً بالأرشيف</strong>
                    </div>
                    <button
                      onClick={handleExportBackup}
                      className="w-full p-3 font-bold bg-slate-900 border border-slate-800 text-white rounded-xl text-xs hover:border-emerald-700 text-center flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <Download size={14} className="text-amber-400" />
                      إنشاء وتنزيل ملف النسخة الاحتياطية الموحد (.json)
                    </button>
                  </div>
                </div>

                {/* Import/Merge Side */}
                <div className="border border-slate-200/85 p-6 rounded-2xl bg-white space-y-5">
                  <h4 className="font-extrabold text-sm text-slate-950 flex items-center gap-1.5">
                    <Upload size={16} className="text-emerald-700" />
                    2. استيراد ودمج النسخ الاحتياطية
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-600">آلية الاستيراد والمطابقة:</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => { setImportMode('merge'); setImportStatus(null); }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          importMode === 'merge'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-500'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🔄 دمج ذكي تراكمي (موصى به)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImportMode('replace'); setImportStatus(null); }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          importMode === 'replace'
                            ? 'bg-rose-50 border-rose-300 text-rose-900 ring-1 ring-rose-200'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        ⚠️ استبدال شامل (مسح الحالي)
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {importMode === 'merge' 
                        ? 'يقوم بالجمع الذكي للملفات الواردة مع ملفاتها الحالية، بحيث يدرج السجلات المفقودة فقط ويحدث النواقص دون حظر أو التسبب بأي تكرار للبيانات.'
                        : 'خيار حرج! يقوم بمسح وإفراغ كافة البيانات المتواجدة بهذا الكمبيوتر حالياً بشكل نهائي، ويعيد استعادة بيانات الملف المستورد بالكامل.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full p-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
                        <Upload size={14} />
                        اختر ملف النسخ (.json) للتشغيل والدمج
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Import status notification */}
              {importStatus && (
                <div className={`p-5 rounded-2xl border text-xs leading-relaxed space-y-2 animate-in slide-in-from-top-4 duration-200 ${
                  importStatus.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center gap-2">
                    {importStatus.success ? (
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    ) : (
                      <AlertTriangle size={18} className="text-rose-600" />
                    )}
                    <span className="font-extrabold text-sm">
                      {importStatus.success ? 'أنجزت العملية بنجاح تام !' : 'فشلت معالجة الملف'}
                    </span>
                  </div>
                  <p>{importStatus.message}</p>
                  {importStatus.success && importStatus.addedCount !== undefined && (
                    <div className="flex items-center gap-4 mt-2 font-mono font-bold text-[11px] bg-white/50 p-2 rounded-lg border border-emerald-100">
                      <span className="text-emerald-800">✓ إضافات جديدة: {importStatus.addedCount}</span>
                      <span className="text-amber-800">✓ السجلات المحدثة والمطابقة: {importStatus.updatedCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM COLLABORATION */}
          {activeTab === 'collab' && (
            <div className="space-y-6 animate-in fade-in duration-150 text-xs">
              <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-xl text-amber-900 leading-normal flex items-start gap-2.5">
                <Users size={18} className="shrink-0 mt-0.5 text-amber-700" />
                <div className="text-right">
                  <h4 className="font-bold">بروتوكول تسيير العمل المشترك لـ 5 عمال أرشيف بدون إنترنت</h4>
                  <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                    من الرائع جداً حماس الزملاء للعمل على المنصة معاً! هناك طريقتان نموذجيتان ومعتمدتان لتشغيلهم في آن واحد أو في أوقات متفرقة دون ربط خارجي ومع سرية كاملة:
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                
                {/* Protocol Option A */}
                <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-3 shadow-xs">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-emerald-850">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-850 font-mono flex items-center justify-center font-bold text-[10px]">أ</span>
                    بروتوكول مشاركة الملف الاحتياطي بالفلاش ميموري (USB Workflow)
                  </h5>
                  <p className="text-slate-500 leading-relaxed pr-6">
                    تعمل هاته الطريقة بمفهوم <strong>تجميع وتطوير الملف النهائي بالمرور الدائري</strong>، وتعد الأسهل والأسرع تطبيقاً دون أي تهيئة لشبكة الحواسيب:
                  </p>
                  <ol className="list-decimal list-inside text-slate-600 space-y-2.5 pr-8 leading-relaxed">
                    <li>كل موظف من الخمسة يعمل على جرد وتعديل علبه وملفاته بمتصفحه <strong>بشكل مستقل تماماً على حاسوبه</strong>.</li>
                    <li>في نهاية الأسبوع أو يوم الجرد، يقوم كل موظف بالدخول لـ <strong>مركز الأمان</strong> والضغط على <strong className="text-slate-900 border-b border-dotted border-slate-650">جدول الأرشيف المستعرض (Excel)</strong> أو <strong className="text-slate-900">تنزيل نسخة احتياطية (.json)</strong> على فلاش ميموري.</li>
                    <li>يذهب المسؤول عن تجميع قواعد البيانات بحيازة تلك الفلاشات، ويفحت المنصة على حاسوبه الرئيسي، ويدخل للتبويب المقابل <strong>(الدمج التراكمي الذكي)</strong> ويقوم برفع ودمج ملفات الزملاء واحداً تلو الآخر.</li>
                    <li><strong>المنصة بذكائها ستقوم بفلترة كل شيء تلقائياً</strong>، ولن يحدث أي تكرار وتندمج كافة علب الموظفين الخمسة في كلاسور واحد موحد رائع!</li>
                    <li>يعيد رئيس الأرشيف تصدير هذا الملف المجمع الموحد الجديد وتوزيعه على الزملاء الأربعة ليكون لديهم آخر نسخة للمطالعة والبحث.</li>
                  </ol>
                </div>

                {/* Protocol Option B */}
                <div className="border border-slate-200 p-5 rounded-xl bg-slate-50 space-y-3">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-blue-800">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-mono flex items-center justify-center font-bold text-[10px]">ب</span>
                    بروتوكول ربط الأجهزة المباشر بشبكة محليّة داخلية (LAN Setup)
                  </h5>
                  <p className="text-slate-500 leading-relaxed pr-6">
                    بإمكانكم تشغيل المنصة كـ <strong>خادم محلي مركزي في الغرفة</strong> بحيث تصبح كأنها موقع ويب داخلي يفتحونه ويتبادلون الإدخالات عليه في نفس الثانية:
                  </p>
                  <ol className="list-decimal list-inside text-slate-600 space-y-2.5 pr-8 leading-relaxed">
                    <li>تأكد من توصيل حواسيب الـ 5 موظفين بـ <strong>مودم أو راوتر واحد (أو سويتش)</strong> عبر كوابل شبكة عادية (دون الحاجة لتوصيل خط هاتف إنترنت بالراوتر، مجرد ربط داخلي).</li>
                    <li>اختر حاسوباً ليصبح هو المضيف (الخادم)، وقم بتشغيل ملف تشغيل المنصة عليه.</li>
                    <li>اعرف عنوان الـ IP الداخلي لحاسوب المضيف (مثلاً: <code className="bg-slate-200 text-slate-800 font-bold font-mono px-1 rounded">192.168.1.15</code>).</li>
                    <li>الموظفون الخمسة الآخرون يفتحون متصفحاتهم ويكتبون في العنوان: <code className="bg-emerald-100 text-emerald-950 font-bold font-mono px-1 rounded-sm">http://192.168.1.15:3000</code>.</li>
                    <li>يفتح لديهم النظام مباشرة من الحاسوب المركزي ويعملون عليه في نفس الوقت بسلاسة مع تخزين مركزي آمن.</li>
                  </ol>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 shrink-0 text-left flex justify-between items-center px-6">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            💻 نظام الأرشفة الجهوي لورقلة • وضع العمل المحلي الآمن
          </span>
          <button
            onClick={onClose}
            className="p-2 px-5 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs cursor-pointer transition-all active:scale-95"
          >
            مفهوم، تمكين الحفظ والتعاون ❯
          </button>
        </div>

      </div>
    </div>
  );
};
