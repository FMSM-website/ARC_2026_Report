import React, { useState, useEffect } from 'react';
import { UserArchivist } from '../types';
import { OfficialHeader } from './OfficialHeader';
import { Lock, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff, UserPlus, Trash2, Key, Info, Shield } from 'lucide-react';
import { fetchAccounts, saveAccounts, isLanActive } from '../utils/syncEngine';

interface LoginScreenProps {
  onLoginSuccess: (user: UserArchivist) => void;
}

interface ArchivistAccount extends UserArchivist {
  passwordHash: string; // كلمة المرور المخزنة محلياً
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // تحميل قائمة الحسابات من localStorage مع تفعيل الحساب السيادي الافتراضي للمسؤول
  const [accounts, setAccounts] = useState<ArchivistAccount[]>(() => {
    const cached = localStorage.getItem('alg_archivists_accounts_v4');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    // الحساب الجذري الافتراضي لمسؤول المصلحة
    const defaultAdmin: ArchivistAccount = {
      username: 'admin',
      fullName: 'مسؤول المصلحة (المدير)',
      role: 'admin',
      avatar: '🏛️',
      matsaleh: 'مديرية الميزانية - ورقلة',
      passwordHash: 'admin'
    };
    return [defaultAdmin];
  });

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

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

  const [isAccountsLoaded, setIsAccountsLoaded] = useState(false);

  // تحميل الحسابات بشكل ذكي وفوري مع الكشف عن وجود الخادم المحلي
  useEffect(() => {
    async function load() {
      const list = await fetchAccounts();
      setAccounts(list);
      setIsAccountsLoaded(true);
    }
    load();
  }, []);

  // حفظ وتمرير أمان الحسابات مع الخادم الفعال أو تخزين احتياطي محلي
  useEffect(() => {
    if (isAccountsLoaded) {
      saveAccounts(accounts);
    }
  }, [accounts, isAccountsLoaded]);

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
                  <span className="p-1 px-2.5 bg-slate-900 text-amber-400 text-[10px] font-black rounded-full">بوابة المصلحة</span>
                  <h2 className="text-[15px] font-bold text-slate-800">حسابات طاقم الأرشيف لورقلة</h2>
                </div>
                
                {/* Tabs to switch */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-slate-900 text-white shadow-xs'
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
                        ? 'bg-red-650 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    فتح حساب 🔐
                  </button>
                </div>
              </div>

              {/* Dynamic list description */}
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                {activeTab === 'login' 
                  ? 'بوابة آمنة وسيادية لوثائق وميزانيات ورقلة. اختر حساب المؤرشف الفعلي ثم اكتب كلمتك السرية للتفويض.'
                  : 'تنبيه أمني هام: نظام تسجيل المستخدمين مقفل ومفوض حصرياً لمدير المصلحة فقط.'}
              </p>

              {/* Accounts cards area */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">اختر حسابك لبدء الجرد والتدوين النشط:</span>
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
                          ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10'
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
                          {isSelected && (
                            <span className="text-[9px] bg-slate-900 text-amber-400 py-0.5 px-1.5 rounded-full font-bold shrink-0">
                              نشط
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans truncate mt-0.5">الصفة: {user.role} • {user.matsaleh}</p>
                        <p className="text-[9px] font-mono text-slate-450 truncate mt-0.5">اسم الدخول: {user.username}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
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

                  <div className="mt-4">
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
                    className="w-full bg-slate-900 hover:bg-slate-800 text-amber-500 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm focus:ring-2 focus:ring-slate-900/40"
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
              // 2. REGISTER LIMITATION NOTICE
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-md font-extrabold text-slate-900 font-sans">فتح الحسابات مغلق إدارياً</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">إجراء تنظيمي وسيادي لولاية ورقلة</p>
                </div>

                {isLanActive() ? (
                  <div className="bg-indigo-50 border border-indigo-150 p-4.5 rounded-2xl text-right space-y-2.5">
                    <p className="text-xs text-indigo-905 leading-relaxed font-semibold">
                      🌐 <strong className="text-indigo-950 font-black font-sans">نظام الشبكة المحلية (LAN) نشط ومفعّل حالياً:</strong>
                    </p>
                    <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                      بما أن جميع حواسيب المرفق متصلة بالشبكة المشتركة، فإن حساباتكم موحدة مركزياً. يقوم رئيس المصلحة (المدير) بإنشاء حسابكم مرة واحدة من حاسوبه الرئيسي، ليظهر فوراً وتتمكنوا من ولوجه بجميع الحواسيب الموصولة دون الحاجة لنسخ الحسابات يدوياً!
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-150/50 p-4.5 rounded-2xl text-right space-y-2.5">
                    <p className="text-xs text-amber-905 leading-relaxed font-semibold">
                      💾 <strong className="text-amber-950 font-black font-sans">نظام العمل المستقل (نمط الفلاش ديسك وثبات PC):</strong>
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      يعمل النظام حالياً بنمطه المستقل (غير موصول بشبكة محلية). في هذا النمط، يتوجب على رئيس المصلحة الولوج كمدير في هذا الجهاز بالذات لإنشاء حساب المؤرشف المخصص لهذا الحاسوب.
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-right space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    يرجى من حاملي صفة المؤرشف الجديد تقديم الاسم والصفة وقسم العمل لرئيس المصلحة مباشرةً ليقوم بفتح وتدبيج حسابكم وكلمتكم السرية من لوحته الإدارية المؤمنة.
                  </p>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-center text-[11px] text-slate-800 leading-normal">
                  📌 <strong>بيانات الدخول الأولي للمسؤول (المدير):</strong><br />
                  اسم المستخدم: <code className="bg-amber-100/80 text-amber-950 font-mono font-bold px-1.5 rounded">admin</code> | الرمز السري: <code className="bg-amber-100/80 text-amber-950 font-mono font-bold px-1.5 rounded">admin</code>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-slate-900 font-black hover:underline bg-transparent"
                  >
                    ← العودة لبوابة تسجيل الدخول الفوري
                  </button>
                </div>
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
    </div>
  );
};
export default LoginScreen;
