<template>
  <div class="case-list-page">
    <div class="page-header">
      <h2>案例管理</h2>
      <el-button type="primary" :icon="Plus" @click="$router.push('/cases/create')">新增案例</el-button>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="filter-card">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="标题/案由/关键词" clearable style="width:200px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="案件类型">
          <el-select v-model="query.caseType" placeholder="全部" clearable style="width:120px">
            <el-option label="民事" :value="1" />
            <el-option label="刑事" :value="2" />
            <el-option label="行政" :value="3" />
            <el-option label="商事" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家/地区">
          <el-input v-model="query.country" placeholder="如：美国" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="query.orderBy" style="width:130px">
            <el-option label="创建时间" value="created_at" />
            <el-option label="重要性评分" value="importance_score" />
            <el-option label="浏览次数" value="view_count" />
            <el-option label="判决日期" value="judgment_date" />
          </el-select>
          <el-select v-model="query.orderDir" style="width:80px; margin-left:8px">
            <el-option label="降序" value="desc" />
            <el-option label="升序" value="asc" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 案例表格 -->
    <el-card class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width:100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="标题" min-width="220">
          <template #default="{ row }">
            <div class="case-title">
              <div class="title-zh" v-if="row.titleZh">{{ row.titleZh }}</div>
              <div class="title-en text-muted" v-if="row.titleEn">{{ row.titleEn }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="caseType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="caseTypeTag(row.caseType)" size="small">{{ caseTypeLabel(row.caseType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country" label="国家/地区" width="110" show-overflow-tooltip />
        <el-table-column prop="court" label="法院" width="150" show-overflow-tooltip />
        <el-table-column prop="judgmentDate" label="判决日期" width="110" align="center" />
        <el-table-column prop="aiStatus" label="AI状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="aiStatusTag(row.aiStatus)" size="small">{{ aiStatusLabel(row.aiStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="删除状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDeleted === 1" type="danger" size="small">已删除</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="importanceScore" label="重要性" width="80" align="center" sortable="custom">
          <template #default="{ row }">
            <span v-if="row.importanceScore != null" :style="{ color: scoreColor(row.importanceScore), fontWeight: 600 }">
              {{ row.importanceScore }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="70" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="155">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="$router.push(`/cases/${row.id}`)">详情</el-button>
            <template v-if="row.isDeleted !== 1">
              <el-button text type="warning" size="small" @click="$router.push(`/cases/${row.id}/edit`)">编辑</el-button>
              <el-dropdown size="small" @command="(cmd) => handleAction(cmd, row)">
                <el-button text size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="translate">触发翻译</el-dropdown-item>
                    <el-dropdown-item command="summary">触发摘要</el-dropdown-item>
                    <el-dropdown-item command="score">触发评分</el-dropdown-item>
                    <el-dropdown-item command="aiComplete" :disabled="row.aiStatus === 2">标记AI已完成</el-dropdown-item>
                    <el-dropdown-item divided command="softDelete" style="color:#E6A23C">逻辑删除</el-dropdown-item>
                    <el-dropdown-item command="hardDelete" style="color:#F56C6C">永久删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button text type="warning" size="small" @click="$router.push(`/cases/${row.id}/edit`)">编辑</el-button>
              <el-button text type="success" size="small" @click="handleAction('restore', row)">恢复</el-button>
              <el-button text type="danger" size="small" @click="handleAction('hardDelete', row)">永久删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import {
  getCaseList, softDeleteCase, restoreCase, hardDeleteCase,
  triggerTranslation, triggerSummary, triggerScore, markAiCompleted
} from '@/api/cases'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  caseType: null,
  country: '',
  orderBy: 'created_at',
  orderDir: 'desc',
  pageNum: 1,
  pageSize: 10,
})

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

async function loadData() {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.keyword) delete params.keyword
    if (!params.caseType) delete params.caseType
    if (!params.country) delete params.country
    const res = await getCaseList(params)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.caseType = null
  query.country = ''
  query.orderBy = 'created_at'
  query.orderDir = 'desc'
  query.pageNum = 1
  loadData()
}

function handleSortChange({ prop, order }) {
  if (prop === 'importanceScore') {
    query.orderBy = 'importance_score'
    query.orderDir = order === 'ascending' ? 'asc' : 'desc'
    loadData()
  }
}

async function handleAction(cmd, row) {
  if (cmd === 'translate') {
    await triggerTranslation(row.id)
    ElMessage.success('翻译任务已提交')
  } else if (cmd === 'summary') {
    await triggerSummary(row.id)
    ElMessage.success('摘要任务已提交')
  } else if (cmd === 'score') {
    await triggerScore(row.id)
    ElMessage.success('评分任务已提交')
  } else if (cmd === 'aiComplete') {
    await ElMessageBox.confirm(
      `确定将案例「${row.titleZh || row.titleEn}」的 AI 状态强制标记为已完成吗？`,
      '提示',
      { type: 'warning' }
    )
    await markAiCompleted(row.id)
    ElMessage.success('AI状态已标记为已完成')
    loadData()
  } else if (cmd === 'restore') {
    await restoreCase(row.id)
    ElMessage.success('案例已恢复')
    loadData()
  } else if (cmd === 'softDelete') {
    await ElMessageBox.confirm(`确定要逻辑删除案例「${row.titleZh || row.titleEn}」吗？`, '提示', { type: 'warning' })
    await softDeleteCase(row.id)
    ElMessage.success('案例已删除')
    loadData()
  } else if (cmd === 'hardDelete') {
    await ElMessageBox.confirm(
      `永久删除操作不可逆！确定要彻底删除案例「${row.titleZh || row.titleEn}」吗？`,
      '危险操作',
      { type: 'error', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' }
    )
    await hardDeleteCase(row.id)
    ElMessage.success('案例已永久删除')
    loadData()
  }
}

onMounted(loadData)
</script>

<style scoped>
.case-list-page { max-width: 1400px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}

.filter-card { margin-bottom: 16px; }

.table-card { }

.case-title { line-height: 1.4; }
.title-zh { font-size: 13px; font-weight: 500; color: #333; }
.title-en { font-size: 12px; margin-top: 2px; }
.text-muted { color: #c0c4cc; }

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
