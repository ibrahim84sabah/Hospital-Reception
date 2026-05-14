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
}

export function LabReportTemplate({ patient, order, assignedDoctorName, title, arabicTitle, onPrint }: LabReportTemplateProps & { onPrint?: () => void }) {
  const age = 2024 - new Date(patient.dob).getFullYear();

  return (
    <div className="bg-white p-12 max-w-[850px] mx-auto shadow-2xl text-slate-800 font-sans leading-relaxed min-h-[1100px] relative border border-slate-200">
      {/* Print/Action Header - Hidden in Print */}
      {onPrint && (
        <div className="absolute top-4 right-4 flex gap-2 print:hidden no-print">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Print Report
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
        <h1 className="text-2xl font-black tracking-tight uppercase mb-2 text-slate-900">[Lab Name - اسم المختبر هنا]</h1>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>[البريد الإلكتروني/الموقع الإلكتروني]</span>
          <span>[رقم الهاتف: 123456789]</span>
          <span>[العنوان: الشارع، المدينة]</span>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className="mb-10 text-left">
        <h3 className="text-sm font-black border-b border-slate-200 pb-2 mb-4 text-slate-900 flex justify-between">
          <span>Patient Information</span>
          <span dir="rtl">معلومات المريض</span>
        </h3>
        <div className="grid grid-cols-2 gap-y-3 text-xs">
          <div className="flex justify-between px-2">
            <span className="font-bold text-slate-400">Name:</span>
            <span className="font-black italic uppercase">{patient.firstName} {patient.lastName}</span>
          </div>
          <div className="flex justify-between px-2 text-right" dir="rtl">
            <span className="font-bold text-slate-400">:اسم المريض</span>
            <span className="font-black italic">{patient.firstName} {patient.lastName}</span>
          </div>

          <div className="flex justify-between px-2">
            <span className="font-bold text-slate-400">Age:</span>
            <span className="font-black italic">{age} Years</span>
          </div>
          <div className="flex justify-between px-2 text-right" dir="rtl">
            <span className="font-bold text-slate-400">:العمر</span>
            <span className="font-black italic">{age} سنة</span>
          </div>

          <div className="flex justify-between px-2">
            <span className="font-bold text-slate-400">ID:</span>
            <span className="font-black italic font-mono uppercase">{patient.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between px-2 text-right" dir="rtl">
            <span className="font-bold text-slate-400">:(ID) رقم المعرف</span>
            <span className="font-black italic font-mono">{patient.id.slice(0, 8)}</span>
          </div>

          <div className="flex justify-between px-2">
            <span className="font-bold text-slate-400">Ref. Doctor:</span>
            <span className="font-black italic uppercase">{assignedDoctorName || 'Duty Physician'}</span>
          </div>
          <div className="flex justify-between px-2 text-right" dir="rtl">
            <span className="font-bold text-slate-400">:الطبيب المعالج</span>
            <span className="font-black italic">{assignedDoctorName || 'الطبيب المناوب'}</span>
          </div>
        </div>
      </div>

      {/* Laboratory Test Results Section */}
      <div className="mb-10 text-left">
        <h3 className="text-sm font-black border-b border-slate-200 pb-2 mb-4 text-slate-900 flex justify-between">
          <span>{title || 'Laboratory Test Results'}</span>
          <span dir="rtl">{arabicTitle || 'نتائج الفحوصات المخبرية'}</span>
        </h3>
        
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="py-3 px-4 text-left font-black text-slate-600 uppercase tracking-tighter">
                Test Name <br/> <span className="text-[9px] text-slate-400 font-bold" dir="rtl">اسم الفحص</span>
              </th>
              <th className="py-3 px-4 text-center font-black text-slate-600 uppercase tracking-tighter">
                Result <br/> <span className="text-[9px] text-slate-400 font-bold" dir="rtl">النتيجة</span>
              </th>
              <th className="py-3 px-4 text-center font-black text-slate-600 uppercase tracking-tighter">
                Unit <br/> <span className="text-[9px] text-slate-400 font-bold" dir="rtl">الوحدة</span>
              </th>
              <th className="py-3 px-4 text-right font-black text-slate-600 uppercase tracking-tighter">
                Normal Range <br/> <span className="text-[9px] text-slate-400 font-bold" dir="rtl">المعدل الطبيعي</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {order.testResults && Object.entries(order.testResults).map(([testName, val]) => {
              const meta = LAB_TESTS_METADATA.find(m => m.name === testName);
              return (
                <tr key={testName} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 font-black text-slate-800 uppercase italic">{testName}</td>
                  <td className="py-3 px-4 text-center font-black text-brand-blue text-sm">{val}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-500">{meta?.unit || '--'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-400">{meta?.range || '--'}</td>
                </tr>
              );
            })}
            {!order.testResults && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-bold italic uppercase tracking-widest">
                  {order.description}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comments Section */}
      <div className="mb-16">
        <h3 className="text-sm font-black border-b border-slate-200 pb-2 mb-4 text-slate-900 flex justify-between">
          <span>Comments</span>
          <span dir="rtl">الملاحظات</span>
        </h3>
        <div className="min-h-[60px] p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-600 italic leading-relaxed">
          {order.results || 'No specific observations noted.'}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end pt-10 border-t border-slate-100">
        <div className="text-[10px] text-slate-400 font-bold">
          Report Generated: {format(new Date(), 'yyyy-MM-dd HH:mm')}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black uppercase text-slate-800 italic" dir="rtl">توقيع المختبر والختم:</p>
          <div className="w-48 h-16 border-b border-slate-200 mt-2 ml-auto" />
        </div>
      </div>
    </div>
  );
}
