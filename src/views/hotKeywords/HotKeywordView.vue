<template>
  <div class="hot-keyword-page">
    <div class="page-header">
      <h2>热门搜索词</h2>
      <div class="header-actions">
        <el-button type="success" :icon="Refresh" :loading="refreshing" @click="handleRefresh">
          从搜索历史同步
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增关键词</el-button>
      </div>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="tip"
      title="说明：每日凌晨自动根据近30天搜索记录更新「统计同步」类词条；置顶词条不会被自动下线；管理员可手动新增/排序/启用禁用。"
    />

    <el-card class="filter-card">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="模糊匹配" clearable style="width: 180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="展示">
          <el-select v-model="query.isEnabled" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="置顶">
          <el-select v-model="query.isPinned" placeholder="全部" clearable style="width: 120px">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="query.origin" placeholder="全部" clearable style="width: 120px">
            <el-option label="统计同步" :value="0" />
            <el-option label="手动新增" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-toolbar">
        <el-button
          type="danger"
          :disabled="selectedIds.length === 0"
          :icon="Delete"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        stripe
        border
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="keyword" label="关键词" min-width="140" />
        <el-table-column prop="searchCount" label="搜索次数(周期)" width="130" align="center" />
        <el-table-column prop="sortOrder" label="排序权重" width="100" align="center" />
        <el-table-column label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isPinned === 1 ? 'warning' : 'info'" size="small">
              {{ row.isPinned === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="展示" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled === 1 ? 'success' : 'danger'" size="small">
              {{ row.isEnabled === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="100" align="center">
          <template #default="{ row }">
            {{ row.origin === 1 ? '手动' : '统计' }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSearch"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑热词' : '新增热词'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="!editId" label="关键词" prop="keyword">
          <el-input v-model="form.keyword" placeholder="输入展示给用户的搜索词" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item v-else label="关键词">
          <el-input v-model="form.keyword" disabled />
        </el-form-item>
        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="99999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isPinned" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用展示">
          <el-switch v-model="form.isEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, RefreshLeft, Delete } from '@element-plus/icons-vue'
import {
  getHotKeywordPage,
  createHotKeyword,
  updateHotKeyword,
  deleteHotKeyword,
  batchDeleteHotKeywords,
  refreshHotKeywords
} from '@/api/hotKeywords'

const loading = ref(false)
const refreshing = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const tableRef = ref()
const selectedIds = ref([])

const query = reactive({
  keyword: '',
  isEnabled: undefined,
  isPinned: undefined,
  origin: undefined,
  pageNum: 1,
  pageSize: 10
})

const form = reactive({
  keyword: '',
  sortOrder: 0,
  isPinned: 0,
  isEnabled: 1
})

const rules = {
  keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }]
}

function buildQueryParams() {
  const p = {
    pageNum: query.pageNum,
    pageSize: query.pageSize
  }
  const kw = query.keyword?.trim()
  if (kw) p.keyword = kw
  if (query.isEnabled === 0 || query.isEnabled === 1) p.isEnabled = query.isEnabled
  if (query.isPinned === 0 || query.isPinned === 1) p.isPinned = query.isPinned
  if (query.origin === 0 || query.origin === 1) p.origin = query.origin
  return p
}

async function loadData() {
  loading.value = true
  try {
    const res = await getHotKeywordPage(buildQueryParams())
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id)
}

function handleSearch() {
  query.pageNum = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.isEnabled = undefined
  query.isPinned = undefined
  query.origin = undefined
  query.pageNum = 1
  query.pageSize = 10
  loadData()
}

function openDialog(row) {
  editId.value = row?.id || null
  if (row) {
    form.keyword = row.keyword
    form.sortOrder = row.sortOrder ?? 0
    form.isPinned = row.isPinned ?? 0
    form.isEnabled = row.isEnabled ?? 1
  } else {
    form.keyword = ''
    form.sortOrder = 0
    form.isPinned = 0
    form.isEnabled = 1
  }
  dialogVisible.value = true
}

async function submitForm() {
  if (!editId.value) {
    await formRef.value?.validate()
  }
  submitting.value = true
  try {
    if (editId.value) {
      await updateHotKeyword(editId.value, {
        sortOrder: form.sortOrder,
        isPinned: form.isPinned,
        isEnabled: form.isEnabled
      })
      ElMessage.success('已更新')
    } else {
      await createHotKeyword({
        keyword: form.keyword.trim(),
        sortOrder: form.sortOrder,
        isPinned: form.isPinned,
        isEnabled: form.isEnabled
      })
      ElMessage.success('已添加')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.keyword}」？`, '提示', { type: 'warning' })
  await deleteHotKeyword(row.id)
  ElMessage.success('已删除')
  tableRef.value?.clearSelection()
  loadData()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条热词？`, '批量删除', { type: 'warning' })
  await batchDeleteHotKeywords([...selectedIds.value])
  ElMessage.success('批量删除成功')
  tableRef.value?.clearSelection()
  loadData()
}

async function handleRefresh() {
  refreshing.value = true
  try {
    await refreshHotKeywords()
    ElMessage.success('同步完成')
    loadData()
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.hot-keyword-page {
  max-width: 1280px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.tip {
  margin-bottom: 16px;
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.table-toolbar {
  margin-bottom: 12px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
