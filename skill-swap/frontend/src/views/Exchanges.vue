<template>
  <div class="exchanges">
    <div class="card">
      <h1 class="page-title">交换记录</h1>

      <div class="exchange-tabs">
        <div class="tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
          待确认 ({{ pendingExchanges.length }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'cancel_pending' }" @click="activeTab = 'cancel_pending'">
          取消中 ({{ cancelPendingExchanges.length }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'disputed' }" @click="activeTab = 'disputed'">
          申诉中 ({{ disputedExchanges.length }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
          已完成 ({{ completedExchanges.length }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'cancelled' }" @click="activeTab = 'cancelled'">
          已取消 ({{ cancelledExchanges.length }})
        </div>
      </div>

      <div v-if="activeTab === 'pending'" class="exchange-list">
        <div v-for="exchange in pendingExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
            </div>
            <div class="exchange-status pending">
              待确认 {{ exchange.confirmedBy.length }}/2
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">你将教授:</span>
              <span v-for="skill in getMyTeachSkills(exchange)" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">你将学习:</span>
              <span v-for="skill in getMyLearnSkills(exchange)" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div class="exchange-footer">
            <span class="exchange-time">{{ formatTime(exchange.createdAt) }}</span>
            <div class="exchange-actions">
              <el-button type="danger" text @click="openCancelDialog(exchange)">
                <el-icon><Close /></el-icon>申请取消
              </el-button>
              <el-button @click="goToChat(exchange)">
                <el-icon><ChatDotRound /></el-icon>联系对方
              </el-button>
              <el-button type="primary" @click="confirmExchange(exchange)" :disabled="exchange.confirmedBy.includes(myId)" :loading="confirmingId === exchange.id">
                <el-icon><Check /></el-icon>
                {{ exchange.confirmedBy.includes(myId) ? '已确认' : '确认完成' }}
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="pendingExchanges.length === 0" description="暂无待确认的交换" />
      </div>

      <div v-if="activeTab === 'cancel_pending'" class="exchange-list">
        <div v-for="exchange in cancelPendingExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
            </div>
            <div class="exchange-status cancel-pending">
              取消待确认
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">你将教授:</span>
              <span v-for="skill in getMyTeachSkills(exchange)" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">你将学习:</span>
              <span v-for="skill in getMyLearnSkills(exchange)" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div class="cancel-info">
            <div class="cancel-info-header">
              <el-icon><Warning /></el-icon>
              <span class="cancel-requester">
                {{ getUserName(exchange.cancelRequestedBy) }} 申请取消交换
              </span>
            </div>
            <div class="cancel-reason">
              <strong>取消原因：</strong>{{ exchange.cancelReason }}
            </div>
            <div class="cancel-time">
              申请时间：{{ formatTime(exchange.cancelRequestedAt) }}
            </div>
          </div>

          <div class="exchange-footer">
            <span class="exchange-time">{{ formatTime(exchange.createdAt) }}</span>
            <div class="exchange-actions" v-if="exchange.cancelRequestedBy !== myId">
              <el-button type="danger" @click="openDisputeDialog(exchange)">
                <el-icon><Warning /></el-icon>申诉
              </el-button>
              <el-button type="success" @click="approveCancel(exchange)" :loading="processingId === exchange.id">
                <el-icon><Check /></el-icon>同意取消
              </el-button>
            </div>
            <div class="exchange-actions" v-else>
              <span class="waiting-text">等待对方处理...</span>
            </div>
          </div>
        </div>
        <el-empty v-if="cancelPendingExchanges.length === 0" description="暂无取消中的交换" />
      </div>

      <div v-if="activeTab === 'disputed'" class="exchange-list">
        <div v-for="exchange in disputedExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
            </div>
            <div class="exchange-status disputed">
              申诉中
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">你将教授:</span>
              <span v-for="skill in getMyTeachSkills(exchange)" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">你将学习:</span>
              <span v-for="skill in getMyLearnSkills(exchange)" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div class="dispute-info">
            <div class="dispute-info-row">
              <el-icon><WarningFilled /></el-icon>
              <span class="dispute-label">{{ getUserName(exchange.cancelRequestedBy) }} 申请取消：</span>
              <span class="dispute-reason">{{ exchange.cancelReason }}</span>
            </div>
            <div class="dispute-info-row">
              <el-icon><Flag /></el-icon>
              <span class="dispute-label">{{ getUserName(exchange.disputedBy) }} 申诉：</span>
              <span class="dispute-reason">{{ exchange.disputeReason }}</span>
            </div>
            <div class="dispute-notice">
              <el-icon><InfoFilled /></el-icon>
              此交换已进入申诉流程，暂无法确认完成，请等待管理员处理
            </div>
          </div>

          <div class="exchange-footer">
            <span class="exchange-time">申诉时间：{{ formatTime(exchange.disputedAt) }}</span>
            <div class="exchange-actions">
              <span class="waiting-text">等待管理员处理...</span>
            </div>
          </div>
        </div>
        <el-empty v-if="disputedExchanges.length === 0" description="暂无申诉中的交换" />
      </div>

      <div v-if="activeTab === 'completed'" class="exchange-list">
        <div v-for="exchange in completedExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
            </div>
            <div class="exchange-status completed">
              ✅ 已完成
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">教授:</span>
              <span v-for="skill in getMyTeachSkills(exchange)" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">学习:</span>
              <span v-for="skill in getMyLearnSkills(exchange)" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div class="exchange-footer">
            <span class="exchange-time">完成于 {{ formatTime(exchange.completedAt) }}</span>
            <div class="exchange-actions">
              <el-button type="success" @click="openReviewDialog(exchange)" :disabled="hasReviewed(exchange)">
                <el-icon><Star /></el-icon>
                {{ hasReviewed(exchange) ? '已评价' : '去评价' }}
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="completedExchanges.length === 0" description="暂无已完成的交换" />
      </div>

      <div v-if="activeTab === 'cancelled'" class="exchange-list">
        <div v-for="exchange in cancelledExchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-header">
            <div class="exchange-users">
              <el-avatar :src="getUserAvatar(exchange.initiatorId)" :size="40" />
              <el-icon class="exchange-icon"><Switch /></el-icon>
              <el-avatar :src="getUserAvatar(exchange.partnerId)" :size="40" />
            </div>
            <div class="exchange-status cancelled">
              ❌ 已取消
            </div>
          </div>

          <div class="exchange-skills">
            <div class="skill-col">
              <span class="label">教授:</span>
              <span v-for="skill in getMyTeachSkills(exchange)" :key="skill" class="skill-tag skill-teach">{{ skill }}</span>
            </div>
            <div class="skill-col">
              <span class="label">学习:</span>
              <span v-for="skill in getMyLearnSkills(exchange)" :key="skill" class="skill-tag skill-learn">{{ skill }}</span>
            </div>
          </div>

          <div class="cancel-info" v-if="exchange.cancelReason">
            <div class="cancel-info-header">
              <el-icon><Close /></el-icon>
              <span class="cancel-requester">
                由 {{ getUserName(exchange.cancelRequestedBy) }} 申请取消
              </span>
            </div>
            <div class="cancel-reason">
              <strong>取消原因：</strong>{{ exchange.cancelReason }}
            </div>
            <div class="cancel-time" v-if="exchange.disputedBy">
              <strong>处理方式：</strong>管理员{{ exchange.handleResult === 'approve_cancel' ? '批准取消' : '驳回申诉' }}
              <span v-if="exchange.handleRemark">（备注：{{ exchange.handleRemark }}）</span>
            </div>
          </div>

          <div class="exchange-footer">
            <span class="exchange-time">取消于 {{ formatTime(exchange.cancelledAt) }}</span>
          </div>
        </div>
        <el-empty v-if="cancelledExchanges.length === 0" description="暂无已取消的交换" />
      </div>
    </div>

    <el-dialog v-model="showCancelModal" title="申请取消交换" width="500px">
      <div v-if="currentExchange" class="cancel-form">
        <el-form :model="cancelForm" label-position="top">
          <el-form-item label="取消原因">
            <el-input v-model="cancelForm.reason" type="textarea" :rows="4" placeholder="请详细说明取消原因..." maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
        <div class="warning-tip">
          <el-icon><Warning /></el-icon>
          取消申请发送后，对方可以选择同意或申诉。如果对方申诉，将由管理员介入处理。
        </div>
      </div>
      <template #footer>
        <el-button @click="showCancelModal = false">取消</el-button>
        <el-button type="danger" @click="submitCancel" :loading="submitting">提交取消申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDisputeModal" title="申诉取消申请" width="500px">
      <div v-if="currentExchange" class="dispute-form">
        <div class="dispute-info-preview">
          <div class="info-row">
            <span class="label">{{ getUserName(currentExchange.cancelRequestedBy) }} 的取消原因：</span>
          </div>
          <div class="reason-box">{{ currentExchange.cancelReason }}</div>
        </div>
        <el-form :model="disputeForm" label-position="top">
          <el-form-item label="申诉原因">
            <el-input v-model="disputeForm.reason" type="textarea" :rows="4" placeholder="请详细说明您的申诉理由..." maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
        <div class="warning-tip">
          <el-icon><Warning /></el-icon>
          申诉提交后，此交换将暂停确认流程，等待管理员介入处理。
        </div>
      </div>
      <template #footer>
        <el-button @click="showDisputeModal = false">取消</el-button>
        <el-button type="danger" @click="submitDispute" :loading="submitting">提交申诉</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReview" title="评价这次交换" width="500px">
      <div v-if="currentExchange" class="review-form">
        <div class="review-user">
          <el-avatar :src="getUserAvatar(getOtherUserId(currentExchange))" :size="56" />
          <span class="username">{{ getUserName(getOtherUserId(currentExchange)) }}</span>
        </div>
        <el-form :model="reviewForm" label-position="top">
          <el-form-item label="评分">
            <el-rate v-model="reviewForm.rating" size="large" />
          </el-form-item>
          <el-form-item label="评价内容">
            <el-input v-model="reviewForm.comment" type="textarea" :rows="4" placeholder="分享一下这次交换的体验..." maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="primary" @click="submitReview" :loading="submitting">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { exchangeAPI, reviewAPI, authAPI } from '../api'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { Switch, Check, ChatDotRound, Star, Close, Warning, WarningFilled, InfoFilled, Flag } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const myId = userStore.user?.id

const exchanges = ref([])
const users = ref({})
const activeTab = ref('pending')
const confirmingId = ref(null)
const processingId = ref(null)
const showReview = ref(false)
const showCancelModal = ref(false)
const showDisputeModal = ref(false)
const currentExchange = ref(null)
const submitting = ref(false)
const reviewForm = ref({ rating: 5, comment: '' })
const cancelForm = ref({ reason: '' })
const disputeForm = ref({ reason: '' })

const pendingExchanges = computed(() =>
  exchanges.value.filter(e => e.status === 'pending')
)

const cancelPendingExchanges = computed(() =>
  exchanges.value.filter(e => e.status === 'cancel_pending')
)

const disputedExchanges = computed(() =>
  exchanges.value.filter(e => e.status === 'disputed')
)

const completedExchanges = computed(() =>
  exchanges.value.filter(e => e.status === 'completed')
)

const cancelledExchanges = computed(() =>
  exchanges.value.filter(e => e.status === 'cancelled')
)

onMounted(async () => {
  await loadExchanges()
})

async function loadExchanges() {
  const res = await exchangeAPI.getExchanges()
  exchanges.value = res.data

  const userIds = new Set()
  exchanges.value.forEach(e => {
    userIds.add(e.initiatorId)
    userIds.add(e.partnerId)
    if (e.cancelRequestedBy) userIds.add(e.cancelRequestedBy)
    if (e.disputedBy) userIds.add(e.disputedBy)
  })

  for (const id of userIds) {
    try {
      const userRes = await authAPI.getUser(id)
      users.value[id] = userRes.data
    } catch (e) {}
  }
}

function getUserAvatar(id) {
  return users.value[id]?.avatar || ''
}

function getUserName(id) {
  return users.value[id]?.username || '未知用户'
}

function getOtherUserId(exchange) {
  return exchange.initiatorId === myId ? exchange.partnerId : exchange.initiatorId
}

function getMyTeachSkills(exchange) {
  if (exchange.initiatorId === myId) {
    return exchange.skills?.teach || []
  } else {
    return exchange.skills?.learn || []
  }
}

function getMyLearnSkills(exchange) {
  if (exchange.initiatorId === myId) {
    return exchange.skills?.learn || []
  } else {
    return exchange.skills?.teach || []
  }
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function confirmExchange(exchange) {
  try {
    confirmingId.value = exchange.id
    await exchangeAPI.confirmExchange(exchange.id)
    ElMessage.success('确认成功')
    await loadExchanges()
  } catch (e) {
    ElMessage.error(e.message || '确认失败')
  } finally {
    confirmingId.value = null
  }
}

function goToChat(exchange) {
  const otherId = getOtherUserId(exchange)
  router.push(`/chat/${otherId}`)
}

function hasReviewed(exchange) {
  return exchange.reviewedBy?.includes(myId)
}

function openReviewDialog(exchange) {
  currentExchange.value = exchange
  reviewForm.value = { rating: 5, comment: '' }
  showReview.value = true
}

async function submitReview() {
  if (!currentExchange.value) return
  if (!reviewForm.value.rating) {
    ElMessage.warning('请选择评分')
    return
  }

  try {
    submitting.value = true
    await reviewAPI.createReview({
      exchangeId: currentExchange.value.id,
      targetUserId: getOtherUserId(currentExchange.value),
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment
    })

    if (!currentExchange.value.reviewedBy) {
      currentExchange.value.reviewedBy = []
    }
    currentExchange.value.reviewedBy.push(myId)

    ElMessage.success('评价成功')
    showReview.value = false
  } catch (e) {
    ElMessage.error(e.message || '评价失败')
  } finally {
    submitting.value = false
  }
}

function openCancelDialog(exchange) {
  currentExchange.value = exchange
  cancelForm.value = { reason: '' }
  showCancelModal.value = true
}

async function submitCancel() {
  if (!currentExchange.value) return
  if (!cancelForm.value.reason || cancelForm.value.reason.trim().length < 5) {
    ElMessage.warning('请填写取消原因（至少5个字符）')
    return
  }

  try {
    submitting.value = true
    await exchangeAPI.requestCancel(currentExchange.value.id, cancelForm.value.reason)
    ElMessage.success('取消申请已发送')
    showCancelModal.value = false
    await loadExchanges()
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function openDisputeDialog(exchange) {
  currentExchange.value = exchange
  disputeForm.value = { reason: '' }
  showDisputeModal.value = true
}

async function submitDispute() {
  if (!currentExchange.value) return
  if (!disputeForm.value.reason || disputeForm.value.reason.trim().length < 5) {
    ElMessage.warning('请填写申诉原因（至少5个字符）')
    return
  }

  try {
    submitting.value = true
    await exchangeAPI.dispute(currentExchange.value.id, disputeForm.value.reason)
    ElMessage.success('申诉已提交，请等待管理员处理')
    showDisputeModal.value = false
    await loadExchanges()
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function approveCancel(exchange) {
  try {
    processingId.value = exchange.id
    await exchangeAPI.approveCancel(exchange.id)
    ElMessage.success('已同意取消交换')
    await loadExchanges()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    processingId.value = null
  }
}
</script>

<style scoped>
.exchanges {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.exchange-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 2px solid #eee;
  flex-wrap: wrap;
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

.exchange-status.cancel-pending {
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

.cancel-info, .dispute-info {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #fa8c16;
}

.cancel-info {
  border-left-color: #f5222d;
}

.dispute-info {
  border-left-color: #d46b08;
}

.cancel-info-header, .dispute-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.cancel-requester, .dispute-label {
  font-weight: 600;
  color: #333;
}

.cancel-reason, .dispute-reason {
  color: #666;
  line-height: 1.6;
}

.cancel-time, .dispute-time {
  color: #999;
  font-size: 13px;
  margin-top: 8px;
}

.dispute-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #fff7e6;
  border-radius: 8px;
  color: #d46b08;
  font-size: 13px;
}

.dispute-info-preview {
  margin-bottom: 20px;
}

.dispute-info-preview .info-row {
  margin-bottom: 8px;
  color: #666;
}

.dispute-info-preview .reason-box {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
}

.warning-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #fff7e6;
  border-radius: 8px;
  color: #d46b08;
  font-size: 13px;
}

.exchange-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exchange-time {
  color: #999;
  font-size: 13px;
}

.exchange-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.waiting-text {
  color: #999;
  font-size: 13px;
  padding: 0 12px;
}

.review-form {
  text-align: center;
}

.review-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.review-user .username {
  font-weight: 600;
  font-size: 18px;
  color: #333;
}

.cancel-form, .dispute-form {
  padding: 8px 0;
}
</style>
