<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>仪表盘</h2>
      <span class="welcome">欢迎回来，{{ authStore.userInfo?.nickname || authStore.userInfo?.username || '管理员' }}</span>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
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
        <div v-else class="stat-card" :style="{ borderTopColor: stat.color }">
          <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
            <el-icon size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

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
import {
  Document, User, Connection, Plus, Lightning,
  InfoFilled, ArrowRight
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const loading = ref(false)
const recentCases = ref([])

const stats = ref([
  { label: '案例总数', value: '-', color: '#409EFF', icon: markRaw(Document) },
  { label: '用户总数', value: '-', color: '#67C23A', icon: markRaw(User) },
  { label: 'AI处理中', value: '-', color: '#E6A23C', icon: markRaw(Lightning), detail: null },
  { label: '爬虫状态', value: '运行中', color: '#F56C6C', icon: markRaw(Connection) },
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

onMounted(async () => {
  loading.value = true
  try {
    const [caseRes, countRes, aiRes] = await Promise.allSettled([
      getCaseList({ pageNum: 1, pageSize: 8 }),
      getUserCount(),
      getAiProcessingCount()
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

.stat-row {
  margin-bottom: 20px;
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
