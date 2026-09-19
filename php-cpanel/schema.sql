-- Consignment Tracking & Logistics System - Native MySQL Schema
-- Suitable for cPanel phpMyAdmin Import

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table: users (Admins & Workers)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'worker') NOT NULL DEFAULT 'worker',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: boxes (Bulk Shipment Boxes / Master Cartons)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `boxes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `box_code` VARCHAR(50) NOT NULL UNIQUE,
  `carrier` VARCHAR(80) NOT NULL,
  `route_name` VARCHAR(120) NOT NULL,
  `destination` VARCHAR(120) NOT NULL,
  `status` ENUM('Open', 'Sealed', 'Dispatched') NOT NULL DEFAULT 'Open',
  `max_weight_kg` DECIMAL(8,2) NOT NULL DEFAULT 30.00,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sealed_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`status`),
  INDEX (`box_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: shipments (Individual Consignments & Parcels)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shipments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tracking_number` VARCHAR(60) NOT NULL UNIQUE,
  `barcode` VARCHAR(60) NOT NULL,
  `sender_name` VARCHAR(120) NOT NULL,
  `sender_phone` VARCHAR(40) NOT NULL,
  `sender_city` VARCHAR(80) NOT NULL,
  `sender_country` VARCHAR(80) NOT NULL DEFAULT 'United States',
  `receiver_name` VARCHAR(120) NOT NULL,
  `receiver_phone` VARCHAR(40) NOT NULL,
  `receiver_address` TEXT NOT NULL,
  `receiver_city` VARCHAR(80) NOT NULL,
  `receiver_country` VARCHAR(80) NOT NULL DEFAULT 'United States',
  `carrier` VARCHAR(80) NOT NULL,
  `route_remarks` VARCHAR(120) NULL,
  `weight_kg` DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  `dimensions` VARCHAR(50) NULL DEFAULT '30x20x15 cm',
  `pieces` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('Received', 'In Transit', 'Out for Delivery', 'Delivered', 'On Hold') NOT NULL DEFAULT 'Received',
  `box_id` INT UNSIGNED NULL DEFAULT NULL,
  `package_image` VARCHAR(255) NULL DEFAULT NULL,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`tracking_number`),
  INDEX (`status`),
  INDEX (`box_id`),
  INDEX (`created_at`),
  CONSTRAINT `fk_shipment_box` FOREIGN KEY (`box_id`) REFERENCES `boxes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_shipment_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: routes (Master Routing Guide)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `routes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `default_carrier` VARCHAR(80) NOT NULL,
  `estimated_days` INT UNSIGNED NOT NULL DEFAULT 3,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Initial Routes
-- --------------------------------------------------------
INSERT IGNORE INTO `routes` (`code`, `name`, `default_carrier`, `estimated_days`) VALUES
('RT-EXP-USA', 'US Express Hub Hub-to-Hub', 'FedEx Express', 2),
('RT-PRI-DOM', 'Domestic Priority Logistics', 'UPS Ground', 3),
('RT-INT-AIR', 'Air Freight Priority Global', 'DHL Express', 5),
('RT-REG-STD', 'Standard Surface Parcel', 'USPS Priority', 4);

-- --------------------------------------------------------
-- Seed Default Initial Admin User
-- Password is: Admin@1234 (change after first login)
-- --------------------------------------------------------
INSERT IGNORE INTO `users` (`id`, `username`, `full_name`, `email`, `password_hash`, `role`, `status`) VALUES
(1, 'admin', 'System Administrator', 'admin@example.com', '$2y$10$wN4vF5lGkJwI2wZ/J1V01eE8k9H71Y.CkgJ5b.cI9p1Y2C5Z9jZ0W', 'admin', 'active');

COMMIT;
