-- ==============================================================================
-- Business Process SLA & Bottleneck Analytics Platform
-- Production MySQL 8.0 Schema DDL
-- Database: business_sla_analytics
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `business_sla_analytics`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `business_sla_analytics`;

-- Disable foreign key checks during creation
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departments
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role_id` INT NOT NULL,
  `department_id` INT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role_id`),
  INDEX `idx_users_dept` (`department_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_users_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Business Processes
CREATE TABLE IF NOT EXISTS `business_processes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `department_id` INT NOT NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `overall_sla_hours` DECIMAL(10, 2) NOT NULL DEFAULT 24.00,
  `created_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_processes_name` (`name`),
  INDEX `idx_processes_dept` (`department_id`),
  INDEX `idx_processes_status` (`status`),
  CONSTRAINT `fk_processes_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_processes_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Process Stages
CREATE TABLE IF NOT EXISTS `process_stages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `process_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `sequence` INT NOT NULL,
  `department_id` INT NOT NULL,
  `responsible_role_id` INT NOT NULL,
  `sla_duration_hours` DECIMAL(10, 2) NOT NULL DEFAULT 4.00,
  `warning_threshold_pct` DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
  `required` TINYINT(1) NOT NULL DEFAULT 1,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_process_stage_sequence` (`process_id`, `sequence`),
  INDEX `idx_stages_process` (`process_id`),
  INDEX `idx_stages_dept` (`department_id`),
  CONSTRAINT `fk_stages_process` FOREIGN KEY (`process_id`) REFERENCES `business_processes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stages_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_stages_role` FOREIGN KEY (`responsible_role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Requests
CREATE TABLE IF NOT EXISTS `requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` VARCHAR(50) NOT NULL UNIQUE,
  `process_id` INT NOT NULL,
  `requester_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  `current_stage_id` INT NULL,
  `current_stage_sequence` INT NOT NULL DEFAULT 1,
  `total_processing_time_hours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `sla_status` VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  INDEX `idx_requests_req_id` (`request_id`),
  INDEX `idx_requests_process` (`process_id`),
  INDEX `idx_requests_requester` (`requester_id`),
  INDEX `idx_requests_dept` (`department_id`),
  INDEX `idx_requests_status` (`status`),
  INDEX `idx_requests_sla_status` (`sla_status`),
  INDEX `idx_requests_created_at` (`created_at`),
  CONSTRAINT `fk_requests_process` FOREIGN KEY (`process_id`) REFERENCES `business_processes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_requests_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_requests_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_requests_stage` FOREIGN KEY (`current_stage_id`) REFERENCES `process_stages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Request Stages (Runtime execution tracking per stage)
CREATE TABLE IF NOT EXISTS `request_stages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `stage_id` INT NOT NULL,
  `sequence` INT NOT NULL,
  `department_id` INT NOT NULL,
  `responsible_role_id` INT NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  `sla_duration_hours` DECIMAL(10, 2) NOT NULL DEFAULT 4.00,
  `stage_start_time` DATETIME NULL,
  `stage_end_time` DATETIME NULL,
  `processing_time_hours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `sla_percentage_used` DECIMAL(7, 2) NOT NULL DEFAULT 0.00,
  `sla_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  `sla_violation` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_by_id` INT NULL,
  `notes` TEXT NULL,
  INDEX `idx_req_stages_request` (`request_id`),
  INDEX `idx_req_stages_stage` (`stage_id`),
  INDEX `idx_req_stages_status` (`status`),
  INDEX `idx_req_stages_sla_status` (`sla_status`),
  INDEX `idx_req_stages_violation` (`sla_violation`),
  CONSTRAINT `fk_req_stages_request` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_req_stages_stage` FOREIGN KEY (`stage_id`) REFERENCES `process_stages` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_req_stages_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_req_stages_role` FOREIGN KEY (`responsible_role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_req_stages_completed_by` FOREIGN KEY (`completed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Stage Events (Audit log for stage level status changes)
CREATE TABLE IF NOT EXISTS `stage_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_stage_id` INT NOT NULL,
  `user_id` INT NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `details` TEXT NULL,
  INDEX `idx_stage_events_stage` (`request_stage_id`),
  INDEX `idx_stage_events_time` (`timestamp`),
  CONSTRAINT `fk_stage_events_req_stage` FOREIGN KEY (`request_stage_id`) REFERENCES `request_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stage_events_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(100) NULL,
  `description` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity`),
  INDEX `idx_audit_time` (`timestamp`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Reports
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `report_type` VARCHAR(50) NOT NULL,
  `generated_by` INT NULL,
  `parameters` JSON NULL,
  `summary_content` TEXT NULL,
  `data_payload` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reports_type` (`report_type`),
  INDEX `idx_reports_created` (`created_at`),
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
