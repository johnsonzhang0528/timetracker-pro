import React, { useState, useMemo } from 'react';
import { FileText, Download, Mail, Calendar, Filter, User, Building, Eye, Send, CreditCard, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  generateInvoiceNumber, 
  calculateTotalEarnings 
} from '../Utils/helpers';
import { TAX_RATE, COMPANY_INFO, CLIENT_INFO, PAYMENT_TERMS } from '../Constants';

const Invoice = ({ timeEntries }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedProject, setSelectedProject] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 過濾發票項目
  const invoiceEntries = useMemo(() => {
    let filtered = [...timeEntries];
    const now = new Date();
    
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      filtered = filtered.filter(entry => 
        entry.date >= customStartDate && entry.date <= customEndDate
      );
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.date) >= monthAgo);
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.date) >= weekAgo);
    }
    
    if (selectedProject !== 'all') {
      filtered = filtered.filter(entry => entry.project === selectedProject);
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [timeEntries, selectedPeriod, selectedProject, customStartDate, customEndDate]);

  // 計算發票總額
  const subtotal = calculateTotalEarnings(invoiceEntries);
  const taxAmount = Math.round(subtotal * TAX_RATE);
  const totalAmount = subtotal + taxAmount;
  const invoiceNumber = generateInvoiceNumber();
  const currentDate = formatDate(new Date());

  // 獲取唯一專案列表
  const uniqueProjects = [...new Set(timeEntries.map(entry => entry.project))];

  // 按專案分組
  const groupedByProject = useMemo(() => {
    const groups = {};
    invoiceEntries.forEach(entry => {
      if (!groups[entry.project]) {
        groups[entry.project] = {
          client: entry.client,
          entries: [],
          totalHours: 0,
          totalAmount: 0
        };
      }
      groups[entry.project].entries.push(entry);
      groups[entry.project].totalHours += entry.duration / 3600;
      groups[entry.project].totalAmount += entry.amount;
    });
    return groups;
  }, [invoiceEntries]);

  // 處理PDF下載
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // 這裡可以整合 PDF 生成庫
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模擬生成過程
      alert('PDF 下載功能開發中\n\n將整合 jsPDF 或 Puppeteer 來生成專業發票');
    } catch (error) {
      alert('PDF 生成失敗：' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 處理郵件發送
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`發票 ${invoiceNumber} - ${COMPANY_INFO.name}`);
    const body = encodeURIComponent(`親愛的客戶，\n\n附件為您的發票 ${invoiceNumber}，金額為 ${formatCurrency(totalAmount)}。\n\n付款條件：${PAYMENT_TERMS}\n\n謝謝！\n\n${COMPANY_INFO.name}`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-20 md:pb-8">
      
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              發票生成
            </h2>
          </div>
          <p className="text-gray-600 text-responsive ml-13">
            生成專業發票並發送給客戶 • 簡單快速</p>
        </div>
        
        {invoiceEntries.length > 0 && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span>下載 PDF</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleSendEmail}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              <span>發送郵件</span>
            </button>
          </div>
        )}
      </div>
      
      {invoiceEntries.length === 0 && timeEntries.length === 0 ? (
        /* 完全空狀態 */
        <div className="card spacing-responsive text-center py-12">
          <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3">
            無法生成發票
          </h3>
          <p className="text-gray-600 text-responsive mb-6 max-w-md mx-auto">
            需要有工作記錄才能生成發票，請先開始計時工作
          </p>
        </div>
      ) : (
        <>
          {/* 發票設定區域 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                發票設定
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 時間範圍 */}
              <div className="bg-white/80 rounded-xl p-4 border border-white/60">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2 text-blue-600" />
                  計費期間
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                >
                  <option value="week">最近 7 天</option>
                  <option value="month">最近 30 天</option>
                  <option value="all">全部記錄</option>
                  <option value="custom">自訂範圍</option>
                </select>
              </div>
              
              {/* 專案篩選 */}
              <div className="bg-white/80 rounded-xl p-4 border border-white/60">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <BarChart3 className="w-4 h-4 inline mr-2 text-purple-600" />
                  專案篩選
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                >
                  <option value="all">所有專案</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 發票號碼 */}
              <div className="bg-white/80 rounded-xl p-4 border border-white/60">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="w-4 h-4 inline mr-2 text-green-600" />
                  發票號碼
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono"
                  readOnly
                />
              </div>
              
              {/* 發票狀態 */}
              <div className="bg-white/80 rounded-xl p-4 border border-white/60">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <CheckCircle className="w-4 h-4 inline mr-2 text-emerald-600" />
                  狀態
                </label>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">準備就緒</span>
                </div>
              </div>
            </div>

            {/* 自訂日期範圍 */}
            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-200">
                <div className="bg-white/80 rounded-xl p-4 border border-white/60">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                  />
                </div>
                <div className="bg-white/80 rounded-xl p-4 border border-white/60">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    結束日期
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            )}
            
            {/* 發票摘要統計 */}
            {invoiceEntries.length > 0 && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 rounded-xl p-4 text-center border border-white/60">
                    <div className="text-2xl font-bold text-blue-600">{invoiceEntries.length}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      工作記錄
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 text-center border border-white/60">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(invoiceEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600)}h
                    </div>
                    <div className="text-sm text-gray-600">總時數</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 text-center border border-white/60">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(subtotal)}</div>
                    <div className="text-sm text-gray-600">小計</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 text-center border border-white/60">
                    <div className="text-2xl font-bold text-indigo-600">{formatCurrency(totalAmount)}</div>
                    <div className="text-sm text-gray-600">總計</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {invoiceEntries.length === 0 ? (
            /* 篩選後無數據 */
            <div className="card spacing-responsive text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                所選期間沒有工作記錄
              </h3>
              <p className="text-gray-600 text-responsive">
                請調整時間範圍或專案篩選條件
              </p>
              <button
                onClick={() => {
                  setSelectedPeriod('all');
                  setSelectedProject('all');
                }}
                className="btn btn-secondary mt-4"
              >
                重置篩選
              </button>
            </div>
          ) : (
            /* 發票預覽 */
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              
              {/* 發票標題區域 */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-6 lg:space-y-0">
                  
                  {/* 發票資訊 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                        發票
                      </h1>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">發票編號</div>
                        <div className="font-mono text-sm font-bold text-blue-600">{invoiceNumber}</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 border border-green-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">開立日期</div>
                        <div className="text-sm font-semibold text-gray-800">{currentDate}</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">到期日</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 公司資訊 */}
                  <div className="lg:text-right bg-white/80 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start space-x-2 lg:justify-end mb-3">
                      <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {COMPANY_INFO.name}
                        </h2>
                      </div>
                    </div>
                    <div className="text-gray-600 space-y-1 text-sm">
                      <p>{COMPANY_INFO.address}</p>
                      <p>電話: {COMPANY_INFO.phone}</p>
                      <p>信箱: {COMPANY_INFO.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* 客戶資訊 */}
                <div className="mb-8">
                  <div className="flex items-start space-x-2 mb-4">
                    <User className="w-5 h-5 text-green-600 mt-0.5" />
                    <h3 className="text-lg font-bold text-gray-800">帳單寄送地址</h3>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <p className="font-semibold text-gray-800">{CLIENT_INFO.name}</p>
                    <p className="text-gray-600">{CLIENT_INFO.address}</p>
                  </div>
                </div>

                {/* 發票項目 - 重新設計 */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-800">服務項目詳細</h3>
                  </div>
                  
                  {/* 項目卡片式設計 */}
                  <div className="space-y-4">
                    {Object.entries(groupedByProject).map(([projectName, projectData]) => (
                      <div key={projectName} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                          
                          {/* 專案資訊 */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <h4 className="text-lg font-bold text-gray-800">{projectName}</h4>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <User className="w-4 h-4" />
                              <span className="text-sm">{projectData.client}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {projectData.entries.length} 筆工作記錄
                            </div>
                          </div>
                          
                          {/* 統計數據 */}
                          <div className="grid grid-cols-3 gap-4 lg:gap-6">
                            <div className="text-center bg-white/80 rounded-lg p-3 border border-white/60">
                              <div className="text-lg font-bold text-blue-600">
                                {projectData.totalHours.toFixed(1)}h
                              </div>
                              <div className="text-xs text-gray-500">工作時數</div>
                            </div>
                            <div className="text-center bg-white/80 rounded-lg p-3 border border-white/60">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(projectData.entries[0]?.rate || 0)}
                              </div>
                              <div className="text-xs text-gray-500">時薪</div>
                            </div>
                            <div className="text-center bg-white/80 rounded-lg p-3 border border-white/60">
                              <div className="text-lg font-bold text-purple-600">
                                {formatCurrency(projectData.totalAmount)}
                              </div>
                              <div className="text-xs text-gray-500">小計</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 工作記錄明細 */}
                        <div className="mt-4 pt-4 border-t border-white/60">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {projectData.entries.slice(0, 6).map((entry, index) => (
                              <div key={index} className="bg-white/60 rounded-lg p-3 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{formatDate(entry.date)}</span>
                                  <span className="font-semibold text-gray-800">
                                    {(entry.duration / 3600).toFixed(1)}h
                                  </span>
                                </div>
                              </div>
                            ))}
                            {projectData.entries.length > 6 && (
                              <div className="bg-white/60 rounded-lg p-3 text-sm text-center text-gray-500">
                                +{projectData.entries.length - 6} 更多...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                            <div className="text-sm text-gray-600">
                              {projectData.client} • {projectData.entries.length} 次工作
                            </div>
                          </td>
                          <td className="text-center py-4 px-2 font-mono">
                            {projectData.totalHours.toFixed(1)}h
                          </td>
                          <td className="text-right py-4 px-2">
                            {formatCurrency(Math.round(projectData.totalAmount / projectData.totalHours))}
                          </td>
                          <td className="text-right py-4 px-2 font-bold">
                            {formatCurrency(projectData.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 平板/手機版卡片 */}
                <div className="lg:hidden space-y-4">
                  {Object.entries(groupedByProject).map(([projectName, projectData]) => (
                    <div key={projectName} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="font-semibold text-gray-800 mb-2">
                        {projectName}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {projectData.client} • {projectData.entries.length} 次工作
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">工作時數:</span>
                          <div className="font-mono font-semibold">
                            {projectData.totalHours.toFixed(1)}h
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">平均時薪:</span>
                          <div className="font-semibold">
                            {formatCurrency(Math.round(projectData.totalAmount / projectData.totalHours))}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">小計:</span>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(projectData.totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 總計區域 */}
              <div className="border-t-2 border-gray-300 pt-6">
                <div className="flex justify-end">
                  <div className="w-full sm:w-80 space-y-3">
                    
                    <div className="flex justify-between items-center py-2 text-gray-700">
                      <span className="font-medium">小計:</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 text-gray-700">
                      <span className="font-medium">
                        營業稅 ({(TAX_RATE * 100).toFixed(0)}%):
                      </span>
                      <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                      <span className="text-xl font-bold text-gray-800">總計:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 付款條件和備註 */}
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">付款條件:</h4>
                  <p className="text-gray-600 text-responsive">{PAYMENT_TERMS}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">備註:</h4>
                  <p className="text-gray-600 text-responsive">
                    感謝您選擇我們的服務！如有任何問題，請隨時與我們聯絡。
                  </p>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="btn btn-primary w-full sm:flex-1 group"
                  >
                    <Download className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-spin' : 'group-hover:scale-110'}`} />
                    <span>{isGenerating ? '生成中...' : '下載 PDF'}</span>
                  </button>
                  
                  <button 
                    onClick={handleSendEmail}
                    className="btn btn-success w-full sm:flex-1 group"
                  >
                    <Mail className="w-5 h-5 mr-2 group-hover:scale-110" />
                    <span>發送郵件</span>
                  </button>
                </div>
                
                {/* 發票摘要 (移動端) */}
                <div className="sm:hidden mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 mb-1">發票總額</div>
                    <div className="text-2xl font-bold text-blue-800">
                      {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      包含 {(TAX_RATE * 100).toFixed(0)}% 營業稅
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 移動端提示 */}
          <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-700">
              💡 <strong>小提示:</strong> 調整篩選條件來選擇要開立發票的工作記錄
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Invoice;
