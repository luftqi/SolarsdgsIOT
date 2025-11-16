-- =================================================================
-- Migration: 001_add_device_images
-- Phase 3.1: 圖像監控系統
-- Date: 2025-11-16
-- =================================================================

-- 刪除舊的 images 表格 (如果存在)
DROP TABLE IF EXISTS images CASCADE;

-- 創建新的 device_images 表格
CREATE TABLE IF NOT EXISTS device_images (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,

    -- RGB 圖像
    rgb_image_path VARCHAR(255) NOT NULL,
    rgb_thumbnail_path VARCHAR(255),
    rgb_file_size INTEGER,

    -- 熱影像
    thermal_image_path VARCHAR(255) NOT NULL,
    thermal_thumbnail_path VARCHAR(255),
    thermal_file_size INTEGER,

    -- 拍攝時間
    captured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵約束
    CONSTRAINT fk_device_images_device
        FOREIGN KEY (device_id)
        REFERENCES devices(device_id)
        ON DELETE CASCADE,

    -- 唯一約束:同一設備同一時間只能有一組圖像
    CONSTRAINT unique_device_images_timestamp UNIQUE (device_id, captured_at)
);

-- 索引優化
CREATE INDEX idx_device_images_device_id ON device_images(device_id);
CREATE INDEX idx_device_images_captured_at ON device_images(captured_at DESC);
CREATE INDEX idx_device_images_device_time ON device_images(device_id, captured_at DESC);

-- =================================================================
-- 完成
-- =================================================================
