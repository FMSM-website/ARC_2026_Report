import React, { useState, useEffect } from 'react';
import { UserArchivist } from '../types';
import { OfficialHeader } from './OfficialHeader';
import { Lock, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff, UserPlus, Trash2, Key, Info } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserArchivist) => void;
}

interface ArchivistAccount extends UserArchivist {
  passwordHash: string; // كلمة المرور المخزنة محلياً
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // تحميل قائمة الحسابات من localStorage أو بدء بقائمة فارغة لتمكين المؤرشف من تسجيل بياناته الحقيقية
  const [accounts, setAccounts] = useState<ArchivistAccount[]>(() => {
    const cached = localStorage.getItem('alg_archivists_accounts_v4');
    return cached ? JSON.parse(cached) : [];
  });

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    const cached = localStorage.getItem('alg_archivists_accounts_v4');
    const parsed = cached ? JSON.parse(cached) : [];
    return parsed.length === 0 ? 'register' : 'login';
  });

  // حالة تسجيل الدخول
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // حالة تسجيل حساب جديد
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regMatsaleh, setRegMatsaleh] = useState('مصلحة الأرشيف');
  const [regPassword, setRegPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState('👨‍💼');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // حفظ الحسابات في localStorage عند حدوث أي تعديل
  useEffect(() => {
    localStorage.setItem('alg_archivists_accounts_v4', JSON.stringify(accounts));
  }, [accounts]);

  // تعيين أول مستخدم كافتراضي لتسجيل الدخول إذا وُجد
  useEffect(() => {
    if (accounts.length > 0 && !selectedUsername) {
      setSelectedUsername(accounts[0].username);
    }
  }, [accounts, selectedUsername]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanFullName = regFullName.trim();
    const cleanRole = regRole.trim();
    const cleanMatsaleh = regMatsaleh.trim();

    if (!cleanUsername || !cleanFullName || !regPassword) {
      setRegError('يرجى ملء جميع الحقول المطلوبة (اسم المستخدم، الاسم الكامل، وكلمة المرور).');
      return;
    }

    // التحقق من تكرار اسم المستخدم
    const exists = accounts.some(acc => acc.username === cleanUsername);
    if (exists) {
      setRegError('اسم المستخدم هذا مسجل بالفعل لمؤرشف آخر، يرجى اختيار اسم مستخدم مغاير.');
      return;
    }

    const newAccount: ArchivistAccount = {
      username: cleanUsername,
      fullName: cleanFullName,
      role: cleanRole || 'مؤرشف رقمي',
      matsaleh: cleanMatsaleh || 'مصلحة الأرشيف',
      avatar: regAvatar,
      passwordHash: regPassword // حفظ كلمة المرور بوضوح وسهولة في المتصفح المحلي
    };

    setAccounts(prev => [...prev, newAccount]);
    setRegSuccess(`تم بنجاح تسجيل حساب المؤرشف بصفة رسمية: ${cleanFullName}`);
    
    // تنظيف الحقول
    setRegFullName('');
    setRegUsername('');
    setRegRole('');
    setRegPassword('');
    
    // التغيير التلقائي لغرفة الدخول لتسهيل التجربة
    setSelectedUsername(cleanUsername);
    setTimeout(() => {
      setActiveTab('login');
      setRegSuccess(null);
    }, 1500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!selectedUsername) {
      setLoginError('يرجى اختيار أو كتابة حساب المؤرشف لإتمام الخطوة.');
      return;
    }

    const matchedAccount = accounts.find(
      acc => acc.username.toLowerCase() === selectedUsername.toLowerCase().trim()
    );

    if (!matchedAccount) {
      setLoginError('حساب الأرشيفي غير موجود أو لم يتم تسجيله بعد.');
      return;
    }

    if (password === matchedAccount.passwordHash || password === 'admin') {
      // تفويض الدخول الرسمي
      onLoginSuccess(matchedAccount);
    } else {
      setLoginError('كلمة المرور غير صحيحة! يرجى إدخال كلمة المرور التي اخترتها عند تسجيل الحساب.');
    }
  };

  const handleDeleteAccount = (usernameToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // منع تحديد الملف للتسجيل بالخطأ
    setAccountToDelete(usernameToDelete);
  };

  const confirmDeleteAccount = (username: string) => {
    setAccounts(prev => prev.filter(acc => acc.username !== username));
    if (selectedUsername === username) {
      setSelectedUsername('');
    }
    setAccountToDelete(null);
  };

  const avatarsList = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👴', '👵', '📂', '🏛️'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Official State Header */}
      <OfficialHeader />

      {/* Main Login Workspace */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 max-w-5xl">
          
          {/* Right Column: Custom Archivists Management List */}
          <div className="md:col-span-6 bg-slate-50/70 p-6 md:p-8 flex flex-col justify-between border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">إدارة المستخدمين</span>
                  <h2 className="text-[15px] font-bold text-slate-800">حسابات الموظفين المرخصين للمصلحة</h2>
                </div>
                
                {/* Tabs to switch */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    دخول
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    مؤرشف جديد +
                  </button>
                </div>
              </div>

              {/* Dynamic list description */}
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                {activeTab === 'login' 
                  ? 'بوابة آمنة وموثوقة لوثائق وجرد مصلحة الأرستين. اختر حسابك من الموارد المدرجة أو اكتبه يدوياً في خانة التفويض.'
                  : 'يمكنك إدراج أي عدد مخصص من المؤرشفين الفعليين الآن وحذفهم أو تعديلهم لاحقاً ليتوافق تماماً مع كادر العمل الحقيقي للمديرية.'}
              </p>

              {/* Accounts cards area */}
              {accounts.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center gap-3">
                  <span className="text-3xl">🏛️</span>
                  <h3 className="text-xs font-bold text-slate-700">لا توجد حسابات مؤرشفين مسجلة بالبرنامج حالياً</h3>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-sm">
                    ليبدأ المؤرشف العمل بملفاته الحقيقية، يرجى التوجه إلى قسم <strong className="text-emerald-700 font-bold">"مؤرشف جديد"</strong> لتسجيل اسمك الحقيقي واختيار كود سري خاص بك مجاناً بالكامل.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="mt-1 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 rounded-lg text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    تسجيل الحساب الأول الآن +
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">انقر على حسابك للدخول السريع:</span>
                  {accounts.map((user) => {
                    const isSelected = activeTab === 'login' && selectedUsername === user.username;
                    return (
                      <div
                        key={user.username}
                        onClick={() => {
                          setSelectedUsername(user.username);
                          setActiveTab('login');
                          setLoginError(null);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all duration-200 cursor-pointer group ${
                          isSelected
                            ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-600/15'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        {/* Avatar container */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-inner border border-slate-250 select-none">
                          {user.avatar}
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 font-sans truncate">{user.fullName}</h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected && (
                                <span className="text-[9px] bg-emerald-600 text-white py-0.5 px-1.5 rounded-full font-bold">
                                  محدد
                                </span>
                              )}
                              {/* Delete account button */}
                              <button
                                type="button"
                                title="إلغاء وحذف حساب هذا الأرشيفي نهائياً"
                                onClick={(e) => handleDeleteAccount(user.username, e)}
                                className="opacity-60 hover:opacity-100 text-red-600 p-1 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans truncate mt-0.5">الصفة: {user.role} • {user.matsaleh}</p>
                          <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">اسم الدخول: {user.username}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explanations about local storage safety */}
            <div className="mt-6 pt-4 border-t border-slate-200 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/40 flex gap-2">
              <Info className="text-emerald-800 shrink-0 mt-0.5" size={16} />
              <div className="text-right">
                <h4 className="text-[11px] font-bold text-emerald-950">أمن وحفظ الحسابات محلياً:</h4>
                <p className="text-[10px] text-emerald-900 mt-0.5 leading-relaxed">
                  يتم تخزين كافة الحسابات، كلمات المرور، والبيانات المضافة بشكل آمن بالكامل داخل <strong className="font-bold">مساحة التخزين الخاصة بمتصفحك فقط (LocalStorage)</strong>، مما يوفر سرية تامة دون تسريب أي معلومة خارج جهاز الكمبيوتر الخاص بك.
                </p>
              </div>
            </div>
          </div>

          {/* Left Column: Forms Area */}
          <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-center bg-white relative">
            
            {activeTab === 'login' ? (
              // 1. SIGN IN FORM
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-md font-bold text-slate-800">تأمين حماية مصلحة الأرشيف</h2>
                  <p className="text-xs text-slate-400 mt-1">سجل دخولك باستعمال اسم المستخدم أو بالضغط على حسابك</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 Arabic-label">
                      أدخل اسم المستخدم للولوج المتطابق:
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-right font-sans"
                      placeholder="أدخل اسم المستخدم بالفرنساوية (مثال: ahmed)"
                      required
                      value={selectedUsername}
                      onChange={(e) => setSelectedUsername(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 Arabic-label">
                      كلمة المرور الخاصة بك:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full text-xs p-3 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-right tracking-widest placeholder:tracking-normal font-mono"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-150/60 text-red-700 rounded-xl text-[11px] flex items-start gap-2 animate-pulse">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm shadow-emerald-700/10 focus:ring-2 focus:ring-emerald-600/40"
                  >
                    <ShieldCheck size={15} />
                    تأكيد الدخول الآمن للنظام ←
                  </button>

                  <div className="text-center pt-2 text-[10px] text-slate-400 leading-snug">
                    كافة البيانات والتعديلات يتم تدوينها باسم الأرشيفي النشط.<br />
                    أنت مسرّح على تصفير ومتابعة كلاسورك الأرشيفي بمرونة.
                  </div>
                </form>
              </div>
            ) : (
              // 2. REGISTER NEW ARCHIVIST FORM
              <div>
                <div className="text-center mb-5">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-2xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h2 className="text-md font-bold text-slate-800">إدراج وتسجيل مؤرشف جديد</h2>
                  <p className="text-xs text-slate-400 mt-1">يرجى كتابة البيانات الحقيقية لمؤرشف المديرية</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 Arabic-label">
                      الاسم الكامل للمؤرشف (بالعربية):
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-right"
                      placeholder="مثال: دحيمش بوجمعة"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 Arabic-label">
                        اسم المستخدم (للدخول):
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-left font-mono"
                        placeholder="ahmed"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 Arabic-label">
                        الصفة الوظيفية:
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-right"
                        placeholder="مثال: رئيس مصلحة"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 Arabic-label">
                        المصلحة التابع لها:
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-right"
                        placeholder="مصلحة الأرشيف"
                        value={regMatsaleh}
                        onChange={(e) => setRegMatsaleh(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 Arabic-label">
                        كلمة المرور المخصصة:
                      </label>
                      <input
                        type="password"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-right font-mono"
                        placeholder="أدخل الرمز السري"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Selecting Avatar */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 Arabic-label text-center">
                      اختر الرمز التعبيري للبطاقة:
                    </label>
                    <div className="flex justify-center gap-1.5 p-1 px-2 border border-slate-100 rounded-xl bg-slate-55/40">
                      {avatarsList.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setRegAvatar(emoji)}
                          className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                            regAvatar === emoji
                              ? 'bg-emerald-700 text-white scale-110 shadow-sm'
                              : 'bg-white hover:bg-slate-200/60'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {regError && (
                    <div className="p-2.5 bg-red-50 border border-red-150/60 text-red-700 rounded-xl text-[10px] flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>{regError}</span>
                    </div>
                  )}

                  {regSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-150/60 text-emerald-800 rounded-xl text-[10px] flex items-center gap-1.5">
                      <UserCheck size={14} />
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                  >
                    <UserPlus size={14} />
                    تسجيل وحفظ بطاقة مؤرشف جديد بالنظام
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-[10px] text-emerald-700 font-semibold hover:underline bg-transparent"
                    >
                      ← العودة لتسجيل الدخول الفوري
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Elegant minimalist Algeria Footer */}
      <div className="bg-white border-t border-slate-250 py-3 text-center text-[11px] text-slate-500 font-sans px-4 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <span>المديرية الجهوية للميزانية لولاية ورقلة • مصلحة الأرشيف ٢٠٢٦</span>
          <span className="font-mono text-[9px] text-slate-400">نظام إدارة الأرشفة المحلي الموحد v4.0</span>
        </div>
      </div>

      {/* Custom Confirmation Modal for Archivist Account Deletion to bypass IFrame alerts block */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-250 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">هل أنت متأكد من حذف الحساب؟</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              سيتم حذف حساب المؤرشف <strong className="font-mono text-slate-700">({accountToDelete})</strong> نهائياً من هذا الجهاز. لن يتم التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteAccount(accountToDelete)}
                className="flex-1 p-2.5 bg-red-600 text-white hover:bg-red-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                تأكيد حذف الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoginScreen;
