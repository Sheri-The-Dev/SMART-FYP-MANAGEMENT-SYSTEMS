-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 07, 2026 at 05:27 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fypms_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `archived_projects`
--

CREATE TABLE `archived_projects` (
  `id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `year` smallint(5) UNSIGNED NOT NULL,
  `abstract` text NOT NULL,
  `department` varchar(100) NOT NULL,
  `supervisor_name` varchar(200) NOT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `technology_type` varchar(200) DEFAULT NULL,
  `final_grade` varchar(10) DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `student_names` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `archived_projects`
--

INSERT INTO `archived_projects` (`id`, `title`, `year`, `abstract`, `department`, `supervisor_name`, `supervisor_id`, `technology_type`, `final_grade`, `keywords`, `student_names`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Skill Link', 2024, 'Skill Link is a web-based platform that connects skilled individuals with clients. It helps users showcase skills, find relevant jobs, and manage hiring efficiently through a simple and user-friendly interface.', 'Software Engineering', 'Mr. Muhammad Nadeem Khan', NULL, 'Web Development', NULL, 'Skill Link, Freelancing, Web Platform', 'Sana Ullah, Hammad Javed', 1, '2026-01-05 04:59:09', '2026-01-05 04:59:09'),
(2, 'FlashFit', 2024, 'FlashFit is a fitness management application designed to help users track workouts, monitor progress, and maintain healthy routines using digital tools and performance analytics.', 'Software Engineering', 'Mr. Shahzad Ahmed Khan', NULL, 'Mobile / Web Application', NULL, 'FlashFit, Fitness, Health App', 'M. Abdullah Mughal, Sheikh M. Abdullah', 1, '2026-01-05 04:59:09', '2026-01-05 04:59:09'),
(3, 'Marriage Hall Reservation System', 2024, 'This system automates the process of booking and managing marriage halls. It provides scheduling, availability checking, and reservation management to reduce manual work and conflicts.', 'Software Engineering', 'Mr. Muhammad Imran Khan', NULL, 'Web Development', NULL, 'Marriage Hall, Reservation, Booking System', 'Mudassar Ali', 1, '2026-01-05 04:59:09', '2026-01-05 04:59:09'),
(4, 'Detonation and Blasting Management System (DBMS)', 2024, 'DBMS is designed to manage blasting operations safely by maintaining records, schedules, and compliance details. It improves safety, monitoring, and operational efficiency in blasting activities.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'DBMS, Blasting, Safety Management', 'M. Zuhran Yousaf, Saad Bin Muzaffar', 1, '2026-01-05 04:59:10', '2026-01-05 04:59:10'),
(5, 'Flour Mill Management System', 2024, 'This system manages flour mill operations including inventory, production, and sales. It helps automate daily tasks and provides accurate reporting for better decision making.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'Flour Mill, Inventory, Production', 'M. Ali Raza, Taib Ullah, Ahsan Abbasi', 1, '2026-01-05 04:59:10', '2026-01-05 04:59:10'),
(6, 'Shift Mate', 2024, 'Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.', 'Software Engineering', 'Syed Hassaan Ali Shah', NULL, 'Web Application', 'A+', 'Shift Mate, Scheduling, HR System', 'Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz', 1, '2026-01-05 04:59:11', '2026-01-05 06:07:21'),
(8, 'Petorius', 2024, 'Petorius is an online system focused on pet management and services. It helps users manage pet records, appointments, and related services in a centralized platform.', 'Software Engineering', 'Mr. Ihtesham Ullah', NULL, 'Web Application', NULL, 'Petorius, Pets, Management System', 'Nouman Naeem, Muhammad Ehsaan, Muhammad Hanzla', 1, '2026-01-05 04:59:11', '2026-01-05 04:59:11'),
(9, 'Picfolio', 2024, 'Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.', 'Computer Science', 'Mr. Usman Sharif', NULL, 'Web Application', 'Failed in', 'Picfolio, Portfolio, Media', 'M. Hamza Ali, Umer Javed Dar', 1, '2026-01-05 04:59:11', '2026-01-05 05:00:41'),
(10, 'Skill Link', 2024, 'Skill Link is a web-based platform that connects skilled individuals with clients. It helps users showcase skills, find relevant jobs, and manage hiring efficiently through a simple and user-friendly interface.', 'Software Engineering', 'Mr. Muhammad Nadeem Khan', NULL, 'Web Development', NULL, 'Skill Link, Freelancing, Web Platform', 'Sana Ullah, Hammad Javed', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(11, 'FlashFit', 2024, 'FlashFit is a fitness management application designed to help users track workouts, monitor progress, and maintain healthy routines using digital tools and performance analytics.', 'Software Engineering', 'Mr. Shahzad Ahmed Khan', NULL, 'Mobile / Web Application', NULL, 'FlashFit, Fitness, Health App', 'M. Abdullah Mughal, Sheikh M. Abdullah', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(12, 'Marriage Hall Reservation System', 2024, 'This system automates the process of booking and managing marriage halls. It provides scheduling, availability checking, and reservation management to reduce manual work and conflicts.', 'Software Engineering', 'Mr. Muhammad Imran Khan', NULL, 'Web Development', NULL, 'Marriage Hall, Reservation, Booking System', 'Mudassar Ali', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(13, 'Detonation and Blasting Management System (DBMS)', 2024, 'DBMS is designed to manage blasting operations safely by maintaining records, schedules, and compliance details. It improves safety, monitoring, and operational efficiency in blasting activities.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'DBMS, Blasting, Safety Management', 'M. Zuhran Yousaf, Saad Bin Muzaffar', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(14, 'Flour Mill Management System', 2024, 'This system manages flour mill operations including inventory, production, and sales. It helps automate daily tasks and provides accurate reporting for better decision making.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'Flour Mill, Inventory, Production', 'M. Ali Raza, Taib Ullah, Ahsan Abbasi', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(15, 'Shift Mate', 2024, 'Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.', 'Software Engineering', 'Syed Hassaan Ali Shah', NULL, 'Web Application', NULL, 'Shift Mate, Scheduling, HR System', 'Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(16, 'Smart Rent', 2024, 'Smart Rent is a property rental management system that helps landlords and tenants manage rental agreements, payments, and property records through a digital platform.', 'Software Engineering', 'Mr. Raja Jalees Ul Hassan', NULL, 'Web Application', NULL, 'Smart Rent, Property, Rental System', 'Tehmas Panni, Osama Javed', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(17, 'Petorius', 2024, 'Petorius is an online system focused on pet management and services. It helps users manage pet records, appointments, and related services in a centralized platform.', 'Software Engineering', 'Mr. Ihtesham Ullah', NULL, 'Web Application', NULL, 'Petorius, Pets, Management System', 'Nouman Naeem, Muhammad Ehsaan, Muhammad Hanzla', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(18, 'Picfolio', 2024, 'Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.', 'Software Engineering', 'Mr. Usman Sharif', NULL, 'Web Application', 'Failed in ', 'Picfolio, Portfolio, Media', 'M. Hamza Ali, Umer Javed Dar', 30, '2026-01-05 06:31:26', '2026-01-05 06:31:26'),
(19, 'Skill Link', 2024, 'Skill Link is a web-based platform that connects skilled individuals with clients. It helps users showcase skills, find relevant jobs, and manage hiring efficiently through a simple and user-friendly interface.', 'Software Engineering', 'Mr Muhammad Nadeem Khan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(20, 'FlashFit', 2024, 'FlashFit is a fitness management application designed to help users track workouts, monitor progress, and maintain healthy routines using digital tools and performance analytics.', 'Software Engineering', 'Mr. Shahzad Ahmed Khan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(21, 'Marriage Hall Reservation System', 2024, 'This system automates the process of booking and managing marriage halls. It provides scheduling, availability checking, and reservation management to reduce manual work and conflicts.', 'Software Engineering', 'Mr. Muhammad Imran Khan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(22, 'Detonation and Blasting Management System (DBMS)', 2024, 'DBMS is designed to manage blasting operations safely by maintaining records, schedules, and compliance details. It improves safety, monitoring, and operational efficiency in blasting activities.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(23, 'Flour Mill Management System', 2024, 'This system manages flour mill operations including inventory, production, and sales. It helps automate daily tasks and provides accurate reporting for better decision making.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(24, 'Shift Mate', 2024, 'Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.', 'Software Engineering', 'Syed Hassaan Ali Shah', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(25, 'Smart Rent', 2024, 'Smart Rent is a property rental management system that helps landlords and tenants manage rental agreements, payments, and property records through a digital platform.', 'Software Engineering', 'Mr. Raja Jalees Ul Hassan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:39:59', '2026-01-05 08:39:59'),
(26, 'Petorius', 2024, 'Petorius is an online system focused on pet management and services. It helps users manage pet records, appointments, and related services in a centralized platform.', 'Software Engineering', 'Mr. Ihtesham Ullah', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:00', '2026-01-05 08:40:00'),
(27, 'Picfolio', 2024, 'Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.', 'Software Engineering', 'Mr. Usman Sharif', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:00', '2026-01-05 08:40:00'),
(28, 'Skill Link', 2024, 'Skill Link is a web-based platform that connects skilled individuals with clients. It helps users showcase skills, find relevant jobs, and manage hiring efficiently through a simple and user-friendly interface.', 'Software Engineering', 'Mr Muhammad Nadeem Khan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(29, 'FlashFit', 2024, 'FlashFit is a fitness management application designed to help users track workouts, monitor progress, and maintain healthy routines using digital tools and performance analytics.', 'Software Engineering', 'Mr. Shahzad Ahmed Khan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(30, 'Marriage Hall Reservation System', 2024, 'This system automates the process of booking and managing marriage halls. It provides scheduling, availability checking, and reservation management to reduce manual work and conflicts.', 'Software Engineering', 'Mr. Muhammad Imran Khan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(31, 'Detonation and Blasting Management System (DBMS)', 2024, 'DBMS is designed to manage blasting operations safely by maintaining records, schedules, and compliance details. It improves safety, monitoring, and operational efficiency in blasting activities.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(32, 'Flour Mill Management System', 2024, 'This system manages flour mill operations including inventory, production, and sales. It helps automate daily tasks and provides accurate reporting for better decision making.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(33, 'Shift Mate', 2024, 'Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.', 'Software Engineering', 'Syed Hassaan Ali Shah', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(34, 'Smart Rent', 2024, 'Smart Rent is a property rental management system that helps landlords and tenants manage rental agreements, payments, and property records through a digital platform.', 'Software Engineering', 'Mr. Raja Jalees Ul Hassan', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(35, 'Petorius', 2024, 'Petorius is an online system focused on pet management and services. It helps users manage pet records, appointments, and related services in a centralized platform.', 'Software Engineering', 'Mr. Ihtesham Ullah', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(36, 'Picfolio', 2024, 'Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.', 'Software Engineering', 'Mr. Usman Sharif', NULL, NULL, NULL, NULL, NULL, 30, '2026-01-05 08:40:46', '2026-01-05 08:40:46'),
(37, 'Skill Link', 2024, 'Skill Link is a web-based platform that connects skilled individuals with clients. It helps users showcase skills, find relevant jobs, and manage hiring efficiently through a simple and user-friendly interface.', 'Software Engineering', 'Mr. Muhammad Nadeem Khan', NULL, 'Web Development', NULL, 'Skill Link, Freelancing, Web Platform', 'Sana Ullah, Hammad Javed', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(38, 'FlashFit', 2024, 'FlashFit is a fitness management application designed to help users track workouts, monitor progress, and maintain healthy routines using digital tools and performance analytics.', 'Software Engineering', 'Mr. Shahzad Ahmed Khan', NULL, 'Mobile / Web Application', NULL, 'FlashFit, Fitness, Health App', 'M. Abdullah Mughal, Sheikh M. Abdullah', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(39, 'Marriage Hall Reservation System', 2024, 'This system automates the process of booking and managing marriage halls. It provides scheduling, availability checking, and reservation management to reduce manual work and conflicts.', 'Software Engineering', 'Mr. Muhammad Imran Khan', NULL, 'Web Development', NULL, 'Marriage Hall, Reservation, Booking System', 'Mudassar Ali', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(40, 'Detonation and Blasting Management System (DBMS)', 2024, 'DBMS is designed to manage blasting operations safely by maintaining records, schedules, and compliance details. It improves safety, monitoring, and operational efficiency in blasting activities.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'DBMS, Blasting, Safety Management', 'M. Zuhran Yousaf, Saad Bin Muzaffar', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(41, 'Flour Mill Management System', 2024, 'This system manages flour mill operations including inventory, production, and sales. It helps automate daily tasks and provides accurate reporting for better decision making.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'Flour Mill, Inventory, Production', 'M. Ali Raza, Taib Ullah, Ahsan Abbasi', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(42, 'Shift Mate', 2024, 'Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.', 'Software Engineering', 'Syed Hassaan Ali Shah', NULL, 'Web Application', NULL, 'Shift Mate, Scheduling, HR System', 'Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(43, 'Smart Rent', 2024, 'Smart Rent is a property rental management system that helps landlords and tenants manage rental agreements, payments, and property records through a digital platform.', 'Software Engineering', 'Mr. Raja Jalees Ul Hassan', NULL, 'Web Application', NULL, 'Smart Rent, Property, Rental System', 'Tehmas Panni, Osama Javed', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(44, 'Petorius', 2024, 'Petorius is an online system focused on pet management and services. It helps users manage pet records, appointments, and related services in a centralized platform.', 'Software Engineering', 'Mr. Ihtesham Ullah', NULL, 'Web Application', NULL, 'Petorius, Pets, Management System', 'Nouman Naeem, Muhammad Ehsaan, Muhammad Hanzla', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(45, 'Picfolio', 2024, 'Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.', 'Software Engineering', 'Mr. Usman Sharif', NULL, 'Web Application', 'Failed in ', 'Picfolio, Portfolio, Media', 'M. Hamza Ali, Umer Javed Dar', 30, '2026-01-05 11:00:51', '2026-01-05 11:00:51'),
(46, 'Skill Link', 2024, 'Skill Link is a web-based platform that connects skilled individuals with clients. It helps users showcase skills, find relevant jobs, and manage hiring efficiently through a simple and user-friendly interface.', 'Software Engineering', 'Mr. Muhammad Nadeem Khan', NULL, 'Web Development', NULL, 'Skill Link, Freelancing, Web Platform', 'Sana Ullah, Hammad Javed', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(47, 'FlashFit', 2024, 'FlashFit is a fitness management application designed to help users track workouts, monitor progress, and maintain healthy routines using digital tools and performance analytics.', 'Software Engineering', 'Mr. Shahzad Ahmed Khan', NULL, 'Mobile / Web Application', NULL, 'FlashFit, Fitness, Health App', 'M. Abdullah Mughal, Sheikh M. Abdullah', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(48, 'Marriage Hall Reservation System', 2024, 'This system automates the process of booking and managing marriage halls. It provides scheduling, availability checking, and reservation management to reduce manual work and conflicts.', 'Software Engineering', 'Mr. Muhammad Imran Khan', NULL, 'Web Development', NULL, 'Marriage Hall, Reservation, Booking System', 'Mudassar Ali', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(49, 'Detonation and Blasting Management System (DBMS)', 2024, 'DBMS is designed to manage blasting operations safely by maintaining records, schedules, and compliance details. It improves safety, monitoring, and operational efficiency in blasting activities.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'DBMS, Blasting, Safety Management', 'M. Zuhran Yousaf, Saad Bin Muzaffar', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(50, 'Flour Mill Management System', 2024, 'This system manages flour mill operations including inventory, production, and sales. It helps automate daily tasks and provides accurate reporting for better decision making.', 'Software Engineering', 'Mr. Sadaqat Ali', NULL, 'Management System', NULL, 'Flour Mill, Inventory, Production', 'M. Ali Raza, Taib Ullah, Ahsan Abbasi', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(51, 'Shift Mate', 2024, 'Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.', 'Software Engineering', 'Syed Hassaan Ali Shah', NULL, 'Web Application', NULL, 'Shift Mate, Scheduling, HR System', 'Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(52, 'Smart Rent', 2024, 'Smart Rent is a property rental management system that helps landlords and tenants manage rental agreements, payments, and property records through a digital platform.', 'Software Engineering', 'Mr. Raja Jalees Ul Hassan', NULL, 'Web Application', NULL, 'Smart Rent, Property, Rental System', 'Tehmas Panni, Osama Javed', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(53, 'Petorius', 2024, 'Petorius is an online system focused on pet management and services. It helps users manage pet records, appointments, and related services in a centralized platform.', 'Software Engineering', 'Mr. Ihtesham Ullah', NULL, 'Web Application', NULL, 'Petorius, Pets, Management System', 'Nouman Naeem, Muhammad Ehsaan, Muhammad Hanzla', 30, '2026-01-05 11:01:21', '2026-01-05 11:01:21'),
(54, 'Picfolio', 2024, 'Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.', 'Software Engineering', 'Mr. Usman Sharif', NULL, 'Web Application', 'Failed in ', 'Picfolio, Portfolio, Media', 'M. Hamza Ali, Umer Javed Dar', 30, '2026-01-05 11:01:22', '2026-01-05 11:01:22');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `admin_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"custmail8@gmail.com\",\"reason\":\"Invalid password\"}', '::1', '2026-01-05 04:43:36'),
(2, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 04:43:57'),
(3, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 04:44:22'),
(4, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"upcom28@gmail.com\",\"reason\":\"User not found\"}', '::1', '2026-01-05 04:45:12'),
(5, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:45:35'),
(6, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:45:49'),
(7, 28, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 04:46:27'),
(8, 28, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 04:46:50'),
(9, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:47:01'),
(10, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:50:50'),
(11, 28, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 04:51:00'),
(12, 28, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 04:51:24'),
(13, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:51:39'),
(14, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:52:40'),
(15, 28, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 04:52:48'),
(16, 28, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 04:53:09'),
(17, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:53:18'),
(18, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 04:55:34'),
(19, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 04:55:45'),
(20, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 04:56:06'),
(21, 26, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"zuhran\"}', '::1', '2026-01-05 04:56:30'),
(22, 26, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"zuhran\"}', '::1', '2026-01-05 04:58:10'),
(23, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 04:58:17'),
(24, 1, NULL, 'BULK_IMPORT_PROJECTS', 'archived_projects', NULL, '{\"newData\":{\"total\":9,\"successful\":9,\"failed\":0,\"errors\":[]}}', NULL, '2026-01-05 04:59:12'),
(25, 1, NULL, 'UPDATE_PROJECT', 'archived_projects', 6, '{\"oldData\":{\"id\":6,\"title\":\"Shift Mate\",\"year\":2024,\"abstract\":\"Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.\",\"department\":\"Software Engineering\",\"supervisor_name\":\"Syed Hassaan Ali Shah\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":null,\"keywords\":\"Shift Mate, Scheduling, HR System\",\"student_names\":\"Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz\",\"created_by\":1,\"created_at\":\"2026-01-05 09:59:11\",\"updated_at\":\"2026-01-05 09:59:11\"},\"newData\":{\"title\":\"Shift Mate\",\"year\":2024,\"abstract\":\"Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.\",\"department\":\"Software Engineering\",\"supervisor_name\":\"Syed Hassaan Ali Shah\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":\"B\",\"keywords\":\"Shift Mate, Scheduling, HR System\",\"student_names\":\"Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz\"}}', NULL, '2026-01-05 05:00:32'),
(26, 1, NULL, 'UPDATE_PROJECT', 'archived_projects', 9, '{\"oldData\":{\"id\":9,\"title\":\"Picfolio\",\"year\":2024,\"abstract\":\"Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.\",\"department\":\"Software Engineering\",\"supervisor_name\":\"Mr. Usman Sharif\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":\"Failed in \",\"keywords\":\"Picfolio, Portfolio, Media\",\"student_names\":\"M. Hamza Ali, Umer Javed Dar\",\"created_by\":1,\"created_at\":\"2026-01-05 09:59:11\",\"updated_at\":\"2026-01-05 09:59:11\"},\"newData\":{\"title\":\"Picfolio\",\"year\":2024,\"abstract\":\"Picfolio is a digital portfolio management system that allows users to organize, display, and share their creative work. It focuses on simplicity and effective presentation.\",\"department\":\"Computer Science\",\"supervisor_name\":\"Mr. Usman Sharif\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":\"Failed in\",\"keywords\":\"Picfolio, Portfolio, Media\",\"student_names\":\"M. Hamza Ali, Umer Javed Dar\"}}', NULL, '2026-01-05 05:00:41'),
(27, 1, NULL, 'DELETE_PROJECT', 'archived_projects', 7, '{\"oldData\":{\"id\":7,\"title\":\"Smart Rent\",\"year\":2024,\"abstract\":\"Smart Rent is a property rental management system that helps landlords and tenants manage rental agreements, payments, and property records through a digital platform.\",\"department\":\"Software Engineering\",\"supervisor_name\":\"Mr. Raja Jalees Ul Hassan\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":null,\"keywords\":\"Smart Rent, Property, Rental System\",\"student_names\":\"Tehmas Panni, Osama Javed\",\"created_by\":1,\"created_at\":\"2026-01-05 09:59:11\",\"updated_at\":\"2026-01-05 09:59:11\"}}', NULL, '2026-01-05 05:00:50'),
(28, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 05:04:41'),
(29, 28, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 05:04:51'),
(30, 28, NULL, 'PROFILE_UPDATED', 'user', 28, '{\"username\":\"Hassan\",\"changes\":{\"phone\":\"\",\"department\":\"Software Engineering\",\"research_areas\":\"\",\"expertise\":\"\",\"availability_status\":\"Unavailable\"}}', '::1', '2026-01-05 05:05:25'),
(31, 28, NULL, 'PROFILE_UPDATED', 'user', 28, '{\"username\":\"Hassan\",\"changes\":{\"phone\":\"\",\"department\":\"Software Engineering\",\"research_areas\":\"\",\"expertise\":\"\",\"availability_status\":\"Unavailable\"}}', '::1', '2026-01-05 05:05:42'),
(32, 28, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 05:05:58'),
(33, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 05:06:06'),
(34, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 05:06:10'),
(35, 25, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"huzaifa\"}', '::1', '2026-01-05 05:06:53'),
(36, 25, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"huzaifa\"}', '::1', '2026-01-05 05:12:57'),
(37, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 05:13:09'),
(38, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 05:13:26'),
(39, 26, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"zuhran\"}', '::1', '2026-01-05 05:13:34'),
(40, 26, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"zuhran\"}', '::1', '2026-01-05 05:15:21'),
(41, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 05:15:32'),
(42, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 05:15:48'),
(43, 25, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"huzaifa\"}', '::1', '2026-01-05 05:15:53'),
(44, 25, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"huzaifa\"}', '::1', '2026-01-05 05:18:59'),
(45, 28, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 05:19:11'),
(46, 28, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Hassan\"}', '::1', '2026-01-05 05:19:16'),
(47, 26, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"zuhran\"}', '::1', '2026-01-05 05:19:21'),
(48, 26, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"zuhran\"}', '::1', '2026-01-05 05:19:55'),
(49, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 05:20:14'),
(50, NULL, 1, 'USER_CREATED', 'user', 29, '{\"username\":\"Haider\",\"email\":\"itshaiderkiani@gmail.com\",\"role\":\"Student\"}', '::1', '2026-01-05 05:24:22'),
(51, 1, NULL, 'UPDATE_PROJECT', 'archived_projects', 6, '{\"oldData\":{\"id\":6,\"title\":\"Shift Mate\",\"year\":2024,\"abstract\":\"Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.\",\"department\":\"Software Engineering\",\"supervisor_name\":\"Syed Hassaan Ali Shah\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":\"B\",\"keywords\":\"Shift Mate, Scheduling, HR System\",\"student_names\":\"Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz\",\"created_by\":1,\"created_at\":\"2026-01-05 09:59:11\",\"updated_at\":\"2026-01-05 10:00:31\"},\"newData\":{\"title\":\"Shift Mate\",\"year\":2024,\"abstract\":\"Shift Mate is a scheduling system that helps organizations manage employee shifts efficiently. It reduces conflicts, improves communication, and ensures proper workforce allocation.\",\"department\":\"Software Engineering\",\"supervisor_name\":\"Syed Hassaan Ali Shah\",\"supervisor_id\":null,\"technology_type\":\"Web Application\",\"final_grade\":\"A+\",\"keywords\":\"Shift Mate, Scheduling, HR System\",\"student_names\":\"Muhammad Subhan, Muhammad Yousaf Khan, Hammad Nawaz\"}}', NULL, '2026-01-05 06:07:21'),
(52, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 06:08:13'),
(53, NULL, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 06:08:28'),
(54, NULL, NULL, 'PASSWORD_CHANGED', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 06:09:18'),
(55, NULL, NULL, 'PROFILE_PICTURE_UPDATED', 'user', 29, '{\"username\":\"Haider\",\"filename\":\"profile_29_1767593387955-695975719.jpeg\"}', '::1', '2026-01-05 06:09:48'),
(56, NULL, NULL, 'PROFILE_UPDATED', 'user', 29, '{\"username\":\"Haider\",\"changes\":{\"phone\":\"\",\"department\":\"\"}}', '::1', '2026-01-05 06:10:00'),
(57, NULL, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 06:12:31'),
(58, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 06:16:21'),
(59, NULL, 1, 'USER_DELETED', 'user', 4, '{\"username\":\"Shayan_Ahmed\",\"email\":\"shayanraza804@gmail.com\"}', '::1', '2026-01-05 06:23:28'),
(60, 30, 1, 'USER_CREATED', 'user', 30, '{\"username\":\"ShayanRaza\",\"email\":\"shayanraza804@gmail.com\",\"role\":\"Administrator\"}', '::1', '2026-01-05 06:23:54'),
(61, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 06:24:25'),
(62, 30, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"ShayanRaza\",\"reason\":\"Invalid password\"}', '::1', '2026-01-05 06:24:45'),
(63, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 06:25:19'),
(64, 30, NULL, 'PROFILE_PICTURE_UPDATED', 'user', 30, '{\"username\":\"ShayanRaza\",\"filename\":\"profile_30_1767594334903-315608106.PNG\"}', '::1', '2026-01-05 06:25:34'),
(65, 30, NULL, 'PROFILE_UPDATED', 'user', 30, '{\"username\":\"ShayanRaza\",\"changes\":{\"phone\":\"\",\"department\":\"\"}}', '::1', '2026-01-05 06:25:38'),
(66, 30, NULL, 'PASSWORD_CHANGED', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 06:26:25'),
(67, 30, NULL, 'BULK_IMPORT_PROJECTS', 'archived_projects', NULL, '{\"newData\":{\"total\":15,\"successful\":9,\"failed\":6,\"errors\":[{\"row\":10,\"title\":\"Online Job Portal\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":11,\"title\":\"Smart Waste Management\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":12,\"title\":\"Desktop Antivirus Software\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":13,\"title\":\"College Management System\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":14,\"title\":\"AI Traffic Prediction System\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":15,\"title\":\"Secure Payment Gateway\",\"error\":\"Abstract must be at least 50 characters\"}]}}', NULL, '2026-01-05 06:31:26'),
(68, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 06:52:48'),
(69, 1, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 06:52:53'),
(70, 1, NULL, 'PROFILE_PICTURE_UPDATED', 'user', 1, '{\"username\":\"admin\",\"filename\":\"profile_1_1767596027793-851858250.png\"}', '::1', '2026-01-05 06:53:48'),
(71, 1, NULL, 'PROFILE_UPDATED', 'user', 1, '{\"username\":\"admin\",\"changes\":{\"phone\":\"46346235234\",\"department\":\"\"}}', '::1', '2026-01-05 06:53:49'),
(72, 1, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"admin\"}', '::1', '2026-01-05 06:54:12'),
(73, 30, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"shayanraza804@gmail.com\",\"reason\":\"Invalid password\"}', '::1', '2026-01-05 06:54:21'),
(74, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 06:54:26'),
(75, 31, 30, 'USER_CREATED', 'user', 31, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\",\"email\":\"shayangujjar088@gmail.com\",\"role\":\"Teacher\",\"department\":\"Software Engineering\",\"max_supervisees\":\"7\"}', '::1', '2026-01-05 06:57:27'),
(76, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 06:58:01'),
(77, 31, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 06:58:15'),
(78, 31, NULL, 'PROFILE_PICTURE_UPDATED', 'user', 31, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\",\"filename\":\"profile_31_1767596367154-325522890.PNG\"}', '::1', '2026-01-05 06:59:27'),
(79, 31, NULL, 'PROFILE_UPDATED', 'user', 31, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\",\"changes\":{\"phone\":\"\",\"department\":\"Software Engineering\",\"research_areas\":\"\",\"expertise\":\"\",\"availability_status\":\"Available\"}}', '::1', '2026-01-05 06:59:39'),
(80, 31, NULL, 'PROFILE_UPDATED', 'user', 31, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\",\"changes\":{\"phone\":\"\",\"department\":\"Software Engineering\",\"research_areas\":\"Research Supervisor\\nAcademic Supervisor\\nResearch Area Supervisor\\nFaculty Research Supervisor\\nThesis/Project Supervisor (if applicable\",\"expertise\":\"Technical Supervisor\\nDomain Expert\\nArea of Expertise Supervisor\\nAcademic Advisor\",\"availability_status\":\"Available\"}}', '::1', '2026-01-05 07:02:48'),
(81, 31, NULL, 'PROFILE_UPDATED', 'user', 31, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\",\"changes\":{\"phone\":\"\",\"department\":\"Software Engineering\",\"research_areas\":\"Research Supervisor – Guides and oversees the research work.\\nAcademic Supervisor – Provides academic direction and ensures standards.\\nResearch Area Supervisor – Supervises a specific research domain.\\nFaculty Research Supervisor – A faculty member supervising research.\\nThesis/Project Supervisor – Supervises a thesis or final-year project.\",\"expertise\":\"Subject Matter Expert – Has deep knowledge in a specific subject.\\nTechnical Supervisor – Guides technical and practical aspects.\\nDomain Expert – Expert in a particular field or domain.\\nArea of Expertise Supervisor – Oversees work related to a specific expertise.\\nAcademic Advisor – Provides academic and career guidance.\",\"availability_status\":\"Available\"}}', '::1', '2026-01-05 07:04:34'),
(82, 31, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 07:04:48'),
(83, 28, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Hassan\",\"reason\":\"Invalid password\"}', '::1', '2026-01-05 07:04:53'),
(84, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Haider\",\"reason\":\"Invalid password\"}', '::1', '2026-01-05 07:05:17'),
(85, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Haider\",\"reason\":\"Invalid password\"}', '::1', '2026-01-05 07:05:27'),
(86, NULL, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 07:05:54'),
(87, NULL, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 07:07:41'),
(88, NULL, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 07:07:44'),
(89, NULL, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 07:08:20'),
(90, NULL, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 07:08:22'),
(91, NULL, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Haider\"}', '::1', '2026-01-05 07:08:28'),
(92, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 07:08:40'),
(93, NULL, 30, 'USER_DELETED', 'user', 29, '{\"username\":\"Haider\",\"email\":\"itshaiderkiani@gmail.com\"}', '::1', '2026-01-05 07:08:48'),
(94, 32, 30, 'USER_CREATED', 'user', 32, '{\"username\":\"Abdul_Salam\",\"email\":\"abdul_salam@grr.la\",\"role\":\"Student\"}', '::1', '2026-01-05 07:11:07'),
(95, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 07:11:18'),
(96, 32, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Abdul_Salam\"}', '::1', '2026-01-05 07:12:50'),
(97, 32, NULL, 'PROFILE_PICTURE_UPDATED', 'user', 32, '{\"username\":\"Abdul_Salam\",\"filename\":\"profile_32_1767597227218-394600621.PNG\"}', '::1', '2026-01-05 07:13:47'),
(98, 32, NULL, 'PROFILE_UPDATED', 'user', 32, '{\"username\":\"Abdul_Salam\",\"changes\":{\"phone\":\"\",\"department\":\"\"}}', '::1', '2026-01-05 07:13:50'),
(99, 32, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Abdul_Salam\"}', '::1', '2026-01-05 07:15:28'),
(100, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 07:15:50'),
(101, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 08:35:01'),
(102, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 08:35:36'),
(103, 30, NULL, 'BULK_IMPORT_PROJECTS', 'archived_projects', NULL, '{\"newData\":{\"total\":9,\"successful\":9,\"failed\":0,\"errors\":[]}}', NULL, '2026-01-05 08:40:00'),
(104, 30, NULL, 'BULK_IMPORT_PROJECTS', 'archived_projects', NULL, '{\"newData\":{\"total\":9,\"successful\":9,\"failed\":0,\"errors\":[]}}', NULL, '2026-01-05 08:40:46'),
(105, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 08:43:40'),
(106, 21, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 08:43:50'),
(107, 21, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"hamza\"}', '::1', '2026-01-05 08:47:19'),
(108, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Haider\",\"reason\":\"User not found\"}', '::1', '2026-01-05 08:47:23'),
(109, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Haider\",\"reason\":\"User not found\"}', '::1', '2026-01-05 08:47:31'),
(110, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Haider\",\"reason\":\"User not found\"}', '::1', '2026-01-05 08:47:45'),
(111, 32, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Abdul_Salam\"}', '::1', '2026-01-05 08:47:58'),
(112, 32, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Abdul_Salam\"}', '::1', '2026-01-05 09:32:07'),
(113, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"Haider\",\"reason\":\"User not found\"}', '::1', '2026-01-05 09:32:16'),
(114, NULL, NULL, 'LOGIN_FAILED', NULL, NULL, '{\"username\":\"itshaiderkiani@gmail.com\",\"reason\":\"User not found\"}', '::1', '2026-01-05 09:33:05'),
(115, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 09:33:58'),
(116, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 10:41:29'),
(117, 30, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 10:56:39'),
(118, 30, NULL, 'BULK_IMPORT_PROJECTS', 'archived_projects', NULL, '{\"newData\":{\"total\":15,\"successful\":9,\"failed\":6,\"errors\":[{\"row\":10,\"title\":\"Online Job Portal\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":11,\"title\":\"Smart Waste Management\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":12,\"title\":\"Desktop Antivirus Software\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":13,\"title\":\"College Management System\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":14,\"title\":\"AI Traffic Prediction System\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":15,\"title\":\"Secure Payment Gateway\",\"error\":\"Abstract must be at least 50 characters\"}]}}', NULL, '2026-01-05 11:00:51'),
(119, 30, NULL, 'BULK_IMPORT_PROJECTS', 'archived_projects', NULL, '{\"newData\":{\"total\":15,\"successful\":9,\"failed\":6,\"errors\":[{\"row\":10,\"title\":\"Online Job Portal\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":11,\"title\":\"Smart Waste Management\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":12,\"title\":\"Desktop Antivirus Software\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":13,\"title\":\"College Management System\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":14,\"title\":\"AI Traffic Prediction System\",\"error\":\"Abstract must be at least 50 characters\"},{\"row\":15,\"title\":\"Secure Payment Gateway\",\"error\":\"Abstract must be at least 50 characters\"}]}}', NULL, '2026-01-05 11:01:22'),
(120, 33, 30, 'USER_CREATED', 'user', 33, '{\"username\":\"itshaiderkiani\",\"email\":\"itshaiderkiani@gmail.com\",\"role\":\"Student\"}', '::1', '2026-01-05 11:07:43'),
(121, 30, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"ShayanRaza\"}', '::1', '2026-01-05 11:10:43'),
(122, 33, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"itshaiderkiani\"}', '::1', '2026-01-05 11:11:03'),
(123, 33, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"itshaiderkiani\"}', '::1', '2026-01-05 11:16:23'),
(124, 31, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 11:16:27'),
(125, 31, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 11:18:34'),
(126, 33, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"itshaiderkiani\"}', '::1', '2026-01-05 11:18:38'),
(127, 33, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"itshaiderkiani\"}', '::1', '2026-01-05 11:20:42'),
(128, 31, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 11:21:01'),
(129, 31, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 11:23:03'),
(130, 31, NULL, 'LOGIN_SUCCESS', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 11:23:06'),
(131, 31, NULL, 'LOGOUT', NULL, NULL, '{\"username\":\"Sir_Syed_Hassan_Ali_Shah\"}', '::1', '2026-01-05 11:23:19');

-- --------------------------------------------------------

--
-- Table structure for table `deadline_logs`
--

CREATE TABLE `deadline_logs` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `coordinator_id` int(11) NOT NULL,
  `previous_deadline` datetime NOT NULL,
  `new_deadline` datetime NOT NULL,
  `reason` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_login_attempts`
--

CREATE TABLE `failed_login_attempts` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `failed_login_attempts`
--

INSERT INTO `failed_login_attempts` (`id`, `identifier`, `ip_address`, `attempted_at`) VALUES
(2, 'upcom28@gmail.com', '::1', '2026-01-05 04:45:12'),
(4, 'shayanraza804@gmail.com', '::1', '2026-01-05 06:54:20'),
(5, 'Hassan', '::1', '2026-01-05 07:04:53'),
(8, 'Haider', '::1', '2026-01-05 08:47:23'),
(9, 'Haider', '::1', '2026-01-05 08:47:31'),
(10, 'Haider', '::1', '2026-01-05 08:47:45'),
(11, 'Haider', '::1', '2026-01-05 09:32:15');

-- --------------------------------------------------------

--
-- Table structure for table `milestone_tasks`
--

CREATE TABLE `milestone_tasks` (
  `id` int(11) NOT NULL,
  `track_id` int(11) NOT NULL,
  `week_number` int(11) NOT NULL CHECK (`week_number` between 1 and 16),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `task_type` enum('template','instruction') NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `release_date` datetime NOT NULL,
  `deadline` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `milestone_tracks`
--

CREATE TABLE `milestone_tracks` (
  `id` int(11) NOT NULL,
  `department` varchar(100) NOT NULL,
  `fyp_part` enum('FYP-I','FYP-II') NOT NULL,
  `start_date` date NOT NULL COMMENT 'Start date of Week 1',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proposals`
--

CREATE TABLE `proposals` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `project_title` varchar(500) NOT NULL,
  `project_description` text NOT NULL,
  `proposal_pdf` varchar(500) DEFAULT NULL,
  `status` enum('draft','submitted','approved','rejected','revision_requested') DEFAULT 'draft',
  `fyp_part` enum('FYP-I','FYP-II') DEFAULT 'FYP-I',
  `supervisor_feedback` text DEFAULT NULL,
  `submission_date` datetime DEFAULT NULL,
  `response_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `previous_supervisor_id` int(11) DEFAULT NULL COMMENT 'Previous supervisor before reassignment',
  `reassignment_date` datetime DEFAULT NULL COMMENT 'Date when supervisor was reassigned',
  `reassignment_reason` text DEFAULT NULL COMMENT 'Reason for supervisor reassignment',
  `reassigned_by` int(11) DEFAULT NULL COMMENT 'Admin who performed reassignment'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `proposals`
--

INSERT INTO `proposals` (`id`, `student_id`, `supervisor_id`, `project_title`, `project_description`, `proposal_pdf`, `status`, `fyp_part`, `supervisor_feedback`, `submission_date`, `response_date`, `created_at`, `updated_at`, `previous_supervisor_id`, `reassignment_date`, `reassignment_reason`, `reassigned_by`) VALUES
(1, 21, 28, 'Smart FYP Management System', '🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.', '/uploads/proposals/proposal-1767588619161-560264703.pdf', 'rejected', 'FYP-I', '🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.', '2026-01-05 09:52:27', '2026-01-05 09:53:01', '2026-01-05 04:49:14', '2026-01-05 04:53:01', NULL, NULL, NULL, NULL),
(2, 21, 26, 'Smart FYP Management System', '🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.', '/uploads/proposals/proposal-1767588920109-867909251.pdf', 'approved', 'FYP-I', NULL, '2026-01-05 09:55:20', '2026-01-05 09:56:50', '2026-01-05 04:55:18', '2026-01-05 04:56:50', NULL, NULL, NULL, NULL),
(3, 25, 26, 'lib Management System', '🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.', '/uploads/proposals/proposal-1767589916320-872436279.pdf', 'rejected', 'FYP-I', '🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.', '2026-01-05 10:12:50', '2026-01-05 10:14:53', '2026-01-05 05:11:53', '2026-01-05 05:14:53', NULL, NULL, NULL, NULL),
(4, 25, 26, 'Lib Management System', '🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.', '/uploads/proposals/proposal-1767590312754-929473490.pdf', 'approved', 'FYP-I', NULL, '2026-01-05 10:18:52', '2026-01-05 10:19:27', '2026-01-05 05:18:32', '2026-01-05 05:19:27', NULL, NULL, NULL, NULL),
(5, 33, 31, 'AI-Based Smart Attendance System', 'Uses face recognition to automatically mark attendance in classrooms. The system stores student data securely, detects faces in real time, and prevents proxy attendance. Suitable for AI + software students.\n2. Online Crime Reporting & Case Management System', '/uploads/proposals/proposal-1767611729605-454336842.pdf', 'approved', 'FYP-I', 'Uses face recognition to automatically mark attendance in classrooms. The system stores student data securely, detects faces in real time, and prevents proxy attendance. Suitable for AI + software students.\n2. Online Crime Reporting & Case Management System', '2026-01-05 16:20:35', '2026-01-05 16:22:14', '2026-01-05 11:15:29', '2026-01-05 11:22:14', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `proposal_activity_logs`
--

CREATE TABLE `proposal_activity_logs` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `action` varchar(100) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `proposal_activity_logs`
--

INSERT INTO `proposal_activity_logs` (`id`, `proposal_id`, `user_id`, `user_role`, `action`, `old_value`, `new_value`, `ip_address`, `created_at`) VALUES
(1, 1, 21, 'Student', 'PROPOSAL_CREATED', NULL, '{\"project_title\":\"Smart FYP Management System\",\"status\":\"draft\"}', '::1', '2026-01-05 04:49:15'),
(2, 1, 21, 'Student', 'PDF_UPLOADED', NULL, '{\"file_path\":\"/uploads/proposals/proposal-1767588555398-171879526.pdf\"}', '::1', '2026-01-05 04:49:16'),
(3, 1, 21, 'Student', 'PROPOSAL_UPDATED', '{\"id\":1,\"student_id\":21,\"supervisor_id\":28,\"project_title\":\"Smart FYP Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"proposal_pdf\":\"/uploads/proposals/proposal-1767588555398-171879526.pdf\",\"status\":\"draft\",\"fyp_part\":\"FYP-I\",\"supervisor_feedback\":null,\"submission_date\":null,\"response_date\":null,\"created_at\":\"2026-01-05 09:49:14\",\"updated_at\":\"2026-01-05 09:49:15\",\"previous_supervisor_id\":null,\"reassignment_date\":null,\"reassignment_reason\":null,\"reassigned_by\":null}', '{\"project_title\":\"Smart FYP Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"supervisor_id\":28,\"members\":[{\"sap_id\":\"28585\",\"email\":\"28585@students.riphah.edu.pk\",\"phone_number\":\"03478654454\",\"department\":\"Software Engineering\",\"display_order\":0},{\"sap_id\":\"36544\",\"email\":\"36544@students.riphah.edu.pk\",\"phone_number\":\"03456787666\",\"department\":\"Computer Science\"}]}', '::1', '2026-01-05 04:50:18'),
(4, 1, 21, 'Student', 'PDF_UPLOADED', NULL, '{\"file_path\":\"/uploads/proposals/proposal-1767588619161-560264703.pdf\"}', '::1', '2026-01-05 04:50:19'),
(5, 1, 21, 'Student', 'PROPOSAL_UPDATED', '{\"id\":1,\"student_id\":21,\"supervisor_id\":28,\"project_title\":\"Smart FYP Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"proposal_pdf\":\"/uploads/proposals/proposal-1767588619161-560264703.pdf\",\"status\":\"draft\",\"fyp_part\":\"FYP-I\",\"supervisor_feedback\":null,\"submission_date\":null,\"response_date\":null,\"created_at\":\"2026-01-05 09:49:14\",\"updated_at\":\"2026-01-05 09:50:19\",\"previous_supervisor_id\":null,\"reassignment_date\":null,\"reassignment_reason\":null,\"reassigned_by\":null}', '{\"project_title\":\"Smart FYP Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"supervisor_id\":28,\"members\":[{\"sap_id\":\"28585\",\"email\":\"28585@students.riphah.edu.pk\",\"phone_number\":\"03478654454\",\"department\":\"Software Engineering\",\"display_order\":0},{\"sap_id\":\"36544\",\"email\":\"36544@students.riphah.edu.pk\",\"phone_number\":\"03456787666\",\"department\":\"Computer Science\",\"display_order\":1}]}', '::1', '2026-01-05 04:50:34'),
(6, 1, 21, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"draft\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 04:50:36'),
(7, 1, 28, 'Teacher', 'REVISION_REQUESTED', '{\"status\":\"submitted\"}', '{\"status\":\"revision_requested\",\"feedback\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\"}', '::1', '2026-01-05 04:51:17'),
(8, 1, 21, 'Student', 'PROPOSAL_UPDATED', '{\"id\":1,\"student_id\":21,\"supervisor_id\":28,\"project_title\":\"Smart FYP Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"proposal_pdf\":\"/uploads/proposals/proposal-1767588619161-560264703.pdf\",\"status\":\"revision_requested\",\"fyp_part\":\"FYP-I\",\"supervisor_feedback\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"submission_date\":\"2026-01-05 09:50:36\",\"response_date\":\"2026-01-05 09:51:17\",\"created_at\":\"2026-01-05 09:49:14\",\"updated_at\":\"2026-01-05 09:51:17\",\"previous_supervisor_id\":null,\"reassignment_date\":null,\"reassignment_reason\":null,\"reassigned_by\":null}', '{\"project_title\":\"Smart FYP Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"supervisor_id\":28,\"members\":[{\"sap_id\":\"28585\",\"email\":\"28585@students.riphah.edu.pk\",\"phone_number\":\"03478654454\",\"department\":\"Software Engineering\",\"display_order\":0},{\"sap_id\":\"36544\",\"email\":\"36544@students.riphah.edu.pk\",\"phone_number\":\"03456787666\",\"department\":\"Computer Science\",\"display_order\":1}]}', '::1', '2026-01-05 04:52:22'),
(9, 1, 21, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"revision_requested\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 04:52:27'),
(10, 1, 28, 'Teacher', 'PROPOSAL_REJECTED', '{\"status\":\"submitted\"}', '{\"status\":\"rejected\",\"feedback\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\"}', '::1', '2026-01-05 04:53:01'),
(11, 2, 21, 'Student', 'PROPOSAL_CREATED', NULL, '{\"project_title\":\"Smart FYP Management System\",\"status\":\"draft\"}', '::1', '2026-01-05 04:55:18'),
(12, 2, 21, 'Student', 'PDF_UPLOADED', NULL, '{\"file_path\":\"/uploads/proposals/proposal-1767588920109-867909251.pdf\"}', '::1', '2026-01-05 04:55:20'),
(13, 2, 21, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"draft\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 04:55:20'),
(14, 2, 26, 'Teacher', 'PROPOSAL_APPROVED', '{\"status\":\"submitted\"}', '{\"status\":\"approved\"}', '::1', '2026-01-05 04:56:51'),
(15, 3, 25, 'Student', 'PROPOSAL_CREATED', NULL, '{\"project_title\":\"lib Management System\",\"status\":\"draft\"}', '::1', '2026-01-05 05:11:54'),
(16, 3, 25, 'Student', 'PDF_UPLOADED', NULL, '{\"file_path\":\"/uploads/proposals/proposal-1767589916320-872436279.pdf\"}', '::1', '2026-01-05 05:11:59'),
(17, 3, 25, 'Student', 'PROPOSAL_UPDATED', '{\"id\":3,\"student_id\":25,\"supervisor_id\":26,\"project_title\":\"lib Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"proposal_pdf\":\"/uploads/proposals/proposal-1767589916320-872436279.pdf\",\"status\":\"draft\",\"fyp_part\":\"FYP-I\",\"supervisor_feedback\":null,\"submission_date\":null,\"response_date\":null,\"created_at\":\"2026-01-05 10:11:53\",\"updated_at\":\"2026-01-05 10:11:56\",\"previous_supervisor_id\":null,\"reassignment_date\":null,\"reassignment_reason\":null,\"reassigned_by\":null}', '{\"project_title\":\"lib Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"supervisor_id\":26,\"members\":[{\"sap_id\":\"32493\",\"email\":\"32493@students.riphah.edu.pk\",\"phone_number\":\"03445566798\",\"department\":\"Software Engineering\",\"display_order\":0},{\"sap_id\":\"46897\",\"email\":\"46897@students.riphah.edu.pk\",\"phone_number\":\"03445435678\",\"department\":\"Software Engineering\"}]}', '::1', '2026-01-05 05:12:49'),
(18, 3, 25, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"draft\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 05:12:50'),
(19, 3, 26, 'Teacher', 'PROPOSAL_REJECTED', '{\"status\":\"submitted\"}', '{\"status\":\"rejected\",\"feedback\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\"}', '::1', '2026-01-05 05:14:53'),
(20, 4, 25, 'Student', 'PROPOSAL_CREATED', NULL, '{\"project_title\":\"Lib Management System\",\"status\":\"draft\"}', '::1', '2026-01-05 05:18:32'),
(21, 4, 25, 'Student', 'PDF_UPLOADED', NULL, '{\"file_path\":\"/uploads/proposals/proposal-1767590312754-929473490.pdf\"}', '::1', '2026-01-05 05:18:32'),
(22, 4, 25, 'Student', 'PROPOSAL_UPDATED', '{\"id\":4,\"student_id\":25,\"supervisor_id\":26,\"project_title\":\"Lib Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"proposal_pdf\":\"/uploads/proposals/proposal-1767590312754-929473490.pdf\",\"status\":\"draft\",\"fyp_part\":\"FYP-I\",\"supervisor_feedback\":null,\"submission_date\":null,\"response_date\":null,\"created_at\":\"2026-01-05 10:18:32\",\"updated_at\":\"2026-01-05 10:18:32\",\"previous_supervisor_id\":null,\"reassignment_date\":null,\"reassignment_reason\":null,\"reassigned_by\":null}', '{\"project_title\":\"Lib Management System\",\"project_description\":\"🧠 Smart FYP Management System Smart FYP Management System is a web-based platform that streamlines the entire Final Year Project process for students, supervisors, and administrators. It automates project registration, proposal submission, progress tracking, and evaluation — making FYP management smarter, faster, and more organized.\",\"supervisor_id\":26,\"members\":[{\"sap_id\":\"32493\",\"email\":\"32493@students.riphah.edu.pk\",\"phone_number\":\"03215678943\",\"department\":\"Computer Science\",\"display_order\":0},{\"sap_id\":\"46897\",\"email\":\"46897@students.riphah.edu.pk\",\"phone_number\":\"03215678678\",\"department\":\"Software Engineering\",\"display_order\":1},{\"sap_id\":\"21111\",\"email\":\"21111@students.riphah.edu.pk\",\"phone_number\":\"03445564556\",\"department\":\"Software Engineering\",\"display_order\":2}]}', '::1', '2026-01-05 05:18:51'),
(23, 4, 25, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"draft\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 05:18:52'),
(24, 4, 26, 'Teacher', 'PROPOSAL_APPROVED', '{\"status\":\"submitted\"}', '{\"status\":\"approved\"}', '::1', '2026-01-05 05:19:27'),
(25, 5, 33, 'Student', 'PROPOSAL_CREATED', NULL, '{\"project_title\":\"AI-Based Smart Attendance System\",\"status\":\"draft\"}', '::1', '2026-01-05 11:15:29'),
(26, 5, 33, 'Student', 'PDF_UPLOADED', NULL, '{\"file_path\":\"/uploads/proposals/proposal-1767611729605-454336842.pdf\"}', '::1', '2026-01-05 11:15:29'),
(27, 5, 33, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"draft\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 11:15:29'),
(28, 5, 31, 'Teacher', 'REVISION_REQUESTED', '{\"status\":\"submitted\"}', '{\"status\":\"revision_requested\",\"feedback\":\"Uses face recognition to automatically mark attendance in classrooms. The system stores student data securely, detects faces in real time, and prevents proxy attendance. Suitable for AI + software students.\\n2. Online Crime Reporting & Case Management System\"}', '::1', '2026-01-05 11:17:55'),
(29, 5, 33, 'Student', 'PROPOSAL_UPDATED', '{\"id\":5,\"student_id\":33,\"supervisor_id\":31,\"project_title\":\"AI-Based Smart Attendance System\",\"project_description\":\"Uses face recognition to automatically mark attendance in classrooms. The system stores student data securely, detects faces in real time, and prevents proxy attendance. Suitable for AI + software students.\\n2. Online Crime Reporting & Case Management System\",\"proposal_pdf\":\"/uploads/proposals/proposal-1767611729605-454336842.pdf\",\"status\":\"revision_requested\",\"fyp_part\":\"FYP-I\",\"supervisor_feedback\":\"Uses face recognition to automatically mark attendance in classrooms. The system stores student data securely, detects faces in real time, and prevents proxy attendance. Suitable for AI + software students.\\n2. Online Crime Reporting & Case Management System\",\"submission_date\":\"2026-01-05 16:15:29\",\"response_date\":\"2026-01-05 16:17:55\",\"created_at\":\"2026-01-05 16:15:29\",\"updated_at\":\"2026-01-05 16:17:55\",\"previous_supervisor_id\":null,\"reassignment_date\":null,\"reassignment_reason\":null,\"reassigned_by\":null}', '{\"project_title\":\"AI-Based Smart Attendance System\",\"project_description\":\"Uses face recognition to automatically mark attendance in classrooms. The system stores student data securely, detects faces in real time, and prevents proxy attendance. Suitable for AI + software students.\\n2. Online Crime Reporting & Case Management System\",\"supervisor_id\":31,\"members\":[{\"sap_id\":\"32493\",\"email\":\"itshaiderkiani@gmail.com\",\"phone_number\":\"0796785876\",\"department\":\"Software Engineering\",\"display_order\":0},{\"sap_id\":\"36544\",\"email\":\"28585@students.riphah.edu.pk\",\"phone_number\":\"0987654765\",\"department\":\"Computer Science\",\"display_order\":1}]}', '::1', '2026-01-05 11:20:35'),
(30, 5, 33, 'Student', 'PROPOSAL_SUBMITTED', '{\"status\":\"revision_requested\"}', '{\"status\":\"submitted\"}', '::1', '2026-01-05 11:20:35'),
(31, 5, 31, 'Teacher', 'PROPOSAL_APPROVED', '{\"status\":\"submitted\"}', '{\"status\":\"approved\"}', '::1', '2026-01-05 11:22:14');

-- --------------------------------------------------------

--
-- Table structure for table `proposal_members`
--

CREATE TABLE `proposal_members` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `sap_id` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `proposal_members`
--

INSERT INTO `proposal_members` (`id`, `proposal_id`, `sap_id`, `email`, `phone_number`, `department`, `display_order`, `created_at`) VALUES
(6, 1, '28585', '28585@students.riphah.edu.pk', '03478654454', 'Software Engineering', 0, '2026-01-05 04:52:22'),
(7, 1, '36544', '36544@students.riphah.edu.pk', '03456787666', 'Computer Science', 1, '2026-01-05 04:52:22'),
(8, 2, '28585', '28585@students.riphah.edu.pk', '0345675787', 'Software Engineering', 0, '2026-01-05 04:55:18'),
(9, 2, '36522', '36522@students.riphah.edu.pk', '0897654675', 'Computer Science', 1, '2026-01-05 04:55:18'),
(11, 3, '32493', '32493@students.riphah.edu.pk', '03445566798', 'Software Engineering', 0, '2026-01-05 05:12:49'),
(12, 3, '46897', '46897@students.riphah.edu.pk', '03445435678', 'Software Engineering', 1, '2026-01-05 05:12:49'),
(16, 4, '32493', '32493@students.riphah.edu.pk', '03215678943', 'Computer Science', 0, '2026-01-05 05:18:51'),
(17, 4, '46897', '46897@students.riphah.edu.pk', '03215678678', 'Software Engineering', 1, '2026-01-05 05:18:51'),
(18, 4, '21111', '21111@students.riphah.edu.pk', '03445564556', 'Software Engineering', 2, '2026-01-05 05:18:51'),
(21, 5, '32493', 'itshaiderkiani@gmail.com', '0796785876', 'Software Engineering', 0, '2026-01-05 11:20:34'),
(22, 5, '36544', '28585@students.riphah.edu.pk', '0987654765', 'Computer Science', 1, '2026-01-05 11:20:35');

-- --------------------------------------------------------

--
-- Table structure for table `proposal_templates`
--

CREATE TABLE `proposal_templates` (
  `id` int(11) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `proposal_templates`
--

INSERT INTO `proposal_templates` (`id`, `template_name`, `file_path`, `uploaded_by`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Proposal Template', '/uploads/proposals/proposal-1767589335837-946715073.pdf', 1, 0, '2026-01-05 05:02:16', '2026-01-05 10:58:21'),
(2, 'Proposal Template', '/uploads/proposals/proposal-1767610700969-569870395.pdf', 30, 1, '2026-01-05 10:58:21', '2026-01-05 10:58:21');

-- --------------------------------------------------------

--
-- Table structure for table `security_questions`
--

CREATE TABLE `security_questions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `security_questions`
--

INSERT INTO `security_questions` (`id`, `user_id`, `question`, `answer_hash`, `created_at`) VALUES
(1, 1, 'What is your favorite color?', '$2a$10$rQ3vXZGmY7qYfBxZ8YJ5V.8hKp5nZ0sBmWQx1pB9nV3nP5xO1nP5O', '2025-10-18 08:46:30');

-- --------------------------------------------------------

--
-- Table structure for table `security_question_challenges`
--

CREATE TABLE `security_question_challenges` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `status` enum('pending','verified','failed','expired') DEFAULT 'pending',
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `token`, `expires_at`, `created_at`, `ip_address`, `user_agent`) VALUES
(17, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzYxMDY5MTM3LCJleHAiOjE3NjExNTU1Mzd9.lSlpqmvHeEP810pUZlINyzZ0ui-xyuKNxYfMtNEy0yA', '2025-10-22 12:52:17', '2025-10-21 12:52:17', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(39, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzYyMTQ2MTAzLCJleHAiOjE3NjIyMzI1MDN9.yZqa545Ih171eZbqjL-7K-MUrczs5wTcRmussFQsMzk', '2025-11-04 00:01:43', '2025-11-03 00:01:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(40, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzYyMTY4Mjg3LCJleHAiOjE3NjIyNTQ2ODd9.OBtTseXpfmv-SPc09DprppleFTxXwPeyhcrXXRhpIM8', '2025-11-04 06:11:27', '2025-11-03 06:11:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(48, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzYyMjg3MzM1LCJleHAiOjE3NjIzNzM3MzV9.AVsS3sxJPeidEQxdzsR5KWHEWfqr04Es8g6zFpTUZR4', '2025-11-05 15:15:35', '2025-11-04 15:15:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(69, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzYzOTY2MDU4LCJleHAiOjE3NjQwNTI0NTh9.nO7unX9Wffjdc7m52e-X_Amikwty1cHjmU5-aCUN4xE', '2025-11-25 01:34:18', '2025-11-24 01:34:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(170, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY0NzM5MTc4LCJleHAiOjE3NjQ4MjU1Nzh9.VZMGu1nA_KBjjsBb9FnahaGIHrKoi6IVjnhDG_VokRo', '2025-12-04 00:19:38', '2025-12-03 00:19:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(206, 21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsInVzZXJuYW1lIjoiaGFtemEiLCJlbWFpbCI6InVwY29tcDI4QGdtYWlsLmNvbSIsInJvbGUiOiJTdHVkZW50IiwiaWF0IjoxNzY1MjgzMTkxLCJleHAiOjE3NjUzNjk1OTF9.a4Zh98-Qr1Trfkl8tFNzij_2XkkL_OED8D8jCOwf_SY', '2025-12-10 07:26:31', '2025-12-09 07:26:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(225, 21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsInVzZXJuYW1lIjoiaGFtemEiLCJlbWFpbCI6InVwY29tcDI4QGdtYWlsLmNvbSIsInJvbGUiOiJTdHVkZW50IiwiaWF0IjoxNzY1Nzk0NjQ5LCJleHAiOjE3NjU4ODEwNDl9.5W6TWaptXssMPtYyGmQFAKL7xyOGrshYnVFSaPsHmNQ', '2025-12-16 05:30:49', '2025-12-15 05:30:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(249, 21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsInVzZXJuYW1lIjoiaGFtemEiLCJlbWFpbCI6InVwY29tcDI4QGdtYWlsLmNvbSIsInJvbGUiOiJTdHVkZW50IiwiaWF0IjoxNzY1ODY2ODQ4LCJleHAiOjE3NjU5NTMyNDh9.eJb0wFlnZfkESPDvUZit7fTnZ1wgO1Cmq_A9NRJsekA', '2025-12-17 01:34:08', '2025-12-16 01:34:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(250, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY1OTQ2ODQ2LCJleHAiOjE3NjYwMzMyNDZ9.Zrhw6ie81AkYwxBOEZCz74fRn81GXZFbsmbJh85yoKk', '2025-12-17 23:47:26', '2025-12-16 23:47:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(251, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY2MDQyNTQ1LCJleHAiOjE3NjYxMjg5NDV9.Ncl-5GN0iAWk-ZjF2H0x-u-H9NQOwpvo9EfI56vsPGs', '2025-12-19 02:22:25', '2025-12-18 02:22:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(257, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY2MTQwMDQ1LCJleHAiOjE3NjYyMjY0NDV9.9VVJMmpMuGGAnpqi8cjnaFeR2R07tGICCNXHX9pX6Po', '2025-12-20 05:27:25', '2025-12-19 05:27:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(263, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY2MTQwNzQxLCJleHAiOjE3NjYyMjcxNDF9.WKupVVsWHb9kklM4ChpTwKZdzBPg33PJjIFVjLp_8to', '2025-12-20 05:39:01', '2025-12-19 05:39:01', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(284, 25, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUsInVzZXJuYW1lIjoiaHV6YWlmYSIsImVtYWlsIjoiNDY4OTdAc3R1ZGVudHMucmlwaGFoLmVkdS5wayIsInJvbGUiOiJTdHVkZW50IiwiaWF0IjoxNzY2MjI4OTg3LCJleHAiOjE3NjYzMTUzODd9.F-54KPa0HItdzoxSYoaAPkNXLvWPyGEgj_UDK3kWJrk', '2025-12-21 06:09:47', '2025-12-20 06:09:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(321, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY2NDgzMTc0LCJleHAiOjE3NjY1Njk1NzR9.UkxjbjAOWrva9x8U0br1h71m3u5IAPkQUkS9IbnLcts', '2025-12-24 04:46:14', '2025-12-23 04:46:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),
(322, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiY3VzdG1haWw4QGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzY2NTUyODUwLCJleHAiOjE3NjY2MzkyNTB9.PGayrhyuQYY7zCpOTr5NN4jUof_cEIYynm1ejDuTsec', '2025-12-25 00:07:30', '2025-12-24 00:07:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'),
(333, 26, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsInVzZXJuYW1lIjoienVocmFuIiwiZW1haWwiOiJidXR0YWxpaGFtemEyODg0QGdtYWlsLmNvbSIsInJvbGUiOiJUZWFjaGVyIiwiaWF0IjoxNzY3NTc3NDczLCJleHAiOjE3Njc2NjM4NzN9.zJC5dcWM5dHOW09pAaRDXtmZaUAAyUlL8Ry0jOR5etI', '2026-01-05 20:44:33', '2026-01-04 20:44:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Stand-in structure for view `supervisor_workload`
-- (See below for the actual view)
--
CREATE TABLE `supervisor_workload` (
`supervisor_id` int(11)
,`supervisor_name` varchar(50)
,`supervisor_email` varchar(255)
,`department` varchar(100)
,`supervisor_status` enum('active','inactive','on_leave','unavailable')
,`unavailable_date` datetime
,`active_proposals` bigint(21)
,`pending_proposals` bigint(21)
,`approved_proposals` bigint(21)
,`last_proposal_date` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `task_submissions`
--

CREATE TABLE `task_submissions` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `submitted_by` int(11) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp(),
  `status` enum('submitted','late') DEFAULT 'submitted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `research_areas` text DEFAULT NULL,
  `expertise` text DEFAULT NULL,
  `availability_status` enum('Available','Busy','Unavailable') DEFAULT 'Available',
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Student','Teacher','Committee','Administrator') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `max_supervisees` int(11) DEFAULT 5 COMMENT 'Maximum number of students this supervisor can handle',
  `current_supervisees` int(11) DEFAULT 0 COMMENT 'Current number of students assigned to this supervisor',
  `is_accepting_proposals` tinyint(1) DEFAULT 1 COMMENT 'Whether supervisor is currently accepting new proposals',
  `supervisor_status` enum('active','inactive','on_leave','unavailable') DEFAULT 'active' COMMENT 'Supervisor availability status',
  `unavailable_date` datetime DEFAULT NULL COMMENT 'Date when supervisor became unavailable',
  `unavailable_reason` text DEFAULT NULL COMMENT 'Reason for unavailability'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `profile_picture`, `phone`, `department`, `research_areas`, `expertise`, `availability_status`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`, `created_by`, `last_login`, `max_supervisees`, `current_supervisees`, `is_accepting_proposals`, `supervisor_status`, `unavailable_date`, `unavailable_reason`) VALUES
(1, 'admin', 'custmail8@gmail.com', 'profile_1_1767596027793-851858250.png', '46346235234', '', NULL, NULL, 'Available', '$2b$10$CQINwP0vQTozFq2kICyHjObtOog1GhDzTZKVtePlNXd93Ht8tZgee', 'Administrator', 1, '2025-10-18 08:46:10', '2026-01-05 06:53:49', NULL, '2026-01-05 06:52:53', NULL, 0, 1, 'active', NULL, NULL),
(21, 'hamza', 'upcomp28@gmail.com', NULL, NULL, NULL, NULL, NULL, 'Available', '$2b$10$3Ta.XZ/oDH8MknZydf4tC.dPhu61Uq.0a1XsaulWq0qIhSIfpD3O.', 'Student', 1, '2025-12-09 07:17:59', '2026-01-05 08:43:50', 1, '2026-01-05 08:43:50', NULL, 0, 1, 'active', NULL, NULL),
(25, 'huzaifa', '46897@students.riphah.edu.pk', NULL, NULL, NULL, NULL, NULL, 'Available', '$2b$10$2yJEtF5198vmvmoCCeVccuXBgPMG/Sr16VylmmIF.F9tao//eHT3e', 'Student', 1, '2025-12-19 06:11:14', '2026-01-05 05:15:53', 1, '2026-01-05 05:15:53', NULL, 0, 1, 'active', NULL, NULL),
(26, 'zuhran', 'buttalihamza2884@gmail.com', NULL, NULL, 'Computer Science', NULL, NULL, 'Available', '$2b$10$j7vZM3Tdg3xwA3KVTLfc5eeTgEJzl.r41AvRobRqBp1zceFSFzEJi', 'Teacher', 1, '2025-12-19 06:17:48', '2026-01-05 05:19:27', 1, '2026-01-05 05:19:21', 5, 3, 1, 'active', NULL, NULL),
(28, 'Hassan', 'hamza.ali@riphah.edu.pk', NULL, '', 'Software Engineering', '', '', 'Unavailable', '$2b$10$HKMyezLYmAenRAA.PQ6BEO7UXf0lZLzQzUGJ2qo1k1TZBXLIbkS5G', 'Teacher', 1, '2026-01-04 20:41:35', '2026-01-05 05:19:11', 1, '2026-01-05 05:19:11', 10, 0, 1, 'active', NULL, NULL),
(30, 'ShayanRaza', 'shayanraza804@gmail.com', 'profile_30_1767594334903-315608106.PNG', '', '', NULL, NULL, 'Available', '$2b$10$JKmdokkKMyRj8m.nZmh3w.gCMf8wOiPkEW4oHt4Fh/OpMVa5xcnfy', 'Administrator', 1, '2026-01-05 06:23:53', '2026-01-05 10:56:39', 1, '2026-01-05 10:56:39', NULL, 0, 1, 'active', NULL, NULL),
(31, 'Sir_Syed_Hassan_Ali_Shah', 'shayangujjar088@gmail.com', 'profile_31_1767596367154-325522890.PNG', '', 'Software Engineering', 'Research Supervisor – Guides and oversees the research work.\nAcademic Supervisor – Provides academic direction and ensures standards.\nResearch Area Supervisor – Supervises a specific research domain.\nFaculty Research Supervisor – A faculty member supervising research.\nThesis/Project Supervisor – Supervises a thesis or final-year project.', 'Subject Matter Expert – Has deep knowledge in a specific subject.\nTechnical Supervisor – Guides technical and practical aspects.\nDomain Expert – Expert in a particular field or domain.\nArea of Expertise Supervisor – Oversees work related to a specific expertise.\nAcademic Advisor – Provides academic and career guidance.', 'Available', '$2b$10$CRDS6GZhVvp/3SHFceWnBeeO0oDzyz3r1tyCk4BfskO9QKMvPN6pC', 'Teacher', 1, '2026-01-05 06:57:27', '2026-01-05 11:23:06', 30, '2026-01-05 11:23:06', 7, 1, 1, 'active', NULL, NULL),
(32, 'Abdul_Salam', 'abdul_salam@grr.la', 'profile_32_1767597227218-394600621.PNG', '', '', NULL, NULL, 'Available', '$2b$10$lQJzFgNLxuiXm6RNur8XOupZYEXNajzgK0gTYQi5L2ZsRjHpqXqsK', 'Student', 1, '2026-01-05 07:11:07', '2026-01-05 08:47:58', 30, '2026-01-05 08:47:58', NULL, 0, 1, 'active', NULL, NULL),
(33, 'itshaiderkiani', 'itshaiderkiani@gmail.com', NULL, NULL, NULL, NULL, NULL, 'Available', '$2b$10$fHrjvQ39caBtYEThJOItXeSMFc8zeeoowu4vM7ICLrj5nDD5uRyEa', 'Student', 1, '2026-01-05 11:07:43', '2026-01-05 11:18:38', 30, '2026-01-05 11:18:38', NULL, 0, 1, 'active', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure for view `supervisor_workload`
--
DROP TABLE IF EXISTS `supervisor_workload`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `supervisor_workload`  AS SELECT `u`.`id` AS `supervisor_id`, `u`.`username` AS `supervisor_name`, `u`.`email` AS `supervisor_email`, `u`.`department` AS `department`, `u`.`supervisor_status` AS `supervisor_status`, `u`.`unavailable_date` AS `unavailable_date`, count(case when `p`.`status` in ('pending','revision_requested','approved') then 1 end) AS `active_proposals`, count(case when `p`.`status` = 'pending' then 1 end) AS `pending_proposals`, count(case when `p`.`status` = 'approved' then 1 end) AS `approved_proposals`, max(`p`.`submission_date`) AS `last_proposal_date` FROM (`users` `u` left join `proposals` `p` on(`u`.`id` = `p`.`supervisor_id`)) WHERE `u`.`role` = 'Teacher' GROUP BY `u`.`id`, `u`.`username`, `u`.`email`, `u`.`department`, `u`.`supervisor_status`, `u`.`unavailable_date` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `archived_projects`
--
ALTER TABLE `archived_projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supervisor_id` (`supervisor_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_year` (`year`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_supervisor_name` (`supervisor_name`),
  ADD KEY `idx_technology` (`technology_type`),
  ADD KEY `idx_technology_type` (`technology_type`),
  ADD KEY `idx_created_at` (`created_at`);
ALTER TABLE `archived_projects` ADD FULLTEXT KEY `idx_search` (`title`,`abstract`,`keywords`,`student_names`);
ALTER TABLE `archived_projects` ADD FULLTEXT KEY `idx_fulltext_title` (`title`);
ALTER TABLE `archived_projects` ADD FULLTEXT KEY `idx_fulltext_abstract` (`abstract`);
ALTER TABLE `archived_projects` ADD FULLTEXT KEY `idx_fulltext_keywords` (`keywords`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `deadline_logs`
--
ALTER TABLE `deadline_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `coordinator_id` (`coordinator_id`);

--
-- Indexes for table `failed_login_attempts`
--
ALTER TABLE `failed_login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_identifier` (`identifier`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_attempted_at` (`attempted_at`);

--
-- Indexes for table `milestone_tasks`
--
ALTER TABLE `milestone_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `track_id` (`track_id`);

--
-- Indexes for table `milestone_tracks`
--
ALTER TABLE `milestone_tracks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_track` (`department`,`fyp_part`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `proposals`
--
ALTER TABLE `proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_supervisor` (`supervisor_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_submission` (`submission_date`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `fk_reassigned_by` (`reassigned_by`),
  ADD KEY `idx_previous_supervisor` (`previous_supervisor_id`),
  ADD KEY `idx_reassignment_date` (`reassignment_date`);

--
-- Indexes for table `proposal_activity_logs`
--
ALTER TABLE `proposal_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proposal` (`proposal_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `proposal_members`
--
ALTER TABLE `proposal_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proposal` (`proposal_id`),
  ADD KEY `idx_sap` (`sap_id`);

--
-- Indexes for table `proposal_templates`
--
ALTER TABLE `proposal_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`);

--
-- Indexes for table `security_questions`
--
ALTER TABLE `security_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `security_question_challenges`
--
ALTER TABLE `security_question_challenges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `task_submissions`
--
ALTER TABLE `task_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_submission` (`task_id`,`proposal_id`),
  ADD KEY `proposal_id` (`proposal_id`),
  ADD KEY `submitted_by` (`submitted_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_profile_picture` (`profile_picture`),
  ADD KEY `idx_availability_status` (`availability_status`),
  ADD KEY `idx_supervisor_availability` (`role`,`is_accepting_proposals`,`current_supervisees`),
  ADD KEY `idx_supervisor_status` (`supervisor_status`,`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `archived_projects`
--
ALTER TABLE `archived_projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT for table `deadline_logs`
--
ALTER TABLE `deadline_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_login_attempts`
--
ALTER TABLE `failed_login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `milestone_tasks`
--
ALTER TABLE `milestone_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `milestone_tracks`
--
ALTER TABLE `milestone_tracks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposals`
--
ALTER TABLE `proposals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `proposal_activity_logs`
--
ALTER TABLE `proposal_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `proposal_members`
--
ALTER TABLE `proposal_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `proposal_templates`
--
ALTER TABLE `proposal_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `security_questions`
--
ALTER TABLE `security_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `security_question_challenges`
--
ALTER TABLE `security_question_challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=377;

--
-- AUTO_INCREMENT for table `task_submissions`
--
ALTER TABLE `task_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `archived_projects`
--
ALTER TABLE `archived_projects`
  ADD CONSTRAINT `archived_projects_ibfk_1` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `archived_projects_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `deadline_logs`
--
ALTER TABLE `deadline_logs`
  ADD CONSTRAINT `deadline_logs_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `milestone_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `deadline_logs_ibfk_2` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `milestone_tasks`
--
ALTER TABLE `milestone_tasks`
  ADD CONSTRAINT `milestone_tasks_ibfk_1` FOREIGN KEY (`track_id`) REFERENCES `milestone_tracks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proposals`
--
ALTER TABLE `proposals`
  ADD CONSTRAINT `fk_previous_supervisor` FOREIGN KEY (`previous_supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reassigned_by` FOREIGN KEY (`reassigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposals_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `proposal_activity_logs`
--
ALTER TABLE `proposal_activity_logs`
  ADD CONSTRAINT `proposal_activity_logs_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposal_activity_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `proposal_members`
--
ALTER TABLE `proposal_members`
  ADD CONSTRAINT `proposal_members_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proposal_templates`
--
ALTER TABLE `proposal_templates`
  ADD CONSTRAINT `proposal_templates_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `security_questions`
--
ALTER TABLE `security_questions`
  ADD CONSTRAINT `security_questions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `security_question_challenges`
--
ALTER TABLE `security_question_challenges`
  ADD CONSTRAINT `security_question_challenges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `security_question_challenges_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_submissions`
--
ALTER TABLE `task_submissions`
  ADD CONSTRAINT `task_submissions_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `milestone_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_submissions_ibfk_2` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_submissions_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
