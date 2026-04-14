<template>
  <div class="crawler-page">
    <div class="page-header">
      <h2>爬虫管理</h2>
      <el-button :icon="Refresh" @click="refreshStatus">刷新状态</el-button>
    </div>

    <el-row :gutter="20">
      <!-- CourtListener 爬虫 -->
      <el-col :span="12">
        <el-card class="crawler-card">
          <template #header>
            <div class="card-header-row">
              <div class="card-title-group">
                <el-icon size="18" color="#409EFF"><Connection /></el-icon>
                <span class="card-title">CourtListener 爬虫</span>
              </div>
              <el-tag :type="crawlerStatus.running ? 'success' : 'info'" size="small">
                {{ crawlerStatus.running ? '运行中' : '空闲' }}
              </el-tag>
            </div>
          </template>

          <div class="status-info" v-if="crawlerStatus.message">
            <el-alert :title="crawlerStatus.message" type="info" :closable="false" show-icon />
          </div>

          <div class="action-group">
            <div class="action-item">
              <div class="action-label">全量采集</div>
              <div class="action-desc">遍历所有预设关键词进行采集（异步执行）</div>
              <el-button
                type="primary"
                :icon="VideoPlay"
                :loading="startLoading"
                :disabled="crawlerStatus.running"
                @click="handleStartCrawler"
              >
                启动全量采集
              </el-button>
            </div>

            <el-divider />

            <div class="action-item">
              <div class="action-label">按关键词采集</div>
              <div class="action-desc">异步执行，适合测试或补采单个关键词</div>
              <el-input-group style="margin-top:8px">
                <el-input
                  v-model="queryKeyword"
                  placeholder="输入关键词，如 Huawei"
                  @keyup.enter="handleQueryCrawler"
                />
                <el-button
                  type="primary"
                  :loading="queryLoading"
                  @click="handleQueryCrawler"
                >
                  开始采集
                </el-button>
              </el-input-group>
              <div v-if="queryResult" class="query-result">
                <el-alert
                  :title="`关键词「${queryResult.keyword}」采集完成，新入库 ${queryResult.savedCount} 条`"
                  type="success"
                  :closable="false"
                  show-icon
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

<!--      &lt;!&ndash; Python 爬虫 &ndash;&gt;-->
<!--      <el-col :span="12">-->
<!--        <el-card class="crawler-card">-->
<!--          <template #header>-->
<!--            <div class="card-header-row">-->
<!--              <div class="card-title-group">-->
<!--                <el-icon size="18" color="#67C23A"><Monitor /></el-icon>-->
<!--                <span class="card-title">Python 爬虫</span>-->
<!--              </div>-->
<!--              <el-button text :icon="Refresh" size="small" @click="loadPythonStatus">刷新</el-button>-->
<!--            </div>-->
<!--          </template>-->

<!--          <div v-if="Object.keys(pythonStatus).length === 0" class="empty-tip">-->
<!--            <el-empty description="暂无 Python 爬虫" :image-size="80" />-->
<!--          </div>-->

<!--          <div v-else>-->
<!--            <div-->
<!--              v-for="(running, name) in pythonStatus"-->
<!--              :key="name"-->
<!--              class="python-crawler-item"-->
<!--            >-->
<!--              <div class="python-info">-->
<!--                <el-icon :color="running ? '#67C23A' : '#909399'">-->
<!--                  <component :is="running ? VideoPlay : VideoPause" />-->
<!--                </el-icon>-->
<!--                <span class="crawler-name">{{ name }}</span>-->
<!--                <el-tag :type="running ? 'success' : 'info'" size="small">-->
<!--                  {{ running ? '运行中' : '已停止' }}-->
<!--                </el-tag>-->
<!--              </div>-->
<!--              <div class="python-actions">-->
<!--                <el-button-->
<!--                  v-if="!running"-->
<!--                  type="success"-->
<!--                  size="small"-->
<!--                  :icon="VideoPlay"-->
<!--                  :loading="pythonActionLoading[name]"-->
<!--                  @click="handleStartPython(name)"-->
<!--                >-->
<!--                  启动-->
<!--                </el-button>-->
<!--                <el-button-->
<!--                  v-else-->
<!--                  type="danger"-->
<!--                  size="small"-->
<!--                  :icon="VideoPause"-->
<!--                  :loading="pythonActionLoading[name]"-->
<!--                  @click="handleStopPython(name)"-->
<!--                >-->
<!--                  停止-->
<!--                </el-button>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->

<!--          <el-divider />-->

<!--          <div class="add-python">-->
<!--            <div class="action-label">手动启动爬虫</div>-->
<!--            <div class="action-desc">输入爬虫名称（对应 {name}_crawler.py 文件）</div>-->
<!--            <el-input-group style="margin-top:8px">-->
<!--              <el-input v-model="newCrawlerName" placeholder="爬虫名称，如 site_a" />-->
<!--              <el-button type="primary" @click="handleStartPython(newCrawlerName)">启动</el-button>-->
<!--            </el-input-group>-->
<!--          </div>-->
<!--        </el-card>-->
<!--      </el-col>-->
    </el-row>

    <!-- 日本裁判所爬虫 -->
    <el-card class="japan-card" style="margin-top:20px">
      <template #header>
        <div class="card-header-row">
          <div class="card-title-group">
            <el-icon size="18" color="#E6162D"><Flag /></el-icon>
            <span class="card-title">日本裁判所判例爬虫</span>
            <el-tag :type="japanStatus.running ? 'success' : 'info'" size="small">
              {{ japanStatus.running ? '运行中' : '空闲' }}
            </el-tag>
          </div>
          <div style="display:flex;gap:8px">
            <el-button text :icon="Refresh" size="small" @click="loadJapanStatus">刷新</el-button>
            <el-link
              href="https://www.courts.go.jp/hanrei/search1/index.html"
              target="_blank"
              type="primary"
              :underline="false"
              style="font-size:12px"
            >官网 ↗</el-link>
          </div>
        </div>
      </template>

      <el-form :model="japanParams" label-width="120px" size="default">

        <!-- 检索关键词 -->
        <el-divider content-position="left"><span class="divider-label">检索关键词</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="第1关键词" required>
              <el-input v-model="japanParams.query1" placeholder="如：中華、中国" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="第2关键词">
              <el-input v-model="japanParams.query2" placeholder="可选，AND 关系" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 判决日期范围 -->
        <el-divider content-position="left"><span class="divider-label">判决日期范围（可选）</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="起始元号">
              <el-select v-model="japanParams.judgeGengoFrom" placeholder="元号" clearable style="width:120px;margin-right:8px">
                <el-option v-for="g in gengoOptions" :key="g" :label="g" :value="g" />
              </el-select>
              <el-input v-model="japanParams.judgeYearFrom" placeholder="年" style="width:70px;margin-right:4px" />
              <el-input v-model="japanParams.judgeMonthFrom" placeholder="月" style="width:60px;margin-right:4px" />
              <el-input v-model="japanParams.judgeDayFrom" placeholder="日" style="width:60px" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止元号">
              <el-select v-model="japanParams.judgeGengoTo" placeholder="元号" clearable style="width:120px;margin-right:8px">
                <el-option v-for="g in gengoOptions" :key="g" :label="g" :value="g" />
              </el-select>
              <el-input v-model="japanParams.judgeYearTo" placeholder="年" style="width:70px;margin-right:4px" />
              <el-input v-model="japanParams.judgeMonthTo" placeholder="月" style="width:60px;margin-right:4px" />
              <el-input v-model="japanParams.judgeDayTo" placeholder="日" style="width:60px" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 法院过滤 -->
        <el-divider content-position="left"><span class="divider-label">法院过滤（可选）</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="裁判所种别">
              <el-select v-model="japanParams.courtType" placeholder="全部" clearable>
                <el-option label="最高裁判所"   value="最高裁判所" />
                <el-option label="高等裁判所"   value="高等裁判所" />
                <el-option label="地方裁判所"   value="地方裁判所" />
                <el-option label="家庭裁判所"   value="家庭裁判所" />
                <el-option label="簡易裁判所"   value="簡易裁判所" />
                <el-option label="行政不服審判所" value="行政不服審判所" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="裁判所名">
              <el-input v-model="japanParams.courtName" placeholder="如：東京地方裁判所" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="支部名">
              <el-input v-model="japanParams.branchName" placeholder="如：立川支部" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 采集控制 -->
        <el-divider content-position="left"><span class="divider-label">采集控制</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最大爬取页数">
              <el-input-number v-model="japanParams.maxPages" :min="1" :max="20" :step="1" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button
            v-if="!japanStatus.running"
            type="primary"
            :icon="VideoPlay"
            :loading="japanStartLoading"
            @click="handleStartJapan"
          >启动爬虫</el-button>
          <el-button
            v-else
            type="danger"
            :icon="VideoPause"
            :loading="japanStopLoading"
            @click="handleStopJapan"
          >停止爬虫</el-button>
          <el-button @click="resetJapanParams" :icon="Refresh">重置参数</el-button>
          <el-text type="info" size="small" style="margin-left:12px">
            日志：logs/crawler_japan_courts.log
          </el-text>
        </el-form-item>

      </el-form>
    </el-card>

    <!-- 关键词管理 -->
    <el-card class="keyword-card" style="margin-top:20px">
      <template #header>
        <div class="card-header-row">
          <div class="card-title-group">
            <el-icon size="18" color="#E6A23C"><Collection /></el-icon>
            <span class="card-title">CourtListener全量采集关键词管理</span>
            <el-tag type="warning" size="small">{{ keywords.length }} 个</el-tag>
          </div>
          <el-button text :icon="Refresh" size="small" @click="loadKeywords">刷新</el-button>
        </div>
      </template>

      <div class="keyword-body">
        <!-- 关键词标签列表 -->
        <div class="keyword-tags">
          <el-tag
            v-for="kw in keywords"
            :key="kw"
            closable
            type="warning"
            size="default"
            class="keyword-tag"
            @close="handleRemoveKeyword(kw)"
          >
            {{ kw }}
          </el-tag>
          <span v-if="keywords.length === 0" class="empty-tip">暂无关键词</span>
        </div>

        <el-divider />

        <!-- 新增关键词 -->
        <div class="keyword-add">
          <div class="action-label">新增关键词</div>
          <el-input-group style="max-width:400px; margin-top:8px">
            <el-input
              v-model="newKeyword"
              placeholder="输入关键词，如 Tencent"
              @keyup.enter="handleAddKeyword"
            />
            <el-button type="primary" :loading="keywordLoading" @click="handleAddKeyword">添加</el-button>
          </el-input-group>
        </div>
      </div>
    </el-card>

    <!-- 操作日志 -->
    <el-card class="log-card" style="margin-top:20px">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">操作日志</span>
          <el-button text size="small" @click="logs = []">清空</el-button>
        </div>
      </template>
      <div class="log-container" ref="logContainerRef">
        <div v-if="logs.length === 0" class="empty-tip">暂无操作记录</div>
        <div v-for="(log, i) in logs" :key="i" class="log-item" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Monitor, VideoPlay, VideoPause, Refresh, Collection, Flag } from '@element-plus/icons-vue'
import {
  startCrawler, queryCrawler, getCrawlerStatus,
  startPythonCrawler, stopPythonCrawler, getPythonCrawlerStatus,
  getKeywords, addKeyword, removeKeyword,
  startJapanCrawler, stopJapanCrawler, getJapanCrawlerStatus
} from '@/api/crawler'

const crawlerStatus = ref({ running: false, message: '' })
const pythonStatus = ref({})
const pythonActionLoading = reactive({})
const startLoading = ref(false)
const queryLoading = ref(false)
const queryKeyword = ref('')
const queryResult = ref(null)
const newCrawlerName = ref('')
const logs = ref([])
const logContainerRef = ref()

const keywords = ref([])
const newKeyword = ref('')
const keywordLoading = ref(false)

// ── 日本裁判所爬虫 ────────────────────────────────────────────────────────────
const gengoOptions = ['明治', '大正', '昭和', '平成', '令和']

const defaultJapanParams = () => ({
  query1: '中華',
  query2: '',
  judgeGengoFrom: '',
  judgeYearFrom: '',
  judgeMonthFrom: '',
  judgeDayFrom: '',
  judgeGengoTo: '',
  judgeYearTo: '',
  judgeMonthTo: '',
  judgeDayTo: '',
  courtType: '',
  courtName: '',
  branchName: '',
  maxPages: 50,
})

const japanParams = reactive(defaultJapanParams())
const japanStatus = ref({ running: false, message: '' })
const japanStartLoading = ref(false)
const japanStopLoading = ref(false)

async function loadJapanStatus() {
  try {
    const res = await getJapanCrawlerStatus()
    japanStatus.value = res.data || { running: false, message: '' }
  } catch {}
}

async function handleStartJapan() {
  if (!japanParams.query1?.trim()) {
    ElMessage.warning('请输入第1检索关键词')
    return
  }
  japanStartLoading.value = true
  try {
    const res = await startJapanCrawler({ ...japanParams })
    ElMessage.success('日本裁判所爬虫已启动')
    addLog(`日本裁判所爬虫已启动，关键词: ${japanParams.query1}`, 'success')
    await loadJapanStatus()
  } catch (e) {
    addLog(`日本裁判所爬虫启动失败: ${e?.message || ''}`, 'error')
  } finally {
    japanStartLoading.value = false
  }
}

async function handleStopJapan() {
  japanStopLoading.value = true
  try {
    await stopJapanCrawler()
    ElMessage.success('日本裁判所爬虫已停止')
    addLog('日本裁判所爬虫已停止', 'warning')
    await loadJapanStatus()
  } catch (e) {
    addLog(`停止失败: ${e?.message || ''}`, 'error')
  } finally {
    japanStopLoading.value = false
  }
}

function resetJapanParams() {
  Object.assign(japanParams, defaultJapanParams())
  ElMessage.info('参数已重置')
}

function addLog(msg, type = 'info') {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, msg, type })
  if (logs.value.length > 100) logs.value = logs.value.slice(0, 100)
}

async function loadCrawlerStatus() {
  try {
    const res = await getCrawlerStatus()
    crawlerStatus.value = res.data || { running: false, message: '' }
  } catch {}
}

async function loadPythonStatus() {
  try {
    const res = await getPythonCrawlerStatus()
    pythonStatus.value = res.data || {}
  } catch {}
}

async function refreshStatus() {
  await Promise.all([loadCrawlerStatus(), loadPythonStatus(), loadJapanStatus()])
  ElMessage.success('状态已刷新')
}

async function loadKeywords() {
  try {
    const res = await getKeywords()
    keywords.value = res.data || []
  } catch {}
}

async function handleAddKeyword() {
  const kw = newKeyword.value.trim()
  if (!kw) { ElMessage.warning('请输入关键词'); return }
  keywordLoading.value = true
  try {
    const res = await addKeyword(kw)
    keywords.value = res.data || []
    newKeyword.value = ''
    ElMessage.success(`关键词「${kw}」已添加`)
    addLog(`新增关键词：${kw}`, 'success')
  } finally {
    keywordLoading.value = false
  }
}

async function handleRemoveKeyword(kw) {
  try {
    const res = await removeKeyword(kw)
    keywords.value = res.data || []
    ElMessage.success(`关键词「${kw}」已删除`)
    addLog(`删除关键词：${kw}`, 'warning')
  } catch {}
}

async function handleStartCrawler() {
  startLoading.value = true
  try {
    await startCrawler()
    ElMessage.success('全量采集任务已启动（异步执行中）')
    addLog('全量采集任务已启动', 'success')
    await loadCrawlerStatus()
  } finally {
    startLoading.value = false
  }
}

async function handleQueryCrawler() {
  if (!queryKeyword.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  queryLoading.value = true
  queryResult.value = null
  try {
    const res = await queryCrawler(queryKeyword.value.trim())
    queryResult.value = res.data
    addLog(`关键词「${res.data.keyword}」采集完成，新入库 ${res.data.savedCount} 条`, 'success')
  } finally {
    queryLoading.value = false
  }
}

async function handleStartPython(name) {
  if (!name?.trim()) { ElMessage.warning('请输入爬虫名称'); return }
  pythonActionLoading[name] = true
  try {
    await startPythonCrawler(name.trim())
    ElMessage.success(`爬虫 ${name} 已启动`)
    addLog(`Python爬虫 ${name} 已启动`, 'success')
    await loadPythonStatus()
    newCrawlerName.value = ''
  } finally {
    pythonActionLoading[name] = false
  }
}

async function handleStopPython(name) {
  pythonActionLoading[name] = true
  try {
    await stopPythonCrawler(name)
    ElMessage.success(`爬虫 ${name} 已停止`)
    addLog(`Python爬虫 ${name} 已停止`, 'warning')
    await loadPythonStatus()
  } finally {
    pythonActionLoading[name] = false
  }
}

onMounted(() => {
  loadCrawlerStatus()
  loadPythonStatus()
  loadKeywords()
  loadJapanStatus()
})
</script>

<style scoped>
.crawler-page { max-width: 1200px; }

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

.crawler-card { height: 100%; }

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title { font-weight: 600; font-size: 15px; }

.status-info { margin-bottom: 16px; }

.action-group { }

.action-item { margin: 8px 0; }

.action-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.query-result { margin-top: 12px; }

.python-crawler-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.python-crawler-item:last-child { border-bottom: none; }

.python-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crawler-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.add-python { margin-top: 8px; }

.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  color: #909399;
  font-size: 13px;
}

.log-card { }

.log-container {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 2px;
  display: flex;
  gap: 12px;
}

.log-item.success { background: #f0f9eb; }
.log-item.warning { background: #fdf6ec; }
.log-item.error { background: #fef0f0; }
.log-item.info { background: #f4f4f5; }

.log-time { color: #909399; flex-shrink: 0; }
.log-msg { color: #333; }

.keyword-body { }

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  align-items: center;
}

.keyword-tag { cursor: default; }

.keyword-add { margin-top: 4px; }

/* ── 日本裁判所面板 ──────────────────────────────────────────────────────── */
.japan-card :deep(.el-form-item__label) {
  font-size: 13px;
  color: #555;
}

.japan-card :deep(.el-divider__text) {
  padding: 0 8px;
}

.divider-label {
  font-size: 12px;
  font-weight: 600;
  color: #E6162D;
  letter-spacing: 0.5px;
}
</style>
