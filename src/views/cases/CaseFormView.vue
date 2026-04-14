<template>
  <div class="case-form-page">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <el-button class="back-btn" :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <div class="header-title">
        <h2>{{ isEdit ? '编辑案例' : '新增案例' }}</h2>
        <span class="header-sub">{{ isEdit ? '修改案例信息及AI处理结果' : '填写案例基本信息，提交后AI自动处理' }}</span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      v-loading="pageLoading"
    >
      <!-- 卡片1：基本信息 -->
      <el-card class="form-card info-card">
        <template #header>
          <div class="card-header">
            <span class="card-icon">📋</span>
            <span class="card-title">基本信息</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原文标题" prop="titleEn" class="label-top">
              <el-input v-model="form.titleEn" placeholder="案例原文标题（必填）" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中文标题" prop="titleZh" class="label-top">
              <el-input v-model="form.titleZh" placeholder="中文标题（可由AI生成）" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="案例编号" prop="caseNo" class="label-top">
              <el-input v-model="form.caseNo" placeholder="案例编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="案件类型" prop="caseType" class="label-top">
              <el-select v-model="form.caseType" placeholder="请选择" style="width:100%">
                <el-option label="民事" :value="1" />
                <el-option label="刑事" :value="2" />
                <el-option label="行政" :value="3" />
                <el-option label="商事" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="国家/地区" prop="country" class="label-top">
              <el-input v-model="form.country" placeholder="如：日本、美国" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="判决日期" prop="judgmentDate" class="label-top">
              <el-date-picker
                v-model="form.judgmentDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="审理法院" prop="court" class="label-top">
              <el-input v-model="form.court" placeholder="审理法院名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="来源" prop="source" class="label-top">
              <el-input v-model="form.source" placeholder="案例发布来源（必填）" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关键词" prop="keywords" class="label-top">
              <el-input v-model="form.keywords" placeholder="多个关键词用逗号分隔" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原始链接" prop="url" class="label-top">
              <el-input v-model="form.url" placeholder="案例原始访问链接（必填）" clearable>
                <template #prefix><el-icon><Link /></el-icon></template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原文PDF链接" prop="pdfUrl" class="label-top">
              <el-input v-model="form.pdfUrl" placeholder="原文PDF链接（可选）" clearable>
                <template #prefix><el-icon><Link /></el-icon></template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="涉及法律条文" prop="legalProvisions" class="label-top">
          <el-input
            v-model="form.legalProvisions"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="涉及的法律条文，如：民法415条第1项…"
            class="long-textarea"
          />
        </el-form-item>
      </el-card>

      <!-- 卡片2：案例内容 -->
      <el-card class="form-card content-card">
        <template #header>
          <div class="card-header">
            <span class="card-icon">📄</span>
            <span class="card-title">案例内容</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="isEdit ? 12 : 24">
            <el-form-item label="原文" prop="contentEn" class="label-top">
              <el-input
                v-model="form.contentEn"
                type="textarea"
                :autosize="{ minRows: 14, maxRows: 40 }"
                placeholder="案例原文（必填）"
                class="long-textarea"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isEdit">
            <el-form-item label="中文翻译" prop="contentZh" class="label-top">
              <el-input
                v-model="form.contentZh"
                type="textarea"
                :autosize="{ minRows: 14, maxRows: 40 }"
                placeholder="中文翻译（可由AI生成）"
                class="long-textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 卡片3：AI处理结果 -->
      <el-card class="form-card ai-card" v-if="isEdit">
        <template #header>
          <div class="card-header">
            <span class="card-icon">✨</span>
            <span class="card-title">AI处理结果</span>
            <el-tag size="small" type="warning" style="margin-left:8px">可人工校正</el-tag>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="18">
            <el-form-item label="案由" prop="caseReason" class="label-top">
              <el-input v-model="form.caseReason" placeholder="案由" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="重要性评分" prop="importanceScore" class="label-top">
              <el-input-number
                v-model="form.importanceScore"
                :min="0"
                :max="100"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="争议焦点" prop="disputeFocus" class="label-top">
              <el-input
                v-model="form.disputeFocus"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 12 }"
                placeholder="争议焦点"
                class="long-textarea"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="判决结果" prop="judgmentResult" class="label-top">
              <el-input
                v-model="form.judgmentResult"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 12 }"
                placeholder="判决结果"
                class="long-textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="核心摘要" prop="summaryZh" class="label-top">
              <el-input
                v-model="form.summaryZh"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 10 }"
                placeholder="核心摘要"
                class="long-textarea"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评分理由" prop="scoreReason" class="label-top">
              <el-input
                v-model="form.scoreReason"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 10 }"
                placeholder="评分理由"
                class="long-textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 底部操作栏 -->
      <div class="form-footer">
        <el-button size="large" @click="$router.back()">取消</el-button>
        <el-button size="large" type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '提交并启动AI处理' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Link } from '@element-plus/icons-vue'
import { getCaseDetail, createCase, updateCase } from '@/api/cases'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const pageLoading = ref(false)
const submitLoading = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  titleEn: '', titleZh: '', caseNo: '', caseType: null,
  country: '', court: '', judgmentDate: null,
  source: '', url: '', pdfUrl: '', keywords: '', legalProvisions: '',
  contentEn: '', contentZh: '',
  caseReason: '', disputeFocus: '', judgmentResult: '',
  summaryZh: '', importanceScore: null, scoreReason: '',
})

const rules = {
  titleEn: [{ required: true, message: '请输入原文标题', trigger: 'blur' }],
  contentEn: [{ required: true, message: '请输入原文', trigger: 'blur' }],
  source: [{ required: true, message: '请输入案例来源', trigger: 'blur' }],
  url: [{ required: true, message: '请输入原始链接', trigger: 'blur' }],
}

onMounted(async () => {
  if (isEdit.value) {
    pageLoading.value = true
    try {
      const res = await getCaseDetail(route.params.id)
      const d = res.data
      Object.keys(form).forEach(k => {
        if (d[k] !== undefined) form[k] = d[k]
      })
    } finally {
      pageLoading.value = false
    }
  }
})

async function handleSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const payload = { ...form }
    Object.keys(payload).forEach(k => {
      if (payload[k] === '' || payload[k] === null) delete payload[k]
    })

    if (isEdit.value) {
      await updateCase(route.params.id, payload)
      ElMessage.success('案例已更新')
    } else {
      const res = await createCase(payload)
      ElMessage.success(`案例创建成功，ID: ${res.data}，AI处理已在后台启动`)
    }
    router.push('/cases')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
/* ─── 页面容器 ─── */
.case-form-page {
  max-width: 1600px;
  padding-bottom: 40px;
}

/* ─── 顶部标题 ─── */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 18px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.back-btn {
  flex-shrink: 0;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1d2939;
  line-height: 1.4;
}

.header-sub {
  font-size: 13px;
  color: #8c8c8c;
}

/* ─── 卡片通用 ─── */
.form-card {
  border-radius: 12px;
  border: 1px solid #eaeef3;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.form-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafbfc;
  border-radius: 12px 12px 0 0;
}

.form-card :deep(.el-card__body) {
  padding: 20px;
}

/* ─── 卡片头部 ─── */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  color: #1d2939;
}

.card-icon {
  font-size: 16px;
}

/* ─── 卡片主题色左边框 ─── */
.info-card {
  border-left: 3px solid #409eff;
}

.content-card {
  border-left: 3px solid #67c23a;
}

.ai-card {
  border-left: 3px solid #e6a23c;
}

/* ─── label-top 样式（标签置顶） ─── */
.label-top :deep(.el-form-item__label) {
  float: none;
  display: block;
  text-align: left;
  padding-bottom: 4px;
  font-size: 13px;
  color: #4a5568;
  font-weight: 500;
  line-height: 1.5;
  width: auto !important;
}

.label-top :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.label-top {
  margin-bottom: 16px;
}

/* ─── 长文本域 ─── */
.long-textarea :deep(.el-textarea__inner) {
  font-size: 13.5px;
  line-height: 1.75;
  letter-spacing: 0.01em;
  resize: vertical;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', monospace;
  color: #2d3748;
  background: #fdfeff;
  border-radius: 6px;
}

.long-textarea :deep(.el-textarea__inner:focus) {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(64,158,255,0.15);
}

/* ─── 底部操作栏 ─── */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  padding: 20px 24px;
}
</style>
