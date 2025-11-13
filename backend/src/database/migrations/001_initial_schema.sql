-- =================================================================
-- Initial Database Schema for SolarSDGs IoT
-- 初始資料庫架構
--
-- Based on Node-RED flows.json analysis
-- Database: solar_db
-- PostgreSQL 16+
-- =================================================================

-- === 1. 功率數據表 (Power Data) ===
CREATE TABLE IF NOT EXISTS power_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    pg INTEGER NOT NULL,                    -- 發電功率 (Generation Power) in Watts
    pa INTEGER NOT NULL,                    -- 負載 A 功率 (Load A Power) in Watts
    pp INTEGER NOT NULL,                    -- 負載 P 功率 (Load P Power) in Watts
    pga_efficiency DECIMAL(5,2),            -- 負載 A 效率 (PAG) in %
    pgp_efficiency DECIMAL(5,2),            -- 負載 P 效率 (PPG) in %
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 唯一約束：同一設備同一時間只能有一條記錄
    CONSTRAINT unique_device_timestamp UNIQUE (device_id, timestamp)
);

-- 索引優化
CREATE INDEX idx_power_data_device_id ON power_data(device_id);
CREATE INDEX idx_power_data_timestamp ON power_data(timestamp);
CREATE INDEX idx_power_data_device_timestamp ON power_data(device_id, timestamp DESC);

-- === 2. GPS 位置表 (GPS Locations) ===
CREATE TABLE IF NOT EXISTS gps_locations (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,        -- 緯度 (-90 ~ 90)
    longitude DECIMAL(11,8) NOT NULL,       -- 經度 (-180 ~ 180)
    altitude DECIMAL(8,2) DEFAULT 0,        -- 高度 (公尺)
    satellites INTEGER DEFAULT 0,           -- 衛星數量
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 唯一約束：同一設備同一時間只能有一條位置記錄
    CONSTRAINT unique_gps_device_timestamp UNIQUE (device_id, timestamp)
);

-- 索引優化
CREATE INDEX idx_gps_device_id ON gps_locations(device_id);
CREATE INDEX idx_gps_timestamp ON gps_locations(timestamp);
CREATE INDEX idx_gps_device_timestamp ON gps_locations(device_id, timestamp DESC);

-- === 3. 設備表 (Devices) ===
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(50) DEFAULT 'solar',
    status VARCHAR(20) DEFAULT 'offline',   -- online, offline, error
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引優化
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_status ON devices(status);

-- === 4. 設備配置表 (Device Configuration) ===
CREATE TABLE IF NOT EXISTS device_config (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    factor_a DECIMAL(5,2) DEFAULT 1.0,      -- PA 修正係數
    factor_p DECIMAL(5,2) DEFAULT 1.0,      -- PP 修正係數
    pizero2_on INTEGER DEFAULT 0,           -- Pi Zero 2W 開機時間
    pizero2_off INTEGER DEFAULT 0,          -- Pi Zero 2W 關機時間
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵約束
    CONSTRAINT fk_device_config_device
        FOREIGN KEY (device_id)
        REFERENCES devices(device_id)
        ON DELETE CASCADE
);

-- === 5. 圖像表 (Images) - 新增功能 ===
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    image_type VARCHAR(20) NOT NULL,        -- 'rgb' or 'thermal'
    file_path VARCHAR(255) NOT NULL,        -- 圖像檔案路徑
    thumbnail_path VARCHAR(255),            -- 縮圖路徑
    file_size INTEGER,                      -- 檔案大小 (bytes)
    width INTEGER,                          -- 圖像寬度
    height INTEGER,                         -- 圖像高度
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵約束
    CONSTRAINT fk_images_device
        FOREIGN KEY (device_id)
        REFERENCES devices(device_id)
        ON DELETE CASCADE
);

-- 索引優化
CREATE INDEX idx_images_device_id ON images(device_id);
CREATE INDEX idx_images_timestamp ON images(timestamp);
CREATE INDEX idx_images_type ON images(image_type);

-- === 6. 用戶表 (Users) - 未來擴展 ===
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) DEFAULT 'user',        -- admin, user, viewer
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引優化
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- === 7. 創建默認設備 ===
INSERT INTO devices (device_id, device_name, device_type, status)
VALUES
    ('6001', 'Solar Device 6001', 'solar', 'offline'),
    ('6002', 'Solar Device 6002', 'solar', 'offline')
ON CONFLICT (device_id) DO NOTHING;

-- === 8. 創建默認配置 ===
INSERT INTO device_config (device_id, factor_a, factor_p)
VALUES
    ('6001', 1.0, 1.0),
    ('6002', 1.0, 1.0)
ON CONFLICT (device_id) DO NOTHING;

-- === 9. 創建默認管理員用戶 ===
-- 密碼: admin123 (需要在應用層進行 bcrypt hash)
INSERT INTO users (username, password_hash, email, role)
VALUES
    ('admin', '$2a$10$placeholder_hash', 'admin@solarsdgs.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- =================================================================
-- 結束
-- =================================================================

-- 顯示所有表格
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
