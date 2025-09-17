<template>
  <div class="user-management-dashboard">
    <div v-if="alertMsg" :class="['alert', alertType]" class="user-alert">
      {{ alertMsg }}
    </div>
    <div class="cards-container">
      <div class="stat-card card-user">
        <div class="card-icon user">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#fff"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-title">Total Users</div>
          <div class="card-number">{{ userCount }}</div>
        </div>
      </div>
      <div class="stat-card card-client">
        <div class="card-icon client">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05C17.16 13.36 19 14.28 19 15.5V19h5v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#fff"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-title">Total Clients</div>
          <div class="card-number">{{ clientCount }}</div>
        </div>
      </div>
      <div class="stat-card card-staff">
        <div class="card-icon staff">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" fill="#fff"/>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-title">Total Staff</div>
          <div class="card-number">{{ staffCount }}</div>
        </div>
      </div>
    </div>
    <div class="charts-container">
      <div class="chart-card">
        <div class="chart-title">
          Users Over Time
          <select style="margin-left:12px;" :value="selectedRange" @change="onRangeChange">
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        <apexchart
          width="100%"
          height="280"
          type="area"
          :options="userChartOptions"
          :series="userChartSeries"
        />
      </div>
      <div class="chart-card">
        <div class="chart-title">Clients Over Time
          <select style="margin-left:12px;" :value="clientRange" @change="onRangeClientChange">
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        </div>          
        <apexchart
          width="100%"
          height="280"
          type="area"
          :options="clientChartOptions"
          :series="clientChartSeries"
        />
      </div>
    </div>
    <div class="user-actions-row">
      <div
        class="user-action-type"
        :class="{ selected: selectedType === 'user' }"
        @click="selectedType = 'user'"
      >User</div>
      <div
        class="user-action-type"
        :class="{ selected: selectedType === 'client' }"
        @click="selectedType = 'client'"
      >Client</div>
      <div
        class="user-action-type"
        :class="{ selected: selectedType === 'staff' }"
        @click="selectedType = 'staff'"
      >Staff</div>
    </div>
    <div v-if="selectedType === 'user'" class="user-table-section">
      <div class="table-action-btns left">
        <button class="icon-btn" title="Add" @click="showAddSidebar = true">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#43a047"/>
            <path d="M12 8v8M8 12h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" title="Update" :disabled="!selectedUserId" @click="openUpdateSidebar">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#1976d2"/>
            <path d="M16 8l-6 8M8 8h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" title="Delete">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#c62828"/>
            <path d="M8 16l8-8M8 8l8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="datatable-controls">
        <input
          type="text"
          v-model="searchQuery"
          class="datatable-search"
          placeholder="Search.."
        />
      </div>
      <div class="datatable-container">
        <table class="user-datatable">
          <thead>
            <tr>
              <th></th>
              <th @click="sortBy('lastname')" :class="getSortClass('lastname')">Lastname</th>
              <th @click="sortBy('firstname')" :class="getSortClass('firstname')">Firstname</th>
              <th @click="sortBy('status')" :class="getSortClass('status')">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in paginatedUsers"
              :key="user.id"
              :class="{ selected: selectedUserId === user.id }"
              @click="selectUser(user)"
              style="cursor:pointer;"
            >
              <td>
                <input type="radio" :checked="selectedUserId === user.id" @change="selectUser(user)" />
              </td>
              <td>{{ user.lastname }}</td>
              <td>{{ user.firstname }}</td>
              <td>
                <span v-if="user.status === 'active'" class="status-active">Active</span>
                <span v-else class="status-offline">
                  Offline
                  <span class="last-seen">({{ formatLastSeen(user.lastSeen) }})</span>
                </span>
              </td>
            </tr>
            <tr v-if="paginatedUsers.length === 0">
              <td colspan="4" style="text-align:center;color:#888;">No users found.</td>
            </tr>
          </tbody>
        </table>
        <div class="datatable-pagination">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >Prev</button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >Next</button>
        </div>
      </div>
    </div>
    <div v-if="selectedType === 'client'" class="user-table-section">
      <div class="table-action-btns left">
        <button class="icon-btn" title="Add" @click="showAddSidebar = true">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#43a047"/>
            <path d="M12 8v8M8 12h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" title="Update" :disabled="!selectedUserId" @click="openUpdateSidebar">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#1976d2"/>
            <path d="M16 8l-6 8M8 8h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" title="Delete">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#c62828"/>
            <path d="M8 16l8-8M8 8l8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="datatable-controls">
        <input
          type="text"
          v-model="searchQuery"
          class="datatable-search"
          placeholder="Search.."
        />
      </div>
      <div class="datatable-container">
        <table class="user-datatable">
          <thead>
            <tr>
              <th></th>
              <th @click="sortBy('lastname')" :class="getSortClass('lastname')">Lastname</th>
              <th @click="sortBy('firstname')" :class="getSortClass('firstname')">Firstname</th>
              <th @click="sortBy('status')" :class="getSortClass('status')">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in paginatedUsers"
              :key="user.id"
              :class="{ selected: selectedUserId === user.id }"
              @click="selectUser(user)"
              style="cursor:pointer;"
            >
              <td>
                <input type="radio" :checked="selectedUserId === user.id" @change="selectUser(user)" />
              </td>
              <td>{{ user.lastname }}</td>
              <td>{{ user.firstname }}</td>
              <td>
                <span v-if="user.status === 'active'" class="status-active">Active</span>
                <span v-else class="status-offline">
                  Offline
                  <span class="last-seen">({{ formatLastSeen(user.lastSeen) }})</span>
                </span>
              </td>
            </tr>
            <tr v-if="paginatedUsers.length === 0">
              <td colspan="4" style="text-align:center;color:#888;">No users found.</td>
            </tr>
          </tbody>
        </table>
        <div class="datatable-pagination">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >Prev</button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >Next</button>
        </div>
      </div>
    </div>
    <div v-if="selectedType === 'staff'" class="user-table-section">
      <div class="table-action-btns left">
        <button class="icon-btn" title="Add" @click="showAddSidebar = true">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#43a047"/>
            <path d="M12 8v8M8 12h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" title="Update" :disabled="!selectedUserId" @click="openUpdateSidebar">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#1976d2"/>
            <path d="M16 8l-6 8M8 8h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" title="Delete">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#c62828"/>
            <path d="M8 16l8-8M8 8l8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="datatable-controls">
        <input
          type="text"
          v-model="searchQuery"
          class="datatable-search"
          placeholder="Search.."
        />
      </div>
      <div class="datatable-container">
        <table class="user-datatable">
          <thead>
            <tr>
              <th></th>
              <th @click="sortBy('lastname')" :class="getSortClass('lastname')">Lastname</th>
              <th @click="sortBy('firstname')" :class="getSortClass('firstname')">Firstname</th>
              <th @click="sortBy('status')" :class="getSortClass('status')">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in paginatedUsers"
              :key="user.id"
              :class="{ selected: selectedUserId === user.id }"
              @click="selectUser(user)"
              style="cursor:pointer;"
            >
              <td>
                <input type="radio" :checked="selectedUserId === user.id" @change="selectUser(user)" />
              </td>
              <td>{{ user.lastname }}</td>
              <td>{{ user.firstname }}</td>
              <td>
                <span v-if="user.status === 'active'" class="status-active">Active</span>
                <span v-else class="status-offline">
                  Offline
                  <span class="last-seen">({{ formatLastSeen(user.lastSeen) }})</span>
                </span>
              </td>
            </tr>
            <tr v-if="paginatedUsers.length === 0">
              <td colspan="4" style="text-align:center;color:#888;">No users found.</td>
            </tr>
          </tbody>
        </table>
        <div class="datatable-pagination">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >Prev</button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >Next</button>
        </div>
      </div>
    </div>
    <div v-if="showAddSidebar && !showAddConfirm" class="add-user-sidebar">
    <div class="sidebar-content">
      <h3>Add User</h3>
      <form @submit.prevent="confirmAddUser">
        <div class="input-group">
          <label>Lastname</label>
          <input v-model="addForm.lastname" type="text" required />
        </div>
        <div class="input-group">
          <label>Firstname</label>
          <input v-model="addForm.firstname" type="text" required />
        </div>
        <div class="input-group">
          <label>Gender</label>
          <select v-model="addForm.gender" required>
            <option value="" disabled>Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div class="input-group">
          <label>Email</label>
          <input v-model="addForm.email" type="email" required />
        </div>
        <div class="input-group">
          <label>Password</label>
          <input v-model="addForm.password" type="password" required />
        </div>
        <div class="input-group">
          <label>Role</label>
          <select v-model="addForm.role" required>
            <option value="" disabled>Select role</option>
            <option value="user">User</option>
            <option value="client">Client</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div class="sidebar-btn-row">
          <button type="submit" class="add-btn" :disabled="addingUser">
            {{ addingUser ? 'Adding...' : 'Add User' }}
          </button>
          <button type="button" class="cancel-btn" @click="closeSidebar">Cancel</button>
        </div>
        <div v-if="addError" class="add-error">{{ addError }}</div>
      </form>
    </div>
  </div>
    <div v-if="showAddSidebar && !showAddConfirm" class="sidebar-backdrop" @click="closeSidebar"></div>
    <div v-if="showAddConfirm" class="confirm-modal">
      <div class="confirm-content">
        <div class="confirm-title">Are you sure you want to add this user?</div>
        <div class="confirm-btn-row">
          <button class="ok-btn" @click="addUser">OK</button>
          <button class="cancel-btn" @click="showAddConfirm = false">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="showUpdateSidebar && !showUpdateConfirm" class="add-user-sidebar">
    <div class="sidebar-content">
      <h3>Update User</h3>
      <form @submit.prevent="confirmUpdateUser">
        <div class="input-group">
          <label>Lastname</label>
          <input v-model="updateForm.lastname" type="text" required />
        </div>
        <div class="input-group">
          <label>Firstname</label>
          <input v-model="updateForm.firstname" type="text" required />
        </div>
        <div class="input-group">
          <label>Gender</label>
          <select v-model="updateForm.gender" required>
            <option value="" disabled>Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div class="input-group">
          <label>Email</label>
          <input v-model="updateForm.email" type="email" required />
        </div>
        <div class="input-group">
          <label>Password</label>
          <input v-model="updateForm.password" type="password" disabled />
        </div>
        <div class="input-group">
          <label>Role</label>
          <select v-model="updateForm.role" required>
            <option value="" disabled>Select role</option>
            <option value="user">User</option>
            <option value="client">Client</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div class="sidebar-btn-row">
          <button type="submit" class="add-btn" :disabled="updatingUser">
            {{ updatingUser ? 'Updating...' : 'Update User' }}
          </button>
          <button type="button" class="cancel-btn" @click="closeUpdateSidebar">Cancel</button>
        </div>
        <div v-if="updateError" class="add-error">{{ updateError }}</div>
      </form>
    </div>
  </div>
    <div v-if="showUpdateSidebar && !showUpdateConfirm" class="sidebar-backdrop" @click="closeUpdateSidebar"></div>
   <div v-if="showUpdateConfirm" class="confirm-modal">
      <div class="confirm-content">
        <div class="confirm-title">Are you sure you want to update this user?</div>
        <div class="confirm-btn-row">
          <button class="ok-btn" @click="updateUser">OK</button>
          <button class="cancel-btn" @click="showUpdateConfirm = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { API_BASE_URL } from '../../../config'
import ApexCharts from 'apexcharts'
import VueApexCharts from 'vue3-apexcharts'

const selectedUserId = ref(null)
const userCount = ref(0)
const clientCount = ref(0)
const staffCount = ref(0)
const selectedType = ref('user')
const users = ref([])
const showAddSidebar = ref(false)
const addingUser = ref(false)
const addError = ref('')
const searchQuery = ref('')
const sortKey = ref('lastname')
const sortOrder = ref('asc')
const currentPage = ref(1)
const pageSize = 10
const addForm = ref({
  lastname: '',
  firstname: '',
  gender: '',
  email: '',
  password: '',
  role: ''
})
const showUpdateSidebar = ref(false)
const updatingUser = ref(false)
const updateError = ref('')
const updateForm = ref({
  lastname: '',
  firstname: '',
  gender: '',
  email: '',
  password: '',
  role: ''
})

const alertMsg = ref('')
const alertType = ref('success')
const showAddConfirm = ref(false)
const showUpdateConfirm = ref(false)

async function fetchCounts() {
  const res = await fetch(`${API_BASE_URL}/api/admin/user-role-counts`)
  const result = await res.json()
  if (result.success) {
    userCount.value = result.user
    clientCount.value = result.client
    staffCount.value = result.staff
  }
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return ''
  const now = new Date()
  const seen = new Date(lastSeen)
  const diff = Math.floor((now - seen) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/api/admin/users-with-status?role=${selectedType.value}`)
  const result = await res.json()
  if (result.success) {
    users.value = result.data
  }
}

onMounted(() => {
  fetchCounts()
  fetchUserStats(selectedRange.value)
    fetchClientStats(clientRange.value)
  fetchUsers()
})

function onRangeChange(e) {
  selectedRange.value = e.target.value
  fetchUserStats(selectedRange.value)
}
function onRangeClientChange(e) {
  clientRange.value = e.target.value
  fetchClientStats(clientRange.value)
}

const userChartSeries = ref([{ name: 'Users', data: [] }])
const userChartOptions = ref({
  chart: { id: 'users-area', toolbar: { show: false }, zoom: { enabled: false } },
  xaxis: { type: 'category', labels: { style: { colors: '#213547' } } },
  yaxis: { labels: { style: { colors: '#213547' } } },
  colors: ['#1976d2'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1 } },
  grid: { borderColor: '#eee' },
  tooltip: { x: { format: 'dd MMM yyyy' } }
})
const selectedRange = ref('week')

async function fetchUserStats(range = 'week') {
  const res = await fetch(`${API_BASE_URL}/api/admin/user-stats?range=${range}`)
  const result = await res.json()
  if (result.success) {
    userChartSeries.value = [{ name: 'Users', data: result.data.map(d => ({ x: d.x, y: d.y })) }]
    userChartOptions.value.xaxis.type = range === 'week' ? 'category' : 'category'
  }
}

function closeSidebar() {
  showAddSidebar.value = false
  addError.value = ''
  addForm.value = { lastname: '', firstname: '', gender: '', email: '', password: '' }
}

async function addUser() {
  showAddConfirm.value = false
  addError.value = ''
  addingUser.value = true
  const payload = {
    lastname: addForm.value.lastname,
    firstname: addForm.value.firstname,
    gender: addForm.value.gender,
    email: addForm.value.email,
    password: addForm.value.password,
    createdAt: new Date().toISOString(),
    role: addForm.value.role
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/add-user-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const result = await res.json()
  addingUser.value = false
  if (result.success) {
    closeSidebar()
    fetchUsers()
    showAlert('User added successfully!', 'success')
  } else {
    addError.value = result.message || 'Failed to add user.'
    showAlert(addError.value, 'error')
  }
}

function confirmAddUser() {
  showAddConfirm.value = true
}

function selectUser(user) {
  selectedUserId.value = user.id
  fetchUserById(user.id)
}

async function fetchUserById(id) {
  // Fetch user details by id from backend
  const res = await fetch(`${API_BASE_URL}/api/admin/get-user?id=${id}`)
  const result = await res.json()
  if (result.success && result.user) {
    updateForm.value = {
      lastname: result.user.lastname,
      firstname: result.user.firstname,
      gender: result.user.gender || '',
      email: result.user.email,
      password: result.user.password || '',
      role: result.user.role || ''
    }
  }
}

function openUpdateSidebar() {
  if (selectedUserId.value) {
    showUpdateSidebar.value = true
    updateError.value = ''
  }
}

function closeUpdateSidebar() {
  showUpdateSidebar.value = false
  updateError.value = ''
}

async function updateUser() {
  showUpdateConfirm.value = false
  updateError.value = ''
  updatingUser.value = true
  const payload = {
    id: selectedUserId.value,
    lastname: updateForm.value.lastname,
    firstname: updateForm.value.firstname,
    gender: updateForm.value.gender,
    email: updateForm.value.email,
    role: updateForm.value.role
    // password is not updated here for security
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/update-user-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const result = await res.json()
  updatingUser.value = false
  if (result.success) {
    closeUpdateSidebar()
    fetchUsers()
    showAlert('User updated successfully!', 'success')
  } else {
    updateError.value = result.message || 'Failed to update user.'
    showAlert(updateError.value, 'error')
  }
}

function confirmUpdateUser() {
  showUpdateConfirm.value = true
}

function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => {
    alertMsg.value = ''
  }, 3000)
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}
function getSortClass(key) {
  return sortKey.value === key ? (sortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc') : ''
}

const filteredUsers = computed(() => {
  let q = searchQuery.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    (u.lastname || '').toLowerCase().includes(q) ||
    (u.firstname || '').toLowerCase().includes(q) ||
    (u.status || '').toLowerCase().includes(q)
  )
})

const sortedUsers = computed(() => {
  let arr = [...filteredUsers.value]
  arr.sort((a, b) => {
    let vA = (a[sortKey.value] || '').toString().toLowerCase()
    let vB = (b[sortKey.value] || '').toString().toLowerCase()
    if (vA < vB) return sortOrder.value === 'asc' ? -1 : 1
    if (vA > vB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  return arr
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedUsers.value.length / pageSize)))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedUsers.value.slice(start, start + pageSize)
})

watch([searchQuery, sortedUsers], () => {
  currentPage.value = 1
})

watch(users, () => {
  currentPage.value = 1
})

watch(selectedType, () => {
  fetchUsers()
  currentPage.value = 1
})

const clientChartSeries = ref([{ name: 'Clients', data: [] }])
const clientChartOptions = ref({
  chart: { id: 'clients-area', toolbar: { show: false }, zoom: { enabled: false } },
  xaxis: { type: 'category', labels: { style: { colors: '#213547' } } },
  yaxis: { labels: { style: { colors: '#213547' } } },
  colors: ['#e6b23a'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1 } },
  grid: { borderColor: '#eee' },
  tooltip: { x: { format: 'dd MMM yyyy' } }
})
const clientRange = ref('week')
async function fetchClientStats(range = 'week') {
  const res = await fetch(`${API_BASE_URL}/api/admin/client-stats?range=${range}`)
  const result = await res.json()
  if (result.success) {
    clientChartSeries.value = [{ name: 'Clients', data: result.data.map(d => ({ x: d.x, y: d.y })) }]
    clientChartOptions.value.xaxis.type = range === 'week' ? 'category' : 'category'
  }
}
</script>

<script>
export default {
  components: {
    apexchart: VueApexCharts
  }
}
</script>

<style scoped>
.user-management-dashboard {
  width: 100%;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Add this to center contents horizontally */
}
.cards-container {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  justify-content: center;
  flex-wrap: wrap;
}
.stat-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  display: flex;
  align-items: center;
  padding: 24px 32px;
  min-width: 220px;
  max-width: 300px;
  margin: 8px 0;
  transition: box-shadow 0.2s, transform 0.2s;
  height: 110px;
}
.stat-card:hover {
  box-shadow: 0 4px 24px #e6b23a44;
  transform: translateY(-4px) scale(1.03);
}
.card-icon {
  margin-right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 56px;
  height: 56px;
}
.card-user {
  background: linear-gradient(135deg, #1976d2 80%, #64b5f6 100%);
}
.card-user .card-icon {
  background: #1976d2;
}
.card-client {
  background: linear-gradient(135deg, #43a047 80%, #81c784 100%);
}
.card-client .card-icon {
  background: #43a047;
}
.card-staff {
  background: linear-gradient(135deg, #fbc02d 80%, #ffe082 100%);
}
.card-staff .card-icon {
  background: #fbc02d;
}
.card-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}
.card-number {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.charts-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  flex-direction: row;
  gap: 32px;
  max-width: 1400px;
  margin-top: 32px;
  margin-bottom: 0;
}
.chart-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  padding: 24px 32px 18px 32px;
  min-width: 420px;
  max-width: 700px;
  flex: 1 1 600px;
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.chart-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #213547;
  margin-bottom: 12px;
  text-align: left;
}
@media (max-width: 1200px) {
  .charts-container {
    max-width: 100vw;
    gap: 18px;
  }
  .chart-card {
    min-width: 280px;
    max-width: 100vw;
    padding: 18px 10px 8px 10px;
    flex: 1 1 320px;
  }
}
@media (max-width: 900px) {
  .cards-container{
    gap: 16px;
    max-width: 100%;
  }
  .charts-container{
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  .stat-card {
    padding: 18px 16px;
    min-width: 160px;
    max-width: 100%;
    height: 110px;
  }
  .chart-card {
    min-width: 180px;
    max-width: 100%;
    padding: 12px 8px 4px 8px;
  }
}
@media (max-width: 600px) {
  .user-management-dashboard {
    padding: 12px 0;
  }
  .cards-container{
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  .charts-container{
    flex-direction: column;
    gap: 12px;
    align-items: center;  
  }
  .stat-card {
    width: 90vw;
    min-width: 0;
    padding: 14px 10px;
    margin: 0;
    height: 110px;
  }
  .chart-card {
    width: 98vw;
    min-width: 0;
    padding: 8px 4px 2px 4px;
    margin: 0;
  }
  .chart-title {
    font-size: 1rem;
  }
}

.user-actions-row {
  display: flex;
  align-items: center;
  justify-content: center; /* Center horizontally */
  gap: 32px;
  width: 100%;
  max-width: 900px;
  margin: 32px auto 0 auto;
  padding: 0 18px;
  position: relative;
  flex-direction: row;
  flex-wrap: nowrap;
}
.user-action-type {
  font-size: 1.08rem;
  font-weight: 600;
  color: #213547;
  background: #f7f7f7;
  border-radius: 8px;
  padding: 10px 24px;
  box-shadow: 0 2px 8px #e6b23a22;
  min-width: 120px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.user-action-type.selected,
.user-action-type:hover {
  background: #e6b23a33;
  color: #e6b23a;
}
.action-btns {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.icon-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s;
}
.icon-btn:hover {
  transform: scale(1.15);
}
.user-table-section {
  width: 100%;
  max-width: 900px;
  margin: 32px auto 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  padding: 24px 18px 18px 18px;
  position: relative;
}
.table-action-btns {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 10px;
}
.table-action-btns.left {
  left: 18px;
  right: auto;
  top: 18px;
  justify-content: flex-start;
}
.datatable-container {
  overflow-x: auto;
  margin-top: 38px;
}
.user-datatable {
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
}
.user-datatable th,
.user-datatable td {
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.user-datatable th {
  background: #f7f7f7;
  color: #213547;
  font-weight: 700;
}
.status-active {
  color: #43a047;
  font-weight: 600;
}
.status-offline {
  color: #c62828;
  font-weight: 600;
}
.last-seen {
  color: #888;
  font-size: 0.95em;
  margin-left: 6px;
}

@media (max-width: 900px) {
  .table-action-btns.left {
    left: 8px;
    top: 8px;
  }
}
@media (max-width: 600px) {
  .table-action-btns.left {
    left: 2px;
    top: 2px;
  }
}
@media (max-width: 900px) {
  .user-actions-row {
    gap: 18px;
    padding: 0 8px;
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .user-action-type {
    min-width: 90px;
    padding: 8px 10px;
    font-size: 1rem;
  }
  .user-table-section {
    padding: 18px 8px 8px 8px;
  }
  .table-action-btns {
    top: 8px;
    right: 8px;
  }
}
@media (max-width: 600px) {
  .user-actions-row {
    flex-direction: row;
    gap: 8px;
    padding: 0 4px;
    flex-wrap: nowrap;
  }
  .user-table-section {
    padding: 10px 2px 2px 2px;
  }
  .table-action-btns {
    top: 2px;
    right: 2px;
  }
  .user-datatable th,
  .user-datatable td {
    padding: 8px 4px;
    font-size: 0.95rem;
  }
}
.add-user-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  max-width: 95vw;
  height: 100vh;
  background: #fff;
  box-shadow: -2px 0 18px #0002;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: slideInSidebar 0.25s;
}
@keyframes slideInSidebar {
  from { right: -400px; opacity: 0; }
  to { right: 0; opacity: 1; }
}
.sidebar-content {
  padding: 32px 24px 18px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.sidebar-content h3 {
  margin-bottom: 18px;
  color: #213547;
  font-size: 1.3rem;
  font-weight: 700;
}
.input-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}
.input-group label {
  font-size: 1rem;
  color: #213547;
  margin-bottom: 6px;
  font-weight: 600;
}
.input-group input,
.input-group select {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #dedddd;
  font-size: 1rem;
  outline: none;
  background: #f7f7f7;
  color: #213547;
  transition: border-color 0.2s;
}
.input-group input:focus,
.input-group select:focus {
  border-color: #e6b23a;
}
.sidebar-btn-row {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
.add-btn {
  background: #43a047;
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.add-btn:hover {
  background: #388e3c;
}
.cancel-btn {
  background: #eee;
  color: #213547;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.cancel-btn:hover {
  background: #dedddd;
}
.add-error {
  color: #c62828;
  margin-top: 10px;
  font-size: 0.98rem;
  text-align: left;
}
.sidebar-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #0005;
  z-index: 9998;
}
@media (max-width: 600px) {
  .add-user-sidebar {
    width: 100vw;
    max-width: 100vw;
    padding: 0;
  }
  .sidebar-content {
    padding: 18px 10px 10px 10px;
  }
}
.user-alert {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  min-width: 220px;
  max-width: 90vw;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px #00000022;
  font-size: 1.08rem;
  text-align: center;
  margin-top: 8px;
}
.alert.success { background: #e6f7e6; color: #2e7d32; border-bottom: 2px solid #2e7d32; }
.alert.error { background: #ffeaea; color: #c62828; border-bottom: 2px solid #c62828; }

.confirm-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #0005;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-content {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: 0 4px 24px #0002;
  min-width: 260px;
  max-width: 90vw;
  text-align: center;
}
.confirm-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 22px;
  color: #213547;
}
.confirm-btn-row {
  display: flex;
  gap: 18px;
  justify-content: center;
}
.ok-btn {
  background: #43a047;
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.ok-btn:hover {
  background: #388e3c;
}
.cancel-btn {
  background: #eee;
  color: #213547;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.cancel-btn:hover {
  background: #dedddd;
}

.datatable-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.datatable-search {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #dedddd;
  font-size: 1rem;
  outline: none;
  background: #f7f7f7;
  color: #213547;
  margin-right: 0;
  min-width: 220px;
  max-width: 100%;
}
.datatable-search:focus {
  border-color: #e6b23a;
}
.user-datatable th {
  cursor: pointer;
  user-select: none;
  position: relative;
}
.user-datatable th.sort-asc::after {
  content: "▲";
  font-size: 0.8em;
  margin-left: 6px;
  color: #e6b23a;
  position: absolute;
  right: 8px;
}
.user-datatable th.sort-desc::after {
  content: "▼";
  font-size: 0.8em;
  margin-left: 6px;
  color: #e6b23a;
  position: absolute;
  right: 8px;
}
.datatable-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 18px;
  margin-top: 12px;
}
.pagination-btn {
  background: #eee;
  color: #213547;
  border: none;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.pagination-btn:disabled {
  background: #f7f7f7;
  color: #aaa;
  cursor: not-allowed;
}
.pagination-info {
  font-size: 1rem;
  color: #213547;
  font-weight: 500;
}
@media (max-width: 600px) {
  .datatable-controls {
    margin-bottom: 4px;
  }
  .datatable-search {
    min-width: 120px;
    font-size: 0.95rem;
    padding: 6px 8px;
  }
  .datatable-pagination {
    gap: 8px;
    font-size: 0.95rem;
  }
}
@media (min-width: 1200px) {
  .user-management-dashboard,
  .cards-container,
  .charts-container,
  .user-table-section {
    max-width: 1400px;
    width: 98vw;
  }
  .user-table-section {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>