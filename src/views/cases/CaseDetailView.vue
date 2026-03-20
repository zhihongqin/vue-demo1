<template>
  <div class="case-detail-page" v-loading="loading">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>案例详情</h2>
      <div class="header-actions" v-if="caseData">
        <el-button :icon="Edit" @click="$router.push(`/cases/${caseData.id}/edit`)">编辑</el-button>
        <el-dropdown @command="handleAction">
          <el-button type="primary">
            AI操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="translate">触发翻译</el-dropdown-item>
              <el-dropdown-item command="enrich">触发字段补全</el-dropdown-item>
              <el-dropdown-item command="summary">触发摘要提取</el-dropdown-item>
              <el-dropdown-item command="score">触发重要性评分</el-dropdown-item>
              <el-dropdown-item
                command="syncFastgpt"
                divided
                :disabled="caseData.aiStatus !== 2 || caseData.fastgptSyncStatus === 1"
              >推送至 FastGPT 知识库</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <template v-if="caseData">
      <!-- 基本信息 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header-row">
            <span class="card-title">基本信息</span>
            <div class="tags">
              <el-tag :type="caseTypeTag(caseData.caseType)" size="small">{{ caseTypeLabel(caseData.caseType) }}</el-tag>
              <el-tag :type="aiStatusTag(caseData.aiStatus)" size="small">AI: {{ aiStatusLabel(caseData.aiStatus) }}</el-tag>
              <el-tag :type="fastgptSyncTag(caseData.fastgptSyncStatus)" size="small">
                知识库: {{ fastgptSyncLabel(caseData.fastgptSyncStatus) }}
              </el-tag>
              <el-tag v-if="caseData.importanceScore != null" :type="scoreTag(caseData.importanceScore)" size="small">
                重要性: {{ caseData.importanceScore }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="中文标题" :span="3">
            <strong>{{ caseData.titleZh || '-' }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="英文标题" :span="3">{{ caseData.titleEn || '-' }}</el-descriptions-item>
          <el-descriptions-item label="案例编号">{{ caseData.caseNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="案件类型">{{ caseTypeLabel(caseData.caseType) }}</el-descriptions-item>
          <el-descriptions-item label="国家/地区">{{ caseData.country || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审理法院">{{ caseData.court || '-' }}</el-descriptions-item>
          <el-descriptions-item label="判决日期">{{ caseData.judgmentDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="案由">{{ caseData.caseReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关键词">{{ caseData.keywords || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ caseData.source || '-' }}</el-descriptions-item>
          <el-descriptions-item label="浏览次数">{{ caseData.viewCount }}</el-descriptions-item>
          <el-descriptions-item label="收藏次数">{{ caseData.favoriteCount }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(caseData.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="原始链接" :span="2">
            <el-link :href="caseData.url" target="_blank" type="primary">{{ caseData.url }}</el-link>
          </el-descriptions-item>
          <el-descriptions-item label="涉及法律条文" :span="3">{{ caseData.legalProvisions || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- FastGPT 知识库 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header-row">
            <span class="card-title">FastGPT 知识库</span>
            <el-button
              type="primary"
              size="small"
              :loading="syncFastgptLoading"
              :disabled="caseData.aiStatus !== 2 || caseData.fastgptSyncStatus === 1"
              @click="handleSyncFastgpt"
            >
              手动推送
            </el-button>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="同步状态">
            <el-tag :type="fastgptSyncTag(caseData.fastgptSyncStatus)" size="small">
              {{ fastgptSyncLabel(caseData.fastgptSyncStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最近同步时间">{{ formatDate(caseData.fastgptSyncedAt) }}</el-descriptions-item>
          <el-descriptions-item label="集合 ID" :span="2">
            <span class="mono-text">{{ caseData.fastgptCollectionId || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败原因" :span="2" v-if="caseData.fastgptSyncStatus === 3 && caseData.fastgptSyncError">
            <span class="error-text">{{ caseData.fastgptSyncError }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <p v-if="caseData.aiStatus !== 2" class="hint-muted">需 AI 处理完成（AI 状态为「已完成」）后方可推送知识库。</p>
      </el-card>

      <!-- AI摘要 -->
      <el-card class="detail-card" v-if="caseData.summary || caseData.summaryZh">
        <template #header><span class="card-title">AI摘要</span></template>
        <el-descriptions :column="2" border v-if="caseData.summary">
          <el-descriptions-item label="案由摘要">{{ caseData.summary.caseReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="判决结果">{{ caseData.summary.judgmentResult || '-' }}</el-descriptions-item>
          <el-descriptions-item label="争议焦点" :span="2">{{ caseData.summary.disputeFocus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="核心要点" :span="2">{{ caseData.summary.keyPoints || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-else-if="caseData.summaryZh" class="content-block">{{ caseData.summaryZh }}</div>
      </el-card>

      <!-- AI评分 -->
      <el-card class="detail-card" v-if="caseData.score">
        <template #header><span class="card-title">AI评分详情</span></template>
        <el-row :gutter="16" class="score-row">
          <el-col :span="6" v-for="s in scoreItems" :key="s.label">
            <div class="score-item">
              <el-progress
                type="circle"
                :percentage="caseData.score[s.key] || 0"
                :color="progressColor(caseData.score[s.key])"
                :width="80"
              />
              <div class="score-label">{{ s.label }}</div>
            </div>
          </el-col>
        </el-row>
        <el-descriptions :column="1" border style="margin-top:16px">
          <el-descriptions-item label="评分标签">{{ caseData.score.scoreTags || '-' }}</el-descriptions-item>
          <el-descriptions-item label="评分理由">{{ caseData.score.scoreReason || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 正文内容 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header-row">
            <span class="card-title">案例正文</span>
            <el-radio-group v-model="contentTab" size="small">
              <el-radio-button value="en">英文原文</el-radio-button>
              <el-radio-button value="zh">中文翻译</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div class="content-block" v-if="contentTab === 'en'">
          {{ caseData.contentEn || '暂无英文原文' }}
        </div>
        <div class="content-block" v-else>
          {{ caseData.contentZh || '暂无中文翻译，可触发AI翻译' }}
        </div>
      </el-card>

      <!-- AI处理记录 Tabs -->
      <el-card class="detail-card">
        <template #header><span class="card-title">AI处理记录</span></template>
        <el-tabs v-model="recordTab" @tab-change="loadRecords">
          <el-tab-pane label="翻译记录" name="translation">
            <el-table :data="translationRecords" v-loading="recordLoading" size="small" border>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="aiStatusTag(row.status)" size="small">{{ aiStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="aiModel" label="模型" width="120" />
              <el-table-column prop="tokenUsed" label="Token" width="80" align="center" />
              <el-table-column prop="errorMsg" label="错误信息" show-overflow-tooltip />
              <el-table-column prop="createdAt" label="创建时间" width="155">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="摘要记录" name="summary">
            <el-table :data="summaryRecords" v-loading="recordLoading" size="small" border>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="aiStatusTag(row.status)" size="small">{{ aiStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="caseReason" label="案由摘要" show-overflow-tooltip />
              <el-table-column prop="disputeFocus" label="争议焦点" show-overflow-tooltip />
              <el-table-column prop="errorMsg" label="错误信息" show-overflow-tooltip />
              <el-table-column prop="createdAt" label="创建时间" width="155">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="评分记录" name="score">
            <el-table :data="scoreRecords" v-loading="recordLoading" size="small" border>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="aiStatusTag(row.status)" size="small">{{ aiStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="importanceScore" label="重要性" width="80" align="center" />
              <el-table-column prop="influenceScore" label="影响力" width="80" align="center" />
              <el-table-column prop="referenceScore" label="参考价值" width="90" align="center" />
              <el-table-column prop="totalScore" label="综合" width="70" align="center" />
              <el-table-column prop="scoreTags" label="标签" show-overflow-tooltip />
              <el-table-column prop="errorMsg" label="错误信息" show-overflow-tooltip />
              <el-table-column prop="createdAt" label="创建时间" width="155">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, ArrowDown } from '@element-plus/icons-vue'
import {
  getCaseDetail, triggerTranslation, triggerEnrich, triggerSummary, triggerScore, syncFastgptKnowledge,
  getTranslationRecords, getSummaryRecords, getScoreRecords
} from '@/api/cases'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const caseData = ref(null)
const contentTab = ref('en')
const recordTab = ref('translation')
const recordLoading = ref(false)
const translationRecords = ref([])
const summaryRecords = ref([])
const scoreRecords = ref([])
const syncFastgptLoading = ref(false)

const scoreItems = [
  { label: '重要性', key: 'importanceScore' },
  { label: '影响力', key: 'influenceScore' },
  { label: '参考价值', key: 'referenceScore' },
  { label: '综合评分', key: 'totalScore' },
]

const caseTypeMap = { 1: '民事', 2: '刑事', 3: '行政', 4: '商事' }
const caseTypeTagMap = { 1: '', 2: 'danger', 3: 'warning', 4: 'success' }
const aiStatusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '失败' }
const aiStatusTagMap = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }

const fastgptSyncMap = { 0: '未同步', 1: '同步中', 2: '已同步', 3: '失败' }
const fastgptSyncTagMap = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }

const caseTypeLabel = (v) => caseTypeMap[v] || '-'
const caseTypeTag = (v) => caseTypeTagMap[v] || ''
const aiStatusLabel = (v) => aiStatusMap[v] ?? '-'
const aiStatusTag = (v) => aiStatusTagMap[v] || 'info'
const fastgptSyncLabel = (v) => fastgptSyncMap[v == null ? 0 : v] ?? '-'
const fastgptSyncTag = (v) => fastgptSyncTagMap[v == null ? 0 : v] || 'info'
const scoreTag = (v) => v >= 80 ? 'danger' : v >= 60 ? 'warning' : 'info'
const progressColor = (v) => v >= 80 ? '#F56C6C' : v >= 60 ? '#E6A23C' : '#409EFF'
const formatDate = (d) => d ? d.replace('T', ' ').slice(0, 16) : '-'

async function loadDetail() {
  loading.value = true
  try {
    const res = await getCaseDetail(route.params.id)
    caseData.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadRecords(tab) {
  recordLoading.value = true
  try {
    const id = route.params.id
    if (tab === 'translation') {
      const res = await getTranslationRecords(id)
      translationRecords.value = res.data || []
    } else if (tab === 'summary') {
      const res = await getSummaryRecords(id)
      summaryRecords.value = res.data || []
    } else if (tab === 'score') {
      const res = await getScoreRecords(id)
      scoreRecords.value = res.data || []
    }
  } finally {
    recordLoading.value = false
  }
}

async function handleAction(cmd) {
  if (cmd === 'translate') {
    await triggerTranslation(route.params.id)
    ElMessage.success('翻译任务已提交，正在后台处理')
  } else if (cmd === 'enrich') {
    await triggerEnrich(route.params.id)
    ElMessage.success('字段补全任务已提交，正在后台处理')
  } else if (cmd === 'summary') {
    await triggerSummary(route.params.id)
    ElMessage.success('摘要任务已提交，正在后台处理')
  } else if (cmd === 'score') {
    await triggerScore(route.params.id)
    ElMessage.success('评分任务已提交，正在后台处理')
  } else if (cmd === 'syncFastgpt') {
    await handleSyncFastgpt()
  }
}

async function handleSyncFastgpt() {
  if (caseData.value?.aiStatus !== 2) {
    ElMessage.warning('请先完成 AI 处理后再推送知识库')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定将本案例推送至 FastGPT 知识库吗？若再次推送，知识库中可能产生多条记录。',
      '同步知识库',
      { type: 'info' }
    )
  } catch {
    return
  }
  syncFastgptLoading.value = true
  try {
    await syncFastgptKnowledge(route.params.id)
    ElMessage.success('知识库同步任务已提交，请稍后刷新页面查看状态')
    await loadDetail()
  } finally {
    syncFastgptLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
  loadRecords('translation')
})
</script>

<style scoped>
.case-detail-page { max-width: 1200px; }

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  flex: 1;
}

.header-actions { display: flex; gap: 8px; }

.detail-card { margin-bottom: 16px; }

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title { font-weight: 600; font-size: 15px; }
.tags { display: flex; gap: 6px; }

.score-row { margin: 8px 0; }

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.score-label {
  font-size: 13px;
  color: #606266;
}

.mono-text {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
}

.error-text {
  color: #f56c6c;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.hint-muted {
  margin: 12px 0 0;
  font-size: 13px;
  color: #909399;
}

.content-block {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  max-height: 500px;
  overflow-y: auto;
  padding: 4px;
}
</style>
