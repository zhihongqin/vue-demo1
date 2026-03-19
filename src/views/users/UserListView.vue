<template>
  <div class="user-list-page">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <!-- 搜索 -->
    <el-card class="filter-card">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="昵称或账号"
            clearable
            style="width:200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户表格 -->
    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :size="36" :src="row.avatarUrl" :icon="UserFilled" />
              <div>
                <div class="nickname">{{ row.nickname || row.username || '-' }}</div>
                <div class="username text-muted" v-if="row.username">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : ''" size="small">
              {{ row.role === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="createdAt" label="注册时间" width="155">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <!-- 禁用/启用 -->
            <el-button
              text
              :type="row.status === 0 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 0 ? '禁用' : '启用' }}
            </el-button>

            <!-- 设置/取消管理员 -->
            <el-button
              text
              :type="row.role === 1 ? 'info' : 'primary'"
              size="small"
              @click="row.role === 1 ? handleRemoveAdmin(row) : showSetAdminDialog(row)"
            >
              {{ row.role === 1 ? '取消管理员' : '设为管理员' }}
            </el-button>

            <!-- 删除 -->
            <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 设置管理员对话框 -->
    <el-dialog v-model="adminDialogVisible" title="设置管理员账号" width="420px" :close-on-click-modal="false">
      <el-alert type="info" :closable="false" style="margin-bottom:16px">
        为该用户设置管理员账号和密码，设置后可通过账号密码登录管理后台。
      </el-alert>
      <el-form ref="adminFormRef" :model="adminForm" :rules="adminRules" label-width="90px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="adminForm.username" placeholder="管理员登录账号" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
          <el-input v-model="adminForm.password" type="password" show-password placeholder="管理员登录密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adminDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adminLoading" @click="handleSetAdmin">确认设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, UserFilled } from '@element-plus/icons-vue'
import { getUserList, updateUserStatus, updateUserRole, deleteUser } from '@/api/user'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({ keyword: '', page: 1, pageSize: 20 })

const adminDialogVisible = ref(false)
const adminLoading = ref(false)
const adminFormRef = ref()
const currentUserId = ref(null)
const adminForm = reactive({ username: '', password: '' })
const adminRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于6位', trigger: 'blur' }
  ]
}

const formatDate = (d) => d ? d.replace('T', ' ').slice(0, 16) : '-'

async function loadData() {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.keyword) delete params.keyword
    const res = await getUserList(params)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() { query.page = 1; loadData() }
function handleReset() { query.keyword = ''; query.page = 1; loadData() }

async function handleToggleStatus(row) {
  const newStatus = row.status === 0 ? 1 : 0
  const action = newStatus === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定要${action}用户「${row.nickname || row.username}」吗？`, '提示', { type: 'warning' })
  await updateUserStatus(row.id, newStatus)
  ElMessage.success(`已${action}`)
  loadData()
}

function showSetAdminDialog(row) {
  currentUserId.value = row.id
  adminForm.username = ''
  adminForm.password = ''
  adminDialogVisible.value = true
}

async function handleSetAdmin() {
  await adminFormRef.value.validate()
  adminLoading.value = true
  try {
    await updateUserRole(currentUserId.value, { role: 1, ...adminForm })
    ElMessage.success('已设置为管理员')
    adminDialogVisible.value = false
    loadData()
  } finally {
    adminLoading.value = false
  }
}

async function handleRemoveAdmin(row) {
  await ElMessageBox.confirm(`确定要取消「${row.nickname || row.username}」的管理员权限吗？`, '提示', { type: 'warning' })
  await updateUserRole(row.id, { role: 0 })
  ElMessage.success('已取消管理员权限')
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定要删除用户「${row.nickname || row.username}」吗？此操作不可逆。`, '危险操作', { type: 'error' })
  await deleteUser(row.id)
  ElMessage.success('用户已删除')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.user-list-page { max-width: 1200px; }

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

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nickname { font-size: 13px; font-weight: 500; color: #333; }
.username { font-size: 12px; }
.text-muted { color: #c0c4cc; }

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
