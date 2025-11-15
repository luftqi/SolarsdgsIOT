<template>
  <div class="login-container">
    <!-- Logo 區域 -->
    <div class="login-header">
      <img :src="logoBase64" alt="SOLARSDGS" class="logo">
      <h1>SolarSDGs IoT</h1>
      <p class="subtitle">太陽能監控系統</p>
    </div>

    <!-- 登入表單 -->
    <div class="login-card">
      <h2>登入系統</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">客戶代碼</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="請輸入客戶代碼"
            required
            :disabled="loading"
            @input="clearError"
          >
        </div>

        <div class="form-group">
          <label for="password">密碼</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="請輸入密碼"
            required
            :disabled="loading"
            @input="clearError"
          >
        </div>

        <!-- 錯誤訊息 -->
        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>

        <!-- 登入按鈕 -->
        <button
          type="submit"
          class="btn-login"
          :disabled="loading"
        >
          <span v-if="!loading">🔐 登入</span>
          <span v-else>⏳ 登入中...</span>
        </button>
      </form>

      <!-- 測試帳號提示 -->
      <div class="test-hint">
        <p>測試帳號：admin / admin123</p>
      </div>
    </div>

    <!-- 版本資訊 -->
    <div class="login-footer">
      <p>SolarSDGs IoT Platform v1.0.0</p>
      <p>© 2025 SolarSDGs. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// Logo Base64 (從 Node-RED 提取, 與 DashboardView 相同)
const logoBase64 = ref('/logo.png')

const router = useRouter()

// 表單狀態
const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

/**
 * 清除錯誤訊息
 */
function clearError() {
  error.value = ''
}

/**
 * 處理登入
 *
 * 100% 沿用 Node-RED 登入邏輯:
 * 1. SQL 查詢: SELECT * FROM customers WHERE customer_code = $1 AND active = true
 * 2. 密碼驗證
 * 3. 更新登入記錄: UPDATE customers SET last_login = NOW(), login_count = login_count + 1
 * 4. 生成 JWT Token
 * 5. 跳轉到設備選擇頁面
 */
async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    // API URL (從環境變數取得)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'

    // 發送登入請求
    const response = await axios.post(`${apiUrl}/api/auth/login`, {
      username: form.username,
      password: form.password
    })

    // 登入成功
    if (response.data.success) {
      // 儲存 Token 和用戶資料到 localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      console.log('✅ 登入成功:', response.data.user)

      // 跳轉到設備選擇頁面
      await router.push('/devices')
    } else {
      error.value = response.data.message || '登入失敗'
    }
  } catch (err: any) {
    console.error('❌ 登入錯誤:', err)

    if (err.response) {
      // API 回傳錯誤
      error.value = err.response.data.message || '帳號或密碼錯誤'
    } else if (err.request) {
      // 網路錯誤
      error.value = '無法連接到服務器，請檢查網路連線'
    } else {
      // 其他錯誤
      error.value = '登入失敗，請稍後再試'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ========================================
   登入容器
   ======================================== */
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #3e5563;
  padding: 20px;
}

/* ========================================
   Logo 區域
   ======================================== */
.login-header {
  text-align: center;
  margin-bottom: 30px;
  color: #ffffff;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: white;
  padding: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 10px 0 5px 0;
  color: #FFC107;
  text-shadow: none;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 16px;
  color: #b0bec5;
  opacity: 1;
  margin: 0;
}

/* ========================================
   登入卡片
   ======================================== */
.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.login-card h2 {
  margin: 0 0 30px 0;
  font-size: 24px;
  color: #333;
  text-align: center;
}

/* ========================================
   表單樣式
   ======================================== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #0094CE;
  box-shadow: 0 0 0 3px rgba(0, 148, 206, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* ========================================
   錯誤訊息
   ======================================== */
.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #c33;
  font-size: 14px;
  font-weight: 500;
}

/* ========================================
   登入按鈕
   ======================================== */
.btn-login {
  width: 100%;
  padding: 14px;
  background: #FFC107;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.btn-login:hover:not(:disabled) {
  background: #FFB300;
  color: #333;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 179, 0, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.btn-login:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* ========================================
   測試帳號提示
   ======================================== */
.test-hint {
  margin-top: 20px;
  padding: 12px;
  background: #e3f2fd;
  border: 1px solid #2196F3;
  border-radius: 8px;
  text-align: center;
}

.test-hint p {
  margin: 0;
  color: #1976D2;
  font-size: 13px;
  font-weight: 500;
}

/* ========================================
   版本資訊
   ======================================== */
.login-footer {
  margin-top: 30px;
  text-align: center;
  color: #b0bec5;
  opacity: 1;
}

.login-footer p {
  margin: 5px 0;
  font-size: 13px;
}

/* ========================================
   響應式設計
   ======================================== */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 28px;
  }

  .logo {
    width: 60px;
    height: 60px;
  }
}
</style>
