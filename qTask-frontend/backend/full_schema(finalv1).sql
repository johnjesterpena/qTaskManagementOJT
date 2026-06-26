-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 25, 2026 at 06:24 AM
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
-- Database: `qtask_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `taskId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `action` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `taskId`, `userId`, `action`, `createdAt`) VALUES
(1, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:26:00'),
(2, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:26:01'),
(3, 2, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 15:26:03'),
(4, 3, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:26:05'),
(5, 3, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:26:06'),
(6, 2, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 15:26:07'),
(7, 1, NULL, 'Phase changed from \"In Progress\" to \"Client Review - UAT\"', '2026-04-18 15:27:48'),
(8, 1, NULL, 'Phase changed from \"Client Review - UAT\" to \"In Progress\"', '2026-04-18 15:27:56'),
(9, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:37:35'),
(10, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:37:37'),
(11, 2, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 15:37:41'),
(12, 2, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 15:37:42'),
(13, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:38:03'),
(14, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:38:12'),
(15, 1, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 15:38:53'),
(16, 1, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 15:39:04'),
(17, 5, NULL, 'Phase changed from \"Deployed (Go-Live)\" to \"QA Execution\"', '2026-04-18 16:53:01'),
(18, 5, NULL, 'Phase changed from \"QA Execution\" to \"Deployed (Go-Live)\"', '2026-04-18 16:53:02'),
(19, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 16:53:05'),
(20, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 16:53:05'),
(21, 4, NULL, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-18 16:55:41'),
(22, 4, NULL, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-18 16:55:43'),
(23, 1, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 17:02:38'),
(24, 1, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 17:34:30'),
(25, 2, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 17:34:38'),
(26, 2, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-18 17:34:43'),
(27, 3, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 18:08:00'),
(28, 3, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 18:08:10'),
(29, 4, NULL, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-18 18:08:44'),
(30, 4, 6, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 18:41:02'),
(31, 2, 5, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 18:42:01'),
(32, 2, 5, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 18:42:08'),
(33, 3, 2, 'Phase changed from \"In Progress\" to \"Backlog (Requirements)\"', '2026-04-18 18:42:25'),
(34, 3, 2, 'Phase changed from \"Backlog (Requirements)\" to \"In Progress\"', '2026-04-18 18:42:29'),
(35, 4, 6, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 18:43:07'),
(36, 4, 6, 'Task details updated', '2026-04-18 18:43:48'),
(37, 4, 6, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 18:48:38'),
(38, 4, 6, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-18 18:48:49'),
(39, 4, 6, 'Phase changed from \"Deployed (Go-Live)\" to \"For Review (Dev Done)\"', '2026-04-18 18:48:57'),
(40, 4, 6, 'Phase changed from \"For Review (Dev Done)\" to \"Deployed (Go-Live)\"', '2026-04-18 18:49:18'),
(41, 4, 6, 'Task details updated', '2026-04-18 18:49:36'),
(42, 4, 4, 'Phase changed from \"Deployed (Go-Live)\" to \"Completed\" — Actual End Date: 2026-04-18', '2026-04-18 18:50:10'),
(43, 4, 4, 'Phase changed from \"Completed\" to \"Deployed (Go-Live)\"', '2026-04-18 18:50:13'),
(44, 6, 6, 'Task created', '2026-04-19 11:29:17'),
(45, 6, 6, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-19 11:29:38'),
(46, 6, 6, 'Phase changed from \"To Do (Ready for Dev)\" to \"Backlog (Requirements)\"', '2026-04-19 11:29:49'),
(47, 6, 7, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-19 11:41:14'),
(48, 6, 7, 'Phase changed from \"To Do (Ready for Dev)\" to \"Backlog (Requirements)\"', '2026-04-19 11:41:31'),
(49, 6, 7, 'Task details updated', '2026-04-19 11:42:12'),
(50, 6, 1, 'Task details updated', '2026-04-19 12:43:56'),
(51, 6, 1, 'Phase changed from \"Backlog (Requirements)\" to \"In Progress\"', '2026-04-19 12:47:01'),
(52, 4, 1, 'Phase changed from \"Deployed (Go-Live)\" to \"In Progress\"', '2026-04-19 12:47:04'),
(53, 5, 1, 'Phase changed from \"Deployed (Go-Live)\" to \"In Progress\"', '2026-04-19 12:47:06'),
(54, 4, 1, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-19 12:47:47'),
(55, 5, 1, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-19 12:47:49'),
(56, 3, 1, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-19 12:47:53'),
(57, 7, 1, 'Task created', '2026-04-22 20:32:28'),
(58, 7, 1, 'Task details updated', '2026-04-22 20:33:25'),
(59, 8, 6, 'Task created', '2026-04-22 20:34:42'),
(60, 8, 6, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-22 20:34:46'),
(61, 7, 6, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-22 20:34:48'),
(62, 8, 6, 'Task details updated', '2026-04-22 20:35:13'),
(63, 3, 2, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-22 20:35:49'),
(64, 4, 7, 'Task details updated', '2026-04-24 10:49:46'),
(65, 5, 7, 'Task details updated', '2026-04-24 10:49:58'),
(66, 3, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:50:07'),
(67, 3, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:50:17'),
(68, 3, 7, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-24 10:50:30'),
(69, 3, 7, 'Task details updated', '2026-04-24 10:50:48'),
(70, 3, 7, 'Phase changed from \"For Review (Dev Done)\" to \"QA Execution\"', '2026-04-24 10:50:52'),
(71, 2, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:50:59'),
(72, 2, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:51:05'),
(73, 3, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:51:13'),
(74, 1, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:51:17'),
(75, 1, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:51:21'),
(76, 2, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:53:15'),
(77, 2, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:53:16'),
(78, 2, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:53:17'),
(79, 2, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:53:19'),
(80, 2, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:55:03'),
(81, 3, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:55:05'),
(82, 3, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:55:08'),
(83, 3, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:55:11'),
(84, 2, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:55:14'),
(85, 3, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:55:22'),
(86, 3, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:55:33'),
(87, 3, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:55:36'),
(88, 3, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:58:01'),
(89, 3, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:58:02'),
(90, 2, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:58:05'),
(91, 2, 7, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 10:58:08'),
(92, 4, 7, 'Phase changed from \"Deployed (Go-Live)\" to \"In Progress\"', '2026-04-24 10:58:13'),
(93, 4, 7, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-24 10:58:15'),
(94, 3, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:59:21'),
(95, 2, 7, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 10:59:28'),
(96, 2, 7, 'Task details updated', '2026-04-24 10:59:38'),
(97, 7, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-24 11:02:08'),
(98, 7, 1, 'Phase changed from \"QA Execution\" to \"To Do (Ready for Dev)\"', '2026-04-24 11:02:11'),
(99, 7, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-24 11:08:05'),
(100, 7, 1, 'Phase changed from \"QA Execution\" to \"To Do (Ready for Dev)\"', '2026-04-24 11:08:24'),
(101, 1, 1, 'QA assignee changed from \"Unassigned\" to \"Dana Cruz\"', '2026-04-24 11:10:14'),
(102, 8, 1, 'QA assignee changed from \"Unassigned\" to \"Qa 2\"', '2026-04-24 11:17:46'),
(103, 7, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-24 11:26:01'),
(104, 7, 1, 'Phase changed from \"QA Execution\" to \"To Do (Ready for Dev)\"', '2026-04-24 11:26:07'),
(105, 8, 8, 'Phase changed from \"Client Review - UAT\" to \"QA Execution\"', '2026-04-24 11:26:17'),
(106, 8, 8, 'Phase changed from \"QA Execution\" to \"Client Review - UAT\"', '2026-04-24 11:26:25'),
(107, 8, 8, 'Phase changed from \"Client Review - UAT\" to \"QA Execution\"', '2026-04-24 11:26:28'),
(108, 6, 3, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-24 11:27:44'),
(109, 6, 3, 'Phase changed from \"To Do (Ready for Dev)\" to \"Backlog (Requirements)\"', '2026-04-24 11:27:48'),
(110, 7, 1, 'QA assignee changed from \"Unassigned\" to \"Qa 2\"', '2026-04-24 11:31:03'),
(111, 6, 1, 'Phase changed from \"Backlog (Requirements)\" to \"Client Review - UAT\"', '2026-04-24 11:32:04'),
(112, 6, 1, 'QA assignee changed from \"Unassigned\" to \"Qa 2\"', '2026-04-24 11:32:17'),
(113, 7, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"For Review (Dev Done)\"', '2026-04-24 15:19:20'),
(114, 7, 1, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-24 15:19:29'),
(115, 1, 1, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 16:08:54'),
(116, 1, 1, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 16:09:01'),
(117, 7, 1, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-24 17:15:32'),
(118, 7, 1, 'Phase changed from \"Deployed (Go-Live)\" to \"In Progress\"', '2026-04-24 17:15:34'),
(119, 9, 1, 'Task created', '2026-04-24 17:16:23'),
(120, 9, 1, 'Phase changed from \"Backlog (Requirements)\" to \"QA Execution\"', '2026-04-24 17:16:28'),
(121, 9, 1, 'Phase changed from \"QA Execution\" to \"Backlog (Requirements)\"', '2026-04-24 17:16:31'),
(122, 9, 1, 'Phase changed from \"Backlog (Requirements)\" to \"QA Execution\"', '2026-04-24 17:16:37'),
(123, 9, 1, 'Phase changed from \"QA Execution\" to \"Backlog (Requirements)\"', '2026-04-24 17:16:39'),
(124, 1, 1, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 17:28:57'),
(125, 1, 1, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 17:28:58'),
(126, 2, 1, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 17:29:07'),
(127, 1, 1, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 17:29:08'),
(128, 1, 1, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 17:29:11'),
(129, 1, 1, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 17:29:12'),
(130, 2, 1, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-24 17:29:14'),
(131, 1, 1, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-24 17:29:17'),
(132, 2, 1, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-24 17:30:42'),
(133, 2, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-24 17:30:43'),
(134, 2, 1, 'Phase changed from \"In Progress\" to \"Backlog (Requirements)\"', '2026-04-24 17:30:44'),
(135, 2, 1, 'Phase changed from \"Backlog (Requirements)\" to \"In Progress\"', '2026-04-24 17:30:46'),
(136, 1, 1, 'Phase changed from \"QA Execution\" to \"To Do (Ready for Dev)\"', '2026-04-24 17:30:55'),
(137, 1, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-24 17:30:58'),
(138, 1, 1, 'Phase changed from \"QA Execution\" to \"To Do (Ready for Dev)\"', '2026-04-24 18:21:01'),
(139, 1, 1, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-24 18:21:08'),
(140, 2, 1, 'Severity changed from \"4 - Low\" to \"5 - Cosmetic Fix\"', '2026-04-24 19:32:31'),
(141, 9, 1, 'Phase changed from \"Backlog (Requirements)\" to \"aa\"', '2026-04-24 19:44:44'),
(142, 9, 1, 'Phase changed from \"aa\" to \"Backlog (Requirements)\"', '2026-04-24 19:45:26'),
(143, 7, 1, 'Phase changed from \"In Progress\" to \"Completed\" — Actual End Date: 2026-04-24', '2026-04-24 20:04:30'),
(144, 7, 1, 'Phase changed from \"Completed\" to \"In Progress\"', '2026-04-24 20:04:35'),
(145, 7, 1, 'Phase changed from \"In Progress\" to \"Completed\" — Actual End Date: 2026-04-24', '2026-04-24 20:05:00'),
(146, 8, 1, 'Phase changed from \"QA Execution\" to \"Completed\" — Actual End Date: 2026-04-24', '2026-04-24 20:44:28'),
(147, 9, 1, 'Phase changed from \"Backlog (Requirements)\" to \"Completed\" — Actual End Date: 2026-04-24', '2026-04-24 20:44:31'),
(148, 6, 1, 'Phase changed from \"Client Review - UAT\" to \"Completed\" — Actual End Date: 2026-04-25', '2026-04-25 11:38:57'),
(149, 2, 5, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-25 11:53:45'),
(150, 2, 5, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-25 11:53:51'),
(151, 2, 5, 'Status changed from \"Not Started\" to \"Active\"', '2026-04-25 11:54:08'),
(152, 2, 5, 'Status changed from \"Active\" to \"Clarification Needed\"', '2026-04-25 11:54:45'),
(153, 2, 5, 'Status changed from \"Clarification Needed\" to \"Active\"', '2026-04-25 11:59:34'),
(154, 2, 5, 'Status changed from \"Active\" to \"Bug Fixing\"', '2026-04-25 11:59:53'),
(155, 2, 5, 'Status changed from \"Bug Fixing\" to \"For Verification\"', '2026-04-25 12:00:29'),
(156, 2, 5, 'Severity changed from \"5 - Cosmetic Fix\" to \"4 - Low\"', '2026-04-25 12:00:37'),
(157, 2, 5, 'Status changed from \"For Verification\" to \"Clarification Needed\"', '2026-04-25 12:01:04'),
(158, 2, 5, 'Severity changed from \"4 - Low\" to \"3 - Medium\"', '2026-04-25 12:02:57'),
(159, 2, 5, 'Status changed from \"Clarification Needed\" to \"Bug Fixing\"', '2026-04-25 12:09:49'),
(160, 2, 5, 'Status changed from \"Bug Fixing\" to \"For Verification\"', '2026-04-25 12:10:24'),
(161, 2, 5, 'Severity changed from \"3 - Medium\" to \"4 - Low\"', '2026-04-25 12:10:33'),
(162, 2, 5, 'Status changed from \"For Verification\" to \"Bug Fixing\"', '2026-04-25 12:13:42'),
(163, 2, 5, 'Status changed from \"Bug Fixing\" to \"Active\" · Severity changed from \"4 - Low\" to \"5 - Cosmetic Fix\"', '2026-04-25 12:14:40'),
(164, 2, 5, 'Status changed from \"Active\" to \"Clarification Needed\" · Severity changed from \"5 - Cosmetic Fix\" to \"4 - Low\"', '2026-04-25 12:15:03'),
(165, 2, 5, 'Status changed from \"Clarification Needed\" to \"Blocked\" · Severity changed from \"4 - Low\" to \"3 - Medium\"', '2026-04-25 12:15:20'),
(166, 2, 5, 'Status changed from \"Blocked\" to \"For Verification\" · Severity changed from \"3 - Medium\" to \"4 - Low\"', '2026-04-25 12:16:06'),
(167, 6, 4, 'Status changed from \"Not Started\" to \"Passed\"', '2026-04-25 12:16:53');

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

CREATE TABLE `assessments` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `assessments`
--

INSERT INTO `assessments` (`id`, `label`, `sortOrder`) VALUES
(1, 'Existing', 1),
(2, 'Development / Customization', 2),
(3, 'Enhancement', 3),
(4, 'Not Applicable', 4),
(5, 'Out of Scope', 5),
(6, 'Defect', 6);

-- --------------------------------------------------------

--
-- Table structure for table `phases`
--

CREATE TABLE `phases` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isFinal` tinyint(1) NOT NULL DEFAULT 0,
  `grouping` enum('dev','qa') NOT NULL DEFAULT 'dev'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `phases`
--

INSERT INTO `phases` (`id`, `label`, `sortOrder`, `isDefault`, `isFinal`, `grouping`) VALUES
(1, 'Backlog (Requirements)', 1, 1, 0, 'dev'),
(2, 'To Do (Ready for Dev)', 2, 0, 0, 'dev'),
(3, 'In Progress', 3, 0, 0, 'dev'),
(4, 'For Review (Dev Done)', 4, 0, 0, 'dev'),
(5, 'Client Review - UAT', 5, 0, 0, 'qa'),
(6, 'QA Execution', 6, 0, 0, 'qa'),
(7, 'Deployed (Go-Live)', 7, 0, 0, 'qa'),
(8, 'Completed', 8, 0, 1, 'qa');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `clientName` varchar(255) DEFAULT NULL,
  `targetEndDate` date DEFAULT NULL,
  `pmId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('ongoing','completed','cancelled') NOT NULL DEFAULT 'ongoing'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `title`, `description`, `clientName`, `targetEndDate`, `pmId`, `createdAt`, `status`) VALUES
(1, 'QTask Development', 'Default project for existing tasks', 'Sikrit', '2026-04-28', 7, '2026-04-19 11:53:14', 'ongoing'),
(2, 'Test Project 1', 'test data to simulate the separation of workloads', 'Atho pooo', '2026-04-20', 6, '2026-04-19 12:10:09', 'completed'),
(3, 'prajekk', 'brip diskripsyun', 'canzon qt', '2026-05-22', 6, '2026-04-24 15:36:03', 'ongoing'),
(4, 'test 4', NULL, 'testting tao', '2026-04-25', 7, '2026-04-24 22:16:30', 'cancelled');

-- --------------------------------------------------------

--
-- Table structure for table `severities`
--

CREATE TABLE `severities` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `color` varchar(20) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `severities`
--

INSERT INTO `severities` (`id`, `label`, `color`, `sortOrder`) VALUES
(1, '1 - Critical', '#ef4444', 1),
(2, '2 - High', '#f97316', 2),
(3, '3 - Medium', '#eab308', 3),
(4, '4 - Low', '#22c55e', 4),
(5, '5 - Cosmetic Fix', '#3b82f6', 5),
(6, 'Nice to Have', '#8b5cf6', 6);

-- --------------------------------------------------------

--
-- Table structure for table `statuses`
--

CREATE TABLE `statuses` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#6b7280',
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isFinal` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `statuses`
--

INSERT INTO `statuses` (`id`, `label`, `color`, `sortOrder`, `isDefault`, `isFinal`) VALUES
(1, 'Not Started', '#94a3b8', 1, 1, 0),
(2, 'Active', '#3b82f6', 2, 0, 0),
(3, 'Blocked', '#ef4444', 3, 0, 0),
(4, 'Bug Fixing', '#f97316', 4, 0, 0),
(5, 'Clarification Needed', '#f59e0b', 5, 0, 0),
(6, 'For Verification', '#8b5cf6', 6, 0, 0),
(7, 'Failed', '#dc2626', 7, 0, 0),
(8, 'Passed', '#22c55e', 8, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `subtasks`
--

CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL,
  `taskId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `isDone` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `subtasks`
--

INSERT INTO `subtasks` (`id`, `taskId`, `title`, `isDone`) VALUES
(46, 8, '1', 0),
(47, 8, '2', 0),
(48, 7, 'subtask 1', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `projectId` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `statusId` int(11) NOT NULL,
  `phaseId` int(11) DEFAULT NULL,
  `severityId` int(11) DEFAULT NULL,
  `assigneeId` int(11) DEFAULT NULL,
  `qaAssigneeId` int(11) DEFAULT NULL,
  `targetDate` date DEFAULT NULL,
  `actualEndDate` date DEFAULT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `projectId`, `title`, `description`, `statusId`, `phaseId`, `severityId`, `assigneeId`, `qaAssigneeId`, `targetDate`, `actualEndDate`, `progress`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Design login page', 'Create Figma mockup and implement HTML/CSS.', 1, 6, 2, 3, 4, '2025-04-09', NULL, 0, '2026-04-18 14:45:08', '2026-04-24 18:21:08'),
(2, 1, 'Write API docs', 'Document all Express routes via Postman.', 6, 3, 4, 5, 4, '2025-04-03', NULL, 0, '2026-04-18 14:45:08', '2026-04-25 12:16:06'),
(3, 1, 'Build dashboard UI', 'Implement analytics dashboard with charts.', 2, 6, 2, 2, 4, '2025-04-14', NULL, 55, '2026-04-18 14:45:08', '2026-04-24 11:19:07'),
(4, 1, 'Auth endpoints', 'Express JWT auth with bcrypt hashing.', 6, 7, 1, 4, 4, '2025-04-09', '2026-04-18', 100, '2026-04-18 14:45:08', '2026-04-24 10:58:15'),
(5, 1, 'Project repo setup', 'Initialise GitHub repo and branch rules.', 8, 7, 3, 2, 4, '2025-03-31', NULL, 100, '2026-04-18 14:45:08', '2026-04-24 10:49:58'),
(6, 1, 'Kanban Frontend', 'test data no. 1', 8, 8, 2, 3, 8, '2026-04-20', '2026-04-25', 100, '2026-04-19 11:29:17', '2026-04-25 12:16:53'),
(7, 2, 'Backshot ugh', 'mwehehe', 1, 8, 2, 6, 8, '2026-04-28', '2026-04-24', 100, '2026-04-22 20:32:28', '2026-04-24 20:05:00'),
(8, 2, 'blow work', 'dipindi', 1, 8, 3, 2, 8, '2026-04-22', '2026-04-24', 100, '2026-04-22 20:34:42', '2026-04-24 20:44:28'),
(9, 2, 'pouble denetration', NULL, 1, 8, 3, 2, NULL, '2026-04-27', '2026-04-24', 100, '2026-04-24 17:16:23', '2026-04-24 20:44:31');

-- --------------------------------------------------------

--
-- Table structure for table `task_attachments`
--

CREATE TABLE `task_attachments` (
  `id` int(11) NOT NULL,
  `taskId` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `uploadedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','ProjectManager','Developer','QA') NOT NULL DEFAULT 'Developer',
  `isActive` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `isActive`) VALUES
(1, 'Admin User', 'admin', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Admin', 1),
(2, 'Carlo Reyes', 'carlo', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Developer', 1),
(3, 'Ana Santos', 'ana', '$2b$10$wcAuxMTpcRCNZaISx.oP2eV1Km3HT2nBNUw7QOjLcOzXtr8rQgA9G', 'Developer', 1),
(4, 'Dana Cruz', 'dana', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'QA', 1),
(5, 'Ben Torres', 'ben', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Developer', 1),
(6, 'Maria Lopez', 'maria', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'ProjectManager', 1),
(7, 'Mark Yyu', 'markyyu', '$2b$10$bf2rKJo.iivVeXrMRo2gKu1SHI71ZL.Hf4n1M1xRnqPR6FcXdpjoO', 'ProjectManager', 1),
(8, 'Qa 222', 'qa2', '$2b$10$Vl9kgVuc8G7MYgSkQwYXieZHuDy2nVJZmtKVOc.Weev7QVmsZJzei', 'QA', 1),
(9, 'Juan Cruz', 'juan', '$2b$10$2jsj0oY8gkP30d42PNSyQ./gmI.pHUOKdxwk6G6CQoujHpJBPUSMC', 'Developer', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_log_task` (`taskId`);

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_assessment_label` (`label`);

--
-- Indexes for table `phases`
--
ALTER TABLE `phases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_phase_label` (`label`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_title` (`title`),
  ADD KEY `fk_project_pm` (`pmId`);

--
-- Indexes for table `severities`
--
ALTER TABLE `severities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_severity_label` (`label`);

--
-- Indexes for table `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_status_label` (`label`);

--
-- Indexes for table `subtasks`
--
ALTER TABLE `subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_subtask_task` (`taskId`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_status` (`statusId`),
  ADD KEY `fk_task_phase` (`phaseId`),
  ADD KEY `fk_task_severity` (`severityId`),
  ADD KEY `fk_task_assignee` (`assigneeId`),
  ADD KEY `fk_task_project` (`projectId`),
  ADD KEY `fk_task_qa_assignee` (`qaAssigneeId`);

--
-- Indexes for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_attachment_task` (`taskId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `phases`
--
ALTER TABLE `phases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `severities`
--
ALTER TABLE `severities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `statuses`
--
ALTER TABLE `statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `subtasks`
--
ALTER TABLE `subtasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `task_attachments`
--
ALTER TABLE `task_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_log_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_project_pm` FOREIGN KEY (`pmId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subtasks`
--
ALTER TABLE `subtasks`
  ADD CONSTRAINT `fk_subtask_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_assignee` FOREIGN KEY (`assigneeId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_task_phase` FOREIGN KEY (`phaseId`) REFERENCES `phases` (`id`),
  ADD CONSTRAINT `fk_task_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_task_qa_assignee` FOREIGN KEY (`qaAssigneeId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_task_severity` FOREIGN KEY (`severityId`) REFERENCES `severities` (`id`),
  ADD CONSTRAINT `fk_task_status` FOREIGN KEY (`statusId`) REFERENCES `statuses` (`id`);

--
-- Constraints for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD CONSTRAINT `fk_attachment_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
