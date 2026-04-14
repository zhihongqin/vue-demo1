<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>仪表盘</h2>
      <span class="welcome">欢迎回来，{{ authStore.userInfo?.nickname || authStore.userInfo?.username || '管理员' }}</span>
    </div>

    <el-alert
      v-if="feedbackPendingCount > 0"
      type="warning"
      show-icon
      :closable="false"
      class="feedback-alert"
    >
      <div class="feedback-alert-inner">
        <span>
          当前有 <strong>{{ feedbackPendingCount }}</strong> 条用户反馈待处理，请及时查看。
        </span>
        <el-button type="warning" size="small" plain @click="$router.push('/feedback')">
          去处理
        </el-button>
      </div>
    </el-alert>

    <!-- 统计卡片（含意见反馈概览） -->
    <div class="stat-row-flex">
      <div v-for="stat in stats" :key="stat.label" class="stat-card-wrap">
        <el-tooltip
          v-if="stat.detail"
          placement="bottom"
          :show-after="200"
        >
          <template #content>
            <div class="ai-detail-tooltip">
              <div class="ai-detail-item">
                <span class="ai-detail-dot" style="background:#409EFF"></span>翻译中：{{ stat.detail.translating }} 条
              </div>
              <div class="ai-detail-item">
                <span class="ai-detail-dot" style="background:#67C23A"></span>摘要中：{{ stat.detail.summarizing }} 条
              </div>
              <div class="ai-detail-item">
                <span class="ai-detail-dot" style="background:#F56C6C"></span>评分中：{{ stat.detail.scoring }} 条
              </div>
            </div>
          </template>
          <div class="stat-card" :style="{ borderTopColor: stat.color, cursor: 'pointer' }">
            <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
              <el-icon size="28"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-tooltip>
        <div
          v-else
          class="stat-card"
          :class="{ 'stat-card--clickable': !!stat.link }"
          :style="{ borderTopColor: stat.color }"
          @click="stat.link && $router.push(stat.link)"
        >
          <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
            <el-icon size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" :class="{ 'stat-value--warn': stat.feedbackPending && feedbackPendingCount > 0 }">
              {{ stat.value }}
            </div>
            <div class="stat-label">{{ stat.label }}</div>
            <div v-if="stat.feedbackTotal != null" class="stat-sub">共 {{ stat.feedbackTotal }} 条反馈</div>
            <div v-else-if="stat.hint" class="stat-sub stat-hint" :title="stat.hint">{{ stat.hint }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-row">
      <el-col :span="12">
        <el-card class="quick-card">
          <template #header>
            <div class="card-header">
              <el-icon><Lightning /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" :icon="Plus" @click="$router.push('/cases/create')">
              新增案例
            </el-button>
            <el-button type="success" :icon="Connection" @click="$router.push('/crawler')">
              爬虫管理
            </el-button>
            <el-button type="info" :icon="User" @click="$router.push('/users')">
              用户管理
            </el-button>
            <el-button :icon="Document" @click="$router.push('/cases')">
              案例列表
            </el-button>
            <el-badge :value="feedbackPendingCount" :hidden="feedbackPendingCount === 0" class="feedback-quick-badge">
              <el-button type="warning" :icon="ChatDotRound" @click="$router.push('/feedback')">
                用户反馈
              </el-button>
            </el-badge>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="quick-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="系统名称">涉外法律案例查询系统</el-descriptions-item>
            <el-descriptions-item label="后端地址">http://localhost:8080/api</el-descriptions-item>
            <el-descriptions-item label="当前账号">{{ authStore.userInfo?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="账号角色">
              <el-tag type="danger" size="small">管理员</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新案例 -->
    <el-card class="recent-card">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>最新案例</span>
          <el-button text type="primary" @click="$router.push('/cases')" style="margin-left: auto">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      <el-table :data="recentCases" v-loading="loading" size="small">
        <el-table-column prop="titleZh" label="中文标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="caseType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="caseTypeTag(row.caseType)" size="small">{{ caseTypeLabel(row.caseType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country" label="国家/地区" width="120" show-overflow-tooltip />
        <el-table-column prop="aiStatus" label="AI状态" width="100">
          <template #default="{ row }">
            <el-tag :type="aiStatusTag(row.aiStatus)" size="small">{{ aiStatusLabel(row.aiStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="importanceScore" label="重要性" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.importanceScore != null" :style="{ color: scoreColor(row.importanceScore) }">
              {{ row.importanceScore }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="$router.push(`/cases/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getCaseList } from '@/api/cases'
import { getUserCount } from '@/api/user'
import { getAiProcessingCount } from '@/api/agent'
import { getFeedbackStats } from '@/api/feedback'
import { getCrawlerStatus, getPythonCrawlerStatus } from '@/api/crawler'
import {
  Document, User, Connection, Plus, Lightning,
  InfoFilled, ArrowRight, ChatDotRound
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const loading = ref(false)
const recentCases = ref([])
const feedbackPendingCount = ref(0)

const stats = ref([
  { label: '案例总数', value: '-', color: '#409EFF', icon: markRaw(Document), link: null },
  { label: '用户总数', value: '-', color: '#67C23A', icon: markRaw(User), link: null },
  { label: 'AI处理中', value: '-', color: '#E6A23C', icon: markRaw(Lightning), detail: null, link: null },
  {
    label: '待处理反馈',
    value: '-',
    color: '#909399',
    icon: markRaw(ChatDotRound),
    link: '/feedback',
    feedbackPending: true,
    feedbackTotal: null
  },
  {
    label: '爬虫状态',
    value: '—',
    color: '#909399',
    icon: markRaw(Connection),
    link: '/crawler',
    hint: ''
  },
])

const caseTypeMap = { 1: '民事', 2: '刑事', 3: '行政', 4: '商事' }
const caseTypeTagMap = { 1: '', 2: 'danger', 3: 'warning', 4: 'success' }
const aiStatusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '失败' }
const aiStatusTagMap = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }

const caseTypeLabel = (v) => caseTypeMap[v] || '-'
const caseTypeTag = (v) => caseTypeTagMap[v] || ''
const aiStatusLabel = (v) => aiStatusMap[v] ?? '-'
const aiStatusTag = (v) => aiStatusTagMap[v] || 'info'
const scoreColor = (v) => v >= 80 ? '#F56C6C' : v >= 60 ? '#E6A23C' : '#909399'
const formatDate = (d) => d ? d.replace('T', ' ').slice(0, 16) : '-'

const CRAWLER_STAT_INDEX = 4

function applyCrawlerDashboardStats(clRes, pyRes) {
  const bothFailed = clRes.status !== 'fulfilled' && pyRes.status !== 'fulfilled'
  if (bothFailed) {
    stats.value[CRAWLER_STAT_INDEX].value = '未知'
    stats.value[CRAWLER_STAT_INDEX].color = '#909399'
    stats.value[CRAWLER_STAT_INDEX].hint = '状态接口暂不可用'
    return
  }

  let courtRunning = false
  if (clRes.status === 'fulfilled' && clRes.value?.data != null) {
    courtRunning = !!clRes.value.data.running
  }

  const pyData = pyRes.status === 'fulfilled' ? (pyRes.value?.data || {}) : {}
  const runningPythons = Object.entries(pyData)
    .filter(([, v]) => v === true)
    .map(([k]) => k)

  const anyRunning = courtRunning || runningPythons.length > 0
  stats.value[CRAWLER_STAT_INDEX].value = anyRunning ? '运行中' : '空闲'
  stats.value[CRAWLER_STAT_INDEX].color = anyRunning ? '#E6A23C' : '#67C23A'

  const parts = []
  if (clRes.status === 'fulfilled') {
    parts.push(courtRunning ? 'CourtListener 采集中' : 'CourtListener 空闲')
  } else {
    parts.push('CourtListener 未获取')
  }
  if (pyRes.status === 'fulfilled') {
    if (runningPythons.length > 0) {
      parts.push(`Python：${runningPythons.join('、')}`)
    } else if (Object.keys(pyData).length > 0) {
      parts.push('Python：无运行')
    } else {
      parts.push('Python：暂无脚本')
    }
  } else {
    parts.push('Python 状态未获取')
  }
  stats.value[CRAWLER_STAT_INDEX].hint = parts.join(' · ')
}

onMounted(async () => {
  loading.value = true
  try {
    const [caseRes, countRes, aiRes, fbRes, clStatusRes, pyStatusRes] = await Promise.allSettled([
      getCaseList({ pageNum: 1, pageSize: 8 }),
      getUserCount(),
      getAiProcessingCount(),
      getFeedbackStats(),
      getCrawlerStatus(),
      getPythonCrawlerStatus()
    ])
    if (caseRes.status === 'fulfilled') {
      recentCases.value = caseRes.value.data?.records || []
      stats.value[0].value = caseRes.value.data?.total ?? '-'
    }
    if (countRes.status === 'fulfilled') {
      stats.value[1].value = countRes.value.data ?? '-'
    }
    if (aiRes.status === 'fulfilled') {
      const d = aiRes.value.data
      stats.value[2].value = d?.total ?? '-'
      stats.value[2].detail = {
        translating: d?.translating ?? 0,
        summarizing: d?.summarizing ?? 0,
        scoring: d?.scoring ?? 0,
      }
    }
    if (fbRes.status === 'fulfilled') {
      const d = fbRes.value.data
      const pending = Number(d?.pendingCount ?? 0)
      const total = Number(d?.totalCount ?? 0)
      feedbackPendingCount.value = pending
      stats.value[3].value = pending
      stats.value[3].feedbackTotal = total
      stats.value[3].color = pending > 0 ? '#E6A23C' : '#67C23A'
    }
    applyCrawlerDashboardStats(clStatusRes, pyStatusRes)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}

.welcome {
  color: #909399;
  font-size: 14px;
}

.feedback-alert {
  margin-bottom: 16px;
}

.feedback-alert-inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-row-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card-wrap {
  flex: 1 1 160px;
  min-width: 140px;
  max-width: 100%;
}

.stat-card--clickable {
  cursor: pointer;
}

.stat-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-value--warn {
  color: #e6a23c !important;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.stat-hint {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.feedback-quick-badge {
  vertical-align: middle;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 3px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}

.quick-row {
  margin-bottom: 20px;
}

.quick-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.recent-card {
  margin-bottom: 20px;
}

.text-muted {
  color: #c0c4cc;
}

.ai-detail-tooltip {
  font-size: 13px;
  line-height: 1.8;
}

.ai-detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-detail-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
