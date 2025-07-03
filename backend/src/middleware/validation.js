import Joi from 'joi';

// 驗證中間件生成器
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: '資料驗證失敗',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// 認證相關驗證
export const authValidation = {
  register: validate(Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '請輸入有效的電子郵件',
      'any.required': '電子郵件為必填項目'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': '密碼至少需要 6 個字元',
      'any.required': '密碼為必填項目'
    }),
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': '姓名至少需要 2 個字元',
      'string.max': '姓名不能超過 50 個字元',
      'any.required': '姓名為必填項目'
    })
  })),
  
  login: validate(Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '請輸入有效的電子郵件',
      'any.required': '電子郵件為必填項目'
    }),
    password: Joi.string().required().messages({
      'any.required': '密碼為必填項目'
    })
  }))
};

// 專案相關驗證
export const projectValidation = {
  create: validate(Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': '專案名稱不能為空',
      'string.max': '專案名稱不能超過 100 個字元',
      'any.required': '專案名稱為必填項目'
    }),
    description: Joi.string().max(500).allow('').optional(),
    clientId: Joi.string().optional(),
    hourlyRate: Joi.number().min(0).optional(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    deadline: Joi.date().optional()
  })),
  
  update: validate(Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).allow('').optional(),
    clientId: Joi.string().optional(),
    hourlyRate: Joi.number().min(0).optional(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    status: Joi.string().valid('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED').optional(),
    deadline: Joi.date().optional()
  }))
};

// 客戶相關驗證
export const clientValidation = {
  create: validate(Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': '客戶名稱不能為空',
      'string.max': '客戶名稱不能超過 100 個字元',
      'any.required': '客戶名稱為必填項目'
    }),
    email: Joi.string().email().optional().allow(''),
    phone: Joi.string().max(20).optional().allow(''),
    company: Joi.string().max(100).optional().allow(''),
    address: Joi.string().max(200).optional().allow(''),
    taxNumber: Joi.string().max(20).optional().allow('')
  })),
  
  update: validate(Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    email: Joi.string().email().optional().allow(''),
    phone: Joi.string().max(20).optional().allow(''),
    company: Joi.string().max(100).optional().allow(''),
    address: Joi.string().max(200).optional().allow(''),
    taxNumber: Joi.string().max(20).optional().allow('')
  }))
};

// 時間追蹤相關驗證
export const timeEntryValidation = {
  create: validate(Joi.object({
    projectId: Joi.string().required().messages({
      'any.required': '專案 ID 為必填項目'
    }),
    description: Joi.string().max(500).optional().allow(''),
    startTime: Joi.date().required().messages({
      'any.required': '開始時間為必填項目'
    }),
    endTime: Joi.date().optional(),
    duration: Joi.number().min(0).optional(),
    hourlyRate: Joi.number().min(0).optional()
  })),
  
  update: validate(Joi.object({
    projectId: Joi.string().optional(),
    description: Joi.string().max(500).optional().allow(''),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional(),
    duration: Joi.number().min(0).optional(),
    hourlyRate: Joi.number().min(0).optional()
  }))
};

// 用戶設定相關驗證
export const userSettingsValidation = {
  update: validate(Joi.object({
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).optional(),
    hourlyRate: Joi.number().min(0).optional(),
    workingHoursStart: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    workingHoursEnd: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    notificationBreak: Joi.boolean().optional(),
    notificationOvertime: Joi.boolean().optional(),
    notificationInvoice: Joi.boolean().optional(),
    invoiceCompany: Joi.string().max(100).optional().allow(''),
    invoiceAddress: Joi.string().max(200).optional().allow(''),
    invoiceTax: Joi.string().max(20).optional().allow('')
  }))
};
