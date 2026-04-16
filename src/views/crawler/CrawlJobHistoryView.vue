<template>
  <div class="crawl-history-page">
    <div class="page-header">
      <h2>爬取记录</h2>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="tip"
      title="记录 CourtListener 与日本裁判所爬虫的每次任务：参数、状态与入库条数。"
    />

    <el-card class="filter-card">
      <el-form :model="query" inline>
        <el-form-item label="采集类型">
          <el-select v-model="query.crawlType" placeholder="全部" clearable style="width: 180px">
            <el-option label="CourtListener" value="COURTLISTENER" />
            <el-option label="日本裁判所" value="JAPAN_COURTS" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="运行中" :value="0" />
            <el-option label="已成功结束" :value="1" />
            <el-option label="已失败结束" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="crawlTypeLabel" label="采集类型" width="130" />
        <el-table-column label="参数摘要" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ paramsSummary(row.paramsJson) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.statusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入库条数" width="100" align="center">
          <template #default="{ row }">
            {{ row.savedCount != null ? row.savedCount : '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="失败原因" min-width="160" show-overflow-tooltip />
        <el-table-column prop="startedBy" label="触发用户ID" width="110" align="center">
          <template #default="{ row }">
            {{ row.startedBy != null ? row.startedBy : '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" width="170" />
        <el-table-column prop="finishedAt" label="结束时间" width="170">
          <template #default="{ row }">
            {{ row.finishedAt || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openParams(row)">参数 JSON</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSearch"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="paramsDialogVisible" title="采集参数（JSON）" width="640px" destroy-on-close>
      <pre class="json-pre">{{ formattedParams }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getCrawlJobPage } from '@/api/crawlJobs'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const paramsDialogVisible = ref(false)
const currentParamsJson = ref('')

const query = reactive({
  crawlType: undefined,
  status: undefined,
  pageNum: 1,
  pageSize: 10
})

const formattedParams = computed(() => {
  const raw = currentParamsJson.value
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
})

function statusTagType(status) {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

function paramsSummary(jsonStr) {
  if (!jsonStr) return ''
  try {
    const o = JSON.parse(jsonStr)
    if (o.mode === 'FULL') {
      return `全量 · 每词 ${o.maxPagesPerKeyword ?? '?'} 页 · 关键词数 ${o.keywordCount ?? '?'} · ${o.trigger || ''}`
    }
    if (o.mode === 'SINGLE') {
      return `单关键词 · 「${o.keyword || ''}」 · max ${o.maxPages ?? '?'} 页`
    }
    if (o.query1 != null) {
      return `日本 · query1: ${o.query1}${o.maxPages != null ? ` · maxPages ${o.maxPages}` : ''}`
    }
  } catch {
    /* ignore */
  }
  return jsonStr.length > 120 ? jsonStr.slice(0, 120) + '…' : jsonStr
}

function buildQueryParams() {
  const p = {
    pageNum: query.pageNum,
    pageSize: query.pageSize
  }
  if (query.crawlType) p.crawlType = query.crawlType
  if (query.status === 0 || query.status === 1 || query.status === 2) p.status = query.status
  return p
}

async function loadData() {
  loading.value = true
  try {
    const res = await getCrawlJobPage(buildQueryParams())
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
  query.crawlType = undefined
  query.status = undefined
  query.pageNum = 1
  query.pageSize = 10
  loadData()
}

function openParams(row) {
  currentParamsJson.value = row.paramsJson || ''
  paramsDialogVisible.value = true
}

onMounted(() => loadData())
</script>

<style scoped>
.crawl-history-page {
  padding: 0 4px 24px;
}
.page-header {
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.tip {
  margin-bottom: 16px;
}
.filter-card {
  margin-bottom: 16px;
}
.table-card {
  margin-bottom: 16px;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.json-pre {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 60vh;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
