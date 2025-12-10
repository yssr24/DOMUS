<template>
  <div class="overview-wrap">
    <header class="ov-header">
      <h2>Admin Overview</h2>

      <div class="ov-actions">
        <button class="btn dl pdf" @click="downloadPDF">Download PDF</button>
        <button class="btn dl csv" @click="downloadCSV">Download CSV</button>
      </div>
    </header>

    <!-- KPI Cards -->
    <section class="ov-cards">
      <div class="ov-card users">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5Z" fill="#1976d2"/></svg>
        </div>
        <div class="info">
          <div class="label">Total Users</div>
          <div class="value">{{ stats.totalUsers }}</div>
        </div>
      </div>
      <div class="ov-card active">
        <div class="icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#43a047"/><path d="M4 20v-1a8 8 0 0 1 16 0v1" fill="#43a047"/></svg>
        </div>
        <div class="info">
          <div class="label">Active Users</div>
          <div class="value">{{ stats.activeUsers }}</div>
        </div>
      </div>
      <div class="ov-card projects">
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" fill="#e6b23a"/><path d="M3 7l9 6 9-6" stroke="#fff" stroke-width="2"/></svg>
        </div>
        <div class="info">
          <div class="label">Total Projects</div>
          <div class="value">{{ stats.totalProjects }}</div>
        </div>
      </div>
      <div class="ov-card clients">
        <div class="icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#8e24aa"/><rect x="4" y="16" width="16" height="5" rx="2" fill="#8e24aa"/></svg>
        </div>
        <div class="info">
          <div class="label">Total Clients</div>
          <div class="value">{{ stats.totalClients }}</div>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="ov-charts">
      <div class="chart-card">
        <h3>User Registrations (Last 7 Days)</h3>
        <apexchart type="bar" height="220" :options="userChartOptions" :series="userChartSeries" />
      </div>
      <div class="chart-card">
        <h3>Projects by Status</h3>
        <apexchart type="donut" height="220" :options="projChartOptions" :series="projChartSeries" />
      </div>
    </section>

    <!-- Data Table -->
    <section class="ov-table-card">
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
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.role }}</td>
              <td>
                <span class="pill" :class="u.status">{{ u.status }}</span>
              </td>
              <td class="mono">{{ u.joined }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

  <script setup>
import { stats, userChartOptions, userChartSeries, projChartOptions, projChartSeries, users, downloadCSV, downloadPDF, initOverview } from '../../../assets/js/overview'

import VueApexCharts from 'vue3-apexcharts'
import { onMounted } from 'vue'

onMounted(() => {
  initOverview()
})
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts,
  },
}
</script>

<style scoped>
.overview-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
}

.ov-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ov-header h2 {
  margin: 0 0 16px 0;
  color: #213547;
}

.ov-actions {
  display: flex;
  gap: 8px;
}

.ov-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.ov-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 12px #00000012;
  border: 1px solid #f0f0f0;
}

.ov-card .icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f8f8f8;
}

.ov-card .icon svg {
  width: 32px;
  height: 32px;
}

.ov-card .info {
  display: flex;
  flex-direction: column;
}

.ov-card .label {
  color: #5a6675;
  font-weight: 600;
  font-size: 0.95rem;
}

.ov-card .value {
  color: #213547;
  font-size: 1.7rem;
  font-weight: 800;
}

.ov-card.users .icon {
  background: #e3f0fc;
}

.ov-card.active .icon {
  background: #eafaf0;
}

.ov-card.projects .icon {
  background: #fff7e1;
}

.ov-card.clients .icon {
  background: #f6eaff;
}

.ov-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.chart-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 16px;
}

.chart-card h3 {
  margin: 0 0 10px;
  color: #213547;
  font-size: 1.1rem;
}

.ov-table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px #0000000f;
  border: 1px solid #f0f0f0;
  padding: 8px 8px 16px 8px;
}

.ov-table-card h3 {
  margin: 0 0 10px 0;
  color: #213547;
}

.table-wrap {
  overflow-x: auto;
}

.ov-table {
  width: 100%;
  border-collapse: collapse;
}

.ov-table thead th {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 700;
  color: #213547;
  white-space: nowrap;
}

.ov-table tbody td {
  padding: 12px 10px;
  border-bottom: 1px solid #f5f5f5;
  color: #213547;
}

.ov-table tbody tr:hover {
  background: #fafafa;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}

.pill.active,
.pill.online {
  color: #1f7a1f;
  background: #ecfaec;
  border-color: #cfeccc;
}

.pill.inactive,
.pill.offline {
  color: #888;
  background: #f3f3f3;
  border-color: #ddd;
}

.mono {
  font-family: ui-monospace, Menlo, Consolas, Monaco, monospace;
}

.btn.dl {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #213547;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.05s;
  box-shadow: 0 2px 8px #00000010;
}

.btn.dl:hover {
  background: #f8fafc;
}

.btn.dl:active {
  transform: translateY(1px);
}

.btn.dl.pdf {
  border-color: #1976d233;
}

.btn.dl.csv {
  border-color: #43a04733;
}

.loading-text {
  text-align: center;
  padding: 20px;
  color: #777;
}

.error-text {
  text-align: center;
  padding: 20px;
  color: #c62828;
}

@media (max-width: 900px) {
  .ov-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .ov-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .ov-cards {
    grid-template-columns: 1fr;
  }
  .ov-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .ov-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>