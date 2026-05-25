import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { ArchiveRecord, SheetTab, UserArchivist } from './types';
import { SHEET_TABS, ARCHIVISTS, INITIAL_RECORDS } from './data/initialData';
import { OfficialHeader } from './components/OfficialHeader';
import { LoginScreen } from './components/LoginScreen';
import { PrintCardModal } from './components/PrintCardModal';
import { ExcelImportWizard } from './components/ExcelImportWizard';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  LogOut,
  FolderLock,
  Database,
  Layers,
  Sparkles,
  RefreshCw,
  FolderOpen,
  PieChart,
  User,
  Info,
  Calendar,
  Layers3,
  CheckCircle,
  FileDown,
  X,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // --- 1. المصادقة والجلسة ---
  const [activeUser, setActiveUser] = useState<UserArchivist | null>(() => {
    const cached = localStorage.getItem('alg_archivist_session');
    return cached ? JSON.parse(cached) : null;
  });

  const handleLogin = (user: UserArchivist) => {
    setActiveUser(user);
    localStorage.setItem('alg_archivist_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.removeItem('alg_archivist_session');
  };

  // --- 2. قاعدة البيانات والحالة العامة ---
  const [records, setRecords] = useState<ArchiveRecord[]>(() => {
    const cached = localStorage.getItem('alg_archive_records_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      // إذا كان الكاش يحتوي على أي ملف تجريبي قديم، نقوم بتصفيره تلقائياً لبدء تجربة عمل حقيقية تماماً للعميل بمجرد التنسيق
      const hasMockData = parsed.some((r: any) => 
        r.id && (
          r.id.startsWith('emp-') || 
          r.id.startsWith('bud-') || 
          r.id.startsWith('inv-') || 
          r.id.startsWith('ctrl-') || 
          r.id.startsWith('ctr-')
        )
      );
      if (hasMockData) {
        localStorage.removeItem('alg_archive_records_v1');
        return [];
      }
      return parsed;
    }
    return INITIAL_RECORDS;
  });

  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>(() => {
    const cached = localStorage.getItem('alg_archive_tabs_v1');
    return cached ? JSON.parse(cached) : SHEET_TABS;
  });

  useEffect(() => {
    localStorage.setItem('alg_archive_records_v1', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('alg_archive_tabs_v1', JSON.stringify(sheetTabs));
  }, [sheetTabs]);

  // --- 3. التنقل الفرز وعلامات التبويب ---
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' أو معرف ورقة محددة

  const handleExcelDataLoaded = (newRecords: ArchiveRecord[], newTabs: SheetTab[]) => {
    setRecords(newRecords);
    setSheetTabs(newTabs);
    setActiveTab('all');
  };

  // --- 4. محركات البحث الفلترة ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBox, setSearchBox] = useState('');
  const [searchProducer, setSearchProducer] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, searchBox, searchProducer, searchYear]);

  // --- 5. النوافذ المنبثقة والمعالجات ---
  const [printRecord, setPrintRecord] = useState<ArchiveRecord | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // حقول إضافة وتعديل سجل
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ArchiveRecord | null>(null);

  // قيم الإدخال المستقلة للنماذج
  const [formSubFileNumber, setFormSubFileNumber] = useState('');
  const [formProducer, setFormProducer] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formUltimateDates, setFormUltimateDates] = useState('');
  const [formRemark, setFormRemark] = useState('');
  const [formBoxNumber, setFormBoxNumber] = useState('');
  const [formCardNumber, setFormCardNumber] = useState('');
  const [formFundTitle, setFormFundTitle] = useState('');
  const [formSheet, setFormSheet] = useState(() => sheetTabs[0]?.id || 'employees');

  // تنظيف وتجهيز النموذج عند الإضافة أو التعديل
  const openAddForm = () => {
    setFormSubFileNumber('');
    setFormProducer('');
    setFormTitle('');
    setFormUltimateDates('');
    setFormRemark('');
    setFormBoxNumber('N7/877');
    setFormCardNumber('877');
    setFormFundTitle('ملفات مستخدمين');
    setFormSheet(activeTab === 'all' ? (sheetTabs[0]?.id || 'employees') : activeTab);
    setEditingRecord(null);
    setIsAdding(true);
  };

  const openEditForm = (rec: ArchiveRecord) => {
    setEditingRecord(rec);
    setFormSubFileNumber(rec.subFileNumber);
    setFormProducer(rec.producer);
    setFormTitle(rec.title);
    setFormUltimateDates(rec.ultimateDates);
    setFormRemark(rec.remark);
    setFormBoxNumber(rec.boxNumber);
    setFormCardNumber(rec.cardNumber);
    setFormFundTitle(rec.fundTitle);
    setFormSheet(rec.sheet);
    setIsAdding(false);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingRecord) {
      // تعديل سجل قائم
      setRecords(prev =>
        prev.map(r =>
          r.id === editingRecord.id
            ? {
                ...r,
                subFileNumber: formSubFileNumber,
                producer: formProducer || 'غير محدد',
                title: formTitle,
                ultimateDates: formUltimateDates,
                remark: formRemark,
                boxNumber: formBoxNumber,
                cardNumber: formCardNumber,
                fundTitle: formFundTitle,
                sheet: formSheet,
                updatedAt: new Date().toISOString()
              }
            : r
        )
      );
      setEditingRecord(null);
    } else {
      // إضافة سجل جديد كلياً
      const newRec: ArchiveRecord = {
        id: `rec-${Date.now()}`,
        subFileNumber: formSubFileNumber || 'غير محدد',
        producer: formProducer || 'مكتب الميزانية',
        title: formTitle,
        ultimateDates: formUltimateDates || '2026',
        remark: formRemark,
        boxNumber: formBoxNumber || 'N7/877',
        cardNumber: formCardNumber || '877',
        fundTitle: formFundTitle || 'ملفات مستخدمين',
        archivistName: activeUser?.fullName || 'أرشيفي مجهول',
        department: activeUser?.matsaleh || 'ارشيف المديرية الجهوية للميزانية',
        sheet: formSheet,
        createdAt: new Date().toISOString()
      };
      setRecords(prev => [newRec, ...prev]);
      setIsAdding(false);
    }
    
    // تنظيف المدخلات بعد الحفظ
    setFormTitle('');
  };

  // حالات التأكيد والمودالات الآمنة لـ iframe لتجاوز مشاكل الحماية
  const [recordToDelete, setRecordToDelete] = useState<ArchiveRecord | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setSelectedRecordIds(prev => prev.filter(item => item !== id));
    setRecordToDelete(null);
  };

  const handleImportCompleted = (imported: ArchiveRecord[]) => {
    setRecords(prev => [...imported, ...prev]);
    setIsImporting(false);
    setImportSuccessCount(imported.length);
  };

  const confirmRestoreDefaultDatabase = () => {
    setRecords([]);
    localStorage.removeItem('alg_archive_records_v1');
    setShowRestoreConfirm(false);
  };

  // --- 6. منطق التصفية الذكي للملفات والبحث التلقائي ---
  // "بمجرد أن يكتب الأرشيفي عنوان الملف/ عنوان الملف الفرعي... يكفي أن يكتب أحد الأسماء"
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // 1. التصفية التبويبية (الورقة النشطة)
      if (activeTab !== 'all' && rec.sheet !== activeTab) {
        return false;
      }

      // 2. تصفية مربع البحث العام (البحث في الاسم، العنوان، أو رقم الملف الفرعي)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = rec.title.toLowerCase().includes(query);
        const matchesProducer = rec.producer.toLowerCase().includes(query);
        const matchesSubFile = rec.subFileNumber.toLowerCase().includes(query);
        const matchesBox = rec.boxNumber.toLowerCase().includes(query);
        const matchesFund = rec.fundTitle.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesProducer && !matchesSubFile && !matchesBox && !matchesFund) {
          return false;
        }
      }

      // 3. تصفية الفلاتر المتقدمة اختيارياً
      if (searchBox.trim() && !rec.boxNumber.toLowerCase().includes(searchBox.toLowerCase().trim())) {
        return false;
      }

      if (searchProducer.trim() && !rec.producer.toLowerCase().includes(searchProducer.toLowerCase().trim())) {
        return false;
      }

      if (searchYear.trim() && !rec.ultimateDates.toLowerCase().includes(searchYear.toLowerCase().trim())) {
        return false;
      }

      return true;
    });
  }, [records, activeTab, searchQuery, searchBox, searchProducer, searchYear]);

  const itemsPerPage = 100;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const isAllFilteredSelected = useMemo(() => {
    return filteredRecords.length > 0 && filteredRecords.every(r => selectedRecordIds.includes(r.id));
  }, [filteredRecords, selectedRecordIds]);

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = filteredRecords.map(r => r.id);
      setSelectedRecordIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredRecords.map(r => r.id);
      setSelectedRecordIds(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  const handleBulkDelete = () => {
    setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
    setSelectedRecordIds([]);
    setShowBulkDeleteConfirm(false);
  };

  // تصفية السجلات التابعة لنفس العلبة لعرضها في بطاقة المعاينة
  const uniqueBoxesInResults = useMemo(() => {
    if (!searchQuery.trim() && !searchBox.trim()) return [];
    return Array.from(new Set(filteredRecords.map(r => r.boxNumber)));
  }, [filteredRecords, searchQuery, searchBox]);

  const recordsInSelectedBox = useMemo(() => {
    if (!printRecord) return [];
    return records.filter(r => r.boxNumber === printRecord.boxNumber);
  }, [records, printRecord]);

  // حساب الإحصائيات الحيوية للوحة القيادة
  const stats = useMemo(() => {
    const totalCount = records.length;
    
    // عدد العلب الفريدة
    const uniqueBoxes = new Set(records.map(r => r.boxNumber)).size;
    
    // التوزيع لكل شيت
    const distribution: Record<string, number> = {};
    sheetTabs.forEach(tab => {
      distribution[tab.id] = records.filter(r => r.sheet === tab.id).length;
    });

    // السنوات الشائعة
    const years = records.map(r => r.ultimateDates.slice(0, 4)).filter(y => y && !isNaN(Number(y)));
    const busiestYear = years.length > 0 ? years.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b) : '0';

    return {
      totalCount,
      uniqueBoxes,
      distribution,
      busiestYear
    };
  }, [records, sheetTabs]);

  // دالة لتلوين الكلمات المطابقة للبحث في العناوين لزيادة الدقة البصرية
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-yellow-100 text-orange-900 px-0.5 rounded-sm font-bold border-b-2 border-orange-400">{part}</mark>
            : part
        )}
      </span>
    );
  };

  // دالة لتصدير البيانات إلى ملف Excel منسق بالكامل ومطابق للمنصة
  const handleExportExcel = async () => {
    try {
      const activeSheetName = activeTab === 'all' 
        ? 'الكل (كافة الأقسام المستعرضة)' 
        : (sheetTabs.find(s => s.id === activeTab)?.name || activeTab);

      // إنشاء كلاسور عمل فارغ بالـ ExcelJS
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('جدول جرد الأرشيف المستعرض');
      ws.views = [{ showGridLines: true, rtl: true } as any];

      // 1. ترويسة جهورية منسقة بالخطوط والألوان الوطنية (الأخضر الداكن والذهبي)
      // الصف الأول: الجمهورية الجزائرية الديمقراطية الشعبية
      const row1 = ws.addRow(['الْجُمْهُورِيَّة الْجَزَائِرِيَّة الدِّيمقْرَاطِيَّة الشَّعْبِيَّة']);
      ws.mergeCells('A1:K1');
      row1.height = 28;
      
      // الصف الثاني: وزارة المالية - المديرية العامة للميزانية
      const row2 = ws.addRow(['وزارة المالية - المديرية العامة للميزانية']);
      ws.mergeCells('A2:K2');
      row2.height = 24;

      // الصف الثالث: المديرية الجهوية للميزانية ورقلة - مصلحة الأرشيف
      const row3 = ws.addRow(['المديرية الجهوية للميزانية ورقلة - مصلحة الأرشيف']);
      ws.mergeCells('A3:K3');
      row3.height = 24;

      // الصف الرابع: سطر فارغ
      const row4 = ws.addRow(['']);
      ws.mergeCells('A4:K4');
      row4.height = 15;

      // الصف الخامس: عنوان عريض للتقرير
      const titleRow = ws.addRow(['جدول جرد ومتابعة الأرشيف المستعرض الرقمي المنسق']);
      ws.mergeCells('A5:K5');
      titleRow.height = 36;

      // الصف السادس: معلومات التصفية والبيانات
      const infoRow1 = ws.addRow([`القسم / ورقة الكلاسور المحددة: ${activeSheetName}`]);
      ws.mergeCells('A6:K6');
      infoRow1.height = 22;

      // الصف السابع: عدد السجلات
      const infoRow2 = ws.addRow([`إجمالي السجلات المصدرة: ${filteredRecords.length} سجل أرشيفي مفرز حالياً`]);
      ws.mergeCells('A7:K7');
      infoRow2.height = 22;

      // الصف الثامن: تاريخ الاستخراج
      const infoRow3 = ws.addRow([`تاريخ ووقت استخراج التقرير من مصلحة الأرشيف: ${new Date().toLocaleString('ar-DZ')}`]);
      ws.mergeCells('A8:K8');
      infoRow3.height = 22;

      // الصف التاسع: سطر فارغ للفصل
      const spaceRow = ws.addRow(['']);
      ws.mergeCells('A9:K9');
      spaceRow.height = 15;

      // الصف العاشر: ترويسة الجدول الأساسي (Columns)
      const headerRow = ws.addRow([
        'رقم الملف الفرعي',
        'جهة المصدر / المنتج للملف',
        'عنوان الملف الأرشيفي الأساسي / عنوان الملف الفرعي المكتمل المعزز',
        'ملاحظات تكميلية للضبط والجرد',
        'التواريخ القصوى',
        'التصنيف / ورقة الكلاسور',
        'رقم العلبة الأرشيفية (الدولاب/الرف)',
        'رقم البطاقة المرجعية الفردية',
        'عنوان الرصيد الأرشيفي العام المدمج',
        'الأرشيفي المكلف بعملية الترميز ورقمنة الفهرس',
        'تاريخ الإدراج بالنظام'
      ]);
      headerRow.height = 32;

      // 2. تعبئة البيانات الفعلية
      filteredRecords.forEach((r) => {
        const sheetDetails = sheetTabs.find(s => s.id === r.sheet);
        const dataRow = ws.addRow([
          r.subFileNumber,
          r.producer,
          r.title,
          r.remark || 'لا توجد ملاحظات إضافية مسجلة',
          r.ultimateDates,
          sheetDetails ? sheetDetails.name : r.sheet,
          r.boxNumber,
          r.cardNumber,
          r.fundTitle,
          r.archivistName,
          r.createdAt ? r.createdAt.slice(0, 10) : ''
        ]);
        dataRow.height = 25;
      });

      // 3. تنسيق الخطوط والألوان في الترويسات (الصف الأول إلى الثالث)
      const headerFont = { name: 'Amiri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      const subHeaderFont = { name: 'Amiri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      
      const officialBgFill: any = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F5132' } // أخضر رئاسي محكم
      };

      const titleBgFill: any = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' } // داكن لضمان القراءة بوضوح
      };

      const defaultBorder: any = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };

      const dataBorder: any = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF555555' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
      };

      // تنسيقات الجمهورية الجزائرية
      [row1, row2, row3].forEach((row, idx) => {
        row.eachCell((cell) => {
          cell.font = idx === 0 ? headerFont : subHeaderFont;
          cell.fill = officialBgFill;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = defaultBorder;
        });
      });

      // تنسيق عنوان التقرير (الصف الخامس)
      titleRow.eachCell((cell) => {
        cell.font = { name: 'Amiri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = titleBgFill;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = defaultBorder;
      });

      // تنسيق سطور المعلومات التوضيحية (الصف السادس والسابع والثامن)
      const infoFont = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1F2937' } };
      const infoBgFill: any = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' } // رمادي فاتح مريح
      };

      [infoRow1, infoRow2, infoRow3].forEach((row) => {
        row.eachCell((cell) => {
          cell.font = infoFont;
          cell.fill = infoBgFill;
          cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
          cell.border = defaultBorder;
        });
      });

      // تنسيق جدول العناوين (الكولومز) (الصف العاشر)
      const tableHeaderFont = { name: 'Amiri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      const tableHeaderFill: any = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF065F46' } // أخضر ميزانية مميز
      };

      headerRow.eachCell((cell) => {
        cell.font = tableHeaderFont;
        cell.fill = tableHeaderFill;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF111827' } },
          left: { style: 'thin', color: { argb: 'FF111827' } },
          bottom: { style: 'medium', color: { argb: 'FF111827' } },
          right: { style: 'thin', color: { argb: 'FF111827' } }
        } as any;
      });

      // 4. تنسيق الخلايا الحاملة للبيانات الفعلية بالتناوب اللوني (Zebra) وإظهار الحدود (Borders) بشكل واضح جداً
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        // صفوف البيانات تبدأ من الصف الحادي عشر وما بعده
        if (rowNumber > 10) {
          const isEven = rowNumber % 2 === 0;
          const cellFill: any = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' } // تناوب لوني مريح للعين
          };

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.fill = cellFill;
            cell.border = dataBorder;
            
            // تخصيص الخطوط والتحجيم بناءً على نوع البيانات في العمود
            cell.font = { name: 'Segoe UI', size: 10, bold: colNumber === 1 || colNumber === 7 || colNumber === 8 };
            
            // محاذاة البيانات (أرقام العلب والملفات في الوسط، العناوين على اليمين مع هامش مريح)
            if ([1, 5, 6, 7, 8, 11].includes(colNumber)) {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
            }

            // ميزة إضافية: تلوين كود العلبة بلون مميز لتبسيط الفهم البصري
            if (colNumber === 7) {
              cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF92400E' } }; // ذهبي خريفي مميز للعلبة الأرشيفية
            }
            if (colNumber === 1) {
              cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } }; // تركواز غامق لرقم الملف الفرعي
            }
          });
        }
      });

      // 5. ضبط وعرض الأعمدة بشكل متناسق جداً ومبني على العرض الفعلي
      const columnConfig = [
        { width: 22 }, // A - رقم الملف الفرعي
        { width: 34 }, // B - جهة المصدر / المنتج للملف
        { width: 68 }, // C - عنوان الملف الأرشيفي الأساسي
        { width: 44 }, // D - ملاحظات تكميلية للضبط والجرد
        { width: 18 }, // E - التواريخ القصوى
        { width: 26 }, // F - التصنيف / ورقة الكلاسور
        { width: 22 }, // G - رقم العلبة الأرشيفية
        { width: 16 }, // H - رقم البطاقة المرجعية الفردية
        { width: 32 }, // I - عنوان الرصيد الأرشيفي العام
        { width: 28 }, // J - الأرشيفي المكلف بعملية الترميز
        { width: 18 }  // K - تاريخ الإدراج الرقمي
      ];

      columnConfig.forEach((cfg, index) => {
        const col = ws.getColumn(index + 1);
        col.width = cfg.width;
      });

      // 6. توليد وتصدير الملف بصيغة Excel binary
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `جرد_ارشيف_المديرية_الجهوية_ورقلة_${activeTab}_2026.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating organized Excel file: ', e);
      alert('حدث خطأ أثناء تنزيل أو معالجة ملف الإكسل المنسق الملون.');
    }
  };

  // إذا لم يسجل الدخول، اعرض شاشة الموظفين
  if (!activeUser) {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      
      {/* 1. Official Government Header */}
      <OfficialHeader minimal={true} />

      {/* 2. Logged User Status Strip */}
      <div className="bg-slate-900 text-white py-3 px-4 md:px-6 shadow-md border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{activeUser.avatar}</span>
            <div>
              <span className="text-slate-400">الموظف الحالي:</span>{' '}
              <strong className="text-emerald-400 text-sm font-bold font-sans">{activeUser.fullName}</strong>
              <span className="mx-2 text-slate-700">|</span>
              <span className="text-slate-400">الوظيفة الإدارية:</span>{' '}
              <span className="text-amber-400 font-semibold">{activeUser.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-emerald-800/80 text-emerald-100 p-1 px-3 rounded-md border border-emerald-700 font-mono text-[10px]">
              🔒 جلسة عمل مؤمنة لمصلحة ورقلة
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 p-1 px-3 bg-red-650 hover:bg-red-700 text-white rounded-md transition-colors cursor-pointer font-bold"
            >
              <LogOut size={13} />
              خروج آمن
            </button>
          </div>

        </div>
      </div>

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        
        {/* Statistics & Overview Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block font-bold">إجمالي الملفات المؤرشفة</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{stats.totalCount} ملفاً</span>
              <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">✓ مخزن محلياً بالمتصفح آمن</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
              <Database size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block font-bold">العلب الأرشيفية الكلية</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{stats.uniqueBoxes} علب</span>
              <span className="text-[10px] text-slate-400 block mt-1">✓ علب حقيقية مستخدمة</span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
              <FolderLock size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block font-bold">معدل السنوات الأكثر كثافة</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{stats.busiestYear}</span>
              <span className="text-[10px] text-amber-600 block mt-1 font-semibold">✓ سنة النشاط الأوفر إنتاجاً</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
              <PieChart size={24} />
            </div>
          </div>

          {/* Quick administrative action cards */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-200 font-bold block">إجراء تسريع رقمي</span>
              <Sparkles className="text-emerald-400" size={16} />
            </div>
            <div className="my-2">
              <span className="text-[11px] text-slate-200 block leading-tight">بإمكانك صب الأوراق المجمعة من ملف إكسل دفعة واحدة لتوفير الوقت.</span>
            </div>
            <button
              onClick={() => setIsImporting(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-555 text-white font-bold p-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet size={12} />
              ابدأ استيراد كلاسور Excel بنقرة
            </button>
          </div>

        </div>

        {/* 4. Active Interactive Workspace Sheets Tab Panel (الكلاسور) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header containing excel-like sheet tabs */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 md:px-6 flex flex-col md:flex-row items-stretch justify-between gap-4">
            
            {/* Tabs List */}
            <div className="flex items-end overflow-x-auto gap-1 pt-3">
              <button
                onClick={() => { setActiveTab('all'); }}
                className={`p-3 px-4 text-xs font-bold rounded-t-xl tracking-tight transition-all duration-150 shrink-0 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white border-t-3 border-emerald-750 border-l border-r border-slate-200 text-emerald-800 font-extrabold shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                📁 جميع الأوراق الأرشيفية
              </button>
            </div>

            {/* Admin triggers on the left side of the tabs */}
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={openAddForm}
                className="p-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <Plus size={14} /> إدراج ملف فرعي يدوي
              </button>
              
              <button
                onClick={() => setShowRestoreConfirm(true)}
                title="تصفير وتطبيق كلاسور مصلحة الأرشيف بالكامل"
                className="p-2 text-slate-400 hover:text-amber-600 bg-slate-200/50 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>

          </div>

          {/* Active Sheet Metadata Description */}
          <div className="bg-slate-50/70 p-4 border-b border-slate-150 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-emerald-700 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700">
                  {activeTab === 'all' 
                    ? 'الكلاسور العام للمديرية ورقلة' 
                    : `الورقة النشطة: ${sheetTabs.find(t => t.id === activeTab)?.name}`}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  {activeTab === 'all'
                    ? 'يعرض جميع الأسطر المخزنة وتوزيع العلب عبر كافة أوراق الأرشفة بالمديرية.'
                    : sheetTabs.find(t => t.id === activeTab)?.description}
                </p>
              </div>
            </div>

            {/* Quick stats on the specific tab */}
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">الملفات المفرزة</span>
                <span className="font-bold text-slate-800 font-mono text-xs">{filteredRecords.length} ملفاً مطابقة</span>
              </div>
              <div className="border-r border-slate-200"></div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">العلب المقترنة</span>
                <span className="font-bold text-slate-800 font-mono text-xs">
                  {new Set(filteredRecords.map(r => r.boxNumber)).size} علبة فرعية
                </span>
              </div>
            </div>
          </div>

          {/* 5. Dynamic Automatic Searching Dashboard Section */}
          <div className="p-4 md:p-6 border-b border-slate-200 bg-white">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Main Realtime Search Box */}
              <div className="md:col-span-6 relative">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex justify-between">
                  <span>ابحث الفوري بمجرد الكتابة (الاسم، عنوان الملف الفرعي، كلمات دالة):</span>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-red-500 font-bold text-[10px] bg-transparent">
                      ✕ مسح الإدخال
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full text-sm p-3.5 pr-11 pl-4 rounded-xl border border-slate-200 font-medium placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 focus:border-emerald-700 text-right bg-slate-50"
                    placeholder="اكتب هنا مثلاً تفاصيل مثل: سليمان، استقالة، تقاعد، حاسي مسعود، تمنراست..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              {/* Advanced Filter: Box Number */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">رقم العلبة المحققة:</label>
                <input
                  type="text"
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-center font-mono placeholder:text-slate-350"
                  placeholder="مثال: N7/877"
                  value={searchBox}
                  onChange={(e) => setSearchBox(e.target.value)}
                />
              </div>

              {/* Advanced Filter: Year */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">تاريخه / سنة الأرشفة:</label>
                <input
                  type="text"
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-center font-mono placeholder:text-slate-350"
                  placeholder="مثال: 1997"
                  value={searchYear}
                  onChange={(e) => setSearchYear(e.target.value)}
                />
              </div>

              {/* Advanced Filter: Producer */}
              <div className="md:col-span-2 flex flex-col justify-end">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">الجهة المنتجة للملف:</label>
                <input
                  type="text"
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-right placeholder:text-slate-350"
                  placeholder="مثال: مكتب المستخدمين"
                  value={searchProducer}
                  onChange={(e) => setSearchProducer(e.target.value)}
                />
              </div>

            </div>

            {/* Reset active filters line */}
            {(searchQuery || searchBox || searchProducer || searchYear) && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 bg-amber-50/50 p-2.5 rounded-xl">
                <span>⚠️ يتم تطبيق فلاتر ومطابقات دقيقة حالياً على العرض الإجمالي.</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchBox('');
                    setSearchProducer('');
                    setSearchYear('');
                  }}
                  className="p-1 px-3 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-md font-bold cursor-pointer transition-colors"
                >
                  إعادة تعيين كافة الفلاتر وتبيان الكل ✕
                </button>
              </div>
            )}

            {/* Bulk Selection Deletion Control Center */}
            {selectedRecordIds.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] flex flex-col sm:flex-row items-center justify-between gap-3 text-right animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <span className="text-xs font-bold text-rose-955 block">تم تظليل وتحديد {selectedRecordIds.length} ملفات أرشيفية</span>
                    <span className="text-[10px] text-rose-600 block mt-0.5">يمكنك تنظيف التحديد أو شطب هذه الملفات معاً إذا ارتكب الأرشيفي خطأ إدخال مجمع</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordIds([])}
                    className="p-2 px-4 rounded-xl text-[11px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                  >
                    إلغاء التحديد ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="p-2 px-4 rounded-xl text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Trash2 size={13} />
                    حذف كافة المسائل المحددة ({selectedRecordIds.length}) دفعة واحدة
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Dynamic Box Number Highlight Widget */}
          {uniqueBoxesInResults.length > 0 && (
            <div className="mx-4 md:mx-6 my-4 bg-slate-50 border-2 border-[#0a3d62] rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#0a3d62] text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-inner select-none shrink-0">
                  📁
                </div>
                <div>
                  {uniqueBoxesInResults.length === 1 ? (
                    <>
                      <div className="text-[11px] text-[#0a3d62] font-extrabold font-sans">
                        تم رصد علبة ملائمة للمطابقة الجردية المباشرة:
                      </div>
                      <div className="text-2xl font-black text-[#0a3d62] tracking-wider block font-mono mt-0.5">
                        العلبة رقم {uniqueBoxesInResults[0]}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] text-rose-700 font-extrabold font-sans flex items-center gap-1">
                        ⚠️ نتائج المخرجات متواجدة في عدة عُلب مختلفة:
                      </div>
                      <div className="text-[12px] text-slate-600 mt-1 font-semibold leading-relaxed">
                        وجدت النتائج في العلب التالية: <strong className="font-mono text-[#0a3d62]">{uniqueBoxesInResults.join(' ، ')}</strong>. اختر العلبة المطلوبة لمعاينتها وطباعة بطاقة تشخيصها:
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {uniqueBoxesInResults.length === 1 ? (
                <button
                  onClick={() => {
                    const rec = filteredRecords.find(r => r.boxNumber === uniqueBoxesInResults[0]);
                    if (rec) {
                      setPrintRecord(rec);
                    }
                  }}
                  type="button"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white border-none p-3.5 px-6 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-700/10 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Printer size={15} />
                  👁️ معاينة وطباعة بطاقة التشخيص للعلبة الكلية {uniqueBoxesInResults[0]}
                </button>
              ) : (
                <div className="flex flex-wrap gap-2.5 items-center justify-end">
                  {uniqueBoxesInResults.map(boxNo => (
                    <button
                      key={boxNo}
                      onClick={() => {
                        const rec = filteredRecords.find(r => r.boxNumber === boxNo);
                        if (rec) {
                          setPrintRecord(rec);
                        }
                      }}
                      type="button"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-mono p-2.5 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap border border-slate-700 hover:border-slate-500"
                    >
                      <Printer size={13} className="text-yellow-400" />
                      معاينة العلبة {boxNo} ❮
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. Main Interactive Table Grid */}
          <div className="overflow-x-auto min-h-72">
            
            <table className="w-full text-right text-xs border-collapse">
              
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 select-none">
                <tr className="text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-12 text-center no-print">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-700 cursor-pointer"
                      title="تحديد الكل / إلغاء تحديد الكل"
                    />
                  </th>
                  <th className="p-4 font-bold text-slate-700">رقم الملف الفرعي</th>
                  <th className="p-4 font-bold text-slate-700">المصدر والمنتج</th>
                  <th className="p-4 font-bold text-slate-700">عنوان الملف / عنوان الملف الفرعي المكتمل المعزز</th>
                  <th className="p-4 font-bold text-slate-700 text-center">التواريخ القصوى</th>
                  
                  {/* Highlighted Box labels exactly matching user's paper requirement */}
                  <th className="p-4 font-bold text-slate-700 text-center">تفاصيل العلبة</th>
                  <th className="p-4 font-bold text-slate-700 text-center no-print">إجراءات الحفظ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedRecords.map((rec) => {
                  const sheetDetails = sheetTabs.find(s => s.id === rec.sheet);
                  const isSelected = selectedRecordIds.includes(rec.id);
                  return (
                    <tr
                      key={rec.id}
                      className={`transition-colors group align-middle ${
                        isSelected 
                          ? 'bg-rose-50/30 hover:bg-rose-50/45' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 w-12 text-center no-print">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRecord(rec.id)}
                          className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                        />
                      </td>

                      {/* Sub-file Number */}
                      <td className="p-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {highlightMatch(rec.subFileNumber, searchQuery)}
                      </td>

                      {/* Source/Producer */}
                      <td className="p-4 text-slate-600 font-sans">
                        {highlightMatch(rec.producer, searchQuery)}
                      </td>

                      {/* Full title (with highlight search query matching) */}
                      <td className="p-4 font-medium text-slate-900 max-w-sm md:max-w-md leading-relaxed font-sans">
                        {highlightMatch(rec.title, searchQuery)}
                        {rec.remark && (
                          <span className="block text-[10px] text-slate-400 mt-1 font-semibold leading-normal">
                             ملاحظة: {rec.remark}
                           </span>
                        )}
                      </td>

                      {/* Ultimate dates */}
                      <td className="p-4 text-center font-mono font-semibold text-slate-500 whitespace-nowrap">
                        {highlightMatch(rec.ultimateDates, searchQuery)}
                      </td>



                      {/* Highlighted box details for this row to fetch the label values */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1.5 bg-slate-950 text-yellow-300 font-mono text-xs font-black rounded-lg border border-black shadow-xs tracking-wider">
                            {rec.boxNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block font-semibold">ب: {rec.cardNumber}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          <button
                            onClick={() => setPrintRecord(rec)}
                            title="طباعة بطاقة التشخيص للعلبة"
                            className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 rounded-lg cursor-pointer transition-all border border-slate-200"
                          >
                            <Printer size={13} />
                          </button>

                          <button
                            onClick={() => openEditForm(rec)}
                            title="تعديل هذا السجل الأرشيفي"
                            className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg cursor-pointer transition-all border border-blue-200"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => setRecordToDelete(rec)}
                            title="حذف السجل"
                            className="p-2 bg-red-50 text-red-700 hover:bg-red-650 hover:text-white rounded-lg cursor-pointer transition-all border border-red-200"
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'all' ? 8 : 7} className="p-12 text-center text-slate-400 bg-slate-50/50">
                      <div className="max-w-md mx-auto flex flex-col items-center">
                        <FolderOpen size={44} className="text-slate-300 mb-3" />
                        <h4 className="text-sm font-bold text-slate-700">لم يتم العثور على أي نتائج مفرزة!</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          اكتفِ بكتابة حروف بسيطة من اسم الملف أو رقم العلبة. تأكد من إملاء الكلمات العربية بشكل سلس (مثل: تمنراست / تمنراست، عبد القادر / عبدالقادر).
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSearchBox('');
                            setSearchYear('');
                            setSearchProducer('');
                          }}
                          className="mt-4 p-2 px-4 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          إعادة تصفير خيارات البحث العام
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print select-none">
              <div className="text-xs text-slate-500 font-sans">
                عرض <span className="font-bold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> إلى{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
                </span>{' '}
                من أصل <span className="font-bold text-slate-900">{filteredRecords.length}</span> سطور مفرزة
              </div>
              
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 px-3 border border-slate-300 rounded-lg text-xs font-bold transition-all ${
                    currentPage === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-white text-slate-700 hover:bg-slate-150 cursor-pointer active:scale-95'
                  }`}
                >
                  السابق ❮
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isNear = Math.abs(p - currentPage) <= 2;
                  const isFirstOrLast = p === 1 || p === totalPages;
                  if (!isNear && !isFirstOrLast) {
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="px-1 text-slate-400 font-mono text-xs">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        currentPage === p
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 px-3 border border-slate-300 rounded-lg text-xs font-bold transition-all ${
                    currentPage === totalPages
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-white text-slate-700 hover:bg-slate-150 cursor-pointer active:scale-95'
                  }`}
                >
                  التالي ❯
                </button>
              </div>
            </div>
          )}

          {/* Table Bottom Action Summary and Exports */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 no-print">
            
            <span>
              تم تبيان <strong className="text-slate-800 font-mono text-sm">{filteredRecords.length}</strong> سجلأً من أصل <strong className="text-slate-800 font-mono text-sm">{records.length}</strong> إجمالاً بالكلاسور الجهوي لورقلة.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="p-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <FileDown size={14} /> تصدير جدول الأرشيف المستعرض (Excel)
              </button>
            </div>
            
          </div>

        </div>

        {/* 7. Beautiful Interactive Form Modular Dialog (Add or Edit Archivist File card) */}
        {(isAdding || editingRecord) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-600/25 overflow-hidden w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              
              <div className="bg-emerald-800 text-white p-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-emerald-700 rounded-lg text-emerald-100">
                    <Database size={16} />
                  </span>
                  <h3 className="font-bold text-sm font-sans">
                    {editingRecord ? `تعديل السجل الأرشيفي الأمني: ${editingRecord.subFileNumber}` : 'إدراج وتكويد ملف أرشيفي فرعي جديد'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingRecord(null);
                  }}
                  className="p-1 hover:bg-emerald-900 rounded text-xs px-2 cursor-pointer"
                >
                  إلغاء ✕
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="p-6 space-y-4 text-right grid gap-4 grid-cols-1">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم الملف الفرعي:</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                      placeholder="مثال: 01/1997"
                      value={formSubFileNumber}
                      onChange={(e) => setFormSubFileNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">جهة المصدر / المنتج للملف:</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      placeholder="مثال: مكتب المستخدمين ورقلة"
                      value={formProducer}
                      onChange={(e) => setFormProducer(e.target.value)}
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">عنوان الملف / عنوان الملف الفرعي المكتمل (يحوي الاسم أو التفاصيل):</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-emerald-700 font-semibold"
                    placeholder="مثال: ملف استقالة السيد (أحمد بلقاسم) منظفة مؤقتة الرقابة المالية تمنراست"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم العلبة المكتوب بالملصق:</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono font-bold"
                      placeholder="مثال: N7/877"
                      value={formBoxNumber}
                      onChange={(e) => setFormBoxNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رقم البطاقة الأرشيفية:</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                      placeholder="مثال: 877"
                      value={formCardNumber}
                      onChange={(e) => setFormCardNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">التواريخ القصوى لملف الأرشيف:</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                      placeholder="مثال: 1997"
                      value={formUltimateDates}
                      onChange={(e) => setFormUltimateDates(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رصيد الأرشيف العام:</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      placeholder="مثال: ملفات مستخدمين"
                      value={formFundTitle}
                      onChange={(e) => setFormFundTitle(e.target.value)}
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظة موثق الأرشفة (اختياري):</label>
                  <textarea
                    className="w-full h-18 text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    placeholder="دون ملاحظات إدارية هنا..."
                    value={formRemark}
                    onChange={(e) => setFormRemark(e.target.value)}
                  />
                </div>

                {/* Informative credentials status autofills */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-emerald-800">
                  <span>👤 الأرشيفي المدبج: <strong>{activeUser.fullName}</strong></span>
                  <span>🏛️ المصلحة الشاهدة: <strong>{activeUser.matsaleh}</strong></span>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingRecord(null);
                    }}
                    className="p-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    إلغاء التغييرات
                  </button>
                  <button
                    type="submit"
                    className="p-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    {editingRecord ? 'احفظ التحديثات المصممة' : 'أدرج واحفظ في الكلاسور ✓'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>

      {/* 8. Prints Model previews rendering */}
      {printRecord && (
        <PrintCardModal
          record={printRecord}
          allRecordsInBox={recordsInSelectedBox}
          onClose={() => setPrintRecord(null)}
        />
      )}

      {/* 9. Excel Imports Wizards */}
      {isImporting && (
        <ExcelImportWizard
          activeUser={activeUser}
          onImportCompleted={handleImportCompleted}
          onClose={() => setIsImporting(false)}
        />
      )}

      {/* 9.1 Custom iframe-safe state-based confirmation dialogs */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">هل أنت متأكد من حذف هذا السجل؟</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed text-right">
              سيتم حذف الملف الفرعي <strong className="font-mono text-slate-700">{recordToDelete.subFileNumber}</strong>: "{recordToDelete.title}" نهائياً ومسحه من خلايا الكلاسور النشط ولا يمكن التراجع.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => confirmDeleteRecord(recordToDelete.id)}
                className="flex-1 p-2.5 bg-red-600 text-white hover:bg-red-750 text-xs font-bold rounded-xl cursor-pointer"
              >
                تأكيد وبتر الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9.1.5 Bulk delete confirmation modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">هل أنت متأكد من حذف هذه المجموعة؟</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed text-right">
              سيتم شطب وحذف <strong className="font-mono text-red-600 text-sm">{selectedRecordIds.length}</strong> مستنداً أرشيفياً مؤشراً عليه من خلايا الجرد بالكامل وبشكل فوري ونهائي. هذه الخطوة لا يمكن التراجع عنها.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 p-2.5 bg-red-600 text-white hover:bg-red-750 text-xs font-bold rounded-xl cursor-pointer"
              >
                تأكيد البتر وحذف الكل
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw size={24} className="animate-spin duration-1000" />
            </div>
            <h3 className="font-bold text-sm text-amber-950">هل تريد تصفير الكلاسور بالكامل؟</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed text-right">
              سيؤدي هذا إلى <strong className="text-red-600 font-bold">تفريغ كل المحتويات والسجلات والملفات الأرشيفية للفرع</strong> لتصبح قاعدة البيانات فارغة تماماً لكي تبدأ بالإدرجات وجرد جدول ملفاتك الحقيقية.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmRestoreDefaultDatabase}
                className="flex-1 p-2.5 bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                نعم، تصفير الكلاسور
              </button>
            </div>
          </div>
        </div>
      )}

      {importSuccessCount !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-sm text-emerald-950">تم الاستيراد والمطابقة بنجاح!</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              تمت بنجاح مطابقة ودمج <strong className="text-emerald-700 font-mono font-bold text-sm">{importSuccessCount}</strong> سجلاً أرشيفياً جديداً وإدراجهم فوراً في مصلحة الأرشفة!
            </p>
            <button
              onClick={() => setImportSuccessCount(null)}
              className="w-full p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl mt-5 cursor-pointer shadow-md transition-all"
            >
              موافق، استعراض المستندات
            </button>
          </div>
        </div>
      )}

      {/* 10. Dedicated High Profile Algerian Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400 font-sans px-4 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-200 block font-serif">الجمهورية الجزائرية الديمقراطية الشعبية</span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              مصلحة الأرشيف - المديرية الجهوية للميزانية لولاية ورقلة • نظام مخصص v3.5
            </span>
          </div>
          <div className="text-left font-mono text-[9px] text-slate-500">
            <div>بوابة الأرشيف الإلكتروني الموحد</div>
            <div>ALL RIGHTS SECURITIZED • SYSTEM LOCAL DATABASE</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
