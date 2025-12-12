-- Test User Setup Script for JWT Authentication
-- This script creates a test admin user with BCrypt encrypted password

-- Note: The password 'admin123' is encrypted with BCrypt
-- You can generate BCrypt hashes at: https://bcrypt-generator.com/
-- Or use: new BCryptPasswordEncoder().encode("admin123")

-- Step 1: Insert test user
INSERT INTO users (username, email, password, created_at, updated_at)
VALUES ('admin', 'admin@mukono-diocese.org', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCu', NOW(), NOW());

-- Step 2: Get the user ID (adjust if needed)
SET @user_id = LAST_INSERT_ID();

-- Step 3: Insert roles if they don't exist
INSERT IGNORE INTO roles (name) VALUES ('ROLE_ADMIN');
INSERT IGNORE INTO roles (name) VALUES ('ROLE_USER');

-- Step 4: Assign ROLE_ADMIN to the user
INSERT INTO user_roles (user_id, role_id)
SELECT @user_id, id FROM roles WHERE name = 'ROLE_ADMIN';

-- Step 5: Optionally assign ROLE_USER as well
INSERT INTO user_roles (user_id, role_id)
SELECT @user_id, id FROM roles WHERE name = 'ROLE_USER';

-- Verify the user was created
SELECT u.id, u.username, u.email, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

-- Additional test users (optional)
-- User: testuser, Password: test123
INSERT INTO users (username, email, password, created_at, updated_at)
VALUES ('testuser', 'test@mukono-diocese.org', '$2a$10$slYQm4nL7BbqxMpqXFCxnuD6yl2FZqZG8U6mBmU3x3h.c3zH8Y9Uy', NOW(), NOW());

SET @test_user_id = LAST_INSERT_ID();

INSERT INTO user_roles (user_id, role_id)
SELECT @test_user_id, id FROM roles WHERE name = 'ROLE_USER';

-- Show all test users
SELECT u.id, u.username, u.email, GROUP_CONCAT(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username IN ('admin', 'testuser')
GROUP BY u.id, u.username, u.email;

-- =====================================================
-- Test Credentials Summary
-- =====================================================
-- Username: admin
-- Password: admin123
-- Roles: ROLE_ADMIN, ROLE_USER
--
-- Username: testuser
-- Password: test123
-- Roles: ROLE_USER
-- =====================================================
