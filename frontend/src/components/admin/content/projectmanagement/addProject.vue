<template>
  <div class="add-project-container">
    <div v-if="alertMsg" :class="['alert', alertType]">{{ alertMsg }}</div>
    <div class="stepper">
      <div :class="['step', {active: step === 1}]">1</div>
      <div class="step-line"></div>
      <div :class="['step', {active: step === 2}]">2</div>
      <div class="step-line"></div>
      <div :class="['step', {active: step === 3}]">3</div>
    </div>
    <div class="step-content">
      <!-- Step 1: Project Info -->
      <div v-if="step === 1">
        <h3>Project Information</h3>
        <div class="input-group">
          <label>Project Title <span style="color:#c62828">*</span></label>
          <input v-model="projectTitle" type="text" required />
        </div>
        <div class="input-group">
          <label>Description (optional)</label>
          <textarea v-model="projectDescription" rows="3"></textarea>
        </div>
        <div class="step-btn-row">
          <button class="next-btn" :disabled="!projectTitle" @click="nextStep">Next</button>
        </div>
      </div>
      <!-- Step 2: Location -->
      <div v-if="step === 2">
        <h3>Location Information</h3>
        <div class="input-group">
          <label>Province <span style="color:#c62828">*</span></label>
          <select v-model="selectedProvince" required>
            <option value="" disabled>Select province</option>
            <option v-for="prov in provinces" :key="prov">{{ prov }}</option>
          </select>
        </div>
        <div class="input-group" v-if="cities.length">
          <label>City <span style="color:#c62828">*</span></label>
          <select v-model="selectedCity" required>
            <option value="" disabled>Select city</option>
            <option v-for="city in cities" :key="city">{{ city }}</option>
          </select>
        </div>
        <div class="input-group" v-if="barangays.length">
          <label>Barangay <span style="color:#c62828">*</span></label>
          <select v-model="selectedBarangay" required>
            <option value="" disabled>Select barangay</option>
            <option v-for="brgy in barangays" :key="brgy">{{ brgy }}</option>
          </select>
        </div>
        <div class="input-group" v-if="selectedBarangay">
          <label>Zipcode <span style="color:#c62828">*</span></label>
          <input v-model="zipcode" type="text" required />
        </div>
        <div class="step-btn-row">
          <button class="prev-btn" @click="prevStep">Back</button>
          <button class="next-btn" :disabled="!canNextStep2" @click="nextStep">Next</button>
        </div>
      </div>
      <!-- Step 3: Assign Users/Staff -->
      <div v-if="step === 3">
        <h3>Assign Client/User and Staff</h3>
        <div class="input-group">
          <label>Select Client/User <span style="color:#c62828">*</span></label>
          <select v-model="selectedUser" required>
            <option value="" disabled>Select user/client</option>
            <optgroup label="Users">
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.lastname }}, {{ u.firstname }} (User)</option>
            </optgroup>
            <optgroup label="Clients">
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.lastname }}, {{ c.firstname }} (Client)</option>
            </optgroup>
          </select>
        </div>
        <div class="input-group">
          <label>Assign Staff (optional)</label>
          <select v-model="selectedStaff">
            <option value="">None</option>
            <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.lastname }}, {{ s.firstname }}</option>
          </select>
        </div>
        <div class="step-btn-row">
          <button class="prev-btn" @click="prevStep">Back</button>
          <button class="save-btn" :disabled="!selectedUser || loading" @click="showConfirm = true">
            {{ loading ? 'Saving...' : 'Save Project' }}
          </button>
        </div>
      </div>
    </div>
    <!-- Confirmation Modal -->
    <div v-if="showConfirm" class="confirm-modal">
      <div class="confirm-content">
        <div class="confirm-title">Are you sure you want to add this project?</div>
        <div class="confirm-btn-row">
          <button class="ok-btn" @click="saveProject">OK</button>
          <button class="cancel-btn" @click="showConfirm = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../../../../config'

const router = useRouter()
const step = ref(1)
const loading = ref(false)
const showConfirm = ref(false)
const alertMsg = ref('')
const alertType = ref('success')

// Step 1: Project Info
const projectTitle = ref('')
const projectDescription = ref('')

// Step 2: Location
const provinces = ref([
  'Metro Manila', 'Cavite', 'Laguna', 'Batangas', 'Bulacan', 'Pampanga', 'Cebu', 'Davao del Sur'
])
const cities = ref([])
const barangays = ref([])
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedBarangay = ref('')
const zipcode = ref('')

// Step 3: Users/Clients/Staff
const users = ref([])
const clients = ref([])
const staff = ref([])
const selectedUser = ref('')
const selectedStaff = ref('')

// Get admin id from localStorage
const adminId = ref('')
onMounted(() => {
  const user = localStorage.getItem('domus_user')
  if (user) {
    const userObj = JSON.parse(user)
    adminId.value = userObj.id || userObj.uid || ''
  }
  fetchUsers()
})

async function fetchUsers() {
  // Fetch users with role user or client
  let res = await fetch(`${API_BASE_URL}/api/admin/users-with-status?role=user`)
  let result = await res.json()
  users.value = result.success ? result.data : []
  res = await fetch(`${API_BASE_URL}/api/admin/users-with-status?role=client`)
  result = await res.json()
  clients.value = result.success ? result.data : []
  res = await fetch(`${API_BASE_URL}/api/admin/users-with-status?role=staff`)
  result = await res.json()
  staff.value = result.success ? result.data : []
}

// Dummy city/barangay data for demo
const cityData = {
  'Metro Manila': ['Manila', 'Quezon City', 'Makati', 'Pasig'],
  'Cavite': ['Bacoor', 'Imus', 'Dasmariñas'],
  'Laguna': ['Calamba', 'San Pablo', 'Santa Rosa'],
  'Batangas': ['Batangas City', 'Lipa', 'Tanauan'],
  'Bulacan': ['Malolos', 'Meycauayan', 'San Jose del Monte'],
  'Pampanga': ['Angeles', 'San Fernando'],
  'Cebu': ['Cebu City', 'Mandaue', 'Lapu-Lapu'],
  'Davao del Sur': ['Davao City', 'Digos']
}
const barangayData = {
  'Manila': ['Barangay 1', 'Barangay 2'],
  'Quezon City': ['Bagong Pag-asa', 'Commonwealth'],
  'Bacoor': ['Barangay Molino', 'Barangay Salinas'],
  // ...add more as needed
}

watch(selectedProvince, (province) => {
  cities.value = cityData[province] || []
  selectedCity.value = ''
  barangays.value = []
  selectedBarangay.value = ''
  zipcode.value = ''
})
watch(selectedCity, (city) => {
  barangays.value = barangayData[city] || []
  selectedBarangay.value = ''
  zipcode.value = ''
})

const canNextStep2 = computed(() =>
  selectedProvince.value && selectedCity.value && selectedBarangay.value && zipcode.value
)

function nextStep() { step.value++ }
function prevStep() { step.value-- }

function showAlert(msg, type = 'success') {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 3000)
}

async function saveProject() {
  showConfirm.value = false
  loading.value = true
  // Save to projects collection
  const payload = {
    title: projectTitle.value,
    description: projectDescription.value,
    location: {
      province: selectedProvince.value,
      city: selectedCity.value,
      barangay: selectedBarangay.value,
      zipcode: zipcode.value
    },
    clientId: selectedUser.value,
    staffId: selectedStaff.value || null,
    leadArchitect: adminId.value,
    createdAt: new Date().toISOString(),
    status: 'pending'
  }
  // Save project
  const res = await fetch(`${API_BASE_URL}/api/admin/add-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const result = await res.json()
  loading.value = false
  if (result.success) {
    showAlert('Project added successfully!', 'success')
    router.push('/admin/project-management')
  } else {
    showAlert(result.message || 'Failed to add project.', 'error')
  }
}
</script>

<style scoped>
.add-project-container {
  max-width: 900px;           /* wider than before */
  min-width: 340px;
  margin: 40px auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px #e6b23a22;
  padding: 40px 48px 32px 48px; /* more horizontal padding */
  position: relative;
  transition: max-width 0.2s, padding 0.2s;
}
.alert {
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
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  gap: 0;
}
.step {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eee;
  color: #213547;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, color 0.18s;
}
.step.active {
  background: #1976d2;
  color: #fff;
}
.step-line {
  width: 38px;
  height: 4px;
  background: #e6b23a;
  margin: 0 2px;
  border-radius: 2px;
}
.step-content {
  margin-bottom: 18px;
}
.input-group {
  margin-bottom: 18px;
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
.input-group select,
.input-group textarea {
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
.input-group select:focus,
.input-group textarea:focus {
  border-color: #e6b23a;
}
.step-btn-row {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  justify-content: flex-end;
}
.next-btn, .prev-btn, .save-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.prev-btn {
  background: #eee;
  color: #213547;
}
.next-btn:disabled, .save-btn:disabled {
  background: #b0b0b0;
  cursor: not-allowed;
}
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
@media (max-width: 1200px) {
  .add-project-container {
    max-width: 98vw;
    padding: 32px 18px 24px 18px;
  }
}
@media (max-width: 700px) {
  .add-project-container {
    max-width: 100vw;
    padding: 16px 4vw 12px 4vw;
  }
}
</style>