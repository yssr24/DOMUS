<!-- filepath: c:\Users\VIVOBOOK\OneDrive - Mindoro State University\Desktop\github\DOMUS\frontend\src\components\admin\content\overview.vue -->
<template>
  <div class="overview-wrap">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading overview data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="refresh-btn" @click="loadAllData">Retry</button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <div class="ov-header">
        <h2>Overview</h2>
        <div class="ov-actions">
          <button class="btn dl pdf" @click="downloadPDF">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z" stroke="#1976d2" stroke-width="2"/>
              <path d="M14 2v6h6" stroke="#1976d2" stroke-width="2"/>
            </svg>
            <span>PDF</span>
          </button>
          <button class="btn dl csv" @click="downloadCSV">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#43a047" stroke-width="2"/>
              <path d="M9 9h6M9 13h6M9 17h4" stroke="#43a047" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>CSV</span>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="ov-cards">
        <div class="ov-card users">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#1976d2" stroke-width="2"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#1976d2" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Total Users</span>
            <span class="value">{{ stats.totalUsers }}</span>
          </div>
        </div>
        <div class="ov-card active">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#43a047" stroke-width="2"/>
              <path d="M8 12l2 2 4-4" stroke="#43a047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Active Users</span>
            <span class="value">{{ stats.activeUsers }}</span>
          </div>
        </div>
        <div class="ov-card projects">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#e6b23a" stroke-width="2"/>
              <path d="M3 10h18" stroke="#e6b23a" stroke-width="2"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Total Projects</span>
            <span class="value">{{ stats.totalProjects }}</span>
          </div>
        </div>
        <div class="ov-card clients">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="3" stroke="#8e24aa" stroke-width="2"/>
              <circle cx="15" cy="7" r="3" stroke="#8e24aa" stroke-width="2"/>
              <path d="M3 18c0-3 3-5 6-5 1.5 0 2.8.4 4 1" stroke="#8e24aa" stroke-width="2" stroke-linecap="round"/>
              <path d="M21 18c0-3-3-5-6-5-.7 0-1.4.1-2 .3" stroke="#8e24aa" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="info">
            <span class="label">Total Clients</span>
            <span class="value">{{ stats.totalClients }}</span>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="ov-charts">
        <div class="chart-card">
          <h3>User Registrations (Last 7 Days)</h3>
          <apexchart type="bar" height="220" :options="userChartOptions" :series="userChartSeries" />
        </div>
        <div class="chart-card">
          <h3>Projects by Status</h3>
          <apexchart type="donut" height="220" :options="projChartOptions" :series="projChartSeries" />
        </div>
      </div>

      <!-- Recent Users Table -->
      <div class="ov-table-card">
        <h3>Recent Users</h3>
        <div class="table-wrap">
          <table class="ov-table">
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
              <tr v-for="user in recentUsers" :key="user.id || user.email">
                <td>{{ user.lastname || '' }}, {{ user.firstname || '' }}</td>
                <td class="mono">{{ user.email }}</td>
                <td>{{ user.role || 'user' }}</td>
                <td>
                  <span :class="['pill', user.status === 'online' || user.status === 'active' ? 'online' : 'offline']">
                    {{ user.status || 'offline' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
              </tr>
              <tr v-if="recentUsers.length === 0">
                <td colspan="5" style="text-align: center; color: #888;">No users found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import VueApexCharts from 'vue3-apexcharts'
import { useOverview } from '../../../assets/js/admin/overview.js'
import '../../../assets/css/admin/overview.css'

const {
  loading,
  error,
  stats,
  recentUsers,
  userChartOptions,
  userChartSeries,
  projChartOptions,
  projChartSeries,
  downloadCSV,
  downloadPDF,
  loadAllData
} = useOverview()

function formatDate(date) {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return 'N/A'
  }
}
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts,
  },
}
</script>