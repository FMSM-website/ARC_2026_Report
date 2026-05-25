export interface ArchiveRecord {
  id: string;
  subFileNumber: string; // رقم الملف الفرعي
  producer: string; // المصدر / المنتج
  title: string; // عنوان الملف / عنوان الملف الفرعي
  ultimateDates: string; // التواريخ القصوى
  remark: string; // ملاحظة
  boxNumber: string; // رقم العلبة (مثال: N7/877)
  cardNumber: string; // رقم البطاقة (مثال: 877)
  fundTitle: string; // عنوان الرصيد (مثال: ملفات مستخدمين)
  archivistName: string; // اسم الأرشيفي (معرف من الجلسة)
  department: string; // المصلحة (مثال: أرشيف المديرية الجهوية للميزانية)
  sheet: string; // اسم ورقة الكلاسور أو التصنيف (مثال: 'employees' | 'budget' | 'expenses' | 'control' | 'procurements')
  createdAt: string;
  updatedAt?: string;
}

export interface SheetTab {
  id: string; // معرف داخلي
  name: string; // اسم الورقة بالعربية (مثال: ملفات مستخدمين، الميزانية، إلخ)
  color: string; // لون مميز للعلامة التبويب لجاذبية بصرية
  description: string; // وصف للورقة
}

export interface UserArchivist {
  username: string;
  fullName: string;
  role: string;
  avatar: string; // الصورة الرمزية
  matsaleh: string; // المصلحة التابع لها
}

export interface SearchFilters {
  query: string;
  sheetId: string; // 'all' أو ورقة محددة
  boxNumber: string;
  year: string;
  producer: string;
}
