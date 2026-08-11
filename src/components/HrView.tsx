import React, { useState } from 'react';
import { Employee, AttendanceRecord, PayrollRecord, AdvancePayment, Expense, JournalEntry } from '../types';
import { Users, Clock, DollarSign, FileText, Plus, CheckCircle, XCircle, AlertCircle, Search, Trash2, Edit2, Calendar, Award } from 'lucide-react';

interface HrViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  payrolls: PayrollRecord[];
  setPayrolls: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  advances: AdvancePayment[];
  setAdvances: React.Dispatch<React.SetStateAction<AdvancePayment[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

export const HrView: React.FC<HrViewProps> = ({
  employees,
  setEmployees,
  attendance,
  setAttendance,
  payrolls,
  setPayrolls,
  advances,
  setAdvances,
  setExpenses,
  setJournalEntries,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'attendance' | 'advances' | 'payroll'>('employees');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    phone: '',
    position: '',
    department: '',
    baseSalary: 5000,
    joinDate: new Date().toISOString().split('T')[0],
  });

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: employees[0]?.id || '',
    amount: 500,
    reason: '',
  });

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    employeeId: employees[0]?.id || '',
    month: new Date().toISOString().slice(0, 7),
    bonuses: 0,
    deductions: 0,
    notes: '',
  });

  // Employee actions
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim()) return;

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, ...empForm } : emp));
    } else {
      const newEmp: Employee = {
        id: 'emp-' + Date.now(),
        ...empForm,
        status: 'active',
      };
      setEmployees(prev => [newEmp, ...prev]);
    }
    setShowEmpModal(false);
    setEditingEmployee(null);
    setEmpForm({ name: '', phone: '', position: '', department: '', baseSalary: 5000, joinDate: new Date().toISOString().split('T')[0] });
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // Attendance actions
  const markAttendance = (empId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = attendance.findIndex(a => a.employeeId === empId && a.date === today);

    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      date: today,
      checkInTime: status === 'absent' ? '' : '08:00',
      checkOutTime: status === 'absent' ? '' : '16:00',
      status,
    };

    if (existingIndex >= 0) {
      setAttendance(prev => prev.map((item, idx) => idx === existingIndex ? record : item));
    } else {
      setAttendance(prev => [record, ...prev]);
    }
  };

  // Advance actions
  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === advanceForm.employeeId);
    if (!emp) return;

    const newAdv: AdvancePayment = {
      id: 'adv-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      amount: Number(advanceForm.amount),
      date: new Date().toISOString().split('T')[0],
      reason: advanceForm.reason || 'سلفة مقدمة من الراتب',
      status: 'pending',
    };
    setAdvances(prev => [newAdv, ...prev]);
    setShowAdvanceModal(false);
    setAdvanceForm({ employeeId: employees[0]?.id || '', amount: 500, reason: '' });
  };

  // Payroll actions
  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === payrollForm.employeeId);
    if (!emp) return;

    // Calculate pending advances for this employee
    const empAdvances = advances
      .filter(a => a.employeeId === emp.id && a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);

    const bonuses = Number(payrollForm.bonuses) || 0;
    const deductions = Number(payrollForm.deductions) || 0;
    const netSalary = emp.baseSalary + bonuses - deductions - empAdvances;

    const newPay: PayrollRecord = {
      id: 'pay-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      month: payrollForm.month,
      baseSalary: emp.baseSalary,
      bonuses,
      deductions,
      advances: empAdvances,
      netSalary,
      status: 'paid',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: payrollForm.notes,
    };

    // Mark advances as deducted
    setAdvances(prev => prev.map(a => a.employeeId === emp.id && a.status === 'pending' ? { ...a, status: 'deducted' } : a));
    setPayrolls(prev => [newPay, ...prev]);

    // Create expense entry
    const newExpense: Expense = {
      id: 'exp-' + Date.now(),
      title: `راتب شهر ${payrollForm.month} للموظف: ${emp.name}`,
      category: 'رواتب',
      amount: netSalary,
      date: new Date().toISOString().split('T')[0],
      notes: `صرف الراتب الصافي (الأساسي: ${emp.baseSalary} + مكافآت: ${bonuses} - استقطاعات: ${deductions} - سلف: ${empAdvances})`,
    };
    setExpenses(prev => [newExpense, ...prev]);

    // Create Journal Entry
    const newJournal: JournalEntry = {
      id: 'jr-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'payroll',
      description: `صرف راتب الموظف ${emp.name} عن شهر ${payrollForm.month}`,
      debit: netSalary,
      credit: 0,
      account: 'مصروف الرواتب والأجور',
      referenceId: newPay.id,
    };
    setJournalEntries(prev => [newJournal, ...prev]);

    setShowPayrollModal(false);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['Cairo',sans-serif]" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-teal-300">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black">شؤون العاملين، الحضور والرواتب</h1>
            <p className="text-xs text-teal-200 mt-1">إدارة الموظفين، تتبع الحضور والانصراف، حساب الرواتب، والسلف بذكاء ودقة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          <button
            onClick={() => {
              setEditingEmployee(null);
              setEmpForm({ name: '', phone: '', position: '', department: '', baseSalary: 5000, joinDate: new Date().toISOString().split('T')[0] });
              setShowEmpModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-2xl border border-white/20 transition-all flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>طلب سلفة</span>
          </button>
          <button
            onClick={() => setShowPayrollModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-2xl shadow-lg transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>صرف راتب جديد</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'employees' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الموظفين ({employees.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'attendance' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>الحضور والانصراف</span>
        </button>
        <button
          onClick={() => setActiveSubTab('advances')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'advances' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>السلف والقروض</span>
        </button>
        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'payroll' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مسير الرواتب</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEES */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، المسمى الوظيفي، أو القسم..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-black text-lg border border-emerald-500/20">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{emp.name}</h3>
                        <p className="text-xs text-emerald-700 font-bold mt-0.5">{emp.position}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                      {emp.department}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">رقم الهاتف:</span>
                      <span className="font-mono font-bold text-slate-800">{emp.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الراتب الأساسي:</span>
                      <span className="font-mono font-black text-emerald-600">ج.م {emp.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">تاريخ التعيين:</span>
                      <span className="font-mono">{emp.joinDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setEditingEmployee(emp);
                      setEmpForm({
                        name: emp.name,
                        phone: emp.phone,
                        position: emp.position,
                        department: emp.department,
                        baseSalary: emp.baseSalary,
                        joinDate: emp.joinDate,
                      });
                      setShowEmpModal(true);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                    title="حذف الموظف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">تسجيل ومتابعة حضور اليوم</h3>
                <p className="text-xs text-slate-500 mt-0.5">سجل الحضور والغياب والانصراف اليومي لجميع العاملين</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>تاريخ اليوم: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                    <th className="py-3 px-4">الموظف</th>
                    <th className="py-3 px-4">القسم</th>
                    <th className="py-3 px-4">وقت الحضور</th>
                    <th className="py-3 px-4">وقت الانصراف</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">إجراءات التسجيل السريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {employees.map(emp => {
                    const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0]);
                    const status = todayAtt?.status || 'absent';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{emp.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{emp.department}</td>
                        <td className="py-3.5 px-4 font-mono">{todayAtt?.checkInTime || '-'}</td>
                        <td className="py-3.5 px-4 font-mono">{todayAtt?.checkOutTime || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            status === 'excused' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {status === 'present' ? 'حاضر' : status === 'late' ? 'متأخر' : status === 'excused' ? 'إذن' : 'غائب'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => markAttendance(emp.id, 'present')}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${status === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                            >
                              حاضر
                            </button>
                            <button
                              onClick={() => markAttendance(emp.id, 'late')}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'}`}
                            >
                              متأخر
                            </button>
                            <button
                              onClick={() => markAttendance(emp.id, 'absent')}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${status === 'absent' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'}`}
                            >
                              غائب
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADVANCES */}
      {activeSubTab === 'advances' && (
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">سلف وقروض العاملين</h3>
              <p className="text-xs text-slate-500 mt-0.5">متابعة السلف المقدمة والتي تخصم تلقائياً عند مسير الرواتب</p>
            </div>
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>طلب سلفة جديدة</span>
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50">
                  <th className="py-3.5 px-4">الموظف</th>
                  <th className="py-3.5 px-4">مبلغ السلفة</th>
                  <th className="py-3.5 px-4">تاريخ الطلب</th>
                  <th className="py-3.5 px-4">السبب</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {advances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">لا توجد سلف مسجلة حالياً.</td>
                  </tr>
                ) : (
                  advances.map(adv => (
                    <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{adv.employeeName}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-600">ج.م {adv.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono">{adv.date}</td>
                      <td className="py-3.5 px-4 text-slate-600">{adv.reason}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          adv.status === 'deducted' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {adv.status === 'deducted' ? 'تم الخصم مع الراتب' : 'معلقة (بانتظار الخصم)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setAdvances(prev => prev.filter(a => a.id !== adv.id))}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYROLL */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">مسير الرواتب والأجور الشهرية</h3>
              <p className="text-xs text-slate-500 mt-0.5">احتساب الصافي تلقائياً مع المكافآت والاستقطاعات وخصم السلف وإصدار القيود</p>
            </div>
            <button
              onClick={() => setShowPayrollModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>صرف راتب جديد</span>
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50">
                  <th className="py-3.5 px-4">الموظف</th>
                  <th className="py-3.5 px-4">الشهر</th>
                  <th className="py-3.5 px-4">الأساسي</th>
                  <th className="py-3.5 px-4">المكافآت</th>
                  <th className="py-3.5 px-4">الاستقطاعات</th>
                  <th className="py-3.5 px-4">السلف المخصومة</th>
                  <th className="py-3.5 px-4">الصافي المدفوع</th>
                  <th className="py-3.5 px-4">تاريخ الصرف</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">لا توجد سجلات رواتب مدفوعة حتى الآن.</td>
                  </tr>
                ) : (
                  payrolls.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{pay.employeeName}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{pay.month}</td>
                      <td className="py-3.5 px-4 font-mono">ج.م {pay.baseSalary.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-600">+ج.م {pay.bonuses.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">-ج.م {pay.deductions.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-600">-ج.م {pay.advances.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">ج.م {pay.netSalary.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono">{pay.paymentDate || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                          تم الصرف
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button onClick={() => setShowEmpModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف الثلاثي:</label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    required
                    value={empForm.phone}
                    onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الأساسي (ج.م):</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={empForm.baseSalary}
                    onChange={e => setEmpForm({ ...empForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي:</label>
                  <input
                    type="text"
                    required
                    value={empForm.position}
                    onChange={e => setEmpForm({ ...empForm, position: e.target.value })}
                    placeholder="مثال: كاشير / محاسب"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم:</label>
                  <input
                    type="text"
                    required
                    value={empForm.department}
                    onChange={e => setEmpForm({ ...empForm, department: e.target.value })}
                    placeholder="مثال: المبيعات / الإدارة"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التعيين:</label>
                <input
                  type="date"
                  required
                  value={empForm.joinDate}
                  onChange={e => setEmpForm({ ...empForm, joinDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ADVANCE */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">طلب سلفة جديدة للعامل</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الموظف:</label>
                <select
                  value={advanceForm.employeeId}
                  onChange={e => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ السلفة (ج.م):</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب السلفة:</label>
                <input
                  type="text"
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="مثال: ظروف طارئة / علاج / سفر"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  تسجيل السلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYROLL */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">إصدار وصرف الراتب الشهري</h3>
              <button onClick={() => setShowPayrollModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleGeneratePayroll} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الموظف:</label>
                <select
                  value={payrollForm.employeeId}
                  onChange={e => setPayrollForm({ ...payrollForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} (أساسي: {emp.baseSalary} ج.م)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عن شهر:</label>
                  <input
                    type="month"
                    required
                    value={payrollForm.month}
                    onChange={e => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المكافآت الحوافز (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={payrollForm.bonuses}
                    onChange={e => setPayrollForm({ ...payrollForm, bonuses: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاستقطاعات والخصومات (ج.م):</label>
                <input
                  type="number"
                  min="0"
                  value={payrollForm.deductions}
                  onChange={e => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الصرف:</label>
                <input
                  type="text"
                  value={payrollForm.notes}
                  onChange={e => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                  placeholder="مثال: تم الصرف نقداً من الصندوق الرئيسي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">💡 تنبيه محاسبي تلقائي:</p>
                <p className="text-[11px]">عند اعتماد الصرف، سيقوم النظام تلقائياً بإنشاء قيد محاسبي في دفاتر الأستاذ وتسجيله كمصروف تشغيلي في الخزينة.</p>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all"
                >
                  اعتماد وصرف الراتب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
