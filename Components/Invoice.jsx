import React from 'react';
import { FileText } from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  generateInvoiceNumber, 
  calculateTotalEarnings 
} from '../Utils/helpers';
import { TAX_RATE, COMPANY_INFO, CLIENT_INFO, PAYMENT_TERMS } from '../Constants';

const Invoice = ({ timeEntries }) => {
  const totalEarnings = calculateTotalEarnings(timeEntries);
  const taxAmount = Math.round(totalEarnings * TAX_RATE);
  const finalTotal = totalEarnings + taxAmount;
  const invoiceNumber = generateInvoiceNumber();
  const currentDate = formatDate(new Date());

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">發票生成</h2>
      
      {timeEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">無法生成發票</h3>
          <p className="text-gray-600">需要有工作記錄才能生成發票</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          {/* 發票標題區域 */}
          <div className="border-b pb-4 sm:pb-6 mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">發票</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  發票編號: {invoiceNumber}
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  日期: {currentDate}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <h2 className="text-lg sm:text-xl font-bold">{COMPANY_INFO.name}</h2>
                <p className="text-sm sm:text-base text-gray-600">{COMPANY_INFO.address}</p>
                <p className="text-sm sm:text-base text-gray-600">電話: {COMPANY_INFO.phone}</p>
                <p className="text-sm sm:text-base text-gray-600">{COMPANY_INFO.email}</p>
              </div>
            </div>
          </div>

          {/* 客戶資訊 */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold mb-2">帳單寄送地址:</h3>
            <p className="text-sm sm:text-base text-gray-700">{CLIENT_INFO.name}</p>
            <p className="text-sm sm:text-base text-gray-700">{CLIENT_INFO.address}</p>
          </div>

          {/* 桌面版表格 */}
          <div className="hidden sm:block mb-4 sm:mb-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-sm sm:text-base">項目描述</th>
                  <th className="text-right py-3 text-sm sm:text-base">時數</th>
                  <th className="text-right py-3 text-sm sm:text-base">時薪</th>
                  <th className="text-right py-3 text-sm sm:text-base">金額</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.slice(0, 3).map(entry => (
                  <tr key={entry.id} className="border-b border-gray-200">
                    <td className="py-3 text-sm sm:text-base">
                      {entry.project} - {entry.client}
                    </td>
                    <td className="text-right py-3 text-sm sm:text-base">
                      {(entry.duration / 3600).toFixed(1)}h
                    </td>
                    <td className="text-right py-3 text-sm sm:text-base">
                      {formatCurrency(Math.round(entry.amount / (entry.duration / 3600)))}
                    </td>
                    <td className="text-right py-3 text-sm sm:text-base">
                      {formatCurrency(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 手機版卡片 */}
          <div className="block sm:hidden mb-4 space-y-3">
            {timeEntries.slice(0, 3).map(entry => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                <div className="font-semibold text-sm mb-2">
                  {entry.project} - {entry.client}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>時數: {(entry.duration / 3600).toFixed(1)}h</div>
                  <div>時薪: {formatCurrency(Math.round(entry.amount / (entry.duration / 3600)))}</div>
                  <div className="col-span-2 font-bold text-right">
                    金額: {formatCurrency(entry.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 總計區域 */}
          <div className="flex justify-end">
            <div className="text-right w-full sm:w-auto">
              <div className="flex justify-between sm:w-48 py-2 text-sm sm:text-base">
                <span>小計:</span>
                <span>{formatCurrency(totalEarnings)}</span>
              </div>
              <div className="flex justify-between sm:w-48 py-2 text-sm sm:text-base">
                <span>營業稅 ({(TAX_RATE * 100).toFixed(0)}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between sm:w-48 py-2 border-t-2 border-gray-300 font-bold text-base sm:text-lg">
                <span>總計:</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* 付款條件 */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">付款條件: {PAYMENT_TERMS}</p>
            <p className="text-xs sm:text-sm text-gray-600">謝謝您的合作！</p>
          </div>

          {/* 操作按鈕 */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => alert('PDF 下載功能開發中')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base"
            >
              下載 PDF
            </button>
            <button 
              onClick={() => alert('郵件功能開發中')}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base"
            >
              發送郵件
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;