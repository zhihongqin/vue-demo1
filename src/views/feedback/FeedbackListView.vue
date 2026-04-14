<template>
  <div class="feedback-page">
    <div class="page-header">
      <h2>用户反馈</h2>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="tip"
      title="小程序用户提交的反馈将出现在此列表。可将状态设为「已处理」并填写处理说明。"
    />

    <el-card class="filter-card">
      <el-form :model="query" inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="未处理" :value="0" />
            <el-option label="已处理" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="搜索反馈内容"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
        <el-table-column prop="userNickname" label="用户" width="120" show-overflow-tooltip />
        <el-table-column prop="content" label="反馈内容" min-width="220" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系方式" width="130" show-overflow-tooltip />
        <el-table-column prop="clientInfo" label="客户端" width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.status === 1 ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="adminReply" label="处理说明" min-width="140" show-overflow-tooltip />
        <el-table-column prop="processorNickname" label="处理人" width="100" show-overflow-tooltip />
        <el-table-column prop="processedAt" label="处理时间" width="170" />
        <el-table-column prop="createdAt" label="提交时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openProcess(row)">处理</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      title="处理反馈"
      width="720px"
      class="feedback-process-dialog"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="反馈内容">
          <el-input
            :model-value="currentRow?.content || ''"
            type="textarea"
            :rows="12"
            readonly
            class="feedback-content-preview"
          />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="form.status">
            <el-radio :label="0">未处理</el-radio>
            <el-radio :label="1">已处理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="form.adminReply"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
            placeholder="选填，可记录处理结果或备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProcess">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getFeedbackPage, processFeedback } from '@/api/feedback'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const currentRow = ref(null)

const query = reactive({
  status: undefined,
  keyword: '',
  pageNum: 1,
  pageSize: 10
})

const form = reactive({
  status: 1,
  adminReply: ''
})

function buildQueryParams() {
  const p = {
    pageNum: query.pageNum,
    pageSize: query.pageSize
  }
  if (query.status === 0 || query.status === 1) p.status = query.status
  const kw = query.keyword?.trim()
  if (kw) p.keyword = kw
  return p
}

async function loadData() {
  loading.value = true
  try {
    const res = await getFeedbackPage(buildQueryParams())
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
  query.status = undefined
  query.keyword = ''
  query.pageNum = 1
  query.pageSize = 10
  loadData()
}

function openProcess(row) {
  currentRow.value = row
  form.status = row.status === 1 ? 1 : 0
  form.adminReply = row.adminReply || ''
  dialogVisible.value = true
}

async function submitProcess() {
  if (!currentRow.value) return
  submitting.value = true
  try {
    await processFeedback(currentRow.value.id, {
      status: form.status,
      adminReply: form.adminReply?.trim() || undefined
    })
    ElMessage.success('已保存')
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.feedback-page {
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

</style>

<!-- el-dialog 默认 teleport 到 body，scoped 无法作用到弹窗内 -->
<style>
.feedback-process-dialog .feedback-content-preview textarea,
.feedback-process-dialog .feedback-content-preview .el-textarea__inner {
  min-height: 320px !important;
  max-height: 52vh;
  font-size: 14px;
  line-height: 1.65;
  resize: vertical;
}
</style>
