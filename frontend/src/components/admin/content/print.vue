<!-- filepath: c:\Users\VIVOBOOK\OneDrive - Mindoro State University\Desktop\github\DOMUS\frontend\src\components\admin\content\print.vue -->
<template>
  <div class="print-page">
    <!-- Print Settings Sidebar -->
    <aside class="print-settings">
      <div class="settings-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Print Settings
        </h2>
      </div>

      <div class="settings-content">
        <!-- Printer Selection -->
        <div class="setting-group">
          <label>Printer</label>
          <div class="printer-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>EPSON L121 Series</span>
            <span class="status online">Ready</span>
          </div>
        </div>

        <!-- Paper Size -->
        <div class="setting-group">
          <label>Paper Size</label>
          <select v-model="settings.paperSize">
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="letter">Letter (8.5 × 11 in)</option>
            <option value="legal">Legal (8.5 × 14 in)</option>
            <option value="a5">A5 (148 × 210 mm)</option>
          </select>
        </div>

        <!-- Orientation -->
        <div class="setting-group">
          <label>Orientation</label>
          <div class="orientation-options">
            <button 
              :class="['orient-btn', { active: settings.orientation === 'portrait' }]"
              @click="settings.orientation = 'portrait'"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
              </svg>
              Portrait
            </button>
            <button 
              :class="['orient-btn', { active: settings.orientation === 'landscape' }]"
              @click="settings.orientation = 'landscape'"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
              </svg>
              Landscape
            </button>
          </div>
        </div>

        <!-- Copies -->
        <div class="setting-group">
          <label>Copies</label>
          <div class="copies-input">
            <button class="copy-btn" @click="settings.copies = Math.max(1, settings.copies - 1)">−</button>
            <input type="number" v-model.number="settings.copies" min="1" max="99" />
            <button class="copy-btn" @click="settings.copies = Math.min(99, settings.copies + 1)">+</button>
          </div>
        </div>

        <!-- Color Mode -->
        <div class="setting-group">
          <label>Color Mode</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" v-model="settings.colorMode" value="color" />
              <span class="radio-label">
                <span class="color-icon"></span>
                Color
              </span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="settings.colorMode" value="grayscale" />
              <span class="radio-label">
                <span class="grayscale-icon"></span>
                Grayscale
              </span>
            </label>
          </div>
        </div>

        <!-- Print Quality -->
        <div class="setting-group">
          <label>Print Quality</label>
          <select v-model="settings.quality">
            <option value="draft">Draft (Fast)</option>
            <option value="normal">Normal</option>
            <option value="high">High Quality</option>
            <option value="photo">Photo Quality</option>
          </select>
        </div>

        <!-- Page Range -->
        <div class="setting-group">
          <label>Pages</label>
          <div class="radio-group vertical">
            <label class="radio-option">
              <input type="radio" v-model="settings.pageRange" value="all" />
              <span class="radio-label">All</span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="settings.pageRange" value="custom" />
              <span class="radio-label">Custom</span>
            </label>
          </div>
          <input 
            v-if="settings.pageRange === 'custom'" 
            type="text" 
            v-model="settings.customPages" 
            placeholder="e.g., 1-3, 5"
            class="custom-pages-input"
          />
        </div>

        <!-- Margins -->
        <div class="setting-group">
          <label>Margins</label>
          <select v-model="settings.margins">
            <option value="normal">Normal</option>
            <option value="narrow">Narrow</option>
            <option value="wide">Wide</option>
            <option value="none">None</option>
          </select>
        </div>

        <!-- Content to Print -->
        <div class="setting-group">
          <label>Include in Print</label>
          <div class="checkbox-group">
            <label class="checkbox-option">
              <input type="checkbox" v-model="settings.includeStats" />
              <span>Statistics Summary</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" v-model="settings.includeCharts" />
              <span>Charts & Graphs</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" v-model="settings.includeTable" />
              <span>Users Table</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" v-model="settings.includeHeader" />
              <span>Header with Logo</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" v-model="settings.includeFooter" />
              <span>Footer with Date</span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button class="btn-back" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <button class="btn-print" @click="printDocument">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </button>
      </div>
    </aside>

    <!-- Print Preview -->
    <main class="print-preview">
      <div class="preview-header">
        <h3>Print Preview</h3>
        <div class="zoom-controls">
          <button @click="zoom = Math.max(50, zoom - 10)">−</button>
          <span>{{ zoom }}%</span>
          <button @click="zoom = Math.min(150, zoom + 10)">+</button>
          <button @click="zoom = 100">Reset</button>
        </div>
      </div>

      <div class="preview-container">
        <div 
          class="preview-page" 
          :class="[settings.orientation, settings.colorMode]"
          :style="{ transform: `scale(${zoom / 100})` }"
          ref="printContent"
        >
          <!-- Header -->
          <header v-if="settings.includeHeader" class="page-header">
            <div class="logo-section">
              <img src="../../../assets/domus.png" alt="DOMUS" class="logo" />
              <div class="title-section">
                <h1>DOMUS</h1>
                <p>Architecture Management System</p>
              </div>
            </div>
            <div class="report-info">
              <h2>Overview Report</h2>
              <p>Generated: {{ currentDate }}</p>
            </div>
          </header>

          <!-- Statistics Summary -->
          <section v-if="settings.includeStats" class="print-section stats-section">
            <h3>Statistics Summary</h3>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-label">Total Users</span>
                <span class="stat-value">{{ printData.stats?.totalUsers || 0 }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Active Users</span>
                <span class="stat-value">{{ printData.stats?.activeUsers || 0 }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Total Projects</span>
                <span class="stat-value">{{ printData.stats?.totalProjects || 0 }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Total Clients</span>
                <span class="stat-value">{{ printData.stats?.totalClients || 0 }}</span>
              </div>
            </div>
          </section>

          <!-- Charts Section -->
          <section v-if="settings.includeCharts" class="print-section charts-section">
            <h3>Data Analysis</h3>
            <div class="charts-grid">
              <div class="chart-box">
                <h4>User Registrations (Last 7 Days)</h4>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Registrations</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(val, idx) in printData.userChartData?.data || []" :key="idx">
                      <td>{{ printData.userChartData?.categories?.[idx] || '' }}</td>
                      <td>{{ val }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="chart-box">
                <h4>Projects by Status</h4>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(val, idx) in printData.projectData?.data || []" :key="idx">
                      <td>{{ printData.projectData?.labels?.[idx] || '' }}</td>
                      <td>{{ val }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Users Table -->
          <section v-if="settings.includeTable" class="print-section table-section">
            <h3>Recent Users</h3>
            <table class="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in printData.users || []" :key="user.email">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role }}</td>
                  <td>{{ user.status }}</td>
                  <td>{{ user.joined }}</td>
                </tr>
                <tr v-if="!printData.users?.length">
                  <td colspan="5" class="no-data">No users to display</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Footer -->
          <footer v-if="settings.includeFooter" class="page-footer">
            <div class="footer-left">
              <p>DOMUS Architecture © {{ new Date().getFullYear() }}</p>
            </div>
            <div class="footer-center">
              <p>Page 1 of 1</p>
            </div>
            <div class="footer-right">
              <p>Printed: {{ currentDateTime }}</p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const zoom = ref(75)
const printContent = ref(null)

const settings = reactive({
  paperSize: 'a4',
  orientation: 'portrait',
  copies: 1,
  colorMode: 'color',
  quality: 'normal',
  pageRange: 'all',
  customPages: '',
  margins: 'normal',
  includeStats: true,
  includeCharts: true,
  includeTable: true,
  includeHeader: true,
  includeFooter: true
})

const printData = ref({
  stats: {},
  userChartData: { categories: [], data: [] },
  projectData: { labels: [], data: [] },
  users: []
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })
})

const currentDateTime = computed(() => {
  return new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

function goBack() {
  router.push('/admin')
}

function printDocument() {
  const printWindow = window.open('', '_blank')
  
  const content = printContent.value.innerHTML
  const styles = `
    <style>
      @page {
        size: ${settings.paperSize} ${settings.orientation};
        margin: ${settings.margins === 'narrow' ? '10mm' : settings.margins === 'wide' ? '25mm' : settings.margins === 'none' ? '0' : '15mm'};
      }
      
      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: ${settings.colorMode === 'grayscale' ? '#333' : '#213547'};
        line-height: 1.5;
        padding: 20px;
      }
      
      ${settings.colorMode === 'grayscale' ? `
        * { filter: grayscale(100%) !important; }
        .stat-box { background: #f5f5f5 !important; border: 1px solid #ddd !important; }
      ` : ''}
      
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 20px;
        border-bottom: 2px solid #e6b23a;
        margin-bottom: 24px;
      }
      
      .logo-section {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .logo {
        width: 48px;
        height: 48px;
      }
      
      .title-section h1 {
        font-size: 24px;
        color: #e6b23a;
        margin: 0;
      }
      
      .title-section p {
        font-size: 12px;
        color: #666;
        margin: 0;
      }
      
      .report-info {
        text-align: right;
      }
      
      .report-info h2 {
        font-size: 18px;
        color: #213547;
        margin: 0;
      }
      
      .report-info p {
        font-size: 12px;
        color: #666;
        margin: 0;
      }
      
      .print-section {
        margin-bottom: 24px;
      }
      
      .print-section h3 {
        font-size: 16px;
        color: #213547;
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid #eee;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      
      .stat-box {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        border: 1px solid #e0e0e0;
      }
      
      .stat-label {
        display: block;
        font-size: 11px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      
      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: #1976d2;
      }
      
      .charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .chart-box {
        background: #fafafa;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #eee;
      }
      
      .chart-box h4 {
        font-size: 13px;
        color: #213547;
        margin-bottom: 10px;
      }
      
      .data-table, .users-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      
      .data-table th, .data-table td,
      .users-table th, .users-table td {
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      
      .data-table th, .users-table th {
        background: #f5f5f5;
        font-weight: 600;
        color: #333;
      }
      
      .users-table {
        font-size: 10px;
      }
      
      .no-data {
        text-align: center;
        color: #999;
        padding: 20px !important;
      }
      
      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        padding: 10px 20px;
        border-top: 1px solid #eee;
        font-size: 10px;
        color: #666;
        background: #fff;
      }
      
      @media print {
        body { padding: 0; }
        .page-footer { position: fixed; }
      }
    </style>
  `
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DOMUS Overview Report</title>
        ${styles}
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        <\/script>
      </body>
    </html>
  `)
  
  printWindow.document.close()
}

onMounted(() => {
  const stored = sessionStorage.getItem('printData')
  if (stored) {
    try {
      printData.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse print data:', e)
    }
  }
})
</script>

<style scoped>
.print-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: calc(100vh - 70px);
  background: #f0f2f5;
}

/* Settings Sidebar */
.print-settings {
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 70px);
  overflow: hidden;
}

.settings-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.1rem;
  color: #213547;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group > label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #213547;
  margin-bottom: 8px;
}

.setting-group select,
.setting-group input[type="text"],
.setting-group input[type="number"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.setting-group select:focus,
.setting-group input:focus {
  border-color: #1976d2;
}

.printer-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.printer-info svg {
  color: #666;
}

.printer-info span:nth-child(2) {
  flex: 1;
  font-weight: 500;
  color: #213547;
}

.printer-info .status {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.printer-info .status.online {
  background: #e8f5e9;
  color: #2e7d32;
}

.orientation-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.orient-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  color: #666;
}

.orient-btn:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}

.orient-btn.active {
  border-color: #1976d2;
  background: #e3f2fd;
  color: #1976d2;
}

.copies-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copies-input input {
  width: 60px;
  text-align: center;
  -moz-appearance: textfield;
}

.copies-input input::-webkit-outer-spin-button,
.copies-input input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.copy-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #e3f2fd;
  border-color: #1976d2;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-group.vertical {
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-option input {
  width: 18px;
  height: 18px;
  accent-color: #1976d2;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #333;
}

.color-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1976d2 0%, #e6b23a 50%, #43a047 100%);
}

.grayscale-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #333 0%, #999 100%);
}

.custom-pages-input {
  margin-top: 8px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  accent-color: #1976d2;
}

.checkbox-option span {
  font-size: 0.9rem;
  color: #333;
}

.settings-actions {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
}

.btn-back {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e8e8e8;
}

.btn-print {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #1976d2;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.btn-print:hover {
  background: #1565c0;
  box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
}

/* Print Preview */
.print-preview {
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h3 {
  margin: 0;
  color: #213547;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.zoom-controls button:hover {
  background: #f5f5f5;
}

.zoom-controls button:last-child {
  width: auto;
  padding: 0 12px;
  font-size: 0.85rem;
}

.zoom-controls span {
  min-width: 50px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.preview-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #e0e0e0;
  border-radius: 12px;
}

.preview-page {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 40px;
  transform-origin: top center;
  transition: transform 0.2s;
}

.preview-page.portrait {
  width: 210mm;
  min-height: 297mm;
}

.preview-page.landscape {
  width: 297mm;
  min-height: 210mm;
}

.preview-page.grayscale {
  filter: grayscale(100%);
}

/* Page Content Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #e6b23a;
  margin-bottom: 24px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
}

.title-section h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #e6b23a;
}

.title-section p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.report-info {
  text-align: right;
}

.report-info h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #213547;
}

.report-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.print-section {
  margin-bottom: 24px;
}

.print-section h3 {
  font-size: 1rem;
  color: #213547;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #eee;
}

.chart-box h4 {
  font-size: 0.9rem;
  color: #213547;
  margin-bottom: 10px;
}

.data-table,
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.data-table th,
.data-table td,
.users-table th,
.users-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th,
.users-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px !important;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #eee;
  margin-top: auto;
  font-size: 0.75rem;
  color: #666;
}

@media (max-width: 1200px) {
  .print-page {
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 900px) {
  .print-page {
    grid-template-columns: 1fr;
  }
  
  .print-settings {
    height: auto;
    max-height: 50vh;
  }
  
  .preview-page.portrait,
  .preview-page.landscape {
    width: 100%;
    min-height: auto;
  }
}
</style>