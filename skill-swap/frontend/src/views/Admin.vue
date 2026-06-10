<template>
  <div class="admin">
    <div class="card">
      <h1 class="page-title">管理后台</h1>

      <div class="admin-tabs">
        <div class="tab" :class="{ active: activeTab === 'disputed' }" @click="activeTab = 'disputed'">
          待处理申诉 ({{ disputedExchanges.length }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
          全部交换记录
        </div>
      </div>

      <div v-if="activeTab === 'disputed'" class="exchange-list">
        <div v-for="exchange in disputedExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <div class="user-info">
                <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
                <span class="username">{{ exchange.initiatorName }}</span>
              </div>
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <div class="user-info">
                <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
                <span class="username">{{ exchange.partnerName }}</span>
              </div>
            </div>
            <div class="exchange-status disputed">
              申诉中
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">{{ exchange.initiatorName }} 教授:</span>
              <span v-for="skill in exchange.skills?.teach" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">{{ exchange.initiatorName }} 学习:</span>
              <span v-for="skill in exchange.skills?.learn" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div class="dispute-detail">
            <div class="dispute-row">
              <el-icon><User /></el-icon>
              <span class="dispute-label">{{ exchange.cancelRequesterName }} 申请取消：</span>
            </div>
            <div class="reason-box">
              {{ exchange.cancelReason }}
            </div>
            <div class="dispute-time">
              申请时间：{{ formatTime(exchange.cancelRequestedAt) }}
            </div>

            <div class="dispute-row" style="margin-top: 16px;">
              <el-icon><Flag /></el-icon>
              <span class="dispute-label">{{ exchange.disputerName }} 申诉：</span>
            </div>
            <div class="reason-box dispute">
              {{ exchange.disputeReason }}
            </div>
            <div class="dispute-time">
              申诉时间：{{ formatTime(exchange.disputedAt) }}
            </div>
          </div>

          <div class="exchange-footer">
            <span class="exchange-time">创建于 {{ formatTime(exchange.createdAt) }}</span>
            <div class="exchange-actions">
              <el-button @click="showHandleDialog(exchange, 'reject')" type="primary">
                <el-icon><Close /></el-icon>驳回申诉
              </el-button>
              <el-button @click="showHandleDialog(exchange, 'approve')" type="danger">
                <el-icon><Check /></el-icon>批准取消
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="disputedExchanges.length === 0" description="暂无待处理的申诉" />
      </div>

      <div v-if="activeTab === 'all'" class="exchange-list">
        <div class="filter-bar">
          <span class="filter-label">状态筛选：</span>
          <el-radio-group v-model="statusFilter" size="default">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="pending">待确认</el-radio-button>
            <el-radio-button value="cancel_pending">取消中</el-radio-button>
            <el-radio-button value="disputed">申诉中</el-radio-button>
            <el-radio-button value="completed">已完成</el-radio-button>
            <el-radio-button value="cancelled">已取消</el-radio-button>
          </el-radio-group>
        </div>

        <div v-for="exchange in filteredExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <div class="user-info">
                <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
                <span class="username">{{ exchange.initiatorName }}</span>
              </div>
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <div class="user-info">
                <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
                <span class="username">{{ exchange.partnerName }}</span>
              </div>
            </div>
            <div class="exchange-status" :class="exchange.status">
              {{ getStatusText(exchange.status) }}
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">{{ exchange.initiatorName }} 教授:</span>
              <span v-for="skill in exchange.skills?.teach" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">{{ exchange.initiatorName }} 学习:</span>
              <span v-for="skill in exchange.skills?.learn" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div v-if="exchange.cancelReason" class="cancel-info">
            <div class="info-row">
              <span class="label">{{ exchange.cancelRequesterName }} 申请取消：</span>
              {{ exchange.cancelReason }}
            </div>
            <div v-if="exchange.disputeReason" class="info-row">
              <span class="label">{{ exchange.disputerName }} 申诉：</span>
              {{ exchange.disputeReason }}
            </div>
            <div v-if="exchange.handledBy" class="info-row">
              <span class="label">{{ exchange.handlerName }} 处理：</span>
              {{ exchange.handleResult === 'approve_cancel' ? '批准取消' : '驳回申诉' }}
              <span v-if="exchange.handleRemark">（备注：{{ exchange.handleRemark }}）</span>
            </div>
          </div>

          <div class="exchange-footer">
            <div class="time-info">
              <span>创建：{{ formatTime(exchange.createdAt) }}</span>
              <span v-if="exchange.completedAt"> | 完成：{{ formatTime(exchange.completedAt) }}</span>
              <span v-if="exchange.cancelledAt"> | 取消：{{ formatTime(exchange.cancelledAt) }}</span>
            </div>
            <div class="exchange-actions">
              <el-button v-if="exchange.status === 'disputed'" @click="showHandleDialog(exchange, 'reject')" type="primary" size="small">
                驳回申诉
              </el-button>
              <el-button v-if="exchange.status === 'disputed'" @click="showHandleDialog(exchange, 'approve')" type="danger" size="small">
                批准取消
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="filteredExchanges.length === 0" description="暂无交换记录" />
      </div>
    </div>

    <el-dialog v-model="showHandleDialog" :title="handleAction === 'approve' ? '批准取消' : '驳回申诉'" width="500px">
      <div v-if="currentExchange" class="handle-form">
        <div class="handle-info">
          <div class="info-row">
            <span class="label">交换双方：</span>
            {{ currentExchange.initiatorName }} ↔ {{ currentExchange.partnerName }}
          </div>
          <div class="info-row">
            <span class="label">取消原因：</span>
            {{ currentExchange.cancelReason }}
          </div>
          <div class="info-row">
            <span class="label">申诉原因：</span>
            {{ currentExchange.disputeReason }}
          </div>
        </div>
        <el-form :model="handleForm" label-position="top">
          <el-form-item label="处理备注（可选）">
            <el-input v-model="handleForm.remark" type="textarea" :rows="3" placeholder="请输入处理备注..." maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
        <div v-if="handleAction === 'approve'" class="warning-tip approve">
          <el-icon><Warning /></el-icon>
          批准取消后，此交换将被标记为已取消，无法恢复。
        </div>
        <div v-else class="warning-tip reject">
          <el-icon><Warning /></el-icon>
          驳回申诉后，此交换将恢复为待确认状态，双方可以继续确认完成。
        </div>
      </div>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button :type="handleAction === 'approve' ? 'danger' : 'primary'" @click="submitHandle" :loading="submitting">
          确认{{ handleAction === 'approve' ? '批准取消' : '驳回申诉' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminAPI } from '../api'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { Switch, User, Flag, Check, Close, Warning } from '@element-plus/icons-vue'

const userStore = useUserStore()

const exchanges = ref([])
const users = ref({})
const activeTab = ref('disputed')
const statusFilter = ref('all')
const showHandleDialog = ref(false)
const currentExchange = ref(null)
const handleAction = ref('approve')
const handleForm = ref({ remark: '' })
const submitting = ref(false)

const disputedExchanges = computed(() =>
  exchanges.value.filter(e => e.status === 'disputed')
)

const filteredExchanges = computed(() => {
  if (statusFilter.value === 'all') {
    return exchanges.value
  }
  return exchanges.value.filter(e => e.status === statusFilter.value)
})

onMounted(async () => {
  await loadExchanges()
})

async function loadExchanges() {
  try {
    const res = await adminAPI.getAllExchanges()
    exchanges.value = res.data

    const userIds = new Set()
    exchanges.value.forEach(e => {
      userIds.add(e.initiatorId)
      userIds.add(e.partnerId)
    })
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

function getUserAvatar(id) {
  const exchange = exchanges.value.find(e => e.initiatorId === id || e.partnerId === id)
  if (exchange?.initiatorId === id) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${exchange.initiatorName}`
  }
  if (exchange?.partnerId === id) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${exchange.partnerName}`
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
}

function getStatusText(status) {
  const statusMap = {
    pending: '待确认',
    cancel_pending: '取消中',
    disputed: '申诉中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

function formatTime(time) {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function showHandleDialog(exchange, action) {
  currentExchange.value = exchange
  handleAction.value = action
  handleForm.value = { remark: '' }
  showHandleDialog.value = true
}

async function submitHandle() {
  if (!currentExchange.value) return

  const action = handleAction.value === 'approve' ? 'approve_cancel' : 'reject_dispute'

  try {
    submitting.value = true
    await adminAPI.handleDispute(currentExchange.value.id, action, handleForm.value.remark)
    ElMessage.success('处理成功')
    showHandleDialog.value = false
    await loadExchanges()
  } catch (e) {
    ElMessage.error(e.message || '处理失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 2px solid #eee;
}

.tab {
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 500;
  color: #999;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.filter-label {
  font-weight: 500;
  color: #333;
}

.exchange-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exchange-card {
  background: #fafafa;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.exchange-card:hover {
  border-color: #667eea;
}

.exchange-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.exchange-users {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
  color: #333;
}

.exchange-icon {
  font-size: 24px;
  color: #667eea;
}

.exchange-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.exchange-status.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.exchange-status.cancel_pending {
  background: #fff1f0;
  color: #f5222d;
}

.exchange-status.disputed {
  background: #fff7e6;
  color: #d46b08;
}

.exchange-status.completed {
  background: #f6ffed;
  color: #52c41a;
}

.exchange-status.cancelled {
  background: #f5f5f5;
  color: #8c8c8c;
}

.exchange-skills {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.skill-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-col .label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.skill-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  margin-right: 8px;
}

.skill-tag.skill-teach {
  background: #e6f7ff;
  color: #1890ff;
}

.skill-tag.skill-learn {
  background: #f9f0ff;
  color: #722ed1;
}

.dispute-detail, .cancel-info {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #d46b08;
}

.cancel-info {
  border-left-color: #fa8c16;
  margin-bottom: 0;
}

.dispute-row, .info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.dispute-label, .label {
  font-weight: 600;
  color: #333;
}

.reason-box {
  background: #fff1f0;
  padding: 12px;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
  margin: 8px 0 8px 32px;
}

.reason-box.dispute {
  background: #fff7e6;
}

.dispute-time {
  color: #999;
  font-size: 13px;
  margin-left: 32px;
}

.cancel-info .info-row {
  margin-bottom: 8px;
}

.exchange-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.time-info {
  color: #999;
  font-size: 13px;
}

.exchange-actions {
  display: flex;
  gap: 12px;
}

.handle-form {
  padding: 8px 0;
}

.handle-info {
  margin-bottom: 20px;
}

.handle-info .info-row {
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
}

.warning-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.warning-tip.approve {
  background: #fff1f0;
  color: #f5222d;
}

.warning-tip.reject {
  background: #e6f7ff;
  color: #1890ff;
}
</style>
