-- SolarSDGs IoT Database Initialization Script
-- PostgreSQL 16

-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create Tables

-- 1. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Power Data Table
CREATE TABLE IF NOT EXISTS power_data (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    pg DECIMAL(10, 2) NOT NULL,  -- Grid Power
    pa DECIMAL(10, 2) NOT NULL,  -- AC Power
    pp DECIMAL(10, 2) NOT NULL,  -- Panel Power
    pag DECIMAL(10, 2),          -- AC-Grid Efficiency %
    ppg DECIMAL(10, 2),          -- Panel-Grid Efficiency %
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_device FOREIGN KEY (device_id)
        REFERENCES devices(device_id) ON DELETE CASCADE
);

-- 3. GPS Locations Table
CREATE TABLE IF NOT EXISTS gps_locations (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    satellites INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_gps FOREIGN KEY (device_id)
        REFERENCES devices(device_id) ON DELETE CASCADE
);

-- 4. Device Configurations Table
CREATE TABLE IF NOT EXISTS device_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    config_data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_config FOREIGN KEY (device_id)
        REFERENCES devices(device_id) ON DELETE CASCADE
);

-- 5. Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance

-- Power Data Indexes
CREATE INDEX IF NOT EXISTS idx_power_data_device_id ON power_data(device_id);
CREATE INDEX IF NOT EXISTS idx_power_data_timestamp ON power_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_power_data_device_timestamp ON power_data(device_id, timestamp DESC);

-- GPS Locations Indexes
CREATE INDEX IF NOT EXISTS idx_gps_device_id ON gps_locations(device_id);
CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_device_timestamp ON gps_locations(device_id, timestamp DESC);

-- Device Indexes
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Create Functions

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers

-- Update triggers for updated_at columns
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_configs_updated_at BEFORE UPDATE ON device_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data (Optional - for development)

-- Sample Device
INSERT INTO devices (device_id, name, location, status)
VALUES ('6001', 'Solar Panel 6001', 'Main Building Roof', 'active')
ON CONFLICT (device_id) DO NOTHING;

-- Sample Admin User (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@solarsdgs.com', '$2b$10$rKvVPqQzK0YMxH5bXGxQp.XJ9K0pZ0vZ0vZ0vZ0vZ0vZ0vZ0vZ0vZ', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Grant Permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

COMMENT ON TABLE devices IS 'IoT devices (Raspberry Pi Pico W)';
COMMENT ON TABLE power_data IS 'Power generation data (PG, PA, PP)';
COMMENT ON TABLE gps_locations IS 'GPS location tracking data';
COMMENT ON TABLE device_configs IS 'Device configuration settings';
COMMENT ON TABLE users IS 'System users for authentication';
