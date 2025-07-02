import React, { useState, useEffect } from 'react';

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: '',
    end: ''
  });
  const [invoiceData, setInvoiceData] = useState({
    clientName: '',
    clientEmail: '',
    description: '',
    additionalNotes: ''
  });

  useEffect(() => {
    // 載入發票記錄
    const savedInvoices = localStorage.getItem('timetracker-invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }

    // 載入專案
    const savedProjects = localStorage.getItem('timetracker-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    // 載入時間記錄
    const savedEntries = localStorage.getItem('timetracker-entries');
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }
  }, []);

  // 儲存發票
  const saveInvoices = (updatedInvoices) => {
    localStorage.setItem('timetracker-invoices', JSON.stringify(updatedInvoices));
    setInvoices(updatedInvoices);
  };

  // 獲取指定期間的工作記錄
  const getEntriesForPeriod = () => {
    if (!selectedProject || !selectedPeriod.start || !selectedPeriod.end) {
      return [];
    }

    const startDate = new Date(selectedPeriod.start);
    const endDate = new Date(selectedPeriod.end);
    endDate.setHours(23, 59, 59); // 包含結束日期的整天

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entry.project === selectedProject && 
             entryDate >= startDate && 
             entryDate <= endDate;
    });
  };

  // 計算發票總額
  const calculateInvoiceTotal = () => {
    const entries = getEntriesForPeriod();
    const project = projects.find(p => p.name === selectedProject);
    const hourlyRate = project?.hourlyRate || 0;
    
    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return {
      totalHours,
      totalAmount: totalHours * hourlyRate,
      hourlyRate,
      entries
    };
  };

  // 生成發票
  const generateInvoice = () => {
    const { totalHours, totalAmount, hourlyRate, entries } = calculateInvoiceTotal();
    
    if (entries.length === 0) {
      alert('選擇的期間內沒有工作記錄');
      return;
    }

    const invoice = {
      id: Date.now(),
      invoiceNumber: `INV-${Date.now()}`,
      projectName: selectedProject,
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      description: invoiceData.description,
      additionalNotes: invoiceData.additionalNotes,
      period: selectedPeriod,
      totalHours,
      hourlyRate,
      totalAmount,
      entries: [...entries],
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    const updatedInvoices = [invoice, ...invoices];
    saveInvoices(updatedInvoices);

    // 重置表單
    setIsCreating(false);
    setSelectedProject('');
    setSelectedPeriod({ start: '', end: '' });
    setInvoiceData({
      clientName: '',
      clientEmail: '',
      description: '',
      additionalNotes: ''
    });
  };

  // 更新發票狀態
  const updateInvoiceStatus = (invoiceId, newStatus) => {
    const updatedInvoices = invoices.map(invoice =>
      invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
    );
    saveInvoices(updatedInvoices);
  };

  // 刪除發票
  const deleteInvoice = (invoiceId) => {
    if (confirm('確定要刪除這張發票嗎？')) {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
      saveInvoices(updatedInvoices);
    }
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { text: '草稿', class: 'status-draft' },
      sent: { text: '已發送', class: 'status-sent' },
      paid: { text: '已付款', class: 'status-paid' },
      overdue: { text: '逾期', class: 'status-overdue' }
    };
    return statusMap[status] || statusMap.draft;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>發票管理</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsCreating(true)}
        >
          + 生成發票
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{invoices.length}</div>
          <div className="stat-label">總發票數</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {invoices.filter(i => i.status === 'draft').length}
          </div>
          <div className="stat-label">草稿</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {invoices.filter(i => i.status === 'sent').length}
          </div>
          <div className="stat-label">已發送</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ${invoices.reduce((sum, i) => i.status === 'paid' ? sum + i.totalAmount : sum, 0).toFixed(0)}
          </div>
          <div className="stat-label">已收款</div>
        </div>
      </div>

      {/* 生成發票表單 */}
      {isCreating && (
        <div className="card">
          <div className="card-header">
            <h3>生成新發票</h3>
            <button 
              className="btn btn-text"
              onClick={() => setIsCreating(false)}
            >
              取消
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>選擇專案</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">請選擇專案</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>
                    {project.name} (${project.hourlyRate}/小時)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>開始日期</label>
              <input
                type="date"
                value={selectedPeriod.start}
                onChange={(e) => setSelectedPeriod({...selectedPeriod, start: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>結束日期</label>
              <input
                type="date"
                value={selectedPeriod.end}
                onChange={(e) => setSelectedPeriod({...selectedPeriod, end: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>客戶名稱</label>
              <input
                type="text"
                value={invoiceData.clientName}
                onChange={(e) => setInvoiceData({...invoiceData, clientName: e.target.value})}
                placeholder="客戶公司/姓名"
              />
            </div>

            <div className="form-group">
              <label>客戶信箱</label>
              <input
                type="email"
                value={invoiceData.clientEmail}
                onChange={(e) => setInvoiceData({...invoiceData, clientEmail: e.target.value})}
                placeholder="client@example.com"
              />
            </div>

            <div className="form-group full-width">
              <label>發票描述</label>
              <input
                type="text"
                value={invoiceData.description}
                onChange={(e) => setInvoiceData({...invoiceData, description: e.target.value})}
                placeholder="專案開發服務費用"
              />
            </div>

            <div className="form-group full-width">
              <label>額外備註</label>
              <textarea
                value={invoiceData.additionalNotes}
                onChange={(e) => setInvoiceData({...invoiceData, additionalNotes: e.target.value})}
                placeholder="付款條件、注意事項等..."
                rows="3"
              />
            </div>
          </div>

          {/* 預覽統計 */}
          {selectedProject && selectedPeriod.start && selectedPeriod.end && (
            <div className="invoice-preview">
              <h4>發票預覽</h4>
              <div className="preview-stats">
                <div className="preview-stat">
                  <span>工作時數:</span>
                  <span>{formatHours(calculateInvoiceTotal().totalHours)}</span>
                </div>
                <div className="preview-stat">
                  <span>時薪:</span>
                  <span>${calculateInvoiceTotal().hourlyRate}</span>
                </div>
                <div className="preview-stat">
                  <span>總金額:</span>
                  <span className="total-amount">${calculateInvoiceTotal().totalAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              className="btn btn-primary" 
              onClick={generateInvoice}
              disabled={!selectedProject || !selectedPeriod.start || !selectedPeriod.end}
            >
              生成發票
            </button>
          </div>
        </div>
      )}

      {/* 發票列表 */}
      <div className="invoices-grid">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>還沒有發票</h3>
            <p>點擊上方「生成發票」按鈕來建立第一張發票</p>
          </div>
        ) : (
          invoices.map(invoice => {
            const statusInfo = getStatusBadge(invoice.status);
            
            return (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div>
                    <h3>{invoice.invoiceNumber}</h3>
                    <p className="invoice-project">{invoice.projectName}</p>
                  </div>
                  <div className={`status-badge ${statusInfo.class}`}>
                    {statusInfo.text}
                  </div>
                </div>

                <div className="invoice-client">
                  <div className="client-info">
                    <strong>{invoice.clientName}</strong>
                    <span>{invoice.clientEmail}</span>
                  </div>
                </div>

                <div className="invoice-period">
                  <span>期間: {formatDate(invoice.period.start)} - {formatDate(invoice.period.end)}</span>
                </div>

                <div className="invoice-amount">
                  <div className="amount-breakdown">
                    <span>{formatHours(invoice.totalHours)} × ${invoice.hourlyRate}</span>
                    <strong>${invoice.totalAmount.toFixed(0)}</strong>
                  </div>
                </div>

                <div className="invoice-actions">
                  <select
                    value={invoice.status}
                    onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="draft">草稿</option>
                    <option value="sent">已發送</option>
                    <option value="paid">已付款</option>
                    <option value="overdue">逾期</option>
                  </select>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteInvoice(invoice.id)}
                  >
                    刪除
                  </button>
                </div>

                <div className="invoice-date">
                  建立於 {formatDate(invoice.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Invoice;
