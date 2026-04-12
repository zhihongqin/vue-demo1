<template>
  <div class="case-form-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>{{ isEdit ? '编辑案例' : '新增案例' }}</h2>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      v-loading="pageLoading"
    >
      <el-row :gutter="24">
        <!-- 左列 -->
        <el-col :span="12">
          <el-card class="form-card">
            <template #header><span class="card-title">基本信息</span></template>

            <el-form-item label="英文标题" prop="titleEn">
              <el-input v-model="form.titleEn" placeholder="案例英文标题（必填）" />
            </el-form-item>
            <el-form-item label="中文标题" prop="titleZh">
              <el-input v-model="form.titleZh" placeholder="中文标题（可由AI生成）" />
            </el-form-item>
            <el-form-item label="案例编号" prop="caseNo">
              <el-input v-model="form.caseNo" placeholder="案例编号" />
            </el-form-item>
            <el-form-item label="案件类型" prop="caseType">
              <el-select v-model="form.caseType" placeholder="请选择" style="width:100%">
                <el-option label="民事" :value="1" />
                <el-option label="刑事" :value="2" />
                <el-option label="行政" :value="3" />
                <el-option label="商事" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="国家/地区" prop="country">
              <el-input v-model="form.country" placeholder="如：美国、英国" />
            </el-form-item>
            <el-form-item label="审理法院" prop="court">
              <el-input v-model="form.court" placeholder="审理法院名称" />
            </el-form-item>
            <el-form-item label="判决日期" prop="judgmentDate">
              <el-date-picker
                v-model="form.judgmentDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width:100%"
              />
            </el-form-item>
            <el-form-item label="来源" prop="source">
              <el-input v-model="form.source" placeholder="案例发布来源（必填）" />
            </el-form-item>
            <el-form-item label="原始链接" prop="url">
              <el-input v-model="form.url" placeholder="案例原始访问链接（必填）" />
            </el-form-item>
            <el-form-item label="原文PDF链接" prop="pdfUrl">
              <el-input v-model="form.pdfUrl" placeholder="原文PDF链接（可选，日本裁判所等）" />
            </el-form-item>
            <el-form-item label="关键词" prop="keywords">
              <el-input v-model="form.keywords" placeholder="多个关键词用逗号分隔" />
            </el-form-item>
            <el-form-item label="涉及法律条文" prop="legalProvisions">
              <el-input v-model="form.legalProvisions" type="textarea" :rows="3" placeholder="涉及的法律条文" />
            </el-form-item>
          </el-card>
        </el-col>

        <!-- 右列 -->
        <el-col :span="12">
          <el-card class="form-card">
            <template #header><span class="card-title">案例内容</span></template>

            <el-form-item label="英文原文" prop="contentEn">
              <el-input
                v-model="form.contentEn"
                type="textarea"
                :rows="10"
                placeholder="案例英文原文（必填）"
              />
            </el-form-item>
            <el-form-item label="中文翻译" prop="contentZh" v-if="isEdit">
              <el-input
                v-model="form.contentZh"
                type="textarea"
                :rows="10"
                placeholder="中文翻译（可由AI生成）"
              />
            </el-form-item>
          </el-card>

          <el-card class="form-card" style="margin-top:16px" v-if="isEdit">
            <template #header><span class="card-title">AI处理结果（可人工校正）</span></template>

            <el-form-item label="案由" prop="caseReason">
              <el-input v-model="form.caseReason" placeholder="案由" />
            </el-form-item>
            <el-form-item label="争议焦点" prop="disputeFocus">
              <el-input v-model="form.disputeFocus" type="textarea" :rows="3" placeholder="争议焦点" />
            </el-form-item>
            <el-form-item label="判决结果" prop="judgmentResult">
              <el-input v-model="form.judgmentResult" type="textarea" :rows="3" placeholder="判决结果" />
            </el-form-item>
            <el-form-item label="核心摘要" prop="summaryZh">
              <el-input v-model="form.summaryZh" type="textarea" :rows="3" placeholder="核心摘要" />
            </el-form-item>
            <el-form-item label="重要性评分" prop="importanceScore">
              <el-input-number v-model="form.importanceScore" :min="0" :max="100" style="width:100%" />
            </el-form-item>
            <el-form-item label="评分理由" prop="scoreReason">
              <el-input v-model="form.scoreReason" type="textarea" :rows="3" placeholder="评分理由" />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <div class="form-footer">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
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
import { ArrowLeft } from '@element-plus/icons-vue'
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
  titleEn: [{ required: true, message: '请输入英文标题', trigger: 'blur' }],
  contentEn: [{ required: true, message: '请输入英文原文', trigger: 'blur' }],
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
.case-form-page { max-width: 1400px; }

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
}

.form-card { }
.card-title { font-weight: 600; font-size: 15px; }

.form-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px 0;
}
</style>
