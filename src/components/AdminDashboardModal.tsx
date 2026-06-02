import React, { useState, useEffect } from 'react';
import { ArchiveRecord, SheetTab, UserArchivist } from '../types';
import { fetchAccounts, saveAccounts, isLanActive } from '../utils/syncEngine';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Clock, 
  UserPlus, 
  Trash2, 
  Key, 
  Check, 
  AlertCircle,
  Database,
  FileSpreadsheet,
  Layers,
  Archive,
  Search,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface AdminDashboardModalProps {
  records: ArchiveRecord[];
  sheetTabs: SheetTab[];
  onClose: () => void;
  onRefreshRecords?: () => void;
}

interface ArchivistAccount extends UserArchivist {
  passwordHash: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  records,
  sheetTabs,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'users' | 'audit'>('stats');
  
  // Accounts state synced with localStorage/Server
  const [accounts, setAccounts] = useState<ArchivistAccount[]>([]);
  const [isAccountsLoaded, setIsAccountsLoaded] = useState(false);

  // State for new account creation
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('مؤرشف رقمي');
  const [newMatsaleh, setNewMatsaleh] = useState('مصلحة الأرشيف');
  const [newPassword, setNewPassword] = useState('');
  const [newAvatar, setNewAvatar] = useState('👨‍💼');
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Search query for audit logs
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedArchivistFilter, setSelectedArchivistFilter] = useState('all');

  // Change password state
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [changedPassword, setChangedPassword] = useState('');

  // Load accounts on mount
  useEffect(() => {
    async function load() {
      const list = await fetchAccounts();
      setAccounts(list);
      setIsAccountsLoaded(true);
    }
    load();
  }, []);

  // Persist accounts any time they change
  useEffect(() => {
    if (isAccountsLoaded) {
      saveAccounts(accounts);
    }
  }, [accounts, isAccountsLoaded]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanFullName = newFullName.trim();
    const cleanRole = newRole.trim();
    const cleanMatsaleh = newMatsaleh.trim();

    if (!cleanUsername || !cleanFullName || !newPassword) {
      setActionError('يرجى ملء كافة الحقول الأساسية لتسجيل الحساب بنجاح.');
      return;
    }

    if (accounts.some(acc => acc.username === cleanUsername)) {
      setActionError(`اسم المستخدم (${cleanUsername}) محجوز بالفعل لموظف آخر.`);
      return;
    }

    const newAcc: ArchivistAccount = {
      username: cleanUsername,
      fullName: cleanFullName,
      role: cleanRole || 'مؤرشف رقمي',
      matsaleh: cleanMatsaleh || 'مصلحة الأرشيف',
      avatar: newAvatar,
      passwordHash: newPassword
    };

    setAccounts(prev => [...prev, newAcc]);
    setActionSuccess(`تم إنشاء وتجهيز ملف الحساب الموظف بنجاح: ${cleanFullName}`);
    
    // Reset forms
    setNewFullName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('مؤرشف رقمي');
    setNewMatsaleh('مصلحة الأرشيف');
  };

  const handleDeleteAccount = (username: string) => {
    if (username === 'admin') {
      setActionError('لا يمكن حذف الحساب الجذري للرئيس (admin).');
      return;
    }
    
    if (confirm(`هل أنت متأكد من حذف حساب الأرشيفي (${username}) نهائياً؟`)) {
      setAccounts(prev => prev.filter(acc => acc.username !== username));
      setActionSuccess(`تم إقصاء وحذف الحساب بنجاح.`);
    }
  };

  const handleChangePassword = (username: string) => {
    if (!changedPassword.trim()) {
      alert('يرجى كتابة الرمز السري الجديد أولاً.');
      return;
    }
    
    setAccounts(prev => prev.map(acc => {
      if (acc.username === username) {
        return { ...acc, passwordHash: changedPassword.trim() };
      }
      return acc;
    }));

    setEditingUsername(null);
    setChangedPassword('');
    setActionSuccess(`تم ترقية وتحديث كلمة السر بنجاح للمستخدم: ${username}`);
  };

  // 1. Calculations for Statistics Tab
  const totalRecordsCount = records.length;
  
  // Contribution of each archivist
  const archivistStats = accounts.map(acc => {
    const createdCount = records.filter(r => r.archivistName === acc.fullName).length;
    
    // Find last activity
    const userRecords = records.filter(r => r.archivistName === acc.fullName);
    let lastActiveDate = 'لا يوجد نشاط مسجل';
    if (userRecords.length > 0) {
      // Find latest date
      const sorted = [...userRecords].sort((a,b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      lastActiveDate = new Date(sorted[0].createdAt).toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return {
      ...acc,
      createdCount,
      lastActiveDate,
      ratio: totalRecordsCount > 0 ? Math.round((createdCount / totalRecordsCount) * 100) : 0
    };
  }).sort((a, b) => b.createdCount - a.createdCount);

  // Sheets breakdown
  const sheetStats = sheetTabs.map(tab => {
    const count = records.filter(r => r.sheet === tab.id).length;
    return {
      ...tab,
      count,
      ratio: totalRecordsCount > 0 ? Math.round((count / totalRecordsCount) * 100) : 0
    };
  });

  // Unique boxes
  const uniqueBoxes = new Set(records.map(r => r.boxNumber.trim()).filter(Boolean));
  const uniqueProducers = new Set(records.map(r => r.producer.trim()).filter(Boolean));

  // 2. Formatting Audit Logs
  const auditLogs = [...records].map(r => {
    return {
      recordId: r.id,
      title: r.title,
      boxNumber: r.boxNumber,
      sheetName: sheetTabs.find(t => t.id === r.sheet)?.name || r.sheet,
      archivistName: r.archivistName,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      lastUpdatedBy: r.archivistName // In local, the person who did it
    };
  }).sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  // Apply filters for audit
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          log.boxNumber.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          log.sheetName.toLowerCase().includes(auditSearchQuery.toLowerCase());
    const matchesArchivist = selectedArchivistFilter === 'all' || log.archivistName === selectedArchivistFilter;
    return matchesSearch && matchesArchivist;
  });

  const avatarsList = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👴', '👵', '📂', '🏛️'];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right no-print">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-900/10 w-full max-w-5xl overflow-hidden h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 shrink-0 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-slate-850 text-amber-500 rounded-xl border border-slate-700">
              <Shield size={22} />
            </span>
            <div>
              <h3 className="font-extrabold text-sm font-sans tracking-wide flex items-center gap-2">
                لوحة رئيس المصلحة والرقابة الشاملة
                <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">المدير والمسؤول</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">مراقبة تقدم جرد المؤرشفين، إحصائيات المصلحة اليومية، وصلاحيات التوظيف والحسابات الحصرية</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-3 bg-red-650 hover:bg-red-700 text-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق المراقبة ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-55 border-b border-slate-200 shrink-0 flex px-6 py-1 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`p-3 text-xs font-bold flex items-center gap-1.5 transition-all relative shrink-0 cursor-pointer ${
              activeSubTab === 'stats'
                ? 'text-slate-900 border-b-2 border-amber-500 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 size={14} className="text-emerald-700" />
            📊 لوحة مؤشرات الأداء وجدولة التقدم
          </button>
          
          <button
            onClick={() => setActiveSubTab('users')}
            className={`p-3 text-xs font-bold flex items-center gap-1.5 transition-all relative shrink-0 cursor-pointer ${
              activeSubTab === 'users'
                ? 'text-slate-900 border-b-2 border-amber-500 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={14} className="text-blue-700" />
            👥 إدارة ملفات وتوظيف المؤرشفين (صلاحية الرئيس)
          </button>
          
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`p-3 text-xs font-bold flex items-center gap-1.5 transition-all relative shrink-0 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'text-slate-900 border-b-2 border-amber-500 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={14} className="text-amber-600" />
            👁️ سجل تتبع الفحص والتدقيق (من فعل ماذا؟)
          </button>
        </div>

        {/* Feedback Messages */}
        {actionSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 p-3 px-6 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="mr-auto font-mono text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}
        {actionError && (
          <div className="bg-red-50 border-b border-red-200 text-red-950 p-3 px-6 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-red-650 rounded-full animate-ping"></span>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="mr-auto font-mono text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans space-y-6">

          {/* TAB 1: STATISTICS / GENERAL PROGRESS */}
          {activeSubTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Top Row Bento Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50 relative overflow-hidden">
                  <div className="absolute left-3 top-3 bg-emerald-100 text-emerald-800 p-2 rounded-xl">
                    <Database size={18} />
                  </div>
                  <span className="text-[11px] text-slate-400 block font-bold">إجمالي السجلات المدونة</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-1.5 block">
                    {totalRecordsCount} <span className="text-xs text-slate-400 font-normal">وثيقة</span>
                  </span>
                  <div className="text-[10px] text-emerald-700 font-bold mt-2">📊 جرد فعلي كامل للمديرية</div>
                </div>

                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50 relative overflow-hidden">
                  <div className="absolute left-3 top-3 bg-blue-100 text-blue-800 p-2 rounded-xl">
                    <Archive size={18} />
                  </div>
                  <span className="text-[11px] text-slate-400 block font-bold">العلب الأرشيفية المجسدة</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-1.5 block">
                    {uniqueBoxes.size} <span className="text-xs text-slate-400 font-normal">علبة</span>
                  </span>
                  <div className="text-[10px] text-blue-700 font-bold mt-2">📦 ترقيم وربط فيزيائي ذكي</div>
                </div>

                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50 relative overflow-hidden">
                  <div className="absolute left-3 top-3 bg-amber-100 text-amber-800 p-2 rounded-xl">
                    <Users size={18} />
                  </div>
                  <span className="text-[11px] text-slate-400 block font-bold">طاقم المؤرشفين النشطين</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-1.5 block">
                    {accounts.length} <span className="text-xs text-slate-400 font-normal">موظفين</span>
                  </span>
                  <div className="text-[10px] text-amber-700 font-bold mt-2">👥 تعاون تزامني تراكمي آمن</div>
                </div>

                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50 relative overflow-hidden">
                  <div className="absolute left-3 top-3 bg-purple-100 text-purple-800 p-2 rounded-xl">
                    <FolderOpen size={18} />
                  </div>
                  <span className="text-[11px] text-slate-400 block font-bold">المصادر والمنتجين للملفات</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-1.5 block">
                    {uniqueProducers.size} <span className="text-xs text-slate-400 font-normal">مصلحة</span>
                  </span>
                  <div className="text-[10px] text-purple-700 font-bold mt-2">🏢 تغطية شاملة لقطاع ورقلة</div>
                </div>

              </div>

              {/* Progress and Contributions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Archivists Contributions (يجب ان يرى مسؤول المصلحة اعمال المؤرشفين) */}
                <div className="lg:col-span-7 border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <Users size={15} className="text-slate-800" />
                      مؤشرات تقييم أداء المؤرشفين
                    </h4>
                    <span className="text-[10px] text-slate-400">مجموع مدونات الإضافة</span>
                  </div>

                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {archivistStats.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد حسابات مؤرشفين بعد لحساب تقدمهم.</p>
                    ) : (
                      archivistStats.map((arch, idx) => (
                        <div key={arch.username} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-sm flex items-center justify-center border border-slate-200 select-none">
                                {arch.avatar}
                              </span>
                              <div>
                                <strong className="text-slate-850 font-bold">{arch.fullName}</strong>
                                <span className="text-[9px] text-slate-400 mr-1.5">({arch.role})</span>
                              </div>
                            </div>
                            <div className="text-[11px] font-mono font-bold text-slate-900">
                              {arch.createdCount} وثيقة <span className="text-slate-400 text-[10px] font-normal">({arch.ratio}%)</span>
                            </div>
                          </div>
                          
                          {/* Beautiful dynamic colored progress bar */}
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 flex">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                idx === 0 ? 'bg-emerald-600' :
                                idx === 1 ? 'bg-blue-600' :
                                idx === 2 ? 'bg-amber-500' :
                                idx === 3 ? 'bg-purple-600' : 'bg-slate-550'
                              }`}
                              style={{ width: `${arch.ratio}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 px-1 font-mono">
                            <span>آخر إدراج: {arch.lastActiveDate}</span>
                            <span> {arch.username}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Categories Filing Stats */}
                <div className="lg:col-span-5 border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <Layers size={15} className="text-emerald-700" />
                      منحنى التصنيف وحجم الملفات الجهوية
                    </h4>
                    <span className="text-[10px] text-slate-400">حجم الاسترجاع</span>
                  </div>

                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {sheetStats.map(sheet => (
                      <div key={sheet.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 text-[11.5px] truncate max-w-[160px]">{sheet.name}</span>
                          <span className="font-mono font-bold text-slate-500 text-[11px]">{sheet.count} صفوف ({sheet.ratio}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full rounded-full ${
                              sheet.color === 'emerald' ? 'bg-emerald-650' :
                              sheet.color === 'blue' ? 'bg-blue-600' :
                              sheet.color === 'amber' ? 'bg-amber-600' :
                              sheet.color === 'indigo' ? 'bg-indigo-600' :
                              sheet.color === 'purple' ? 'bg-purple-600' : 'bg-slate-500'
                            }`}
                            style={{ width: `${sheet.ratio}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Informative Security Advisory Banner */}
              <div className="bg-amber-50 border border-amber-200/60 p-5 rounded-2xl space-y-1">
                <h5 className="font-extrabold text-xs text-amber-950">💡 نصيحة المدير التنفيذي لسلامة الأرشيف الجهوي:</h5>
                <p className="text-[11px] text-amber-800/95 leading-relaxed">
                  البيانات الإحصائية أعلاه مستخرجة بصفة دورية وفورية من الكلاسور الداخلي للحاسوب. يرجى تذكير الموظفين بضرورة تصدير نسخهم بصيغة 
                  <strong className="text-slate-900"> (.json) </strong> أسبوعياً وتسخيرها لك، من أجل تعشيق هاته البيانات بمركز المزامنة الذكي لديكم ليعطيك جرد كامل مدمج وبدون أي نقصان.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: REGISTER & MANAGE ARCHIVISTS (وهو الوحيد المسؤول عن فتح حساب جديد للاي مؤرشف في المصلحة) */}
          {activeSubTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Add Archivist Form */}
                <div className="lg:col-span-5 border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-950 flex items-center gap-1.5">
                      <UserPlus size={16} className="text-slate-900" />
                      إنشاء وفتح حساب جديد لأحد المؤرشفين
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">تنسيق وتوظيف حساب رسمي لمؤرشف يعمل بالمصلحة</p>
                  </div>

                  <form onSubmit={handleCreateAccount} className="space-y-3.5 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">الاسم الكامل للمؤرشف (بالعربية):</label>
                      <input
                        type="text"
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-right"
                        placeholder="مثال: بلعربي عبد الرؤوف"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">اسم المستخدم (للدخول):</label>
                        <input
                          type="text"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-left font-mono"
                          placeholder="raouf_org"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">الصفة والوظيفة إدارياً:</label>
                        <input
                          type="text"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-right"
                          placeholder="مؤرشف تقني"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">المصلحة والقسم:</label>
                        <input
                          type="text"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-right"
                          value={newMatsaleh}
                          onChange={(e) => setNewMatsaleh(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">كلمة مرور الحساب:</label>
                        <input
                          type="password"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-right font-mono"
                          placeholder="الرمز السري"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-600 mb-1.5 text-center">اختر الرمز التعبيري للحساب:</span>
                      <div className="flex justify-center gap-1 bg-white p-1 border border-slate-200 rounded-xl">
                        {avatarsList.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewAvatar(emoji)}
                            className={`w-7.5 h-7.5 rounded-lg text-md flex items-center justify-center transition-all cursor-pointer ${
                              newAvatar === emoji
                                ? 'bg-slate-900 text-white scale-110 shadow-sm'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 text-amber-500 font-extrabold p-3 rounded-xl text-xs hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserPlus size={14} />
                      فتح الحساب الرسمي وتفعيل الموظف
                    </button>
                  </form>
                </div>

                {/* 2. Registered Archivists List with Admin Control */}
                <div className="lg:col-span-7 border border-slate-200 p-5 rounded-2xl bg-white space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs text-slate-900">حسابات طاقم المصلحة وأمن التراخيص</h4>
                    <p className="text-[10px] text-slate-400">التحكم في العمال، تعديل كلمات المرور، أو سحب تراخيص العمل.</p>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {accounts.map(user => {
                      const isSelf = user.username === 'admin';
                      const isEditing = editingUsername === user.username;
                      const userRecordsCount = records.filter(r => r.archivistName === user.fullName).length;

                      return (
                        <div key={user.username} className="p-3 bg-slate-50/50 rounded-xl border border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-2.5">
                              <span className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-lg border border-slate-200">
                                {user.avatar}
                              </span>
                              <div>
                                <h5 className="font-bold text-xs text-slate-900">
                                  {user.fullName} {isSelf && <span className="text-[9px] bg-amber-500 text-slate-950 px-1 py-0.5 rounded mr-1">رئيس المصلحة</span>}
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">{user.role} • {user.matsaleh}</p>
                                <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                                  اسم الولوج: {user.username} • مساهماته: <strong className="text-slate-800">{userRecordsCount} وثيقة</strong>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingUsername(null);
                                  } else {
                                    setEditingUsername(user.username);
                                    setChangedPassword(user.passwordHash);
                                  }
                                }}
                                className="p-1 px-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Key size={11} />
                                {isEditing ? 'إلغاء' : 'تغيير السر'}
                              </button>
                              
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteAccount(user.username)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                                  title="سحب ترخيص الحساب وحذفه نهائياً"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Password Edit Form */}
                          {isEditing && (
                            <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
                              <div className="flex-1">
                                <label className="block text-[8px] font-bold text-slate-400 mb-0.5">كلمة المرور الجديدة لهذا الحساب:</label>
                                <input
                                  type="text"
                                  className="w-full text-xs p-1.5 border border-slate-300 rounded-lg text-right font-mono focus:outline-slate-500"
                                  value={changedPassword}
                                  onChange={(e) => setChangedPassword(e.target.value)}
                                />
                              </div>
                              <button
                                onClick={() => handleChangePassword(user.username)}
                                className="p-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 self-end"
                              >
                                حفظ 🎯
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: OPERATION AUDIT & TRAILING LOGS */}
          {activeSubTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-950 text-xs leading-normal">
                🛡️ <strong>سجل الأنشطة الصارم:</strong> هذا التبويب يتيح لمدير المصلحة تتبع كافة مدونات الأرشفة الفردية التي قام بها المؤرشفون. تتم فهرسة الإدراج في هاته القائمة فورياً بالاسم، القسم، والتصنيف لكي يتسنى لك مراجعة وضمان صحة ومستوى التقدم داخل مصلحة ورقلة.
              </div>

              {/* Filters Panel */}
              <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                
                <div className="relative w-full sm:w-72">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="w-full text-xs p-2.5 pr-9 pl-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 text-right"
                    placeholder="ابحث بالعنوان، الكلاسور، أو العلبة..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-slate-400 shrink-0 font-bold">فرز بالأرشيفي:</span>
                  <select
                    className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 ml-auto sm:ml-0"
                    value={selectedArchivistFilter}
                    onChange={(e) => setSelectedArchivistFilter(e.target.value)}
                  >
                    <option value="all">كل طاقم المصلحة 👥</option>
                    {accounts.map(acc => (
                      <option key={acc.username} value={acc.fullName}>{acc.fullName} ({acc.username})</option>
                    ))}
                  </select>
                </div>
                
                <span className="text-[11px] text-slate-400 mr-auto font-mono">
                  مدونات مفلترة: <strong>{filteredAuditLogs.length}</strong> من أصل <strong>{auditLogs.length}</strong>
                </span>

              </div>

              {/* Log Ledger table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-250 text-slate-200 text-[11px] font-bold">
                        <th className="p-3 text-center w-12">مخطط</th>
                        <th className="p-3">اسم المستكشف / عنوان الملف</th>
                        <th className="p-3">ورقة الكلاسور</th>
                        <th className="p-3">رقم العلبة</th>
                        <th className="p-3">الأرشيفي المسؤول</th>
                        <th className="p-3">توقيت وجدولة الإدراج</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            لا توجد مدونات تدقيق مطابقة لبحثك العام ومحدداتك.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.slice(0, 100).map((log, idx) => {
                          const logTime = new Date(log.updatedAt || log.createdAt).toLocaleString('ar-DZ', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });

                          return (
                            <tr 
                              key={log.recordId + '-' + idx} 
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-3 text-center">
                                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                                  {log.updatedAt ? 'تحديث' : 'إدراج'}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-800 truncate max-w-xs" title={log.title}>
                                {log.title}
                              </td>
                              <td className="p-3 text-slate-500 font-bold">{log.sheetName}</td>
                              <td className="p-3 text-slate-500 font-mono font-bold">{log.boxNumber}</td>
                              <td className="p-3 font-bold text-slate-800">{log.archivistName}</td>
                              <td className="p-3 text-slate-400 font-mono text-[11px] tracking-tight">{logTime}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 shrink-0 text-left flex justify-between items-center px-6">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            💻 هيبة الدولة وحماية السيادة الرقمية للأرشيف الوطني • ورقلة
          </span>
          <button
            onClick={onClose}
            className="p-2 px-5 bg-slate-900 hover:bg-slate-850 text-amber-500 font-extrabold rounded-xl text-xs cursor-pointer transition-all active:scale-95"
          >
            إغلاق مركز الإدارة والعودة ❯
          </button>
        </div>

      </div>
    </div>
  );
};
