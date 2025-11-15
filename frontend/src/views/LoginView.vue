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
const logoBase64 = ref('data:image/png;base64,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')

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
