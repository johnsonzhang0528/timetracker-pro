import React from 'react';
import { DollarSign, Clock, BarChart3 } from 'lucide-react';
import { formatTime, formatCurrency, calculateTotalEarnings, calculateTotalHours } from '../Utils/helpers';

const Reports = ({ timeEntries }) => {
  const totalEarnings = calculateTotalEarnings(timeEntries);
  const totalHours = calculateTotalHours(timeEntries);
  const averageHourlyRate = totalHours > 0 ? Math.round(totalEarnings / totalHours) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">報表分析</h2>
      
      {timeEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">還沒有數據</h3>
          <p className="text-gray-600">開始計時工作來查看您的收入統計</p>
        </div>
      ) : (
        <>
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 總收入 */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">總收入</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(totalEarnings)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
            
            {/* 總工作時數 */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">總工作時數</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {totalHours.toFixed(1)} 小時
                  </p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
            
            {/* 平均時薪 */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">平均時薪</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {formatCurrency(averageHourlyRate)}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* 工作記錄列表 */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold mb-4">工作記錄</h3>
            <div className="space-y-3">
              {timeEntries.map(entry => (
                <div 
                  key={entry.id} 
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 border border-gray-200 rounded-lg space-y-2 sm:space-y-0"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm sm:text-base">{entry.project}</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {entry.client} • {entry.date}
                    </div>
                  </div>
                  <div className="flex justify-between sm:block sm:text-right">
                    <div className="font-bold text-green-600 text-sm sm:text-base">
                      {formatCurrency(entry.amount)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {formatTime(entry.duration)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;