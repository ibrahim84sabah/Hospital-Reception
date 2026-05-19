import React from 'react';
import { Patient, Visit, Order } from '../types';
import { LAB_TESTS_METADATA } from '../constants/labTests';
import { format } from 'date-fns';

interface LabReportTemplateProps {
  patient: Patient;
  visit: Visit;
  order: Order;
  assignedDoctorName?: string;
  title?: string;
  arabicTitle?: string;
  onPrint?: () => void;
}

export function LabReportTemplate({ patient, order, assignedDoctorName, title, arabicTitle, onPrint }: LabReportTemplateProps) {
  const age = 2024 - new Date(patient.dob).getFullYear();

  return (
    <div className="bg-white p-8 max-w-[850px] mx-auto shadow-sm text-slate-800 font-sans leading-relaxed min-h-[1100px] relative border border-slate-200">
      
      {/* Official Header */}
      <div className="mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-center mb-6">
          {/* Logo Area */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-blue-900 flex items-center justify-center relative overflow-hidden bg-white shadow-sm">
              <div className="absolute inset-0 border-2 border-blue-400 m-1 rounded-full flex flex-col items-center justify-center p-2">
                <span className="text-xl font-black text-red-600 tracking-tighter">L.A.D.</span>
                <div className="h-[1px] w-full bg-blue-900 my-0.5" />
                <span className="text-[6px] text-blue-900 font-bold uppercase text-center leading-[1] mt-0.5">Laboratory Accreditation Department</span>
              </div>
            </div>
          </div>

          {/* Ministry Info */}
          <div className="text-right space-y-0.5">
            <p className="text-lg font-black text-slate-950 leading-tight">وزارة التعليم العالي والبحث العلمي</p>
            <p className="text-base font-bold text-slate-900 leading-tight">جهاز الإشراف والتقويم العلمي</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">قسم اعتماد المختبرات</p>
          </div>
        </div>

        {/* University / Department Info */}
        <div className="flex justify-between items-center text-[10px] font-black text-slate-900 uppercase border-t border-slate-900 pt-2">
           <span>مختبر الاتصالات</span>
           <span>قسم هندسة المعلومات والاتصالات</span>
           <span>كلية هندسة المعلومات</span>
           <span>جامعة النهرين</span>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
          <p><span className="font-bold text-slate-500">Patient:</span> {patient.firstName} {patient.lastName}</p>
          <p className="text-right" dir="rtl"><span className="font-bold text-slate-500">اسم المريض:</span> {patient.firstName} {patient.lastName}</p>
          
          <p><span className="font-bold text-slate-500">Age/Gender:</span> {age} / {patient.gender}</p>
          <p className="text-right" dir="rtl"><span className="font-bold text-slate-500">العمر/الجنس:</span> {age} / {patient.gender === 'Male' ? 'ذكر' : 'أنثى'}</p>
        </div>
      </div>

      {/* Laboratory Test Results */}
      <div className="mb-8">
        <h3 className="text-sm font-black border-b border-slate-900 pb-2 mb-4 text-slate-900 uppercase text-center">
          {title || 'Report'}
        </h3>
        
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-2 text-left font-black uppercase">Test Name</th>
              <th className="py-2 text-center font-black uppercase">Result</th>
              <th className="py-2 text-center font-black uppercase">Unit</th>
              <th className="py-2 text-right font-black uppercase">Reference Range</th>
            </tr>
          </thead>
          <tbody>
            {order.testResults && Object.entries(order.testResults).map(([testName, val]) => {
              const meta = LAB_TESTS_METADATA.find(m => m.name === testName);
              return (
                <tr key={testName} className="border-b border-slate-200">
                  <td className="py-2 font-bold">{testName}</td>
                  <td className="py-2 text-center font-mono">{val}</td>
                  <td className="py-2 text-center font-bold text-slate-500">{meta?.unit || '--'}</td>
                  <td className="py-2 text-right font-bold text-slate-500">{meta?.range || '--'}</td>
                </tr>
              );
            })}
            {!order.testResults && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 font-bold italic">
                  {order.description}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Official Footer */}
      <div className="mt-16 pt-8 border-t border-slate-900">
        <div className="grid grid-cols-3 gap-8 text-center text-[10px] font-black text-slate-900 uppercase">
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-900 mb-2 h-8" />
            <p>مصادقة رئيس القسم</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-900 mb-2 h-8" />
            <p>مسؤول وحدة اعتماد المختبرات</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-900 mb-2 h-8" />
            <p>رئيس فريق التدقيق</p>
          </div>
        </div>
      </div>

      {onPrint && (
        <div className="absolute top-4 right-4 flex gap-2 print:hidden no-print">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Print
          </button>
        </div>
      )}
    </div>
  );
}
