-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 08, 2026 at 03:49 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pos`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
CREATE TABLE IF NOT EXISTS `activity_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `log_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `fk_activity_log_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_log`
--

INSERT INTO `activity_log` (`log_id`, `action`, `log_date`, `user_id`) VALUES
(1, 'admin (ADMIN) logged in', '2025-12-01 08:00:05', 1),
(2, 'cashier (CASHIER) logged in', '2025-12-01 08:05:22', 2),
(3, 'Created purchase orders #1, #2, #3', '2025-12-03 09:15:00', 1),
(4, 'Received purchase order #1', '2025-12-05 09:30:00', 1),
(5, 'Received purchase order #2', '2025-12-05 09:32:00', 1),
(6, 'Received purchase order #3', '2025-12-05 09:35:00', 1),
(7, 'admin (ADMIN) logged in', '2026-01-05 08:10:15', 1),
(8, 'cashier (CASHIER) logged in', '2026-01-05 08:12:05', 2),
(9, 'Created purchase orders #4, #5, #6', '2026-01-05 08:20:00', 1),
(10, 'Received purchase order #4, #5, #6', '2026-01-07 10:00:00', 1),
(11, 'admin (ADMIN) logged in', '2026-02-05 08:05:33', 1),
(12, 'cashier (CASHIER) logged in', '2026-02-05 08:10:45', 2),
(13, 'Created purchase orders #7, #8', '2026-02-05 08:25:00', 1),
(14, 'Received purchase order #7, #8', '2026-02-08 09:00:00', 1),
(15, 'admin (ADMIN) logged in', '2026-03-05 08:03:17', 1),
(16, 'cashier (CASHIER) logged in', '2026-03-05 08:08:50', 2),
(17, 'Created purchase order #9', '2026-03-05 08:15:00', 1),
(18, 'Received purchase order #9', '2026-03-08 10:30:00', 1),
(19, 'admin (ADMIN) logged in', '2026-04-01 08:00:51', 1),
(20, 'Created and received purchase order #10', '2026-04-03 09:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cash_register`
--

DROP TABLE IF EXISTS `cash_register`;
CREATE TABLE IF NOT EXISTS `cash_register` (
  `register_id` bigint NOT NULL AUTO_INCREMENT,
  `closing_balance` double DEFAULT NULL,
  `opening_balance` double NOT NULL,
  `register_date` date NOT NULL,
  `shift` enum('AFTERNOON','EVENING','MORNING') NOT NULL,
  `location_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`register_id`),
  KEY `fk_cash_register_location` (`location_id`),
  KEY `fk_cash_register_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cash_register`
--

INSERT INTO `cash_register` (`register_id`, `closing_balance`, `opening_balance`, `register_date`, `shift`, `location_id`, `user_id`) VALUES
(1, 282.15, 200, '2025-12-31', 'MORNING', 1, 2),
(2, 284.55, 200, '2026-01-31', 'MORNING', 1, 2),
(3, 279.70, 200, '2026-02-28', 'MORNING', 1, 2),
(4, 286.46, 200, '2026-03-31', 'MORNING', 1, 2),
(5, NULL, 200, '2026-04-08', 'MORNING', 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
CREATE TABLE IF NOT EXISTS `category` (
  `category_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `UK46ccwnsi9409t36lurvtyljak` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `name`) VALUES
(6, 'Bakery'),
(1, 'Beverages'),
(7, 'Dairy'),
(10, 'Electronics & Accessories'),
(5, 'Frozen Foods'),
(9, 'Health & Wellness'),
(3, 'Household'),
(4, 'Personal Care'),
(8, 'Produce'),
(2, 'Snacks');

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
CREATE TABLE IF NOT EXISTS `customer` (
  `customer_id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `points` int NOT NULL,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `email`, `name`, `phone`, `points`) VALUES
(1, 'john@example.com', 'John Doe', '012111111', 156),
(2, 'jane@example.com', 'Jane Smith', '012222222', 75),
(3, 'mike@example.com', 'Mike Chan', '012333333', 72),
(4, 'sara@example.com', 'Sara Lee', '012444444', 74),
(5, 'david@example.com', 'David Tan', '012555555', 91),
(6, 'lisa@example.com', 'Lisa Wong', '012666666', 61);

-- --------------------------------------------------------

--
-- Table structure for table `expense`
--

DROP TABLE IF EXISTS `expense`;
CREATE TABLE IF NOT EXISTS `expense` (
  `expense_id` bigint NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `category` enum('OTHER','RENT','SALARY','SUPPLIES','UTILITIES') NOT NULL,
  `description` varchar(255) NOT NULL,
  `expense_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `location_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`expense_id`),
  KEY `fk_expense_location` (`location_id`),
  KEY `fk_expense_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `expense`
--

INSERT INTO `expense` (`expense_id`, `amount`, `category`, `description`, `expense_date`, `location_id`, `user_id`) VALUES
(1, 48, 'UTILITIES', 'December Electricity & Water Bill', '2025-12-31 18:00:00', 1, 1),
(2, 22, 'SUPPLIES', 'December Cleaning & Packaging Supplies', '2025-12-31 18:05:00', 1, 1),
(3, 52, 'UTILITIES', 'January Electricity & Water Bill', '2026-01-31 18:00:00', 1, 1),
(4, 45, 'UTILITIES', 'February Electricity & Water Bill', '2026-02-28 18:00:00', 1, 1),
(5, 50, 'UTILITIES', 'March Electricity & Water Bill', '2026-03-31 18:00:00', 1, 1),
(6, 35, 'SUPPLIES', 'March Cleaning & Packaging Supplies', '2026-03-31 18:05:00', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
CREATE TABLE IF NOT EXISTS `location` (
  `location_id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `location`
--

INSERT INTO `location` (`location_id`, `address`, `name`) VALUES
(1, '123 Main St, Phnom Penh', 'Chbar Ampov'),
(2, 'Airport Road, Phnom Penh', 'Daun Penh'),
(3, 'Aeon Mall, Phnom Penh', 'Toul Kork');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` bigint NOT NULL AUTO_INCREMENT,
  `discount` double NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('CANCELLED','PAID','PENDING') NOT NULL,
  `total` double NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `location_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `fk_orders_location` (`location_id`),
  KEY `fk_orders_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
-- Dec 2025: Orders 1-18 | Jan 2026: 19-32 | Feb 2026: 33-44 | Mar 2026: 45-54 | Apr 2026: 55-62
--

INSERT INTO `orders` (`order_id`, `discount`, `order_date`, `payment_status`, `total`, `customer_id`, `location_id`, `user_id`) VALUES
(1,  0,    '2025-12-02 08:45:00', 'PAID', 4.40,  1,    1, 2),
(2,  0,    '2025-12-03 09:30:00', 'PAID', 6.48,  NULL, 1, 2),
(3,  0,    '2025-12-04 14:15:00', 'PAID', 7.98,  NULL, 1, 2),
(4,  0,    '2025-12-05 10:00:00', 'PAID', 6.50,  2,    1, 2),
(5,  0,    '2025-12-08 11:20:00', 'PAID', 9.50,  NULL, 1, 2),
(6,  0,    '2025-12-09 15:30:00', 'PAID', 7.83,  3,    1, 2),
(7,  0,    '2025-12-10 09:00:00', 'PAID', 9.16,  NULL, 1, 2),
(8,  0,    '2025-12-12 16:45:00', 'PAID', 11.48, NULL, 1, 2),
(9,  0.20, '2025-12-14 12:00:00', 'PAID', 7.00,  1,    1, 2),
(10, 0,    '2025-12-16 10:30:00', 'PAID', 6.28,  NULL, 1, 2),
(11, 0,    '2025-12-18 14:00:00', 'PAID', 8.07,  6,    1, 2),
(12, 0,    '2025-12-19 09:15:00', 'PAID', 4.40,  NULL, 1, 2),
(13, 0,    '2025-12-20 11:45:00', 'PAID', 6.37,  NULL, 1, 2),
(14, 0,    '2025-12-22 16:20:00', 'PAID', 7.00,  4,    1, 2),
(15, 0,    '2025-12-23 10:00:00', 'PAID', 8.48,  2,    1, 2),
(16, 0,    '2025-12-26 14:30:00', 'PAID', 19.47, NULL, 1, 2),
(17, 0,    '2025-12-28 09:45:00', 'PAID', 13.93, 5,    1, 1),
(18, 0,    '2025-12-31 15:00:00', 'PAID', 9.80,  NULL, 1, 2),
(19, 0,    '2026-01-03 09:00:00', 'PAID', 8.39,  1,    1, 2),
(20, 0,    '2026-01-05 11:30:00', 'PAID', 10.48, NULL, 1, 2),
(21, 0,    '2026-01-07 14:00:00', 'PAID', 7.76,  3,    1, 2),
(22, 0,    '2026-01-09 10:15:00', 'PAID', 9.30,  NULL, 1, 2),
(23, 0,    '2026-01-12 15:30:00', 'PAID', 14.03, 4,    1, 2),
(24, 0,    '2026-01-14 09:00:00', 'PAID', 11.40, NULL, 1, 2),
(25, 0,    '2026-01-16 13:00:00', 'PAID', 12.74, 2,    1, 2),
(26, 0,    '2026-01-18 16:45:00', 'PAID', 21.49, NULL, 1, 1),
(27, 0,    '2026-01-21 10:00:00', 'PAID', 9.80,  5,    1, 2),
(28, 0,    '2026-01-23 14:30:00', 'PAID', 13.48, NULL, 1, 2),
(29, 0,    '2026-01-25 09:15:00', 'PAID', 14.44, 1,    1, 2),
(30, 0,    '2026-01-27 11:00:00', 'PAID', 11.48, 6,    1, 2),
(31, 0,    '2026-01-29 15:30:00', 'PAID', 11.88, 3,    1, 2),
(32, 0,    '2026-01-31 14:00:00', 'PAID', 8.38,  NULL, 1, 2),
(33, 0,    '2026-02-02 09:30:00', 'PAID', 8.50,  4,    1, 2),
(34, 0,    '2026-02-04 14:00:00', 'PAID', 12.96, 1,    1, 2),
(35, 0,    '2026-02-06 10:45:00', 'PAID', 22.96, NULL, 1, 2),
(36, 0,    '2026-02-08 15:30:00', 'PAID', 11.30, 2,    1, 2),
(37, 0,    '2026-02-11 09:00:00', 'PAID', 11.54, 5,    1, 2),
(38, 0,    '2026-02-13 11:30:00', 'PAID', 11.70, 6,    1, 2),
(39, 0,    '2026-02-16 14:15:00', 'PAID', 12.88, 3,    1, 2),
(40, 0,    '2026-02-18 10:00:00', 'PAID', 7.20,  NULL, 1, 2),
(41, 0,    '2026-02-20 15:45:00', 'PAID', 32.89, 1,    1, 1),
(42, 0,    '2026-02-23 09:15:00', 'PAID', 15.00, NULL, 1, 2),
(43, 0,    '2026-02-25 13:00:00', 'PAID', 16.03, 4,    1, 2),
(44, 0,    '2026-02-28 16:30:00', 'PAID', 11.77, 6,    1, 2),
(45, 0,    '2026-03-03 09:15:00', 'PAID', 7.30,  2,    1, 2),
(46, 0,    '2026-03-05 14:30:00', 'PAID', 14.73, NULL, 1, 2),
(47, 0,    '2026-03-08 10:00:00', 'PAID', 26.96, 3,    1, 2),
(48, 0,    '2026-03-10 11:45:00', 'PAID', 24.00, 5,    1, 2),
(49, 0,    '2026-03-13 15:00:00', 'PAID', 17.38, NULL, 1, 2),
(50, 0,    '2026-03-16 09:30:00', 'PAID', 49.48, 1,    1, 1),
(51, 0,    '2026-03-18 14:00:00', 'PAID', 10.20, 4,    1, 2),
(52, 0,    '2026-03-21 10:15:00', 'PAID', 20.50, 6,    1, 2),
(53, 0,    '2026-03-25 15:45:00', 'PAID', 16.35, 2,    1, 2),
(54, 0,    '2026-03-28 09:00:00', 'PAID', 33.92, NULL, 1, 1),
(55, 0,    '2026-04-01 09:30:00', 'PAID', 9.30,  3,    1, 2),
(56, 0,    '2026-04-02 14:00:00', 'PAID', 12.74, 1,    1, 2),
(57, 0,    '2026-04-03 10:15:00', 'PAID', 11.48, NULL, 1, 2),
(58, 0,    '2026-04-04 11:30:00', 'PAID', 19.00, 4,    1, 2),
(59, 0,    '2026-04-05 15:00:00', 'PAID', 15.28, 2,    1, 2),
(60, 0,    '2026-04-06 09:45:00', 'PAID', 10.20, NULL, 1, 2),
(61, 0,    '2026-04-07 14:30:00', 'PAID', 34.49, 5,    1, 1),
(62, 0,    '2026-04-08 10:00:00', 'PAID', 18.51, 1,    1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `order_detail`
--

DROP TABLE IF EXISTS `order_detail`;
CREATE TABLE IF NOT EXISTS `order_detail` (
  `order_detail_id` bigint NOT NULL AUTO_INCREMENT,
  `price` double NOT NULL,
  `quantity` int NOT NULL,
  `order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`order_detail_id`),
  KEY `fk_orderdetail_order` (`order_id`),
  KEY `fk_orderdetail_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_detail`
--

INSERT INTO `order_detail` (`order_detail_id`, `price`, `quantity`, `order_id`, `product_id`) VALUES
-- Order 1: Coca Cola x2, Pepsi x1
(1,  1.50, 2, 1,  1),
(2,  1.40, 1, 1,  2),
-- Order 2: Bread x1, Milk x1, Bananas x1
(3,  2.59, 1, 2,  8),
(4,  1.79, 1, 2,  10),
(5,  2.10, 1, 2,  13),
-- Order 3: Potato Chips x2, Croissant x2
(6,  2.00, 2, 3,  3),
(7,  1.99, 2, 3,  9),
-- Order 4: Coca Cola x3, Potato Chips x1
(8,  1.50, 3, 4,  1),
(9,  2.00, 1, 4,  3),
-- Order 5: Shampoo x1, Laundry Powder x1
(10, 4.50, 1, 5,  5),
(11, 5.00, 1, 5,  4),
-- Order 6: Milk x2, Cheddar Cheese x1
(12, 1.79, 2, 6,  10),
(13, 4.25, 1, 6,  11),
-- Order 7: Bread x2, Croissant x2
(14, 2.59, 2, 7,  8),
(15, 1.99, 2, 7,  9),
-- Order 8: Frozen Pizza x1, Mixed Veg x1
(16, 7.99, 1, 8,  6),
(17, 3.49, 1, 8,  7),
-- Order 9: Pepsi x3, Coca Cola x2 (discount $0.20)
(18, 1.40, 3, 9,  2),
(19, 1.50, 2, 9,  1),
-- Order 10: Milk x2, Lettuce x2
(20, 1.79, 2, 10, 10),
(21, 1.35, 2, 10, 12),
-- Order 11: Croissant x3, Bananas x1
(22, 1.99, 3, 11, 9),
(23, 2.10, 1, 11, 13),
-- Order 12: Coca Cola x2, Pepsi x1
(24, 1.50, 2, 12, 1),
(25, 1.40, 1, 12, 2),
-- Order 13: Bread x1, Milk x1, Croissant x1
(26, 2.59, 1, 13, 8),
(27, 1.79, 1, 13, 10),
(28, 1.99, 1, 13, 9),
-- Order 14: Potato Chips x2, Coca Cola x2
(29, 2.00, 2, 14, 3),
(30, 1.50, 2, 14, 1),
-- Order 15: Shampoo x1, Croissant x2
(31, 4.50, 1, 15, 5),
(32, 1.99, 2, 15, 9),
-- Order 16: Frozen Pizza x2, Mixed Veg x1
(33, 7.99, 2, 16, 6),
(34, 3.49, 1, 16, 7),
-- Order 17: Lettuce x3, Bananas x3, Milk x2
(35, 1.35, 3, 17, 12),
(36, 2.10, 3, 17, 13),
(37, 1.79, 2, 17, 10),
-- Order 18: Coca Cola x2, Pepsi x2, Potato Chips x2
(38, 1.50, 2, 18, 1),
(39, 1.40, 2, 18, 2),
(40, 2.00, 2, 18, 3),
-- Order 19: Coca Cola x2, Pepsi x2, Bread x1
(41, 1.50, 2, 19, 1),
(42, 1.40, 2, 19, 2),
(43, 2.59, 1, 19, 8),
-- Order 20: Milk x2, Lettuce x2, Bananas x2
(44, 1.79, 2, 20, 10),
(45, 1.35, 2, 20, 12),
(46, 2.10, 2, 20, 13),
-- Order 21: Croissant x3, Milk x1
(47, 1.99, 3, 21, 9),
(48, 1.79, 1, 21, 10),
-- Order 22: Shampoo x1, Potato Chips x1, Pepsi x2
(49, 4.50, 1, 22, 5),
(50, 2.00, 1, 22, 3),
(51, 1.40, 2, 22, 2),
-- Order 23: Frozen Pizza x1, Milk x1, Cheddar Cheese x1
(52, 7.99, 1, 23, 6),
(53, 1.79, 1, 23, 10),
(54, 4.25, 1, 23, 11),
-- Order 24: Coca Cola x3, Bananas x2, Lettuce x2
(55, 1.50, 3, 24, 1),
(56, 2.10, 2, 24, 13),
(57, 1.35, 2, 24, 12),
-- Order 25: Bread x2, Croissant x2, Milk x2
(58, 2.59, 2, 25, 8),
(59, 1.99, 2, 25, 9),
(60, 1.79, 2, 25, 10),
-- Order 26: USB-C Cable x1, Wireless Mouse x1
(61, 6.50,  1, 26, 17),
(62, 14.99, 1, 26, 16),
-- Order 27: Coca Cola x2, Pepsi x2, Potato Chips x2
(63, 1.50, 2, 27, 1),
(64, 1.40, 2, 27, 2),
(65, 2.00, 2, 27, 3),
-- Order 28: Frozen Pizza x1, Mixed Veg x1, Potato Chips x1
(66, 7.99, 1, 28, 6),
(67, 3.49, 1, 28, 7),
(68, 2.00, 1, 28, 3),
-- Order 29: Vitamin C x1, Pain Relief Gel x1
(69, 8.95, 1, 29, 14),
(70, 5.49, 1, 29, 15),
-- Order 30: Bread x2, Bananas x3
(71, 2.59, 2, 30, 8),
(72, 2.10, 3, 30, 13),
-- Order 31: Milk x2, Lettuce x3, Cheddar Cheese x1
(73, 1.79, 2, 31, 10),
(74, 1.35, 3, 31, 12),
(75, 4.25, 1, 31, 11),
-- Order 32: Coca Cola x2, Pepsi x1, Croissant x2
(76, 1.50, 2, 32, 1),
(77, 1.40, 1, 32, 2),
(78, 1.99, 2, 32, 9),
-- Order 33: Coca Cola x3, Potato Chips x2
(79, 1.50, 3, 33, 1),
(80, 2.00, 2, 33, 3),
-- Order 34: Bread x2, Milk x2, Bananas x2
(81, 2.59, 2, 34, 8),
(82, 1.79, 2, 34, 10),
(83, 2.10, 2, 34, 13),
-- Order 35: Frozen Pizza x2, Mixed Veg x2
(84, 7.99, 2, 35, 6),
(85, 3.49, 2, 35, 7),
-- Order 36: Shampoo x1, Potato Chips x2, Pepsi x2
(86, 4.50, 1, 36, 5),
(87, 2.00, 2, 36, 3),
(88, 1.40, 2, 36, 2),
-- Order 37: Croissant x4, Milk x2
(89, 1.99, 4, 37, 9),
(90, 1.79, 2, 37, 10),
-- Order 38: Lettuce x4, Bananas x3
(91, 1.35, 4, 38, 12),
(92, 2.10, 3, 38, 13),
-- Order 39: Cheddar Cheese x2, Milk x1, Bread x1
(93, 4.25, 2, 39, 11),
(94, 1.79, 1, 39, 10),
(95, 2.59, 1, 39, 8),
-- Order 40: Coca Cola x2, Pepsi x3
(96,  1.50, 2, 40, 1),
(97,  1.40, 3, 40, 2),
-- Order 41: Vitamin C x2, Wireless Mouse x1
(98,  8.95,  2, 41, 14),
(99,  14.99, 1, 41, 16),
-- Order 42: USB-C Cable x2, Potato Chips x1
(100, 6.50, 2, 42, 17),
(101, 2.00, 1, 42, 3),
-- Order 43: Bananas x4, Lettuce x3, Milk x2
(102, 2.10, 4, 43, 13),
(103, 1.35, 3, 43, 12),
(104, 1.79, 2, 43, 10),
-- Order 44: Coca Cola x2, Pepsi x2, Croissant x3
(105, 1.50, 2, 44, 1),
(106, 1.40, 2, 44, 2),
(107, 1.99, 3, 44, 9),
-- Order 45: Coca Cola x3, Pepsi x2
(108, 1.50, 3, 45, 1),
(109, 1.40, 2, 45, 2),
-- Order 46: Bread x2, Croissant x3, Milk x2
(110, 2.59, 2, 46, 8),
(111, 1.99, 3, 46, 9),
(112, 1.79, 2, 46, 10),
-- Order 47: Frozen Pizza x2, Mixed Veg x2, Potato Chips x2
(113, 7.99, 2, 47, 6),
(114, 3.49, 2, 47, 7),
(115, 2.00, 2, 47, 3),
-- Order 48: Shampoo x2, Laundry Powder x3
(116, 4.50, 2, 48, 5),
(117, 5.00, 3, 48, 4),
-- Order 49: Lettuce x4, Bananas x4, Milk x2
(118, 1.35, 4, 49, 12),
(119, 2.10, 4, 49, 13),
(120, 1.79, 2, 49, 10),
-- Order 50: Wireless Mouse x2, USB-C Cable x3
(121, 14.99, 2, 50, 16),
(122, 6.50,  3, 50, 17),
-- Order 51: Coca Cola x4, Pepsi x3
(123, 1.50, 4, 51, 1),
(124, 1.40, 3, 51, 2),
-- Order 52: Croissant x5, Milk x3, Bread x2
(125, 1.99, 5, 52, 9),
(126, 1.79, 3, 52, 10),
(127, 2.59, 2, 52, 8),
-- Order 53: Potato Chips x3, Bananas x3, Lettuce x3
(128, 2.00, 3, 53, 3),
(129, 2.10, 3, 53, 13),
(130, 1.35, 3, 53, 12),
-- Order 54: Pain Relief Gel x3, Vitamin C x1, Cheddar Cheese x2
(131, 5.49, 3, 54, 15),
(132, 8.95, 1, 54, 14),
(133, 4.25, 2, 54, 11),
-- Order 55: Coca Cola x3, Pepsi x2, Potato Chips x1
(134, 1.50, 3, 55, 1),
(135, 1.40, 2, 55, 2),
(136, 2.00, 1, 55, 3),
-- Order 56: Bread x2, Milk x2, Croissant x2
(137, 2.59, 2, 56, 8),
(138, 1.79, 2, 56, 10),
(139, 1.99, 2, 56, 9),
-- Order 57: Frozen Pizza x1, Mixed Veg x1
(140, 7.99, 1, 57, 6),
(141, 3.49, 1, 57, 7),
-- Order 58: Shampoo x2, Laundry Powder x2
(142, 4.50, 2, 58, 5),
(143, 5.00, 2, 58, 4),
-- Order 59: Lettuce x4, Bananas x3, Milk x2
(144, 1.35, 4, 59, 12),
(145, 2.10, 3, 59, 13),
(146, 1.79, 2, 59, 10),
-- Order 60: Coca Cola x4, Pepsi x3
(147, 1.50, 4, 60, 1),
(148, 1.40, 3, 60, 2),
-- Order 61: USB-C Cable x3, Wireless Mouse x1
(149, 6.50,  3, 61, 17),
(150, 14.99, 1, 61, 16),
-- Order 62: Croissant x4, Milk x3, Bread x2
(151, 1.99, 4, 62, 9),
(152, 1.79, 3, 62, 10),
(153, 2.59, 2, 62, 8);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
CREATE TABLE IF NOT EXISTS `payment` (
  `payment_id` bigint NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `change_amount` double DEFAULT NULL,
  `method` enum('CARD','CASH','EWALLET','TRANSFER') NOT NULL,
  `paid_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `received_amount` double DEFAULT NULL,
  `order_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payment_order` (`order_id`),
  KEY `fk_payment_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment`
-- Methods: CASH ~48%, CARD ~40%, EWALLET ~11%
--

INSERT INTO `payment` (`payment_id`, `amount`, `change_amount`, `method`, `paid_at`, `received_amount`, `order_id`, `user_id`) VALUES
(1,  4.40,  0.60, 'CASH',    '2025-12-02 08:45:00', 5.00,  1,  2),
(2,  6.48,  0.52, 'CASH',    '2025-12-03 09:30:00', 7.00,  2,  2),
(3,  7.98,  0.00, 'CARD',    '2025-12-04 14:15:00', 7.98,  3,  2),
(4,  6.50,  0.50, 'CASH',    '2025-12-05 10:00:00', 7.00,  4,  2),
(5,  9.50,  0.00, 'CARD',    '2025-12-08 11:20:00', 9.50,  5,  2),
(6,  7.83,  0.17, 'CASH',    '2025-12-09 15:30:00', 8.00,  6,  2),
(7,  9.16,  0.00, 'EWALLET', '2025-12-10 09:00:00', 9.16,  7,  2),
(8,  11.48, 0.00, 'CARD',    '2025-12-12 16:45:00', 11.48, 8,  2),
(9,  7.00,  0.00, 'CASH',    '2025-12-14 12:00:00', 7.00,  9,  2),
(10, 6.28,  0.72, 'CASH',    '2025-12-16 10:30:00', 7.00,  10, 2),
(11, 8.07,  0.00, 'CARD',    '2025-12-18 14:00:00', 8.07,  11, 2),
(12, 4.40,  0.60, 'CASH',    '2025-12-19 09:15:00', 5.00,  12, 2),
(13, 6.37,  0.63, 'CASH',    '2025-12-20 11:45:00', 7.00,  13, 2),
(14, 7.00,  0.00, 'CARD',    '2025-12-22 16:20:00', 7.00,  14, 2),
(15, 8.48,  0.00, 'CARD',    '2025-12-23 10:00:00', 8.48,  15, 2),
(16, 19.47, 0.00, 'CARD',    '2025-12-26 14:30:00', 19.47, 16, 2),
(17, 13.93, 1.07, 'CASH',    '2025-12-28 09:45:00', 15.00, 17, 1),
(18, 9.80,  0.00, 'EWALLET', '2025-12-31 15:00:00', 9.80,  18, 2),
(19, 8.39,  0.61, 'CASH',    '2026-01-03 09:00:00', 9.00,  19, 2),
(20, 10.48, 0.52, 'CASH',    '2026-01-05 11:30:00', 11.00, 20, 2),
(21, 7.76,  0.00, 'CARD',    '2026-01-07 14:00:00', 7.76,  21, 2),
(22, 9.30,  0.00, 'CARD',    '2026-01-09 10:15:00', 9.30,  22, 2),
(23, 14.03, 0.00, 'CARD',    '2026-01-12 15:30:00', 14.03, 23, 2),
(24, 11.40, 0.60, 'CASH',    '2026-01-14 09:00:00', 12.00, 24, 2),
(25, 12.74, 0.26, 'CASH',    '2026-01-16 13:00:00', 13.00, 25, 2),
(26, 21.49, 0.00, 'CARD',    '2026-01-18 16:45:00', 21.49, 26, 1),
(27, 9.80,  0.00, 'EWALLET', '2026-01-21 10:00:00', 9.80,  27, 2),
(28, 13.48, 0.00, 'CARD',    '2026-01-23 14:30:00', 13.48, 28, 2),
(29, 14.44, 0.00, 'CARD',    '2026-01-25 09:15:00', 14.44, 29, 2),
(30, 11.48, 0.52, 'CASH',    '2026-01-27 11:00:00', 12.00, 30, 2),
(31, 11.88, 0.12, 'CASH',    '2026-01-29 15:30:00', 12.00, 31, 2),
(32, 8.38,  0.62, 'CASH',    '2026-01-31 14:00:00', 9.00,  32, 2),
(33, 8.50,  0.50, 'CASH',    '2026-02-02 09:30:00', 9.00,  33, 2),
(34, 12.96, 0.00, 'EWALLET', '2026-02-04 14:00:00', 12.96, 34, 2),
(35, 22.96, 0.00, 'CARD',    '2026-02-06 10:45:00', 22.96, 35, 2),
(36, 11.30, 0.00, 'CARD',    '2026-02-08 15:30:00', 11.30, 36, 2),
(37, 11.54, 0.46, 'CASH',    '2026-02-11 09:00:00', 12.00, 37, 2),
(38, 11.70, 0.30, 'CASH',    '2026-02-13 11:30:00', 12.00, 38, 2),
(39, 12.88, 0.00, 'CARD',    '2026-02-16 14:15:00', 12.88, 39, 2),
(40, 7.20,  0.80, 'CASH',    '2026-02-18 10:00:00', 8.00,  40, 2),
(41, 32.89, 0.00, 'CARD',    '2026-02-20 15:45:00', 32.89, 41, 1),
(42, 15.00, 0.00, 'CARD',    '2026-02-23 09:15:00', 15.00, 42, 2),
(43, 16.03, 0.97, 'CASH',    '2026-02-25 13:00:00', 17.00, 43, 2),
(44, 11.77, 0.23, 'CASH',    '2026-02-28 16:30:00', 12.00, 44, 2),
(45, 7.30,  0.70, 'CASH',    '2026-03-03 09:15:00', 8.00,  45, 2),
(46, 14.73, 0.00, 'EWALLET', '2026-03-05 14:30:00', 14.73, 46, 2),
(47, 26.96, 0.00, 'CARD',    '2026-03-08 10:00:00', 26.96, 47, 2),
(48, 24.00, 0.00, 'CARD',    '2026-03-10 11:45:00', 24.00, 48, 2),
(49, 17.38, 0.62, 'CASH',    '2026-03-13 15:00:00', 18.00, 49, 2),
(50, 49.48, 0.00, 'CARD',    '2026-03-16 09:30:00', 49.48, 50, 1),
(51, 10.20, 0.80, 'CASH',    '2026-03-18 14:00:00', 11.00, 51, 2),
(52, 20.50, 0.00, 'EWALLET', '2026-03-21 10:15:00', 20.50, 52, 2),
(53, 16.35, 0.65, 'CASH',    '2026-03-25 15:45:00', 17.00, 53, 2),
(54, 33.92, 0.00, 'CARD',    '2026-03-28 09:00:00', 33.92, 54, 1),
(55, 9.30,  0.70, 'CASH',    '2026-04-01 09:30:00', 10.00, 55, 2),
(56, 12.74, 0.26, 'CASH',    '2026-04-02 14:00:00', 13.00, 56, 2),
(57, 11.48, 0.00, 'CARD',    '2026-04-03 10:15:00', 11.48, 57, 2),
(58, 19.00, 0.00, 'CARD',    '2026-04-04 11:30:00', 19.00, 58, 2),
(59, 15.28, 0.72, 'CASH',    '2026-04-05 15:00:00', 16.00, 59, 2),
(60, 10.20, 0.80, 'CASH',    '2026-04-06 09:45:00', 11.00, 60, 2),
(61, 34.49, 0.00, 'CARD',    '2026-04-07 14:30:00', 34.49, 61, 1),
(62, 18.51, 1.49, 'CASH',    '2026-04-08 10:00:00', 20.00, 62, 2);

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
CREATE TABLE IF NOT EXISTS `product` (
  `product_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `price` double NOT NULL,
  `cost_price` double NOT NULL DEFAULT '0',
  `sku` varchar(50) DEFAULT NULL,
  `category_id` bigint NOT NULL,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `UKq1mafxn973ldq80m1irp3mpvq` (`sku`),
  KEY `fk_product_category` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `name`, `price`, `cost_price`, `sku`, `category_id`) VALUES
(1,  'Coca Cola',                  1.50,  0.95, 'SKU-COKE-001',   1),
(2,  'Pepsi',                      1.40,  0.90, 'SKU-PEPSI-002',  1),
(3,  'Potato Chips',               2.00,  1.25, 'SKU-CHIP-003',   2),
(4,  'Laundry Powder',             5.00,  3.20, 'SKU-LAUN-004',   3),
(5,  'Shampoo',                    4.50,  2.75, 'SKU-SHAM-005',   4),
(6,  'Frozen Pepperoni Pizza',     7.99,  5.10, 'SKU-FPIZ-006',   5),
(7,  'Mixed Vegetables (Frozen)',  3.49,  2.15, 'SKU-MVEG-007',   5),
(8,  'Whole Wheat Bread',          2.59,  1.35, 'SKU-WBREAD-008', 6),
(9,  'Chocolate Croissant',        1.99,  1.10, 'SKU-CCROIS-009', 6),
(10, 'Whole Milk 1L',              1.79,  1.05, 'SKU-WMILK-010',  7),
(11, 'Cheddar Cheese Block',       4.25,  2.85, 'SKU-CHED-011',   7),
(12, 'Fresh Lettuce',              1.35,  0.75, 'SKU-FLETT-012',  8),
(13, 'Bananas (1kg)',              2.10,  1.25, 'SKU-BAN-013',    8),
(14, 'Vitamin C Tablets',          8.95,  5.40, 'SKU-VITC-014',   9),
(15, 'Pain Relief Gel',            5.49,  3.30, 'SKU-PRGEL-015',  9),
(16, 'Wireless Mouse',             14.99, 9.20, 'SKU-WMOU-016',   10),
(17, 'USB-C Charging Cable',       6.50,  3.80, 'SKU-USBC-017',   10);

-- --------------------------------------------------------

--
-- Table structure for table `product_supplier`
--

DROP TABLE IF EXISTS `product_supplier`;
CREATE TABLE IF NOT EXISTS `product_supplier` (
  `product_supplier_id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `supplier_id` bigint NOT NULL,
  `preferred` tinyint(1) NOT NULL DEFAULT '0',
  `vendor_sku` varchar(100) DEFAULT NULL,
  `lead_time_days` int DEFAULT NULL,
  `cost_price` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`product_supplier_id`),
  UNIQUE KEY `uk_product_supplier_pair` (`product_id`,`supplier_id`),
  KEY `fk_product_supplier_supplier` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_supplier`
--

INSERT INTO `product_supplier` (`product_supplier_id`, `product_id`, `supplier_id`, `preferred`, `vendor_sku`, `lead_time_days`, `cost_price`) VALUES
(1,  1,  1, 1, 'V-S1-SKU-COKE-001',   3, 0.95),
(2,  2,  1, 1, 'V-S1-SKU-PEPSI-002',  3, 0.90),
(3,  3,  2, 1, 'V-S2-SKU-CHIP-003',   4, 1.25),
(4,  4,  1, 1, 'V-S1-SKU-LAUN-004',   5, 3.20),
(5,  5,  1, 1, 'V-S1-SKU-SHAM-005',   5, 2.75),
(6,  6,  1, 1, 'V-S1-SKU-FPIZ-006',   4, 5.10),
(7,  7,  1, 1, 'V-S1-SKU-MVEG-007',   4, 2.15),
(8,  8,  1, 1, 'V-S1-SKU-WBREAD-008', 2, 1.35),
(9,  9,  1, 1, 'V-S1-SKU-CCROIS-009', 2, 1.10),
(10, 10, 2, 1, 'V-S2-SKU-WMILK-010',  2, 1.05),
(11, 11, 1, 1, 'V-S1-SKU-CHED-011',   3, 2.85),
(12, 12, 2, 1, 'V-S2-SKU-FLETT-012',  2, 0.75),
(13, 13, 2, 1, 'V-S2-SKU-BAN-013',    2, 1.25),
(14, 14, 1, 1, 'V-S1-SKU-VITC-014',   6, 5.40),
(15, 15, 1, 1, 'V-S1-SKU-PRGEL-015',  6, 3.30),
(16, 16, 1, 1, 'V-S1-SKU-WMOU-016',   7, 9.20),
(17, 17, 1, 1, 'V-S1-SKU-USBC-017',   7, 3.80);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order`
--

DROP TABLE IF EXISTS `purchase_order`;
CREATE TABLE IF NOT EXISTS `purchase_order` (
  `po_id` bigint NOT NULL AUTO_INCREMENT,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('CANCELLED','OPEN','PARTIAL','RECEIVED') NOT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `total` double NOT NULL,
  `location_id` bigint DEFAULT NULL,
  `supplier_id` bigint NOT NULL,
  PRIMARY KEY (`po_id`),
  KEY `fk_purchase_order_location` (`location_id`),
  KEY `fk_purchase_order_supplier` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `purchase_order`
--

INSERT INTO `purchase_order` (`po_id`, `order_date`, `status`, `received_at`, `total`, `location_id`, `supplier_id`) VALUES
(1,  '2025-12-03 09:00:00', 'RECEIVED', '2025-12-05 09:30:00', 106.75, 1, 1),
(2,  '2025-12-03 09:05:00', 'RECEIVED', '2025-12-05 09:32:00', 124.95, 1, 1),
(3,  '2025-12-03 09:10:00', 'RECEIVED', '2025-12-05 09:35:00', 67.65,  1, 2),
(4,  '2026-01-05 08:20:00', 'RECEIVED', '2026-01-07 10:00:00', 129.00, 1, 1),
(5,  '2026-01-05 08:25:00', 'RECEIVED', '2026-01-07 10:05:00', 163.05, 1, 1),
(6,  '2026-01-05 08:30:00', 'RECEIVED', '2026-01-07 10:10:00', 72.00,  1, 2),
(7,  '2026-02-05 08:20:00', 'RECEIVED', '2026-02-08 09:00:00', 85.85,  1, 1),
(8,  '2026-02-05 08:25:00', 'RECEIVED', '2026-02-08 09:05:00', 72.00,  1, 2),
(9,  '2026-03-05 08:15:00', 'RECEIVED', '2026-03-08 10:30:00', 128.80, 1, 1),
(10, '2026-04-01 08:20:00', 'RECEIVED', '2026-04-03 09:00:00', 42.30,  1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_detail`
--

DROP TABLE IF EXISTS `purchase_order_detail`;
CREATE TABLE IF NOT EXISTS `purchase_order_detail` (
  `purchase_order_detail_id` bigint NOT NULL AUTO_INCREMENT,
  `price` double NOT NULL,
  `quantity` int NOT NULL,
  `received_qty` int NOT NULL DEFAULT '0',
  `product_id` bigint NOT NULL,
  `po_id` bigint NOT NULL,
  PRIMARY KEY (`purchase_order_detail_id`),
  KEY `fk_purchase_order_detail_product` (`product_id`),
  KEY `fk_purchase_order_detail_order` (`po_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `purchase_order_detail`
--

INSERT INTO `purchase_order_detail` (`purchase_order_detail_id`, `price`, `quantity`, `received_qty`, `product_id`, `po_id`) VALUES
-- PO1 (Dec): Beverages + Household from ABC Supplier
(1,  0.95, 25, 25, 1,  1),
(2,  0.90, 20, 20, 2,  1),
(3,  3.20, 10, 10, 4,  1),
(4,  2.75, 12, 12, 5,  1),
-- PO2 (Dec): Frozen + Bakery from ABC Supplier
(5,  5.10, 12, 12, 6,  2),
(6,  2.15, 10, 10, 7,  2),
(7,  1.35, 15, 15, 8,  2),
(8,  1.10, 20, 20, 9,  2),
-- PO3 (Dec): Fresh & Dairy from FreshFoods Co
(9,  1.25, 15, 15, 3,  3),
(10, 1.05, 18, 18, 10, 3),
(11, 0.75, 15, 15, 12, 3),
(12, 1.25, 15, 15, 13, 3),
-- PO4 (Jan): Beverages + Electronics from ABC Supplier
(13, 0.95, 18, 18, 1,  4),
(14, 0.90, 15, 15, 2,  4),
(15, 2.75,  8,  8, 5,  4),
(16, 9.20,  5,  5, 16, 4),
(17, 3.80,  8,  8, 17, 4),
-- PO5 (Jan): Frozen + Bakery + Dairy + Health from ABC Supplier
(18, 5.10, 10, 10, 6,  5),
(19, 1.35, 15, 15, 8,  5),
(20, 1.10, 18, 18, 9,  5),
(21, 2.85, 10, 10, 11, 5),
(22, 5.40,  5,  5, 14, 5),
(23, 3.30,  5,  5, 15, 5),
-- PO6 (Jan): Fresh & Dairy from FreshFoods Co
(24, 1.25, 12, 12, 3,  6),
(25, 1.05, 20, 20, 10, 6),
(26, 0.75, 18, 18, 12, 6),
(27, 1.25, 18, 18, 13, 6),
-- PO7 (Feb): Beverages + Frozen + Dairy + Health from ABC Supplier
(28, 0.95, 15, 15, 1,  7),
(29, 0.90, 12, 12, 2,  7),
(30, 2.15, 10, 10, 7,  7),
(31, 2.85,  8,  8, 11, 7),
(32, 3.30,  5,  5, 15, 7),
-- PO8 (Feb): Fresh & Dairy from FreshFoods Co
(33, 1.25, 12, 12, 3,  8),
(34, 1.05, 20, 20, 10, 8),
(35, 0.75, 18, 18, 12, 8),
(36, 1.25, 18, 18, 13, 8),
-- PO9 (Mar): Bakery + Dairy + Electronics from ABC Supplier
(37, 1.10, 20, 20, 9,  9),
(38, 2.85,  8,  8, 11, 9),
(39, 3.80, 10, 10, 17, 9),
(40, 9.20,  5,  5, 16, 9),
-- PO10 (Apr): Beverages + Household from ABC Supplier
(41, 0.95, 10, 10, 1,  10),
(42, 0.90,  8,  8, 2,  10),
(43, 3.20,  8,  8, 4,  10);

-- --------------------------------------------------------

--
-- Table structure for table `stock`
-- Final stock as of Apr 8, 2026 at location 1 (Chbar Ampov)
-- Formula: Opening stock + PO received - Units sold
--

DROP TABLE IF EXISTS `stock`;
CREATE TABLE IF NOT EXISTS `stock` (
  `stock_id` bigint NOT NULL AUTO_INCREMENT,
  `last_updated` datetime(6) NOT NULL,
  `quantity` int NOT NULL,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`stock_id`),
  UNIQUE KEY `uk_stock_product_location` (`product_id`,`location_id`),
  KEY `fk_stock_location` (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` (`stock_id`, `last_updated`, `quantity`, `location_id`, `product_id`) VALUES
(1,  '2026-04-06 09:45:00.000000', 35, 1, 1),
(2,  '2026-04-06 09:45:00.000000', 34, 1, 2),
(3,  '2026-04-01 09:30:00.000000', 25, 1, 3),
(4,  '2026-04-04 11:30:00.000000', 17, 1, 4),
(5,  '2026-04-04 11:30:00.000000', 17, 1, 5),
(6,  '2026-04-03 10:15:00.000000', 16, 1, 6),
(7,  '2026-04-03 10:15:00.000000', 15, 1, 7),
(8,  '2026-04-08 10:00:00.000000', 15, 1, 8),
(9,  '2026-04-08 10:00:00.000000', 26, 1, 9),
(10, '2026-04-08 10:00:00.000000', 26, 1, 10),
(11, '2026-03-28 09:00:00.000000', 23, 1, 11),
(12, '2026-04-05 15:00:00.000000', 26, 1, 12),
(13, '2026-04-05 15:00:00.000000', 25, 1, 13),
(14, '2026-03-28 09:00:00.000000',  5, 1, 14),
(15, '2026-03-28 09:00:00.000000', 10, 1, 15),
(16, '2026-04-07 14:30:00.000000',  8, 1, 16),
(17, '2026-04-07 14:30:00.000000', 12, 1, 17);

-- --------------------------------------------------------

--
-- Table structure for table `stock_batch`
--

DROP TABLE IF EXISTS `stock_batch`;
CREATE TABLE IF NOT EXISTS `stock_batch` (
  `batch_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `quantity_received` int NOT NULL,
  `quantity_remaining` int NOT NULL,
  `received_date` date NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `purchase_order_id` bigint DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`batch_id`),
  KEY `idx_stock_batch_product_location` (`product_id`,`location_id`),
  KEY `idx_stock_batch_received_date` (`received_date`),
  KEY `fk_stock_batch_location` (`location_id`),
  KEY `fk_stock_batch_po` (`purchase_order_id`),
  KEY `fk_stock_batch_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_movement`
--

DROP TABLE IF EXISTS `stock_movement`;
CREATE TABLE IF NOT EXISTS `stock_movement` (
  `stock_movement_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `movement_type` enum('ADJUSTMENT','PURCHASE','RECEIVE','RETURN','SALE','TRANSFER','WRITE_OFF') NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `quantity_change` int NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `location_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `po_id` bigint DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`stock_movement_id`),
  KEY `fk_stock_movement_location` (`location_id`),
  KEY `fk_stock_movement_order` (`order_id`),
  KEY `fk_stock_movement_purchase_order` (`po_id`),
  KEY `fk_stock_movement_supplier` (`supplier_id`),
  KEY `fk_stock_movement_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stock_movement`
-- IDs 1-17:  Opening stock (Dec 1, 2025)
-- IDs 18-60: PO receive movements (Dec-Apr)
-- IDs 61-213: Sale movements (Orders 1-62)
--

INSERT INTO `stock_movement` (`stock_movement_id`, `created_at`, `movement_type`, `note`, `quantity_change`, `reference`, `location_id`, `order_id`, `po_id`, `supplier_id`, `product_id`) VALUES
-- === OPENING STOCK (Dec 1, 2025) ===
(1,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025', 10, 'OPENING', 1, NULL, NULL, NULL, 1),
(2,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025', 10, 'OPENING', 1, NULL, NULL, NULL, 2),
(3,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  8, 'OPENING', 1, NULL, NULL, NULL, 3),
(4,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  5, 'OPENING', 1, NULL, NULL, NULL, 4),
(5,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  5, 'OPENING', 1, NULL, NULL, NULL, 5),
(6,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  4, 'OPENING', 1, NULL, NULL, NULL, 6),
(7,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  3, 'OPENING', 1, NULL, NULL, NULL, 7),
(8,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  5, 'OPENING', 1, NULL, NULL, NULL, 8),
(9,  '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  6, 'OPENING', 1, NULL, NULL, NULL, 9),
(10, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  5, 'OPENING', 1, NULL, NULL, NULL, 10),
(11, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  4, 'OPENING', 1, NULL, NULL, NULL, 11),
(12, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  5, 'OPENING', 1, NULL, NULL, NULL, 12),
(13, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  5, 'OPENING', 1, NULL, NULL, NULL, 13),
(14, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  4, 'OPENING', 1, NULL, NULL, NULL, 14),
(15, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  4, 'OPENING', 1, NULL, NULL, NULL, 15),
(16, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  3, 'OPENING', 1, NULL, NULL, NULL, 16),
(17, '2025-12-01 08:00:00.000000', 'ADJUSTMENT', 'Opening stock Dec 2025',  3, 'OPENING', 1, NULL, NULL, NULL, 17),
-- === PO1 RECEIVE (Dec 5): Beverages + Household from ABC Supplier ===
(18, '2025-12-05 09:30:00.000000', 'RECEIVE', 'Received PO #1 from ABC Supplier', 25, 'PO-1', 1, NULL, 1, 1, 1),
(19, '2025-12-05 09:30:00.000000', 'RECEIVE', 'Received PO #1 from ABC Supplier', 20, 'PO-1', 1, NULL, 1, 1, 2),
(20, '2025-12-05 09:30:00.000000', 'RECEIVE', 'Received PO #1 from ABC Supplier', 10, 'PO-1', 1, NULL, 1, 1, 4),
(21, '2025-12-05 09:30:00.000000', 'RECEIVE', 'Received PO #1 from ABC Supplier', 12, 'PO-1', 1, NULL, 1, 1, 5),
-- === PO2 RECEIVE (Dec 5): Frozen + Bakery from ABC Supplier ===
(22, '2025-12-05 09:32:00.000000', 'RECEIVE', 'Received PO #2 from ABC Supplier', 12, 'PO-2', 1, NULL, 2, 1, 6),
(23, '2025-12-05 09:32:00.000000', 'RECEIVE', 'Received PO #2 from ABC Supplier', 10, 'PO-2', 1, NULL, 2, 1, 7),
(24, '2025-12-05 09:32:00.000000', 'RECEIVE', 'Received PO #2 from ABC Supplier', 15, 'PO-2', 1, NULL, 2, 1, 8),
(25, '2025-12-05 09:32:00.000000', 'RECEIVE', 'Received PO #2 from ABC Supplier', 20, 'PO-2', 1, NULL, 2, 1, 9),
-- === PO3 RECEIVE (Dec 5): Fresh & Dairy from FreshFoods Co ===
(26, '2025-12-05 09:35:00.000000', 'RECEIVE', 'Received PO #3 from FreshFoods Co', 15, 'PO-3', 1, NULL, 3, 2, 3),
(27, '2025-12-05 09:35:00.000000', 'RECEIVE', 'Received PO #3 from FreshFoods Co', 18, 'PO-3', 1, NULL, 3, 2, 10),
(28, '2025-12-05 09:35:00.000000', 'RECEIVE', 'Received PO #3 from FreshFoods Co', 15, 'PO-3', 1, NULL, 3, 2, 12),
(29, '2025-12-05 09:35:00.000000', 'RECEIVE', 'Received PO #3 from FreshFoods Co', 15, 'PO-3', 1, NULL, 3, 2, 13),
-- === PO4 RECEIVE (Jan 7): Beverages + Electronics from ABC Supplier ===
(30, '2026-01-07 10:00:00.000000', 'RECEIVE', 'Received PO #4 from ABC Supplier', 18, 'PO-4', 1, NULL, 4, 1, 1),
(31, '2026-01-07 10:00:00.000000', 'RECEIVE', 'Received PO #4 from ABC Supplier', 15, 'PO-4', 1, NULL, 4, 1, 2),
(32, '2026-01-07 10:00:00.000000', 'RECEIVE', 'Received PO #4 from ABC Supplier',  8, 'PO-4', 1, NULL, 4, 1, 5),
(33, '2026-01-07 10:00:00.000000', 'RECEIVE', 'Received PO #4 from ABC Supplier',  5, 'PO-4', 1, NULL, 4, 1, 16),
(34, '2026-01-07 10:00:00.000000', 'RECEIVE', 'Received PO #4 from ABC Supplier',  8, 'PO-4', 1, NULL, 4, 1, 17),
-- === PO5 RECEIVE (Jan 7): Frozen + Bakery + Dairy + Health from ABC Supplier ===
(35, '2026-01-07 10:05:00.000000', 'RECEIVE', 'Received PO #5 from ABC Supplier', 10, 'PO-5', 1, NULL, 5, 1, 6),
(36, '2026-01-07 10:05:00.000000', 'RECEIVE', 'Received PO #5 from ABC Supplier', 15, 'PO-5', 1, NULL, 5, 1, 8),
(37, '2026-01-07 10:05:00.000000', 'RECEIVE', 'Received PO #5 from ABC Supplier', 18, 'PO-5', 1, NULL, 5, 1, 9),
(38, '2026-01-07 10:05:00.000000', 'RECEIVE', 'Received PO #5 from ABC Supplier', 10, 'PO-5', 1, NULL, 5, 1, 11),
(39, '2026-01-07 10:05:00.000000', 'RECEIVE', 'Received PO #5 from ABC Supplier',  5, 'PO-5', 1, NULL, 5, 1, 14),
(40, '2026-01-07 10:05:00.000000', 'RECEIVE', 'Received PO #5 from ABC Supplier',  5, 'PO-5', 1, NULL, 5, 1, 15),
-- === PO6 RECEIVE (Jan 7): Fresh & Dairy from FreshFoods Co ===
(41, '2026-01-07 10:10:00.000000', 'RECEIVE', 'Received PO #6 from FreshFoods Co', 12, 'PO-6', 1, NULL, 6, 2, 3),
(42, '2026-01-07 10:10:00.000000', 'RECEIVE', 'Received PO #6 from FreshFoods Co', 20, 'PO-6', 1, NULL, 6, 2, 10),
(43, '2026-01-07 10:10:00.000000', 'RECEIVE', 'Received PO #6 from FreshFoods Co', 18, 'PO-6', 1, NULL, 6, 2, 12),
(44, '2026-01-07 10:10:00.000000', 'RECEIVE', 'Received PO #6 from FreshFoods Co', 18, 'PO-6', 1, NULL, 6, 2, 13),
-- === PO7 RECEIVE (Feb 8): from ABC Supplier ===
(45, '2026-02-08 09:00:00.000000', 'RECEIVE', 'Received PO #7 from ABC Supplier', 15, 'PO-7', 1, NULL, 7, 1, 1),
(46, '2026-02-08 09:00:00.000000', 'RECEIVE', 'Received PO #7 from ABC Supplier', 12, 'PO-7', 1, NULL, 7, 1, 2),
(47, '2026-02-08 09:00:00.000000', 'RECEIVE', 'Received PO #7 from ABC Supplier', 10, 'PO-7', 1, NULL, 7, 1, 7),
(48, '2026-02-08 09:00:00.000000', 'RECEIVE', 'Received PO #7 from ABC Supplier',  8, 'PO-7', 1, NULL, 7, 1, 11),
(49, '2026-02-08 09:00:00.000000', 'RECEIVE', 'Received PO #7 from ABC Supplier',  5, 'PO-7', 1, NULL, 7, 1, 15),
-- === PO8 RECEIVE (Feb 8): Fresh & Dairy from FreshFoods Co ===
(50, '2026-02-08 09:05:00.000000', 'RECEIVE', 'Received PO #8 from FreshFoods Co', 12, 'PO-8', 1, NULL, 8, 2, 3),
(51, '2026-02-08 09:05:00.000000', 'RECEIVE', 'Received PO #8 from FreshFoods Co', 20, 'PO-8', 1, NULL, 8, 2, 10),
(52, '2026-02-08 09:05:00.000000', 'RECEIVE', 'Received PO #8 from FreshFoods Co', 18, 'PO-8', 1, NULL, 8, 2, 12),
(53, '2026-02-08 09:05:00.000000', 'RECEIVE', 'Received PO #8 from FreshFoods Co', 18, 'PO-8', 1, NULL, 8, 2, 13),
-- === PO9 RECEIVE (Mar 8): Bakery + Dairy + Electronics from ABC Supplier ===
(54, '2026-03-08 10:30:00.000000', 'RECEIVE', 'Received PO #9 from ABC Supplier', 20, 'PO-9', 1, NULL, 9, 1, 9),
(55, '2026-03-08 10:30:00.000000', 'RECEIVE', 'Received PO #9 from ABC Supplier',  8, 'PO-9', 1, NULL, 9, 1, 11),
(56, '2026-03-08 10:30:00.000000', 'RECEIVE', 'Received PO #9 from ABC Supplier', 10, 'PO-9', 1, NULL, 9, 1, 17),
(57, '2026-03-08 10:30:00.000000', 'RECEIVE', 'Received PO #9 from ABC Supplier',  5, 'PO-9', 1, NULL, 9, 1, 16),
-- === PO10 RECEIVE (Apr 3): Beverages + Household from ABC Supplier ===
(58, '2026-04-03 09:00:00.000000', 'RECEIVE', 'Received PO #10 from ABC Supplier', 10, 'PO-10', 1, NULL, 10, 1, 1),
(59, '2026-04-03 09:00:00.000000', 'RECEIVE', 'Received PO #10 from ABC Supplier',  8, 'PO-10', 1, NULL, 10, 1, 2),
(60, '2026-04-03 09:00:00.000000', 'RECEIVE', 'Received PO #10 from ABC Supplier',  8, 'PO-10', 1, NULL, 10, 1, 4),
-- === SALE MOVEMENTS (Orders 1-62) ===
-- Order 1: Coca Cola x2, Pepsi x1
(61,  '2025-12-02 08:45:00.000000', 'SALE', 'Order paid', -2, 'ORDER-1',  1, 1,  NULL, NULL, 1),
(62,  '2025-12-02 08:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-1',  1, 1,  NULL, NULL, 2),
-- Order 2: Bread x1, Milk x1, Bananas x1
(63,  '2025-12-03 09:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-2',  1, 2,  NULL, NULL, 8),
(64,  '2025-12-03 09:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-2',  1, 2,  NULL, NULL, 10),
(65,  '2025-12-03 09:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-2',  1, 2,  NULL, NULL, 13),
-- Order 3: Potato Chips x2, Croissant x2
(66,  '2025-12-04 14:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-3',  1, 3,  NULL, NULL, 3),
(67,  '2025-12-04 14:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-3',  1, 3,  NULL, NULL, 9),
-- Order 4: Coca Cola x3, Potato Chips x1
(68,  '2025-12-05 10:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-4',  1, 4,  NULL, NULL, 1),
(69,  '2025-12-05 10:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-4',  1, 4,  NULL, NULL, 3),
-- Order 5: Shampoo x1, Laundry Powder x1
(70,  '2025-12-08 11:20:00.000000', 'SALE', 'Order paid', -1, 'ORDER-5',  1, 5,  NULL, NULL, 5),
(71,  '2025-12-08 11:20:00.000000', 'SALE', 'Order paid', -1, 'ORDER-5',  1, 5,  NULL, NULL, 4),
-- Order 6: Milk x2, Cheddar Cheese x1
(72,  '2025-12-09 15:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-6',  1, 6,  NULL, NULL, 10),
(73,  '2025-12-09 15:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-6',  1, 6,  NULL, NULL, 11),
-- Order 7: Bread x2, Croissant x2
(74,  '2025-12-10 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-7',  1, 7,  NULL, NULL, 8),
(75,  '2025-12-10 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-7',  1, 7,  NULL, NULL, 9),
-- Order 8: Frozen Pizza x1, Mixed Veg x1
(76,  '2025-12-12 16:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-8',  1, 8,  NULL, NULL, 6),
(77,  '2025-12-12 16:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-8',  1, 8,  NULL, NULL, 7),
-- Order 9: Pepsi x3, Coca Cola x2
(78,  '2025-12-14 12:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-9',  1, 9,  NULL, NULL, 2),
(79,  '2025-12-14 12:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-9',  1, 9,  NULL, NULL, 1),
-- Order 10: Milk x2, Lettuce x2
(80,  '2025-12-16 10:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-10', 1, 10, NULL, NULL, 10),
(81,  '2025-12-16 10:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-10', 1, 10, NULL, NULL, 12),
-- Order 11: Croissant x3, Bananas x1
(82,  '2025-12-18 14:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-11', 1, 11, NULL, NULL, 9),
(83,  '2025-12-18 14:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-11', 1, 11, NULL, NULL, 13),
-- Order 12: Coca Cola x2, Pepsi x1
(84,  '2025-12-19 09:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-12', 1, 12, NULL, NULL, 1),
(85,  '2025-12-19 09:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-12', 1, 12, NULL, NULL, 2),
-- Order 13: Bread x1, Milk x1, Croissant x1
(86,  '2025-12-20 11:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-13', 1, 13, NULL, NULL, 8),
(87,  '2025-12-20 11:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-13', 1, 13, NULL, NULL, 10),
(88,  '2025-12-20 11:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-13', 1, 13, NULL, NULL, 9),
-- Order 14: Potato Chips x2, Coca Cola x2
(89,  '2025-12-22 16:20:00.000000', 'SALE', 'Order paid', -2, 'ORDER-14', 1, 14, NULL, NULL, 3),
(90,  '2025-12-22 16:20:00.000000', 'SALE', 'Order paid', -2, 'ORDER-14', 1, 14, NULL, NULL, 1),
-- Order 15: Shampoo x1, Croissant x2
(91,  '2025-12-23 10:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-15', 1, 15, NULL, NULL, 5),
(92,  '2025-12-23 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-15', 1, 15, NULL, NULL, 9),
-- Order 16: Frozen Pizza x2, Mixed Veg x1
(93,  '2025-12-26 14:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-16', 1, 16, NULL, NULL, 6),
(94,  '2025-12-26 14:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-16', 1, 16, NULL, NULL, 7),
-- Order 17: Lettuce x3, Bananas x3, Milk x2
(95,  '2025-12-28 09:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-17', 1, 17, NULL, NULL, 12),
(96,  '2025-12-28 09:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-17', 1, 17, NULL, NULL, 13),
(97,  '2025-12-28 09:45:00.000000', 'SALE', 'Order paid', -2, 'ORDER-17', 1, 17, NULL, NULL, 10),
-- Order 18: Coca Cola x2, Pepsi x2, Potato Chips x2
(98,  '2025-12-31 15:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-18', 1, 18, NULL, NULL, 1),
(99,  '2025-12-31 15:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-18', 1, 18, NULL, NULL, 2),
(100, '2025-12-31 15:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-18', 1, 18, NULL, NULL, 3),
-- Order 19: Coca Cola x2, Pepsi x2, Bread x1
(101, '2026-01-03 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-19', 1, 19, NULL, NULL, 1),
(102, '2026-01-03 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-19', 1, 19, NULL, NULL, 2),
(103, '2026-01-03 09:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-19', 1, 19, NULL, NULL, 8),
-- Order 20: Milk x2, Lettuce x2, Bananas x2
(104, '2026-01-05 11:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-20', 1, 20, NULL, NULL, 10),
(105, '2026-01-05 11:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-20', 1, 20, NULL, NULL, 12),
(106, '2026-01-05 11:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-20', 1, 20, NULL, NULL, 13),
-- Order 21: Croissant x3, Milk x1
(107, '2026-01-07 14:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-21', 1, 21, NULL, NULL, 9),
(108, '2026-01-07 14:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-21', 1, 21, NULL, NULL, 10),
-- Order 22: Shampoo x1, Potato Chips x1, Pepsi x2
(109, '2026-01-09 10:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-22', 1, 22, NULL, NULL, 5),
(110, '2026-01-09 10:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-22', 1, 22, NULL, NULL, 3),
(111, '2026-01-09 10:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-22', 1, 22, NULL, NULL, 2),
-- Order 23: Frozen Pizza x1, Milk x1, Cheddar Cheese x1
(112, '2026-01-12 15:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-23', 1, 23, NULL, NULL, 6),
(113, '2026-01-12 15:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-23', 1, 23, NULL, NULL, 10),
(114, '2026-01-12 15:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-23', 1, 23, NULL, NULL, 11),
-- Order 24: Coca Cola x3, Bananas x2, Lettuce x2
(115, '2026-01-14 09:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-24', 1, 24, NULL, NULL, 1),
(116, '2026-01-14 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-24', 1, 24, NULL, NULL, 13),
(117, '2026-01-14 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-24', 1, 24, NULL, NULL, 12),
-- Order 25: Bread x2, Croissant x2, Milk x2
(118, '2026-01-16 13:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-25', 1, 25, NULL, NULL, 8),
(119, '2026-01-16 13:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-25', 1, 25, NULL, NULL, 9),
(120, '2026-01-16 13:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-25', 1, 25, NULL, NULL, 10),
-- Order 26: USB-C Cable x1, Wireless Mouse x1
(121, '2026-01-18 16:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-26', 1, 26, NULL, NULL, 17),
(122, '2026-01-18 16:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-26', 1, 26, NULL, NULL, 16),
-- Order 27: Coca Cola x2, Pepsi x2, Potato Chips x2
(123, '2026-01-21 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-27', 1, 27, NULL, NULL, 1),
(124, '2026-01-21 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-27', 1, 27, NULL, NULL, 2),
(125, '2026-01-21 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-27', 1, 27, NULL, NULL, 3),
-- Order 28: Frozen Pizza x1, Mixed Veg x1, Potato Chips x1
(126, '2026-01-23 14:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-28', 1, 28, NULL, NULL, 6),
(127, '2026-01-23 14:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-28', 1, 28, NULL, NULL, 7),
(128, '2026-01-23 14:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-28', 1, 28, NULL, NULL, 3),
-- Order 29: Vitamin C x1, Pain Relief Gel x1
(129, '2026-01-25 09:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-29', 1, 29, NULL, NULL, 14),
(130, '2026-01-25 09:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-29', 1, 29, NULL, NULL, 15),
-- Order 30: Bread x2, Bananas x3
(131, '2026-01-27 11:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-30', 1, 30, NULL, NULL, 8),
(132, '2026-01-27 11:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-30', 1, 30, NULL, NULL, 13),
-- Order 31: Milk x2, Lettuce x3, Cheddar Cheese x1
(133, '2026-01-29 15:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-31', 1, 31, NULL, NULL, 10),
(134, '2026-01-29 15:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-31', 1, 31, NULL, NULL, 12),
(135, '2026-01-29 15:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-31', 1, 31, NULL, NULL, 11),
-- Order 32: Coca Cola x2, Pepsi x1, Croissant x2
(136, '2026-01-31 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-32', 1, 32, NULL, NULL, 1),
(137, '2026-01-31 14:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-32', 1, 32, NULL, NULL, 2),
(138, '2026-01-31 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-32', 1, 32, NULL, NULL, 9),
-- Order 33: Coca Cola x3, Potato Chips x2
(139, '2026-02-02 09:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-33', 1, 33, NULL, NULL, 1),
(140, '2026-02-02 09:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-33', 1, 33, NULL, NULL, 3),
-- Order 34: Bread x2, Milk x2, Bananas x2
(141, '2026-02-04 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-34', 1, 34, NULL, NULL, 8),
(142, '2026-02-04 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-34', 1, 34, NULL, NULL, 10),
(143, '2026-02-04 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-34', 1, 34, NULL, NULL, 13),
-- Order 35: Frozen Pizza x2, Mixed Veg x2
(144, '2026-02-06 10:45:00.000000', 'SALE', 'Order paid', -2, 'ORDER-35', 1, 35, NULL, NULL, 6),
(145, '2026-02-06 10:45:00.000000', 'SALE', 'Order paid', -2, 'ORDER-35', 1, 35, NULL, NULL, 7),
-- Order 36: Shampoo x1, Potato Chips x2, Pepsi x2
(146, '2026-02-08 15:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-36', 1, 36, NULL, NULL, 5),
(147, '2026-02-08 15:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-36', 1, 36, NULL, NULL, 3),
(148, '2026-02-08 15:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-36', 1, 36, NULL, NULL, 2),
-- Order 37: Croissant x4, Milk x2
(149, '2026-02-11 09:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-37', 1, 37, NULL, NULL, 9),
(150, '2026-02-11 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-37', 1, 37, NULL, NULL, 10),
-- Order 38: Lettuce x4, Bananas x3
(151, '2026-02-13 11:30:00.000000', 'SALE', 'Order paid', -4, 'ORDER-38', 1, 38, NULL, NULL, 12),
(152, '2026-02-13 11:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-38', 1, 38, NULL, NULL, 13),
-- Order 39: Cheddar Cheese x2, Milk x1, Bread x1
(153, '2026-02-16 14:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-39', 1, 39, NULL, NULL, 11),
(154, '2026-02-16 14:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-39', 1, 39, NULL, NULL, 10),
(155, '2026-02-16 14:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-39', 1, 39, NULL, NULL, 8),
-- Order 40: Coca Cola x2, Pepsi x3
(156, '2026-02-18 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-40', 1, 40, NULL, NULL, 1),
(157, '2026-02-18 10:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-40', 1, 40, NULL, NULL, 2),
-- Order 41: Vitamin C x2, Wireless Mouse x1
(158, '2026-02-20 15:45:00.000000', 'SALE', 'Order paid', -2, 'ORDER-41', 1, 41, NULL, NULL, 14),
(159, '2026-02-20 15:45:00.000000', 'SALE', 'Order paid', -1, 'ORDER-41', 1, 41, NULL, NULL, 16),
-- Order 42: USB-C Cable x2, Potato Chips x1
(160, '2026-02-23 09:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-42', 1, 42, NULL, NULL, 17),
(161, '2026-02-23 09:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-42', 1, 42, NULL, NULL, 3),
-- Order 43: Bananas x4, Lettuce x3, Milk x2
(162, '2026-02-25 13:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-43', 1, 43, NULL, NULL, 13),
(163, '2026-02-25 13:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-43', 1, 43, NULL, NULL, 12),
(164, '2026-02-25 13:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-43', 1, 43, NULL, NULL, 10),
-- Order 44: Coca Cola x2, Pepsi x2, Croissant x3
(165, '2026-02-28 16:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-44', 1, 44, NULL, NULL, 1),
(166, '2026-02-28 16:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-44', 1, 44, NULL, NULL, 2),
(167, '2026-02-28 16:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-44', 1, 44, NULL, NULL, 9),
-- Order 45: Coca Cola x3, Pepsi x2
(168, '2026-03-03 09:15:00.000000', 'SALE', 'Order paid', -3, 'ORDER-45', 1, 45, NULL, NULL, 1),
(169, '2026-03-03 09:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-45', 1, 45, NULL, NULL, 2),
-- Order 46: Bread x2, Croissant x3, Milk x2
(170, '2026-03-05 14:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-46', 1, 46, NULL, NULL, 8),
(171, '2026-03-05 14:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-46', 1, 46, NULL, NULL, 9),
(172, '2026-03-05 14:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-46', 1, 46, NULL, NULL, 10),
-- Order 47: Frozen Pizza x2, Mixed Veg x2, Potato Chips x2
(173, '2026-03-08 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-47', 1, 47, NULL, NULL, 6),
(174, '2026-03-08 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-47', 1, 47, NULL, NULL, 7),
(175, '2026-03-08 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-47', 1, 47, NULL, NULL, 3),
-- Order 48: Shampoo x2, Laundry Powder x3
(176, '2026-03-10 11:45:00.000000', 'SALE', 'Order paid', -2, 'ORDER-48', 1, 48, NULL, NULL, 5),
(177, '2026-03-10 11:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-48', 1, 48, NULL, NULL, 4),
-- Order 49: Lettuce x4, Bananas x4, Milk x2
(178, '2026-03-13 15:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-49', 1, 49, NULL, NULL, 12),
(179, '2026-03-13 15:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-49', 1, 49, NULL, NULL, 13),
(180, '2026-03-13 15:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-49', 1, 49, NULL, NULL, 10),
-- Order 50: Wireless Mouse x2, USB-C Cable x3
(181, '2026-03-16 09:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-50', 1, 50, NULL, NULL, 16),
(182, '2026-03-16 09:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-50', 1, 50, NULL, NULL, 17),
-- Order 51: Coca Cola x4, Pepsi x3
(183, '2026-03-18 14:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-51', 1, 51, NULL, NULL, 1),
(184, '2026-03-18 14:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-51', 1, 51, NULL, NULL, 2),
-- Order 52: Croissant x5, Milk x3, Bread x2
(185, '2026-03-21 10:15:00.000000', 'SALE', 'Order paid', -5, 'ORDER-52', 1, 52, NULL, NULL, 9),
(186, '2026-03-21 10:15:00.000000', 'SALE', 'Order paid', -3, 'ORDER-52', 1, 52, NULL, NULL, 10),
(187, '2026-03-21 10:15:00.000000', 'SALE', 'Order paid', -2, 'ORDER-52', 1, 52, NULL, NULL, 8),
-- Order 53: Potato Chips x3, Bananas x3, Lettuce x3
(188, '2026-03-25 15:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-53', 1, 53, NULL, NULL, 3),
(189, '2026-03-25 15:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-53', 1, 53, NULL, NULL, 13),
(190, '2026-03-25 15:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-53', 1, 53, NULL, NULL, 12),
-- Order 54: Pain Relief Gel x3, Vitamin C x1, Cheddar Cheese x2
(191, '2026-03-28 09:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-54', 1, 54, NULL, NULL, 15),
(192, '2026-03-28 09:00:00.000000', 'SALE', 'Order paid', -1, 'ORDER-54', 1, 54, NULL, NULL, 14),
(193, '2026-03-28 09:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-54', 1, 54, NULL, NULL, 11),
-- Order 55: Coca Cola x3, Pepsi x2, Potato Chips x1
(194, '2026-04-01 09:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-55', 1, 55, NULL, NULL, 1),
(195, '2026-04-01 09:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-55', 1, 55, NULL, NULL, 2),
(196, '2026-04-01 09:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-55', 1, 55, NULL, NULL, 3),
-- Order 56: Bread x2, Milk x2, Croissant x2
(197, '2026-04-02 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-56', 1, 56, NULL, NULL, 8),
(198, '2026-04-02 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-56', 1, 56, NULL, NULL, 10),
(199, '2026-04-02 14:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-56', 1, 56, NULL, NULL, 9),
-- Order 57: Frozen Pizza x1, Mixed Veg x1
(200, '2026-04-03 10:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-57', 1, 57, NULL, NULL, 6),
(201, '2026-04-03 10:15:00.000000', 'SALE', 'Order paid', -1, 'ORDER-57', 1, 57, NULL, NULL, 7),
-- Order 58: Shampoo x2, Laundry Powder x2
(202, '2026-04-04 11:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-58', 1, 58, NULL, NULL, 5),
(203, '2026-04-04 11:30:00.000000', 'SALE', 'Order paid', -2, 'ORDER-58', 1, 58, NULL, NULL, 4),
-- Order 59: Lettuce x4, Bananas x3, Milk x2
(204, '2026-04-05 15:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-59', 1, 59, NULL, NULL, 12),
(205, '2026-04-05 15:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-59', 1, 59, NULL, NULL, 13),
(206, '2026-04-05 15:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-59', 1, 59, NULL, NULL, 10),
-- Order 60: Coca Cola x4, Pepsi x3
(207, '2026-04-06 09:45:00.000000', 'SALE', 'Order paid', -4, 'ORDER-60', 1, 60, NULL, NULL, 1),
(208, '2026-04-06 09:45:00.000000', 'SALE', 'Order paid', -3, 'ORDER-60', 1, 60, NULL, NULL, 2),
-- Order 61: USB-C Cable x3, Wireless Mouse x1
(209, '2026-04-07 14:30:00.000000', 'SALE', 'Order paid', -3, 'ORDER-61', 1, 61, NULL, NULL, 17),
(210, '2026-04-07 14:30:00.000000', 'SALE', 'Order paid', -1, 'ORDER-61', 1, 61, NULL, NULL, 16),
-- Order 62: Croissant x4, Milk x3, Bread x2
(211, '2026-04-08 10:00:00.000000', 'SALE', 'Order paid', -4, 'ORDER-62', 1, 62, NULL, NULL, 9),
(212, '2026-04-08 10:00:00.000000', 'SALE', 'Order paid', -3, 'ORDER-62', 1, 62, NULL, NULL, 10),
(213, '2026-04-08 10:00:00.000000', 'SALE', 'Order paid', -2, 'ORDER-62', 1, 62, NULL, NULL, 8);

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
CREATE TABLE IF NOT EXISTS `supplier` (
  `supplier_id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`supplier_id`, `address`, `email`, `name`, `phone`) VALUES
(1, 'Street 1, Phnom Penh', 'abc@supplier.com', 'ABC Supplier', '012345678'),
(2, 'Street 2, Phnom Penh', 'fresh@foods.com',  'FreshFoods Co', '087654321');

-- --------------------------------------------------------

--
-- Table structure for table `tax`
--

DROP TABLE IF EXISTS `tax`;
CREATE TABLE IF NOT EXISTS `tax` (
  `tax_id` bigint NOT NULL AUTO_INCREMENT,
  `tax_amount` double NOT NULL,
  `tax_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` enum('PURCHASE','SALES') NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `po_id` bigint DEFAULT NULL,
  PRIMARY KEY (`tax_id`),
  KEY `fk_tax_order` (`order_id`),
  KEY `fk_tax_purchase_order` (`po_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tax`
--

INSERT INTO `tax` (`tax_id`, `tax_amount`, `tax_date`, `type`, `order_id`, `po_id`) VALUES
(1, 10.70, '2025-12-05 09:30:00', 'PURCHASE', NULL, 1),
(2, 12.50, '2025-12-05 09:32:00', 'PURCHASE', NULL, 2),
(3,  6.77, '2025-12-05 09:35:00', 'PURCHASE', NULL, 3);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('ADMIN','CASHIER','MANAGER') NOT NULL,
  `shift` enum('AFTERNOON','EVENING','MORNING') DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `location_id` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UKsb8bbouer5wak8vyiiy4pf2bx` (`username`),
  KEY `FKneyhvoj17hax43m8dq3u7gbic` (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
-- Passwords (bcrypt): admin=admin123, cashier=cashier123, manager=manager123
--

INSERT INTO `user` (`user_id`, `created_at`, `email`, `password`, `phone`, `role`, `shift`, `status`, `updated_at`, `username`, `location_id`) VALUES
(1, '2025-11-30 08:00:00.000000', 'admin.demo@mini.com',   '$2y$12$GOayOeb2sURc5pISlZo3t.FwaT49S9rHh4SCFyH7avXhVMxmddp9O', '099111222', 'ADMIN',   'MORNING', 'ACTIVE', '2025-11-30 08:00:00.000000', 'admin',   1),
(2, '2025-11-30 08:00:00.000000', 'cashier.demo@mini.com', '$2y$12$fPHeX3rcYVqzl3NY73iaNe1M30hMhffqiSU8e0WwVp0lvHYLVKyli', '099333444', 'CASHIER', 'MORNING', 'ACTIVE', '2025-11-30 08:00:00.000000', 'cashier', 1),
(3, '2025-11-30 08:00:00.000000', 'manager.demo@mini.com', '$2y$12$XFV1Fxs2695br3.ifffb..GP2A1eKsOY.Iw3meYa57oGVuGMd9Es2', '099555666', 'MANAGER', 'MORNING', 'ACTIVE', '2025-11-30 08:00:00.000000', 'manager', 1);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `fk_activity_log_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `cash_register`
--
ALTER TABLE `cash_register`
  ADD CONSTRAINT `fk_cash_register_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_cash_register_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `expense`
--
ALTER TABLE `expense`
  ADD CONSTRAINT `fk_expense_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_expense_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  ADD CONSTRAINT `fk_orders_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `order_detail`
--
ALTER TABLE `order_detail`
  ADD CONSTRAINT `fk_orderdetail_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `fk_orderdetail_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `fk_payment_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`);

--
-- Constraints for table `product_supplier`
--
ALTER TABLE `product_supplier`
  ADD CONSTRAINT `fk_product_supplier_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `fk_product_supplier_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`);

--
-- Constraints for table `purchase_order`
--
ALTER TABLE `purchase_order`
  ADD CONSTRAINT `fk_purchase_order_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_purchase_order_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`);

--
-- Constraints for table `purchase_order_detail`
--
ALTER TABLE `purchase_order_detail`
  ADD CONSTRAINT `fk_purchase_order_detail_order` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`),
  ADD CONSTRAINT `fk_purchase_order_detail_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `fk_stock_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_stock_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `stock_batch`
--
ALTER TABLE `stock_batch`
  ADD CONSTRAINT `fk_stock_batch_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_stock_batch_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_order` (`po_id`),
  ADD CONSTRAINT `fk_stock_batch_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `fk_stock_batch_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`);

--
-- Constraints for table `stock_movement`
--
ALTER TABLE `stock_movement`
  ADD CONSTRAINT `fk_stock_movement_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  ADD CONSTRAINT `fk_stock_movement_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `fk_stock_movement_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  ADD CONSTRAINT `fk_stock_movement_purchase_order` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`),
  ADD CONSTRAINT `fk_stock_movement_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`);

--
-- Constraints for table `tax`
--
ALTER TABLE `tax`
  ADD CONSTRAINT `fk_tax_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `fk_tax_purchase_order` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`);

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `FKneyhvoj17hax43m8dq3u7gbic` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
