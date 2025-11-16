-- =================================================================
-- Migration: 時區支援 (Timezone Support)
-- 目的: 將所有 TIMESTAMP 改為 TIMESTAMPTZ，並加入設備時區欄位
-- 日期: 2025-11-16
-- =================================================================

-- Step 1: 修改 power_data 表
-- 注意: PostgreSQL 會自動將現有數據解釋為 UTC
ALTER TABLE power_data
    ALTER COLUMN timestamp TYPE TIMESTAMPTZ USING timestamp AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Step 2: 修改 gps_locations 表，並加入 timezone 欄位
ALTER TABLE gps_locations
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
    ALTER COLUMN timestamp TYPE TIMESTAMPTZ USING timestamp AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Step 3: 修改 devices 表，並加入 timezone 欄位
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
    ALTER COLUMN last_seen TYPE TIMESTAMPTZ USING last_seen AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Step 4: 修改 device_config 表
ALTER TABLE device_config
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Step 5: 為現有設備設置預設時區 (假設都在台灣)
UPDATE devices SET timezone = 'Asia/Taipei' WHERE timezone = 'UTC';

-- Step 6: 根據現有 GPS 數據推算設備時區 (如果有的話)
-- 這個步驟會在後端服務中執行，這裡只是預設值

-- 驗證
SELECT 'Migration completed successfully' AS status;
SELECT COUNT(*) AS total_devices, timezone,
       COUNT(DISTINCT timezone) AS unique_timezones
FROM devices
GROUP BY timezone;
