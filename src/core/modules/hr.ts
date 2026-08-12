import { Employee, AttendanceRecord, PayrollRecord, AdvancePayment } from '../../types';

/**
 * Core HR Module - Manages employee logs, timesheets, payroll runs, and wage advances.
 */
export const HRModule = {
  /**
   * Spawns a new employee profile.
   */
  createEmployee(
    name: string,
    phone: string,
    position: string,
    department: string,
    baseSalary: number
  ): Employee {
    return {
      id: 'emp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      phone,
      position,
      department,
      baseSalary,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };
  },

  /**
   * Creates an attendance (check-in/check-out) record.
   */
  createAttendance(
    employeeId: string,
    employeeName: string,
    date: string,
    checkInTime: string,
    status: AttendanceRecord['status'] = 'present',
    notes?: string
  ): AttendanceRecord {
    return {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      employeeId,
      employeeName,
      date,
      checkInTime,
      status,
      notes
    };
  },

  /**
   * Prepares a payroll calculation with base salary, bonuses, deductions, and advance payment balances.
   */
  calculatePayroll(
    employee: Employee,
    month: string,
    advancesAmount: number = 0,
    bonuses: number = 0,
    deductions: number = 0,
    notes?: string
  ): PayrollRecord {
    const baseSalary = employee.baseSalary;
    const netSalary = baseSalary + bonuses - deductions - advancesAmount;

    return {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      employeeId: employee.id,
      employeeName: employee.name,
      month,
      baseSalary,
      bonuses,
      deductions,
      advances: advancesAmount,
      netSalary: Math.max(0, netSalary),
      status: 'pending',
      notes
    };
  },

  /**
   * Logs a wage advance request.
   */
  createAdvancePayment(
    employeeId: string,
    employeeName: string,
    amount: number,
    reason: string
  ): AdvancePayment {
    return {
      id: 'adv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      employeeId,
      employeeName,
      amount,
      date: new Date().toISOString(),
      reason,
      status: 'pending'
    };
  }
};
