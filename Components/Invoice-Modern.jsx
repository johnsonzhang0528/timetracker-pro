import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Calendar, User, Mail, DollarSign, Clock, Eye, Plus, Send, Check, Trash2,
  Download, Filter, BarChart3, CheckCircle, Building, CreditCard, Edit3
} from 'lucide-react';

const InvoiceModern = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    selectedProject: '',
    selectedPeriod: { start: '', end: '' },
    clientName: '',
    clientEmail: '',
    description: '',
    additionalNotes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // 篩選狀態
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedProject, setSelectedProject] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 公司和客戶資訊
  const COMPANY_INFO = {
    name: '您的公司名稱',
    address: '台北市信義區信義路五段7號',
    phone: '02-2345-6789',
    email: 'contact@yourcompany.com'
  };

  const CLIENT_INFO = {
    name: '客戶公司名稱',
    address: '客戶地址'
  };

  const TAX_RATE = 0.05; // 5% 營業稅
  const PAYMENT_TERMS = '收到發票後 30 天內付款';

  useEffect(() => {
    // 載入時間記錄
    const savedEntries = localStorage.getItem('timetracker-entries');
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }

    // 載入專案
    const savedProjects = localStorage.getItem('timetracker-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    // 載入發票記錄
    const savedInvoices = localStorage.getItem('timetracker-invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  }, []);

  // 計算過濾後的時間記錄
  const filteredEntries = useMemo(() => {
    let filtered = [...timeEntries];

    // 專案篩選
    if (selectedProject !== 'all') {
      filtered = filtered.filter(entry => entry.project === selectedProject);
    }

    // 時間篩選
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          return [];
        }
        break;
      default: // 'all'
        return filtered;
    }

    return filtered.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [timeEntries, selectedProject, selectedPeriod, customStartDate, customEndDate]);

  // 獲取唯一專案列表
  const uniqueProjects = useMemo(() => {
    return [...new Set(timeEntries.map(entry => entry.project))];
  }, [timeEntries]);

  // 發票項目（已過濾的記錄）
  const invoiceEntries = filteredEntries;

  // 發票編號
  const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(invoices.length + 1).padStart(3, '0')}`;

  // 當前日期
  const currentDate = new Date().toLocaleDateString('zh-TW');

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  // 按專案分組
  const groupedByProject = useMemo(() => {
    const groups = {};
    invoiceEntries.forEach(entry => {
      if (!groups[entry.project]) {
        groups[entry.project] = {
          client: entry.client || '未指定客戶',
          entries: [],
          totalHours: 0,
          totalAmount: 0
        };
      }
      groups[entry.project].entries.push(entry);
      groups[entry.project].totalHours += entry.duration / 3600;
      // 計算金額，假設每個 entry 都有 rate 或使用專案的預設費率
      const entryRate = entry.rate || projects.find(p => p.name === entry.project)?.hourlyRate || 800;
      groups[entry.project].totalAmount += (entry.duration / 3600) * entryRate;
    });
    return groups;
  }, [invoiceEntries, projects]);

  // 計算總計
  const subtotal = useMemo(() => {
    return Object.values(groupedByProject).reduce((sum, project) => sum + project.totalAmount, 0);
  }, [groupedByProject]);

  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

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

  // 新增發票表單
  const renderCreateForm = () => {
    if (!showCreateForm) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">建立新發票</h3>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <span className="text-gray-500">×</span>
              </button>
            </div>
          </div>

          <form className="p-6 space-y-6">
            {/* 專案選擇 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-2 text-purple-600" />
                選擇專案
              </label>
              <select
                value={formData.selectedProject}
                onChange={(e) => setFormData({...formData, selectedProject: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              >
                <option value="">請選擇專案</option>
                {uniqueProjects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              {formErrors.project && (
                <p className="text-red-500 text-sm mt-1">{formErrors.project}</p>
              )}
            </div>

            {/* 時間範圍 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2 text-blue-600" />
                  開始日期
                </label>
                <input
                  type="date"
                  value={formData.selectedPeriod.start}
                  onChange={(e) => setFormData({
                    ...formData, 
                    selectedPeriod: {...formData.selectedPeriod, start: e.target.value}
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                {formErrors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2 text-blue-600" />
                  結束日期
                </label>
                <input
                  type="date"
                  value={formData.selectedPeriod.end}
                  onChange={(e) => setFormData({
                    ...formData, 
                    selectedPeriod: {...formData.selectedPeriod, end: e.target.value}
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                {formErrors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* 客戶資訊 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2 text-green-600" />
                  客戶名稱
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  placeholder="輸入客戶名稱"
                />
                {formErrors.clientName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.clientName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2 text-blue-600" />
                  客戶信箱
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="client@example.com"
                />
                {formErrors.clientEmail && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.clientEmail}</p>
                )}
              </div>
            </div>

            {/* 描述和備註 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Edit3 className="w-4 h-4 inline mr-2 text-purple-600" />
                發票描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 h-24 resize-none"
                placeholder="輸入發票描述（選填）"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2 text-gray-600" />
                備註事項
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 h-20 resize-none"
                placeholder="額外的備註事項（選填）"
              />
            </div>

            {formErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{formErrors.general}</p>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={generateInvoice}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                建立發票
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 驗證新增發票表單
  const validateCreateForm = () => {
    const errors = {};
    
    if (!formData.selectedProject) errors.project = '請選擇專案';
    if (!formData.selectedPeriod.start) errors.startDate = '請選擇開始日期';
    if (!formData.selectedPeriod.end) errors.endDate = '請選擇結束日期';
    if (!formData.clientName) errors.clientName = '請輸入客戶名稱';
    if (!formData.clientEmail) errors.clientEmail = '請輸入客戶信箱';
    if (formData.clientEmail && !/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      errors.clientEmail = '請輸入有效的信箱地址';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 生成發票
  const generateInvoice = () => {
    if (!validateCreateForm()) return;
    
    // 獲取指定期間和專案的工作記錄
    const startDate = new Date(formData.selectedPeriod.start);
    const endDate = new Date(formData.selectedPeriod.end);
    endDate.setHours(23, 59, 59, 999);

    const periodEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entry.project === formData.selectedProject && 
             entryDate >= startDate && 
             entryDate <= endDate;
    });
    
    if (periodEntries.length === 0) {
      setFormErrors({general: '選擇的期間和專案沒有工作記錄'});
      return;
    }

    const project = projects.find(p => p.name === formData.selectedProject);
    const hourlyRate = project?.hourlyRate || 800;
    const totalMinutes = periodEntries.reduce((total, entry) => total + entry.duration, 0);
    const totalHours = totalMinutes / 60;
    const subtotalAmount = totalHours * hourlyRate;
    const taxAmount = subtotalAmount * TAX_RATE;
    const totalAmount = subtotalAmount + taxAmount;

    const invoice = {
      id: Date.now(),
      invoiceNumber: `INV-${Date.now()}`,
      projectName: formData.selectedProject,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      description: formData.description,
      additionalNotes: formData.additionalNotes,
      period: formData.selectedPeriod,
      totalHours,
      hourlyRate,
      subtotal: subtotalAmount,
      taxAmount,
      totalAmount,
      entries: [...periodEntries],
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    const updatedInvoices = [invoice, ...invoices];
    localStorage.setItem('timetracker-invoices', JSON.stringify(updatedInvoices));
    setInvoices(updatedInvoices);

    // 重置表單
    setShowCreateForm(false);
    setFormData({
      selectedProject: '',
      selectedPeriod: { start: '', end: '' },
      clientName: '',
      clientEmail: '',
      description: '',
      additionalNotes: ''
    });
    setFormErrors({});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {renderCreateForm()}
      
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
          <p className="text-gray-600 ml-13">
            生成專業發票並發送給客戶 • 簡單快速
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>建立發票</span>
          </button>
          
          {invoiceEntries.length > 0 && (
            <>
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
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                <span>發送郵件</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {timeEntries.length === 0 ? (
        /* 完全空狀態 */
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/50 shadow-lg">
          <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3">
            無法生成發票
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
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
                發票預覽設定
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
                  <span className="text-sm font-medium text-green-700">預覽模式</span>
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/50 shadow-lg">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                所選期間沒有工作記錄
              </h3>
              <p className="text-gray-600">
                請調整時間範圍或專案篩選條件
              </p>
              <button
                onClick={() => {
                  setSelectedPeriod('all');
                  setSelectedProject('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                                {formatCurrency(projectData.entries[0]?.rate || projects.find(p => p.name === projectName)?.hourlyRate || 800)}
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

                {/* 費用總計區域 */}
                <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-6 border border-gray-200 mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-800">費用總計</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/80 rounded-lg p-4 text-center border border-white/60">
                      <div className="text-2xl font-bold text-gray-800">{formatCurrency(subtotal)}</div>
                      <div className="text-sm text-gray-600">小計</div>
                    </div>
                    
                    <div className="bg-white/80 rounded-lg p-4 text-center border border-white/60">
                      <div className="text-2xl font-bold text-amber-600">{formatCurrency(taxAmount)}</div>
                      <div className="text-sm text-gray-600">營業稅 ({(TAX_RATE * 100).toFixed(0)}%)</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-center text-white shadow-lg">
                      <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                      <div className="text-sm opacity-90">總計金額</div>
                    </div>
                  </div>
                </div>

                {/* 付款資訊和備註 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-gray-800">付款條件</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{PAYMENT_TERMS}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold text-gray-800">備註事項</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      感謝您選擇我們的服務！如有任何疑問，請隨時與我們聯絡。
                    </p>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>生成中...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        <span>下載 PDF</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSendEmail}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    <span>發送郵件</span>
                  </button>
                  
                  <button
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
                  >
                    <Eye className="w-5 h-5 mr-2 inline" />
                    <span>預覽列印</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 已建立的發票列表 */}
          {invoices.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">已建立的發票</h3>
                  <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">
                    {invoices.length} 張
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-mono text-sm font-bold text-blue-600">
                              {invoice.invoiceNumber}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-600' :
                              invoice.status === 'sent' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {invoice.status === 'paid' ? '已付款' : 
                               invoice.status === 'sent' ? '已發送' : '草稿'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>客戶：{invoice.clientName}</div>
                            <div>專案：{invoice.projectName}</div>
                            <div>時數：{invoice.totalHours.toFixed(1)}h</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end space-y-2">
                          <div className="text-xl font-bold text-gray-800">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(invoice.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoiceModern;
