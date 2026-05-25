import { ArchiveRecord, SheetTab, UserArchivist } from '../types';

export const SHEET_TABS: SheetTab[] = [
  {
    id: 'employees',
    name: 'ملفات المستخدمين',
    color: 'emerald',
    description: 'ملفات الاستقالة، التقاعد، التوظيف، الترقية، والتأديب لموظفي قطاع المالية والميزانية والرقابة المالية بالولايات الجنوبية.'
  },
  {
    id: 'budget',
    name: 'الميزانية والمالية المحلية',
    color: 'blue',
    description: 'الميزانيات الأولية والإضافية والحسابات الإدارية للبلديات والولايات التابعة للجهة.'
  },
  {
    id: 'investments',
    name: 'التجهيز والاستثمارات العمومية',
    color: 'amber',
    description: 'ملفات برامج التنمية البلدية والقطاعية، بطاقات تمويل المشاريع وتصريحات البرامج التنموية.'
  },
  {
    id: 'control',
    name: 'الرقابة المالية والتأشيرة',
    color: 'indigo',
    description: 'مقررات التأشيرة، دفاتر تسجيل المقررات الإدارية، محاضر التحفظ وعمليات التدقيق المالي.'
  },
  {
    id: 'contracts',
    name: 'الصفقات العمومية والاتفاقيات',
    color: 'purple',
    description: 'دفاتر الشروط، الصفقات المبرمة لاقتناء اللوازم، اتفاقيات الخدمات والصيانة العامة وعقود الاستشارات.'
  }
];

export const ARCHIVISTS: UserArchivist[] = [];

// تبدأ فارغة تماماً بناءً على طلب المستخدم للعمل بالبيانات الحقيقية
export const INITIAL_RECORDS: ArchiveRecord[] = [];
