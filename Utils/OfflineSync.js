// TimeTracker Pro 離線同步工具
import { log } from '../config/api';
import { SYNC_CONSTANTS } from '../Constants';

// 離線操作狀態
export const SYNC_STATUS = {
  IDLE: 'idle',           // 沒有需要同步的資料
  PENDING: 'pending',     // 有待同步的資料
  SYNCING: 'syncing',     // 正在同步
  SUCCESS: 'success',     // 同步成功
  ERROR: 'error',         // 同步失敗
  CONFLICT: 'conflict'    // 資料衝突
};

// 操作類型
export const OPERATION_TYPE = {
  CREATE: 'create',       // 創建
  UPDATE: 'update',       // 更新
  DELETE: 'delete'        // 刪除
};

// 資料類型
export const DATA_TYPE = {
  PROJECT: 'project',     // 專案
  TIME_ENTRY: 'timeEntry',// 時間記錄
  USER_SETTING: 'userSetting', // 用戶設定
  CLIENT: 'client'        // 客戶
};

// 離線操作存儲鍵
const OFFLINE_KEYS = {
  OPERATIONS: SYNC_CONSTANTS.STORAGE_KEYS.OFFLINE_OPERATIONS,
  LAST_SYNC: SYNC_CONSTANTS.STORAGE_KEYS.LAST_SYNC,
  SYNC_STATUS: SYNC_CONSTANTS.STORAGE_KEYS.SYNC_STATUS
};

// 離線同步控制器
export class OfflineSyncController {
  constructor() {
    this.syncListeners = [];
    this.conflictResolver = this.defaultConflictResolver;
    this.initialized = false;
    this.currentConflicts = [];
  }

  // 初始化
  initialize() {
    if (this.initialized) return;
    
    // 檢查離線操作佇列
    this.operations = this.loadOperations();
    this.lastSyncTime = this.loadLastSyncTime();
    this.syncStatus = this.loadSyncStatus();
    
    // 如果有待同步的操作，設置狀態為待同步
    if (this.operations.length > 0) {
      this.setSyncStatus(SYNC_STATUS.PENDING);
    }
    
    this.initialized = true;
    log.info('離線同步控制器初始化完成', {
      operationsCount: this.operations.length,
      lastSyncTime: this.lastSyncTime,
      syncStatus: this.syncStatus
    });
  }

  // 設置衝突解決器
  setConflictResolver(resolver) {
    this.conflictResolver = resolver;
  }

  // 預設衝突解決策略 (以本地為主)
  defaultConflictResolver(localData, serverData, type) {
    log.info('使用預設衝突解決策略', { type });
    return localData; // 預設以本地為主
  }

  // 添加同步監聽器
  addSyncListener(listener) {
    this.syncListeners.push(listener);
  }

  // 移除同步監聽器
  removeSyncListener(listener) {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  // 通知同步狀態變化
  notifySyncListeners(status, data) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status, data);
      } catch (error) {
        log.error('同步監聽器執行錯誤', error);
      }
    });
  }

  // 設置同步狀態
  setSyncStatus(status) {
    this.syncStatus = status;
    localStorage.setItem(OFFLINE_KEYS.SYNC_STATUS, status);
    this.notifySyncListeners(status);
    log.info('同步狀態已更新', { status });
  }

  // 獲取同步狀態
  getSyncStatus() {
    return this.syncStatus;
  }

  // 加載上次同步時間
  loadLastSyncTime() {
    const lastSync = localStorage.getItem(OFFLINE_KEYS.LAST_SYNC);
    return lastSync ? new Date(lastSync) : null;
  }

  // 加載同步狀態
  loadSyncStatus() {
    return localStorage.getItem(OFFLINE_KEYS.SYNC_STATUS) || SYNC_STATUS.IDLE;
  }

  // 加載離線操作
  loadOperations() {
    try {
      const operations = localStorage.getItem(OFFLINE_KEYS.OPERATIONS);
      return operations ? JSON.parse(operations) : [];
    } catch (error) {
      log.error('載入離線操作失敗', error);
      return [];
    }
  }

  // 保存離線操作
  saveOperations(operations) {
    localStorage.setItem(OFFLINE_KEYS.OPERATIONS, JSON.stringify(operations));
    this.operations = operations;
  }

  // 記錄離線操作
  recordOperation(type, dataType, data, id = null) {
    this.initialize();
    
    const operation = {
      id: Date.now().toString(),
      operationType: type,
      dataType: dataType,
      data: data,
      entityId: id || data.id,
      timestamp: new Date().toISOString(),
      synced: false
    };

    // 檢查是否可以合併操作
    // 例如：如果已有對同一對象的CREATE後再有UPDATE，可以合併為一個CREATE
    const operations = this.loadOperations();
    const newOperations = this.mergeOperations(operations, operation);
    
    this.saveOperations(newOperations);
    this.setSyncStatus(SYNC_STATUS.PENDING);
    
    log.info('記錄離線操作', { operationType: type, dataType, entityId: operation.entityId });
    return operation;
  }

  // 合併操作以減少同步請求
  mergeOperations(operations, newOperation) {
    // 如果是刪除操作，查找並移除先前對同一實體的未同步操作
    if (newOperation.operationType === OPERATION_TYPE.DELETE) {
      const prevOperationIndex = operations.findIndex(
        op => op.entityId === newOperation.entityId && 
              op.dataType === newOperation.dataType &&
              !op.synced
      );

      // 如果是先前的CREATE操作尚未同步，則直接取消兩者
      if (prevOperationIndex !== -1 && operations[prevOperationIndex].operationType === OPERATION_TYPE.CREATE) {
        // 移除先前的操作並不添加新操作
        return operations.filter((_, index) => index !== prevOperationIndex);
      }
    }

    // 如果是更新操作，查找先前同一實體的未同步更新操作
    if (newOperation.operationType === OPERATION_TYPE.UPDATE) {
      const prevUpdateIndex = operations.findIndex(
        op => op.entityId === newOperation.entityId && 
              op.dataType === newOperation.dataType &&
              op.operationType === OPERATION_TYPE.UPDATE &&
              !op.synced
      );

      // 如果找到先前的更新操作，則合併
      if (prevUpdateIndex !== -1) {
        const mergedOperations = [...operations];
        mergedOperations[prevUpdateIndex] = {
          ...mergedOperations[prevUpdateIndex],
          data: { ...mergedOperations[prevUpdateIndex].data, ...newOperation.data },
          timestamp: newOperation.timestamp
        };
        return mergedOperations;
      }
    }

    // 其他情況，添加新操作
    return [...operations, newOperation];
  }

  // 標記操作為已同步
  markOperationSynced(operationId) {
    const operations = this.loadOperations();
    const updatedOperations = operations.map(op => 
      op.id === operationId ? { ...op, synced: true } : op
    );
    
    this.saveOperations(updatedOperations);
    log.info('操作已標記為同步', { operationId });
  }

  // 清除已同步的操作
  clearSyncedOperations() {
    const operations = this.loadOperations();
    const pendingOperations = operations.filter(op => !op.synced);
    
    this.saveOperations(pendingOperations);
    log.info('已清除同步操作', { 
      beforeCount: operations.length,
      afterCount: pendingOperations.length
    });
    
    // 如果沒有待同步的操作，設置狀態為閒置
    if (pendingOperations.length === 0) {
      this.setSyncStatus(SYNC_STATUS.IDLE);
    }
  }

  // 獲取待同步操作
  getPendingOperations() {
    this.initialize();
    return this.operations.filter(op => !op.synced);
  }

  // 設置最後同步時間
  setLastSyncTime(time = new Date()) {
    localStorage.setItem(OFFLINE_KEYS.LAST_SYNC, time.toISOString());
    this.lastSyncTime = time;
    log.info('更新最後同步時間', { time });
  }

  // 獲取最後同步時間
  getLastSyncTime() {
    return this.lastSyncTime;
  }

  // 獲取當前衝突
  getConflicts() {
    return this.currentConflicts;
  }

  // 以特定策略解決衝突
  resolveConflict(conflictId, strategy) {
    const conflictIndex = this.currentConflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return false;
    
    const conflict = this.currentConflicts[conflictIndex];
    let resolvedData;
    
    switch(strategy) {
      case SYNC_CONSTANTS.CONFLICT_STRATEGIES.LOCAL:
        resolvedData = conflict.localData;
        break;
      case SYNC_CONSTANTS.CONFLICT_STRATEGIES.SERVER:
        resolvedData = conflict.serverData;
        break;
      case SYNC_CONSTANTS.CONFLICT_STRATEGIES.MERGE:
        // 合併兩個對象的屬性
        resolvedData = { ...conflict.serverData, ...conflict.localData };
        break;
      default:
        resolvedData = conflict.localData; // 默認使用本地
    }
    
    // 應用解決方案
    this.currentConflicts[conflictIndex] = {
      ...conflict,
      resolved: true,
      resolvedData
    };
    
    log.info('已解決衝突', { conflictId, strategy });
    return true;
  }

  // 同步所有待同步操作
  async syncAll(apiClient) {
    this.initialize();
    
    const pendingOperations = this.getPendingOperations();
    if (pendingOperations.length === 0) {
      log.info('沒有待同步的操作');
      this.setSyncStatus(SYNC_STATUS.IDLE);
      return { success: true, synced: 0, failed: 0, conflicts: 0 };
    }

    log.info('開始同步操作', { count: pendingOperations.length });
    this.setSyncStatus(SYNC_STATUS.SYNCING);
    
    // 重置衝突列表
    this.currentConflicts = [];

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    // 按數據類型和操作類型分組進行同步
    for (const operation of pendingOperations) {
      try {
        log.info('同步操作', { 
          operationType: operation.operationType, 
          dataType: operation.dataType,
          entityId: operation.entityId
        });

        const result = await this.syncOperation(operation, apiClient);
        
        if (result.success) {
          this.markOperationSynced(operation.id);
          synced++;
          
          // 通知進度更新
          this.notifySyncListeners(SYNC_STATUS.SYNCING, { synced, failed, conflicts });
        } else if (result.conflict) {
          // 處理衝突
          conflicts++;
          
          // 添加到衝突列表
          this.currentConflicts.push({
            id: operation.id,
            operationType: operation.operationType,
            dataType: operation.dataType,
            entityId: operation.entityId,
            localData: operation.data,
            serverData: result.serverData,
            resolved: false
          });
          
          if (result.resolved) {
            this.markOperationSynced(operation.id);
            synced++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      } catch (error) {
        log.error('同步操作失敗', { 
          operationId: operation.id, 
          error: error.message
        });
        failed++;
      }
    }

    // 清理已同步的操作
    this.clearSyncedOperations();
    
    // 更新最後同步時間
    this.setLastSyncTime();
    
    // 設置同步狀態
    if (this.currentConflicts.length > 0) {
      this.setSyncStatus(SYNC_STATUS.CONFLICT);
    } else if (failed > 0) {
      this.setSyncStatus(SYNC_STATUS.ERROR);
    } else {
      this.setSyncStatus(SYNC_STATUS.SUCCESS);
    }

    const result = { 
      success: failed === 0 && this.currentConflicts.length === 0, 
      synced, 
      failed, 
      conflicts: this.currentConflicts.length 
    };
    
    log.info('同步完成', result);
    
    // 通知最終結果
    this.notifySyncListeners(this.syncStatus, result);
    
    return result;
  }

  // 同步單個操作
  async syncOperation(operation, apiClient) {
    const { operationType, dataType, data, entityId } = operation;
    
    // 針對不同的資料類型和操作類型使用相應的 API 方法
    try {
      let result;
      
      switch (dataType) {
        case DATA_TYPE.PROJECT:
          result = await this.syncProjectOperation(operationType, data, entityId, apiClient);
          break;
        
        case DATA_TYPE.TIME_ENTRY:
          result = await this.syncTimeEntryOperation(operationType, data, entityId, apiClient);
          break;
          
        case DATA_TYPE.CLIENT:
          result = await this.syncClientOperation(operationType, data, entityId, apiClient);
          break;
          
        case DATA_TYPE.USER_SETTING:
          result = await this.syncUserSettingOperation(operationType, data, entityId, apiClient);
          break;
          
        default:
          log.warn('未知的數據類型', { dataType });
          return { success: false };
      }
      
      return result;
    } catch (error) {
      log.error('同步操作時出錯', { error, operation });
      return { success: false };
    }
  }

  // 同步專案操作
  async syncProjectOperation(operationType, data, entityId, apiClient) {
    switch (operationType) {
      case OPERATION_TYPE.CREATE:
        return await apiClient.projects.create(data);
        
      case OPERATION_TYPE.UPDATE:
        return await apiClient.projects.update(entityId, data);
        
      case OPERATION_TYPE.DELETE:
        return await apiClient.projects.delete(entityId);
        
      default:
        return { success: false };
    }
  }

  // 同步時間記錄操作
  async syncTimeEntryOperation(operationType, data, entityId, apiClient) {
    switch (operationType) {
      case OPERATION_TYPE.CREATE:
        return await apiClient.timeEntries.create(data);
        
      case OPERATION_TYPE.UPDATE:
        return await apiClient.timeEntries.update(entityId, data);
        
      case OPERATION_TYPE.DELETE:
        return await apiClient.timeEntries.delete(entityId);
        
      default:
        return { success: false };
    }
  }

  // 同步客戶操作
  async syncClientOperation(operationType, data, entityId, apiClient) {
    switch (operationType) {
      case OPERATION_TYPE.CREATE:
        return await apiClient.clients.create(data);
        
      case OPERATION_TYPE.UPDATE:
        return await apiClient.clients.update(entityId, data);
        
      case OPERATION_TYPE.DELETE:
        return await apiClient.clients.delete(entityId);
        
      default:
        return { success: false };
    }
  }

  // 同步用戶設定操作
  async syncUserSettingOperation(operationType, data, entityId, apiClient) {
    // 用戶設定通常只有更新操作
    if (operationType === OPERATION_TYPE.UPDATE) {
      return await apiClient.userSettings.update(data);
    }
    return { success: false };
  }

  // 檢測資料衝突
  async detectConflicts(localData, serverData, type) {
    // 這裡可以實現更複雜的衝突檢測邏輯
    // 目前簡單地比較最後修改時間
    if (!serverData || !localData) return false;
    
    const localTime = new Date(localData.updatedAt || localData.timestamp);
    const serverTime = new Date(serverData.updatedAt || serverData.timestamp);
    
    return serverTime > localTime;
  }

  // 解決資料衝突
  async resolveConflict(localData, serverData, type) {
    // 使用衝突解決器
    const resolvedData = this.conflictResolver(localData, serverData, type);
    return { success: true, data: resolvedData };
  }
}

// 建立全局實例
export const offlineSync = new OfflineSyncController();

// 快捷函數
export const recordOfflineOperation = (operationType, dataType, data, id) => {
  return offlineSync.recordOperation(operationType, dataType, data, id);
};

export default offlineSync;
