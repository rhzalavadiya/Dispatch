CREATE DATABASE  IF NOT EXISTS `dispatchdatabase` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dispatchdatabase`;
-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: dispatchdatabase
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.22.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appmaster`
--

DROP TABLE IF EXISTS `appmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appmaster` (
  `AppId` int NOT NULL AUTO_INCREMENT,
  `AppName` varchar(255) DEFAULT NULL,
  `AppStatus` int DEFAULT NULL,
  PRIMARY KEY (`AppId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appmaster`
--

LOCK TABLES `appmaster` WRITE;
/*!40000 ALTER TABLE `appmaster` DISABLE KEYS */;
INSERT INTO `appmaster` VALUES (1,'SmartTrackerPlus',1),(2,'Shipper Tracker',1),(3,'Shipment Dispatch',1);
/*!40000 ALTER TABLE `appmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audittrail`
--

DROP TABLE IF EXISTS `audittrail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audittrail` (
  `AUTR_ID` int NOT NULL AUTO_INCREMENT,
  `AUTR_ScreenName` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `AUTR_OldValue` longtext,
  `AUTR_NewValue` longtext,
  `AUTR_Message` varchar(255) DEFAULT NULL,
  `AUTR_UserID` int DEFAULT NULL,
  `AUTR_UserName` varchar(45) DEFAULT NULL,
  `AUTR_TimeStamp` datetime DEFAULT NULL,
  `AUTR_AuditType` tinytext,
  `AUTR_SCPID` int DEFAULT NULL,
  `AUTR_CompanyGrpId` int DEFAULT NULL,
  `AUTR_CompanyID` int DEFAULT NULL,
  `AUTR_CreatedBy` int DEFAULT NULL,
  `AUTR_CreatedDateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`AUTR_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='		';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audittrail`
--

LOCK TABLES `audittrail` WRITE;
/*!40000 ALTER TABLE `audittrail` DISABLE KEYS */;
/*!40000 ALTER TABLE `audittrail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audittransaction`
--

DROP TABLE IF EXISTS `audittransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audittransaction` (
  `AUTRN_MID` int NOT NULL AUTO_INCREMENT,
  `AUTRN_ID` int DEFAULT NULL,
  `AUTRN_OldValue` longtext,
  `AUTRN_NewValue` longtext,
  `AUTRN_ParamererName` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`AUTRN_MID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Audit Transaction';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audittransaction`
--

LOCK TABLES `audittransaction` WRITE;
/*!40000 ALTER TABLE `audittransaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `audittransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batchlist`
--

DROP TABLE IF EXISTS `batchlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batchlist` (
  `BL_ID` int NOT NULL AUTO_INCREMENT,
  `BL_BatchID` int DEFAULT NULL,
  `BL_BatchName` varchar(45) DEFAULT NULL,
  `BL_BatchType` varchar(45) DEFAULT NULL,
  `BL_MfgDate` datetime DEFAULT NULL,
  `BL_ExpDate` datetime DEFAULT NULL,
  `BL_BatchSize` double DEFAULT NULL,
  `BL_BlockCount` int DEFAULT '0',
  `BL_ExtraRSN` double DEFAULT NULL,
  `BL_BatchStatus` varchar(45) DEFAULT NULL,
  `BL_PONumber` varchar(45) DEFAULT NULL,
  `BL_FirstRsnComm` varchar(45) DEFAULT NULL,
  `BL_LastRsnComm` varchar(45) DEFAULT NULL,
  `BL_IsUploadDownload` varchar(45) DEFAULT NULL,
  `BL_FromSSCC` double DEFAULT NULL,
  `BL_ToSSCC` double DEFAULT NULL,
  `BL_ProductName` varchar(45) DEFAULT NULL,
  `BL_GenericName` varchar(45) DEFAULT NULL,
  `BL_GTIN` varchar(45) DEFAULT NULL,
  `BL_ProductFGCode` varchar(45) DEFAULT NULL,
  `BL_RegulatoryID` int DEFAULT NULL,
  `BL_ReportingPartyID` int DEFAULT NULL,
  `BL_SerializationID` int DEFAULT NULL,
  `BL_CaseCompanyID` int DEFAULT NULL,
  `BL_PalletteCompanyID` int DEFAULT NULL,
  `BL_ItemNumber` varchar(45) DEFAULT NULL,
  `BL_MachineID` varchar(45) DEFAULT NULL,
  `BL_MachineName` varchar(45) DEFAULT NULL,
  `BL_MachineIdentity` varchar(45) DEFAULT NULL,
  `BL_LineID` int DEFAULT NULL,
  `BL_PartyID` int DEFAULT NULL,
  `BL_PhysicalLocation` int DEFAULT NULL,
  `BL_CompanyID` int DEFAULT NULL,
  `BL_CompanyGrpID` int DEFAULT NULL,
  `BL_ProductListDataTemplateID` int DEFAULT NULL,
  `BL_ProductListDataTemplateData` varchar(45) DEFAULT NULL,
  `BL_BatchListDataTemplateID` int DEFAULT NULL,
  `BL_BatchListDataTemplateData` varchar(45) DEFAULT NULL,
  `BL_CreatedBy` varchar(45) DEFAULT NULL,
  `BL_CreatedTimeStamp` datetime DEFAULT NULL,
  `BL_LastModifiedBy` varchar(45) DEFAULT NULL,
  `BL_LastModifiedTimeStamp` datetime DEFAULT NULL,
  `BCT_RSNFlag` int DEFAULT NULL,
  `BL_ProductID` int DEFAULT NULL,
  `BL_PackSize` int DEFAULT NULL,
  PRIMARY KEY (`BL_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Batch Header Information';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batchlist`
--

LOCK TABLES `batchlist` WRITE;
/*!40000 ALTER TABLE `batchlist` DISABLE KEYS */;
INSERT INTO `batchlist` VALUES (48,NULL,'DM/01',NULL,'2026-01-19 13:00:00','2033-07-19 13:00:00',3,3,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'DOBULE MARI PAPAD 400 GM',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 05:32:21',NULL,NULL,NULL,18,NULL),(49,NULL,'DM/02',NULL,'2026-01-20 13:00:00','2033-07-20 13:00:00',0,0,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'DOBULE MARI PAPAD 400 GM',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 05:36:41',NULL,NULL,NULL,18,NULL),(50,NULL,'DM/02',NULL,'2026-01-20 13:00:00','2033-07-20 13:00:00',2,2,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'DOBULE MARI PAPAD 400 GM',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 05:48:21',NULL,NULL,NULL,18,NULL),(51,NULL,'DM/03',NULL,'2026-01-20 13:00:00','2041-11-20 13:00:00',1,0,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'Product 01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 09:04:21',NULL,NULL,NULL,7,NULL),(52,NULL,'DM/04',NULL,'2026-01-19 13:00:00','2041-11-19 13:00:00',2,0,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'Product 01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 09:15:21',NULL,NULL,NULL,7,NULL),(53,NULL,'DM/05',NULL,'2026-01-19 13:00:00','2041-11-19 13:00:00',1,0,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'Product 01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 10:49:41',NULL,NULL,NULL,7,NULL),(54,NULL,'LM/01',NULL,'2026-01-19 13:00:00','2041-11-19 13:00:00',1,0,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'Product 01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 11:13:02',NULL,NULL,NULL,7,NULL),(55,NULL,'2455',NULL,'2026-01-22 13:00:00','2033-07-22 13:00:00',1,0,NULL,'3',NULL,NULL,NULL,NULL,NULL,NULL,'PRODUCT1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,38,19,15,NULL,NULL,NULL,NULL,NULL,'2026-01-20 11:39:41',NULL,NULL,NULL,5,NULL);
/*!40000 ALTER TABLE `batchlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batchmaster`
--

DROP TABLE IF EXISTS `batchmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batchmaster` (
  `BM_BatchMID` int NOT NULL AUTO_INCREMENT,
  `BM_BatchID` int DEFAULT NULL,
  `BM_BatchSize` int DEFAULT NULL,
  `BM_TotalRsnQty` int DEFAULT NULL,
  `BM_ExtraRsnQty` int DEFAULT NULL,
  `BM_GoodRsnQty` int DEFAULT NULL,
  `BM_BadRsnQty` int DEFAULT NULL,
  `BM_QARsnQty` int DEFAULT NULL,
  `BM_UnusedRsnQty` int DEFAULT NULL,
  `BM_TotalCount` int DEFAULT NULL,
  `BM_PackLevel` varchar(45) DEFAULT NULL,
  `BM_MfgDate` datetime DEFAULT NULL,
  `BM_ExpDate` datetime DEFAULT NULL,
  `BM_ProductMId` varchar(45) DEFAULT NULL,
  `BM_ProductId` varchar(45) DEFAULT NULL,
  `BM_GTIN` varchar(45) DEFAULT NULL,
  `BM_ParentGTIN` varchar(45) DEFAULT NULL,
  `BM_PackingLevel` varchar(45) DEFAULT NULL,
  `BM_LabelID` varchar(45) DEFAULT NULL,
  `BM_MfgDateFormatId` varchar(45) DEFAULT NULL,
  `BM_ExpDateFormatId` varchar(45) DEFAULT NULL,
  `BM_GTIN_URI_Format` varchar(45) DEFAULT NULL,
  `BM_Price` varchar(45) DEFAULT NULL,
  `BM_ProductMastDataTemplateID` int DEFAULT NULL,
  `BM_ProductMastDataTemplateData` varchar(45) DEFAULT NULL,
  `BM_BatchMastDataTemplateID` int DEFAULT NULL,
  `BM_BatchMastDataTemplateData` varchar(45) DEFAULT NULL,
  `BM_CreatedBy` varchar(45) DEFAULT NULL,
  `BM_CreatedTimestamp` datetime DEFAULT NULL,
  `BM_LastModifiedBy` varchar(45) DEFAULT NULL,
  `BM_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`BM_BatchMID`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Packing Level Information for Particular Batch';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batchmaster`
--

LOCK TABLES `batchmaster` WRITE;
/*!40000 ALTER TABLE `batchmaster` DISABLE KEYS */;
INSERT INTO `batchmaster` VALUES (46,48,6,NULL,NULL,NULL,NULL,NULL,NULL,6,NULL,'2026-01-19 13:00:00','2036-01-19 13:00:00','17','17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-19 11:56:41',NULL,NULL),(47,49,2,NULL,NULL,NULL,NULL,NULL,NULL,2,NULL,'2026-01-21 13:00:00','2036-01-21 13:00:00','17','17',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-19 11:57:40',NULL,NULL),(48,50,3,NULL,NULL,NULL,NULL,NULL,NULL,3,NULL,'2026-01-19 13:00:00','2033-07-19 13:00:00','18','18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-20 05:32:21',NULL,NULL),(49,51,1,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-01-20 13:00:00','2041-11-20 13:00:00','18','18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-20 05:36:41',NULL,NULL),(50,52,2,NULL,NULL,NULL,NULL,NULL,NULL,2,NULL,'2026-01-20 13:00:00','2041-11-19 13:00:00','18','18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-20 05:48:21',NULL,NULL),(51,53,1,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-01-19 13:00:00','2041-11-19 13:00:00','7','7',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-20 10:49:41',NULL,NULL),(52,54,1,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-01-19 13:00:00','2041-11-19 13:00:00','7','7',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-20 11:13:02',NULL,NULL),(53,55,1,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-01-22 13:00:00','2033-07-22 13:00:00','5','5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-20 11:39:41',NULL,NULL);
/*!40000 ALTER TABLE `batchmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyconfigchannelmaster`
--

DROP TABLE IF EXISTS `companyconfigchannelmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyconfigchannelmaster` (
  `C_ID` int NOT NULL AUTO_INCREMENT,
  `C_CCID` int NOT NULL,
  `C_ChannelValue` varchar(255) NOT NULL,
  PRIMARY KEY (`C_ID`),
  UNIQUE KEY `uq_channel` (`C_CCID`,`C_ChannelValue`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyconfigchannelmaster`
--

LOCK TABLES `companyconfigchannelmaster` WRITE;
/*!40000 ALTER TABLE `companyconfigchannelmaster` DISABLE KEYS */;
INSERT INTO `companyconfigchannelmaster` VALUES (1,1,'1');
/*!40000 ALTER TABLE `companyconfigchannelmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyconfigdateformatmaster`
--

DROP TABLE IF EXISTS `companyconfigdateformatmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyconfigdateformatmaster` (
  `CC_DM_ID` int NOT NULL AUTO_INCREMENT,
  `CC_DM_DateFormat` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  PRIMARY KEY (`CC_DM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyconfigdateformatmaster`
--

LOCK TABLES `companyconfigdateformatmaster` WRITE;
/*!40000 ALTER TABLE `companyconfigdateformatmaster` DISABLE KEYS */;
INSERT INTO `companyconfigdateformatmaster` VALUES (1,'yyyy-MM-dd'),(2,'yyyy/MM/dd'),(3,'yyyy.MM.dd'),(4,'yyyyMMdd'),(5,'yy-MM-dd'),(6,'yy/MM/dd'),(7,'dd-MM-yyyy'),(8,'dd/MM/yyyy'),(9,'dd.MM.yyyy'),(10,'ddMMyyyy'),(11,'dd-MM-yy'),(12,'dd/MM/yy'),(13,'MM-dd-yyyy'),(14,'MM/dd/yyyy'),(15,'MM.dd.yyyy'),(16,'MMddyyyy'),(17,'MM-dd-yy'),(18,'MM/dd/yy');
/*!40000 ALTER TABLE `companyconfigdateformatmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyconfigeventtypemaster`
--

DROP TABLE IF EXISTS `companyconfigeventtypemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyconfigeventtypemaster` (
  `ET_ID` int NOT NULL AUTO_INCREMENT,
  `ET_CCID` int NOT NULL,
  `ET_EventTypeValue` varchar(255) NOT NULL,
  PRIMARY KEY (`ET_ID`),
  UNIQUE KEY `uq_eventtype` (`ET_CCID`,`ET_EventTypeValue`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyconfigeventtypemaster`
--

LOCK TABLES `companyconfigeventtypemaster` WRITE;
/*!40000 ALTER TABLE `companyconfigeventtypemaster` DISABLE KEYS */;
INSERT INTO `companyconfigeventtypemaster` VALUES (1,1,'1'),(2,1,'2'),(3,1,'4');
/*!40000 ALTER TABLE `companyconfigeventtypemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyconfiguration`
--

DROP TABLE IF EXISTS `companyconfiguration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyconfiguration` (
  `CC_ID` int NOT NULL AUTO_INCREMENT,
  `CC_CM_ID` int DEFAULT NULL,
  `CC_CMType` int DEFAULT NULL,
  `CC_IsMaximumUserDefined` int DEFAULT NULL,
  `CC_NoOfUser` int DEFAULT NULL,
  `CC_UserLimitExceedAction` int DEFAULT NULL,
  `CC_IsRSNLimitDefined` int DEFAULT NULL,
  `CC_NoOfRSN` int DEFAULT NULL,
  `CC_RSNLimitExceedAction` int DEFAULT NULL,
  `CC_PackingLevelForShipment` int DEFAULT NULL,
  `CC_RSNcutOffRequest` varchar(255) DEFAULT NULL,
  `CC_Maxplant` int DEFAULT NULL,
  `CC_Maxproduct` int DEFAULT NULL,
  `CC_CreatedBy` int DEFAULT NULL,
  `CC_CreatedTimestamp` datetime DEFAULT NULL,
  `CC_ModifiedBy` int DEFAULT NULL,
  `CC_ModifiedTimestamp` datetime DEFAULT NULL,
  `CC_Config_ID` int DEFAULT NULL,
  `CC_IsMappingBypassed` int DEFAULT '0',
  `CC_RSNRequestConf` int DEFAULT NULL,
  `CC_SSCCRequestConf` int DEFAULT NULL,
  `CC_CompanyLogo` varchar(255) DEFAULT NULL,
  `CC_DateFormat` int DEFAULT NULL,
  `CC_UserLimitNotified` int DEFAULT '0',
  `CC_IsMultipleSchemeApplicable` int DEFAULT '0',
  `CC_IsMultipleScheme` int DEFAULT NULL,
  `CC_ScanningMode` int DEFAULT NULL,
  PRIMARY KEY (`CC_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyconfiguration`
--

LOCK TABLES `companyconfiguration` WRITE;
/*!40000 ALTER TABLE `companyconfiguration` DISABLE KEYS */;
INSERT INTO `companyconfiguration` VALUES (1,1,3,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-01-07 16:18:14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,0,0,0,1);
/*!40000 ALTER TABLE `companyconfiguration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyfieldlabelconfiguration`
--

DROP TABLE IF EXISTS `companyfieldlabelconfiguration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyfieldlabelconfiguration` (
  `CFLC_ID` int NOT NULL AUTO_INCREMENT,
  `CFLC_CompanyID` int DEFAULT NULL,
  `CFLC_FieldID` int DEFAULT NULL,
  `CFLC_Order` int DEFAULT NULL,
  `CFLC_DisplayName` varchar(255) DEFAULT NULL,
  `CFLC_ModuleName` varchar(255) DEFAULT NULL,
  `CFLC_IsRequired` int DEFAULT NULL,
  `CFLC_CreatedBy` int DEFAULT NULL,
  `CFLC_CreatedTimestamp` datetime DEFAULT NULL,
  `CFLC_ModifiedBy` int DEFAULT NULL,
  `CFLC_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`CFLC_ID`),
  UNIQUE KEY `uq_field` (`CFLC_CompanyID`,`CFLC_FieldID`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyfieldlabelconfiguration`
--

LOCK TABLES `companyfieldlabelconfiguration` WRITE;
/*!40000 ALTER TABLE `companyfieldlabelconfiguration` DISABLE KEYS */;
INSERT INTO `companyfieldlabelconfiguration` VALUES (1,1,1,1,'Product Name','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(2,1,2,2,'Product Code','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(3,1,3,3,'Shelf Time (In Months)','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(4,1,4,4,'GTIN GCP','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(5,1,32,5,'Status','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(6,1,33,6,'T& T Regulatory','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(7,1,34,7,'RSN Serialization Template','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(8,1,35,8,'SSCC Serialization Template','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(9,1,5,1,'Packing Level','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(10,1,6,2,'GTIN','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(11,1,7,3,'PackSize','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(12,1,8,4,'PackUnit','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(13,1,9,5,'ChildPackQty','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(14,1,10,6,'ChildPackUnit','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(15,1,11,7,'Pack Style','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(16,1,12,8,'Label Name','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(17,1,13,9,'Mfg DateFormat','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(18,1,14,10,'Exp DateFormat','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(19,1,15,11,'GTIN URI Format','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(20,1,16,12,'Net Weight','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(21,1,17,13,'Gross Weight','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(22,1,18,14,'Weight Unit','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(23,1,36,15,'GS1 Encoding Format','Product Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(24,1,19,1,'Batch Name','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(25,1,20,2,'Batch Size','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(26,1,21,3,'Extra RSN','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(27,1,22,4,'PO Number','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(28,1,23,5,'Mfg Date','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(29,1,24,6,'Expiry Date','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(30,1,37,7,'Status','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(31,1,38,8,'Product Name','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(32,1,39,9,'Mapping Name','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(33,1,40,10,'Machine Name','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(34,1,43,11,'DM Expiry Format','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(35,1,25,1,'Packing Level','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(36,1,26,2,'GS1 Encoding Format','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(37,1,27,3,'Pack Size','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(38,1,28,4,'Loose Qty','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(39,1,29,5,'Label Name','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(40,1,30,6,'Mfg Format','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(41,1,31,7,'Exp Format','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(42,1,41,8,'Extra RSN','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(43,1,42,9,'Batch Size','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(44,1,44,10,'GTIN','Batch Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(45,1,45,1,'Mapping Name','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(46,1,46,2,'Product Name','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(47,1,47,3,'T & T Regulatory','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(48,1,48,4,'DM Expiry','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(49,1,49,5,'Status','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(50,1,50,6,'RSN Template','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(51,1,51,7,'SSCC Template','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(52,1,52,1,'Packing Level','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(53,1,53,2,'Packing Level Code','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(54,1,54,3,'GS1 Encoding Format','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(55,1,55,4,'Minimum Pool Count','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(56,1,56,5,'Maximum Pool Count','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(57,1,57,6,'GTIN','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(58,1,58,7,'Pack Size','Mapping Master',1,0,'2026-01-07 16:18:14',NULL,NULL),(59,1,59,1,'ChildPackQty','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(60,1,60,2,'ChildPackUnit','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(61,1,61,3,'PackStyle','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(62,1,62,4,'LabelName','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(63,1,63,5,'MfgDateFormat','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(64,1,64,6,'ExpDateFormat','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(65,1,65,7,'GTINURIFormat','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(66,1,66,8,'NetWeight','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(67,1,67,9,'GrossWeight','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(68,1,68,10,'WeightUnit','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(69,1,70,11,'Maximum RSN Request Count','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL),(70,1,69,1,'Generation Type','MappingMaster',1,0,'2026-01-07 16:18:14',NULL,NULL);
/*!40000 ALTER TABLE `companyfieldlabelconfiguration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companygroupmaster`
--

DROP TABLE IF EXISTS `companygroupmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companygroupmaster` (
  `CGM_ID` int NOT NULL AUTO_INCREMENT,
  `CGM_CompanyGroupCode` varchar(45) NOT NULL,
  `CGM_CompanyGroupName` varchar(45) NOT NULL,
  `CGM_CompanyGroupStatus` tinyint NOT NULL,
  `CGM_SuspendRemark` varchar(1000) DEFAULT NULL,
  `CGM_CreatedBy` varchar(45) DEFAULT NULL,
  `CGM_CreatedTimestamp` datetime DEFAULT NULL,
  `CGM_ModifiedBy` varchar(45) DEFAULT NULL,
  `CGM_ModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`CGM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master details of Company Group Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companygroupmaster`
--

LOCK TABLES `companygroupmaster` WRITE;
/*!40000 ALTER TABLE `companygroupmaster` DISABLE KEYS */;
INSERT INTO `companygroupmaster` VALUES (1,'BG01','Bhagwati Group Of Companies',1,NULL,'0','2026-01-07 16:16:15','0','2026-01-07 16:16:15');
/*!40000 ALTER TABLE `companygroupmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companyitpolicymaster`
--

DROP TABLE IF EXISTS `companyitpolicymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companyitpolicymaster` (
  `CITPM_PolicyID` int NOT NULL AUTO_INCREMENT,
  `CITPM_PolicyName` varchar(100) DEFAULT NULL,
  `CITPM_PolicyType` int DEFAULT NULL,
  `CITPM_Status` int DEFAULT NULL,
  `CITPM_SuspendRemark` varchar(1000) DEFAULT NULL,
  `CITPM_SessionTimeOut` int DEFAULT NULL,
  `CITPM_FailAttempt` int DEFAULT NULL,
  `CITPM_PwdNeverExpiry` int DEFAULT NULL,
  `CITPM_PwdChangeDuration` varchar(45) DEFAULT NULL,
  `CITPM_PwdNotificationDuration` varchar(45) DEFAULT NULL,
  `CITPM_CreatedBy` int DEFAULT NULL,
  `CITPM_CreatedDateTime` datetime DEFAULT NULL,
  `CITPM_ModifiedBy` int DEFAULT NULL,
  `CITPM_ModifiedDateTime` datetime DEFAULT NULL,
  `CITPM_CompanyID` int DEFAULT NULL,
  `CITPM_CompanyGrpID` int DEFAULT NULL,
  `CITPM_SCPID` int DEFAULT NULL,
  PRIMARY KEY (`CITPM_PolicyID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Company IT Policy Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companyitpolicymaster`
--

LOCK TABLES `companyitpolicymaster` WRITE;
/*!40000 ALTER TABLE `companyitpolicymaster` DISABLE KEYS */;
INSERT INTO `companyitpolicymaster` VALUES (26,'Bhiwandi_WH',3,1,NULL,60,10,1,NULL,NULL,31,'2026-01-20 04:48:37',31,'2026-01-20 04:48:37',19,15,38);
/*!40000 ALTER TABLE `companyitpolicymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companymaster`
--

DROP TABLE IF EXISTS `companymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companymaster` (
  `CM_ID` int NOT NULL AUTO_INCREMENT,
  `CM_CompanyCode` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CM_CompanyName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CM_CompanyGrpId` int NOT NULL,
  `CM_CompanyUrl` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'CM_CompanyUrl',
  `CM_Status` int DEFAULT NULL,
  `CM_SuspendRemark` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CM_CreatedBy` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CM_CreatedTimestamp` datetime DEFAULT NULL,
  `CM_ModifiedBy` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CM_ModifiedTimestamp` datetime DEFAULT NULL,
  `CM_TransmissionMode` int DEFAULT '3',
  PRIMARY KEY (`CM_ID`,`CM_CompanyGrpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='Master Details of Company Master	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companymaster`
--

LOCK TABLES `companymaster` WRITE;
/*!40000 ALTER TABLE `companymaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `companymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companymenumaster`
--

DROP TABLE IF EXISTS `companymenumaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companymenumaster` (
  `CMM_ID` int NOT NULL AUTO_INCREMENT,
  `CMM_CompanyMenuId` int DEFAULT NULL,
  `CMM_CompanyMenuName` varchar(255) DEFAULT NULL,
  `CMM_CompanyMenuIndex` int DEFAULT NULL,
  `CMM_CompanyApplicationType` int DEFAULT '1',
  `CMM_CompanyID` int DEFAULT NULL,
  `CMM_CreatedBy` int DEFAULT NULL,
  `CMM_CreatedTimestamp` datetime DEFAULT NULL,
  `CMM_status` int DEFAULT '1',
  PRIMARY KEY (`CMM_ID`),
  UNIQUE KEY `uq_menu` (`CMM_CompanyID`,`CMM_CompanyMenuId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companymenumaster`
--

LOCK TABLES `companymenumaster` WRITE;
/*!40000 ALTER TABLE `companymenumaster` DISABLE KEYS */;
INSERT INTO `companymenumaster` VALUES (1,1,'Master',1,1,1,0,'2026-01-07 16:18:14',1),(2,2,'Configuration',2,1,1,0,'2026-01-07 16:18:14',1),(3,3,'Order',3,1,1,0,'2026-01-07 16:18:14',1),(4,4,'Shipment',4,1,1,0,'2026-01-07 16:18:14',1),(5,6,'Reports',6,1,1,0,'2026-01-07 16:18:14',1);
/*!40000 ALTER TABLE `companymenumaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companypackinglevelmaster`
--

DROP TABLE IF EXISTS `companypackinglevelmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companypackinglevelmaster` (
  `CPLM_ID` int NOT NULL AUTO_INCREMENT,
  `CPLM_CompanyID` int DEFAULT NULL,
  `CPLM_PLM_ID` int DEFAULT NULL,
  `CPLM_Name` varchar(255) DEFAULT NULL,
  `CPLM_PackingLevelValue` int DEFAULT NULL,
  `CPLM_Status` int DEFAULT '1',
  PRIMARY KEY (`CPLM_ID`),
  UNIQUE KEY `uq_pack` (`CPLM_CompanyID`,`CPLM_PLM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companypackinglevelmaster`
--

LOCK TABLES `companypackinglevelmaster` WRITE;
/*!40000 ALTER TABLE `companypackinglevelmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `companypackinglevelmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companysubmenumaster`
--

DROP TABLE IF EXISTS `companysubmenumaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companysubmenumaster` (
  `CSM_ID` int NOT NULL AUTO_INCREMENT,
  `CSM_CompanySubmenuID` int DEFAULT NULL,
  `CSM_CompanySubmenuName` varchar(255) DEFAULT NULL,
  `CSM_Ischangable` int DEFAULT NULL,
  `CSM_CompanymenuIndex` int DEFAULT NULL,
  `CSM_CompanySubmenuIndex` int DEFAULT NULL,
  `CSM_CompanyID` int DEFAULT NULL,
  `CSM_CreatedBy` int DEFAULT NULL,
  `CSM_CreatedTimestamp` datetime DEFAULT NULL,
  `CSM_status` int DEFAULT '1',
  PRIMARY KEY (`CSM_ID`),
  UNIQUE KEY `uq_submenu` (`CSM_CompanyID`,`CSM_CompanymenuIndex`,`CSM_CompanySubmenuIndex`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companysubmenumaster`
--

LOCK TABLES `companysubmenumaster` WRITE;
/*!40000 ALTER TABLE `companysubmenumaster` DISABLE KEYS */;
INSERT INTO `companysubmenumaster` VALUES (1,4,'Company IT Policy Master',1,1,3,1,0,'2026-01-07 16:18:14',1),(2,6,'Group Master',1,1,4,1,0,'2026-01-07 16:18:14',1),(3,8,'User Master',1,1,5,1,0,'2026-01-07 16:18:14',1),(4,9,'SCP Master',1,1,6,1,0,'2026-01-07 16:18:14',1),(5,10,'Logistic Party Master',1,1,7,1,0,'2026-01-07 16:18:14',1),(6,11,'Routing Master',1,1,8,1,0,'2026-01-07 16:18:14',1),(7,37,'Shipment Report',1,6,7,1,0,'2026-01-07 16:18:14',1),(8,22,'Message Configuration',0,2,3,1,0,'2026-01-07 16:18:14',1),(9,24,'Order Master (by Sales Officer)',0,3,2,1,0,'2026-01-07 16:18:14',1),(10,45,'Scheme Master',0,1,17,1,0,'2026-01-07 16:18:14',1),(11,25,'Shipment Master',1,4,1,1,0,'2026-01-07 16:18:14',1),(12,35,'Inventory Report',0,6,5,1,0,'2026-01-07 16:18:14',1),(13,36,'Order Report',0,6,6,1,0,'2026-01-07 16:18:14',1);
/*!40000 ALTER TABLE `companysubmenumaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countryskumapping`
--

DROP TABLE IF EXISTS `countryskumapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countryskumapping` (
  `CSM_ID` int NOT NULL AUTO_INCREMENT,
  `CSM_SKU_ID` int NOT NULL,
  `CSM_RM_CountryID` int NOT NULL,
  `CSM_SKU_SortBy` int DEFAULT NULL,
  PRIMARY KEY (`CSM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countryskumapping`
--

LOCK TABLES `countryskumapping` WRITE;
/*!40000 ALTER TABLE `countryskumapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `countryskumapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `datatemplatemaster`
--

DROP TABLE IF EXISTS `datatemplatemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `datatemplatemaster` (
  `DTTM_DataTemplateID` int NOT NULL AUTO_INCREMENT,
  `DTTM_DataTemplateName` varchar(45) DEFAULT NULL,
  `DTTM_NoOfParameter` varchar(45) DEFAULT NULL,
  `DTTM_ParameterType` varchar(45) DEFAULT NULL,
  `DTTM_Separator` varchar(45) DEFAULT NULL,
  `DTTM_ParameterData` longtext,
  `DTTM_CreatedBy` int DEFAULT NULL,
  `DTTM_CreatedTimestamp` datetime DEFAULT NULL,
  `DTTM_LastModifiedBy` int DEFAULT NULL,
  `DTTM_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`DTTM_DataTemplateID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Data Template Master for Additional Product Characteristics';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `datatemplatemaster`
--

LOCK TABLES `datatemplatemaster` WRITE;
/*!40000 ALTER TABLE `datatemplatemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `datatemplatemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dateformatmaster`
--

DROP TABLE IF EXISTS `dateformatmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dateformatmaster` (
  `DM_ID` int NOT NULL AUTO_INCREMENT,
  `DM_DateFormat` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `DM_Caps` tinyint(1) NOT NULL,
  `DM_Status` int DEFAULT NULL,
  `DM_Preview` text,
  `DM_SuspendRemark` varchar(1000) DEFAULT NULL,
  `DM_CompanyID` int DEFAULT '0',
  PRIMARY KEY (`DM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dateformatmaster`
--

LOCK TABLES `dateformatmaster` WRITE;
/*!40000 ALTER TABLE `dateformatmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `dateformatmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dbversion`
--

DROP TABLE IF EXISTS `dbversion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dbversion` (
  `DBName` varchar(255) DEFAULT NULL,
  `Version` varchar(255) DEFAULT NULL,
  `Pwd` varchar(255) DEFAULT NULL,
  `RSNDBName` varchar(255) DEFAULT NULL,
  `InstantCheckServiceTimerAlive` bit(1) DEFAULT NULL,
  `ID` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `DBName` (`DBName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dbversion`
--

LOCK TABLES `dbversion` WRITE;
/*!40000 ALTER TABLE `dbversion` DISABLE KEYS */;
/*!40000 ALTER TABLE `dbversion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dbversionhistory`
--

DROP TABLE IF EXISTS `dbversionhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dbversionhistory` (
  `Name` varchar(100) DEFAULT NULL,
  `Owner` varchar(100) DEFAULT NULL,
  `Type` varchar(120) DEFAULT NULL,
  `created_datetime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dbversionhistory`
--

LOCK TABLES `dbversionhistory` WRITE;
/*!40000 ALTER TABLE `dbversionhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `dbversionhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliverychallanlist`
--

DROP TABLE IF EXISTS `deliverychallanlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverychallanlist` (
  `dcl_ID` int NOT NULL AUTO_INCREMENT,
  `dcl_shipmentID` int DEFAULT NULL,
  `dcl_InvoiceNumber` varchar(45) DEFAULT NULL,
  `dcl_DeliveryNo` varchar(45) DEFAULT NULL,
  `dcl_scpfrom` int DEFAULT NULL,
  `dcl_scpto` int DEFAULT NULL,
  `dcl_companygrpid` int DEFAULT NULL,
  `dcl_companyid` int DEFAULT NULL,
  `dcl_createdTimestamp` datetime DEFAULT NULL,
  `dcl_createdby` varchar(45) DEFAULT NULL,
  `dcl_modifiedTimestamp` datetime DEFAULT NULL,
  `dcl_modifiedby` varchar(45) DEFAULT NULL,
  `dcl_status` int DEFAULT NULL,
  `dcl_ShipmentType` int DEFAULT NULL,
  `dcl_IsInwardEmailSent` int DEFAULT '0',
  `dcl_IsInwardTelegramMsgSent` int DEFAULT '0',
  PRIMARY KEY (`dcl_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverychallanlist`
--

LOCK TABLES `deliverychallanlist` WRITE;
/*!40000 ALTER TABLE `deliverychallanlist` DISABLE KEYS */;
INSERT INTO `deliverychallanlist` VALUES (18,18,NULL,'DEL_BW_1_1',38,36,15,19,'2026-01-20 06:00:38','33',NULL,NULL,1,1,0,0),(19,19,NULL,'DEL_BW_2_1',38,36,15,19,'2026-01-20 07:21:35','33',NULL,NULL,1,1,0,0);
/*!40000 ALTER TABLE `deliverychallanlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliverychallanmaster`
--

DROP TABLE IF EXISTS `deliverychallanmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverychallanmaster` (
  `dcm_ID` int NOT NULL AUTO_INCREMENT,
  `dcm_dclID` int NOT NULL,
  `dcm_productCode` varchar(45) DEFAULT NULL,
  `dcm_qty` double DEFAULT NULL,
  `dcm_productname` varchar(45) DEFAULT NULL,
  `dcm_createdtimestamp` datetime DEFAULT NULL,
  `dcm_craetedby` int DEFAULT NULL,
  PRIMARY KEY (`dcm_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverychallanmaster`
--

LOCK TABLES `deliverychallanmaster` WRITE;
/*!40000 ALTER TABLE `deliverychallanmaster` DISABLE KEYS */;
INSERT INTO `deliverychallanmaster` VALUES (1,1,'12345',2,'PRODUCT1','2026-01-12 08:42:35',2),(2,2,'12345',4,'PRODUCT1','2026-01-12 10:55:20',2),(3,3,'P0001',5,'Product 01','2026-01-16 05:49:59',2),(4,4,'P10',7,'Product10','2026-01-16 10:03:00',2),(5,5,'P11',7,'PRODUCT11','2026-01-16 10:58:40',2),(6,6,'P0001',1,'Product 01','2026-01-16 12:06:45',2),(7,7,'Trail Demo01',2,'Trail Demo','2026-01-17 06:09:46',2),(8,8,'D010',3,'kemcho papad','2026-01-17 09:05:52',2),(9,9,'TESTING02',4,'TESTING02','2026-01-19 04:55:25',2),(10,10,'GP 400',1,'GARLIC PAPAD 400 X 20 GM','2026-01-19 05:46:00',2),(11,11,'890566466464',5,'KEM CHHO GARLIC PAPAD','2026-01-19 06:11:47',2),(12,12,'GP 400',1,'GARLIC PAPAD 400 X 20 GM','2026-01-19 06:36:41',2),(13,13,'GP 400',1,'GARLIC PAPAD 400 X 20 GM','2026-01-19 06:38:56',2),(14,14,'J01',4,'JALARAM PAPAD','2026-01-19 06:49:48',2),(15,15,'SAPL001',7,'PUNJABI MASALA','2026-01-19 09:27:11',2),(16,16,'IND001',6,'CHURMUR PAPAD','2026-01-19 12:01:13',2),(17,17,'GP 400',10,'GARLIC PAPAD 400 X 20 GM','2026-01-20 05:02:42',2),(18,18,'DM01',4,'DOBULE MARI PAPAD 400 GM','2026-01-20 06:00:38',33),(19,19,'DM01',1,'DOBULE MARI PAPAD 400 GM','2026-01-20 07:21:35',33);
/*!40000 ALTER TABLE `deliverychallanmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devicemaster`
--

DROP TABLE IF EXISTS `devicemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devicemaster` (
  `DVM_ID` int NOT NULL AUTO_INCREMENT,
  `DVM_Name` varchar(45) DEFAULT NULL,
  `DVM_SerialNumber` varchar(45) DEFAULT NULL,
  `DVM_Identity` varchar(45) DEFAULT NULL,
  `DVM_CompanyCode` varchar(45) DEFAULT NULL,
  `DVM_SCPCode` varchar(45) DEFAULT NULL,
  `DVM_PhoneNumber` varchar(20) DEFAULT NULL,
  `DVM_IsScanner` int DEFAULT NULL,
  `DVM_TransactionFile` varchar(45) DEFAULT NULL,
  `DVM_Status` tinyint DEFAULT NULL,
  `DVM_CompanyID` int DEFAULT NULL,
  `DVM_CompanyGrpID` int DEFAULT NULL,
  `DVM_CreatedBy` int DEFAULT NULL,
  `DVM_CreatedTimeStamp` datetime DEFAULT NULL,
  `DVM_ModifiedBy` int DEFAULT NULL,
  `DVM_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`DVM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master Details for Mobile Device';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devicemaster`
--

LOCK TABLES `devicemaster` WRITE;
/*!40000 ALTER TABLE `devicemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `devicemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emaileventmaster`
--

DROP TABLE IF EXISTS `emaileventmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emaileventmaster` (
  `EEVM_EmailEventId` int NOT NULL AUTO_INCREMENT,
  `EEVM_EventName` text,
  `EEVM_SortBy` int DEFAULT NULL,
  `EEVM_Status` int DEFAULT NULL,
  `EEVM_CompanyGrpID` int DEFAULT NULL,
  `EEVM_CompanyID` int DEFAULT NULL,
  `EEVM_RightType` int DEFAULT '0',
  PRIMARY KEY (`EEVM_EmailEventId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emaileventmaster`
--

LOCK TABLES `emaileventmaster` WRITE;
/*!40000 ALTER TABLE `emaileventmaster` DISABLE KEYS */;
INSERT INTO `emaileventmaster` VALUES (1,'Order',NULL,1,NULL,NULL,3),(2,'Shipment',NULL,1,NULL,NULL,3),(3,'Shipment Return',NULL,1,NULL,NULL,3),(4,'Scheme',NULL,1,NULL,NULL,3),(5,'Batch',NULL,1,NULL,NULL,2);
/*!40000 ALTER TABLE `emaileventmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emailkeywords`
--

DROP TABLE IF EXISTS `emailkeywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailkeywords` (
  `EMKW_KWID` int NOT NULL AUTO_INCREMENT,
  `EMKW_EmailEventId` int DEFAULT NULL,
  `EMKW_FindValue` text,
  `EMKW_TagName` text,
  `EMKW_Status` int DEFAULT NULL,
  `EMKW_CompanyGrpID` int DEFAULT NULL,
  `EMKW_CompanyID` int DEFAULT NULL,
  PRIMARY KEY (`EMKW_KWID`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emailkeywords`
--

LOCK TABLES `emailkeywords` WRITE;
/*!40000 ALTER TABLE `emailkeywords` DISABLE KEYS */;
INSERT INTO `emailkeywords` VALUES (1,1,'Order Number','<<Order Number>>',1,NULL,NULL),(3,1,'Order Type','<<Order Type>>',1,NULL,NULL),(4,2,'Shipment Code','<<Shipment Code>>',1,NULL,NULL),(6,2,'Logistic Party Name','<<Logistic Party Name>>',1,NULL,NULL),(7,2,'Vehicle Number','<<Vehicle Number>>',1,NULL,NULL),(8,1,'Order Date','<<Order Date>>',1,NULL,NULL),(9,1,'From Scp Name','<<From Scp Name>>',1,NULL,NULL),(10,2,'Shipment Type','<<Shipment Type>>',1,NULL,NULL),(11,2,'Shipment Date','<<Shipment Date>>',1,NULL,NULL),(12,1,'To Scp Name','<<To Scp Name>>',1,NULL,NULL),(13,2,'Route Name','<<Route Name>>',1,NULL,NULL),(14,2,'From','<<From>>',1,NULL,NULL),(15,2,'To','<<To>>',1,NULL,NULL),(16,3,'Shipment Return Code','<<Shipment Return Code>>',1,NULL,NULL),(17,3,'Logistic Party Name','<<Logistic Party Name>>',1,NULL,NULL),(18,3,'Vehicle Number','<<Vehicle Number>>',1,NULL,NULL),(19,3,'Shipment Type','<<Shipment Type>>',1,NULL,NULL),(20,3,'Shipment Date','<<Shipment Date>>',1,NULL,NULL),(21,3,'From','<<From>>',1,NULL,NULL),(22,3,'To','<<To>>',1,NULL,NULL),(23,3,'Shipment_Return_Reason','<<Shipment Return Reason>>',1,NULL,NULL),(24,2,'Delivery Number','<<Delivery Number>>',1,NULL,NULL),(25,3,'Delivery Number ','<<Delivery Number>>',1,NULL,NULL),(26,4,'Scheme Name','<Scheme Name>>',1,NULL,NULL),(27,4,'Start Date','<<Start Date>>',1,NULL,NULL),(28,4,'End Date','<<End Date>>',1,NULL,NULL);
/*!40000 ALTER TABLE `emailkeywords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emailsettings`
--

DROP TABLE IF EXISTS `emailsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailsettings` (
  `EMLS_EmailSettingId` int NOT NULL AUTO_INCREMENT,
  `EMLS_FromEmail` varchar(500) DEFAULT NULL,
  `EMLS_UserName` varchar(500) DEFAULT NULL,
  `EMLS_Password` text,
  `EMLS_SMTPHost` text,
  `EMLS_Port` varchar(50) DEFAULT NULL,
  `EMLS_EnableSSL` int DEFAULT NULL,
  `EMLS_Status` int DEFAULT NULL,
  `EMLS_CompanyGrpID` int NOT NULL,
  `EMLS_CompanyID` int NOT NULL,
  PRIMARY KEY (`EMLS_EmailSettingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emailsettings`
--

LOCK TABLES `emailsettings` WRITE;
/*!40000 ALTER TABLE `emailsettings` DISABLE KEYS */;
/*!40000 ALTER TABLE `emailsettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emailtemplatemaster`
--

DROP TABLE IF EXISTS `emailtemplatemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailtemplatemaster` (
  `EMTPL_EmailTemplateId` int NOT NULL AUTO_INCREMENT,
  `EMTPL_EmailEventId` int DEFAULT NULL,
  `EMTPL_TransmissionID` int DEFAULT NULL,
  `EMTPL_ToEmailList` text,
  `EMTPL_Subject` varchar(100) DEFAULT NULL,
  `EMTPL_Body` text,
  `EMTPL_Status` int DEFAULT NULL,
  `EMTPL_DelRemark` varchar(1000) DEFAULT NULL,
  `EMTPL_CompanyGrpID` int DEFAULT NULL,
  `EMTPL_CompanyID` int DEFAULT NULL,
  `EMTPL_FROMSCPID` int DEFAULT NULL,
  `EMTPL_TOSCPID` int DEFAULT NULL,
  `EMPTL_TemplateDetails` json DEFAULT NULL,
  `EMTPL_CreatedBy` varchar(45) DEFAULT NULL,
  `EMTPL_CreatedTimestamp` datetime DEFAULT NULL,
  `EMTPL_ModifiedBy` varchar(45) DEFAULT NULL,
  `EMTPL_ModifiedTimestamp` datetime DEFAULT NULL,
  `EMTPL_SHPTTYPE` int DEFAULT NULL,
  PRIMARY KEY (`EMTPL_EmailTemplateId`),
  KEY `EMTPL_EmailEventId_idx` (`EMTPL_EmailEventId`),
  CONSTRAINT `EMTPL_EmailEventId` FOREIGN KEY (`EMTPL_EmailEventId`) REFERENCES `emaileventmaster` (`EEVM_EmailEventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emailtemplatemaster`
--

LOCK TABLES `emailtemplatemaster` WRITE;
/*!40000 ALTER TABLE `emailtemplatemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `emailtemplatemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emailtemplateuserlist`
--

DROP TABLE IF EXISTS `emailtemplateuserlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailtemplateuserlist` (
  `ETUL_ID` int NOT NULL AUTO_INCREMENT,
  `ETUL_MID` int DEFAULT NULL,
  `ETUL_UserID` text,
  PRIMARY KEY (`ETUL_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emailtemplateuserlist`
--

LOCK TABLES `emailtemplateuserlist` WRITE;
/*!40000 ALTER TABLE `emailtemplateuserlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `emailtemplateuserlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enummaster`
--

DROP TABLE IF EXISTS `enummaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enummaster` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `EnumType` varchar(45) DEFAULT NULL,
  `EnumVal` int DEFAULT NULL,
  `Description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=175 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Default Entries';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enummaster`
--

LOCK TABLES `enummaster` WRITE;
/*!40000 ALTER TABLE `enummaster` DISABLE KEYS */;
INSERT INTO `enummaster` VALUES (29,'ScanningMode',1,'Vendor'),(30,'ScanningMode',2,'Product'),(31,'Shipment',1,'Created'),(32,'Shipment',2,'Approved'),(33,'Shipment',3,'Reject'),(34,'Shipment',4,'Picking'),(35,'Shipment',5,'Loading'),(36,'Shipment',6,'Scanning'),(37,'Shipment',7,'Delievery'),(38,'Shipment',8,'InTransit'),(39,'Shipment',9,'Recieved'),(40,'Shipment',10,'Pending'),(41,'Shipment',11,'Completed'),(46,'RSNEvent',21,'Scanned'),(47,'RSNEvent',22,'In Transit'),(48,'RSNEvent',1,'Allocate'),(49,'RSNEvent',2,'Commission'),(50,'RSNEvent',3,'Aggregate'),(51,'RSNEvent',4,'Failed'),(52,'RSNEvent',5,'Sample'),(53,'RSNEvent',6,'Shipment'),(54,'RSNEvent',7,'Receipt'),(55,'RSNEvent',8,'Disaggregate'),(56,'RSNEvent',9,'Decommision'),(57,'OrderType',1,'New Order'),(58,'OrderType',2,'Sampling'),(60,'DeliveryChallan',1,'Creation'),(61,'DeliveryChallan',2,'Completion'),(69,'AuditType',1,'Log in/Log out'),(70,'AuditType',2,'companygroupmaster'),(71,'AuditType',3,'companyitpolicymaster'),(72,'AuditType',4,'companymaster'),(73,'AuditType',5,'groupmaster'),(74,'AuditType',6,'locationmaster'),(75,'AuditType',7,'logisticcompanymaster'),(76,'AuditType',8,'scpmaster'),(77,'AuditType',9,'Dashboard'),(78,'AuditType',10,'usermaster'),(80,'AuditType',13,'routemaster'),(81,'AuditType',14,'scpconfiguration'),(82,'AuditType',11,'OrderMaster'),(83,'EmailEvent',1,'Order'),(84,'EmailEvent',2,'Shipment'),(102,'ShipmentReturnReason',1,'Defective Product'),(103,'ShipmentReturnReason',2,'Wrong Item Recieved'),(104,'ShipmentReturnReason',3,'Placed Order Mistakenly'),(105,'ShipmentReturnReason',4,'Received Late'),(106,'ShipmentReturnReason',5,'Quality Issues'),(107,'ShipmentReturnReason',6,'Others'),(108,'Order',1,'Created'),(109,'Order',2,'Approved'),(110,'Order',3,'Rejected'),(111,'Order',4,'Shipment'),(112,'Order',5,'Goods Receipt'),(113,'Order',6,'Completed'),(114,'Order',7,'Closed'),(115,'Status',0,'Active'),(116,'Status',1,'Inactive'),(117,'UserType',1,'CompanyAdmin'),(118,'AuditType',15,'Email Configuration'),(120,'UserLimitExhaust',2,'Notification'),(121,'UserLimitExhaust',3,'Stop User Creation'),(123,'RSNLimitExhaust',2,'Notification'),(124,'RSNLimitExhaust',3,'Stop Generation'),(125,'CompanyType',1,'Both'),(126,'CompanyType',2,'Production'),(127,'CompanyType',3,'SCP'),(128,'RequestConfigure',1,'Company Wise'),(129,'RequestConfigure',2,'Plant Wise'),(130,'SerializationTemplateCode',1,'GS1'),(131,'SerializationTemplateCode',2,'Non-GS1'),(132,'Generation Type',1,'Product Wise Unique'),(133,'Generation Type',2,'Product-Level Wise Unique'),(134,'RSNStructure1',1,'Product MID'),(135,'RSNStructure',2,'Product Code'),(136,'RSNStructure',3,'Product Level ID'),(137,'RSNStructure',4,'Day Index'),(138,'RSNStructure',5,'Plant Code'),(139,'RSNAllowedchar',1,'Numerics'),(140,'RSNAllowedchar',2,'Uppercase alphabets'),(141,'RSNAllowedchar',3,'Lowercase alphabets'),(142,'SSCC Reuse',1,'No Reuse'),(143,'SSCC Reuse',2,'UnUsed SSCC'),(144,'RSNStructure',6,'Year Index'),(145,'RSNStructure',7,'Serial Number'),(146,'SerializationTemplateType',1,'RSN'),(147,'SerializationTemplateType',2,'SSCC'),(148,'Country',1,'Canada'),(149,'Country',1,'Chile'),(150,'Country',1,'Colombia'),(151,'MonthFormat',1,'General'),(152,'MonthFormat',2,'Custom'),(153,'Country',1,'Canada'),(154,'Country',2,'Chile'),(155,'Country',3,'Colombia'),(156,'MonthFormat',1,'General'),(157,'MonthFormat',2,'Custom'),(158,'Type',1,'Administrator'),(160,'Type',3,'SCP'),(161,'Block Name',1,''),(162,'Block Name',2,'Solid'),(163,'Block Name',3,'Capsule'),(165,'AuditType',16,'Reset'),(171,'TransmissionMode',1,'Email'),(172,'TransmissionMode',2,'Telegram'),(173,'Shipment',12,'Suspend'),(174,'ScanningMode',3,'Both');
/*!40000 ALTER TABLE `enummaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `errorlogmaster`
--

DROP TABLE IF EXISTS `errorlogmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `errorlogmaster` (
  `ERLM_ErrorID` int NOT NULL AUTO_INCREMENT,
  `ERLM_ErrorMessage` mediumtext,
  `ERLM_DatetimeCreated` datetime DEFAULT NULL,
  `ERLM_SPName` varchar(255) DEFAULT NULL,
  `ERLM_Query` longtext,
  `ERLM_FunctionName` varchar(45) DEFAULT NULL,
  `ERLM_UserID` int DEFAULT NULL,
  `ERLM_ParameterValue` mediumtext,
  `ERLM_CompanyGrpId` int DEFAULT NULL,
  `ERLM_CompanyID` int DEFAULT NULL,
  PRIMARY KEY (`ERLM_ErrorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Error log Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `errorlogmaster`
--

LOCK TABLES `errorlogmaster` WRITE;
/*!40000 ALTER TABLE `errorlogmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `errorlogmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fieldmaster`
--

DROP TABLE IF EXISTS `fieldmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fieldmaster` (
  `FieldID` int NOT NULL AUTO_INCREMENT,
  `FieldName` varchar(255) DEFAULT NULL,
  `ModuleName` varchar(255) DEFAULT NULL,
  `IsMasterField` int DEFAULT NULL,
  PRIMARY KEY (`FieldID`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fieldmaster`
--

LOCK TABLES `fieldmaster` WRITE;
/*!40000 ALTER TABLE `fieldmaster` DISABLE KEYS */;
INSERT INTO `fieldmaster` VALUES (1,'Product Name','Product Master',0),(2,'Product Code','Product Master',0),(3,'Shelf Time (In Months)','Product Master',0),(4,'GTIN GCP','Product Master',0),(5,'Packing Level','Product Master',1),(6,'GTIN','Product Master',1),(7,'PackSize','Product Master',1),(8,'PackUnit','Product Master',1),(9,'ChildPackQty','Product Master',1),(10,'ChildPackUnit','Product Master',1),(11,'Pack Style','Product Master',1),(12,'Label Name','Product Master',1),(13,'Mfg DateFormat','Product Master',1),(14,'Exp DateFormat','Product Master',1),(15,'GTIN URI Format','Product Master',1),(16,'Net Weight','Product Master',1),(17,'Gross Weight','Product Master',1),(18,'Weight Unit','Product Master',1),(19,'Batch Name','Batch Master',0),(20,'Batch Size','Batch Master',0),(21,'Extra RSN','Batch Master',0),(22,'PO Number','Batch Master',0),(23,'Mfg Date','Batch Master',0),(24,'Expiry Date','Batch Master',0),(25,'Packing Level','Batch Master',1),(26,'GS1 Encoding Format','Batch Master',1),(27,'Pack Size','Batch Master',1),(28,'Loose Qty','Batch Master',1),(29,'Label Name','Batch Master',1),(30,'Mfg Format','Batch Master',1),(31,'Exp Format','Batch Master',1),(32,'Status','Product Master',0),(33,'T& T Regulatory','Product Master',0),(34,'RSN Serialization Template','Product Master',0),(35,'SSCC Serialization Template','Product Master',0),(36,'GS1 Encoding Format','Product Master',1),(37,'Status','Batch Master',0),(38,'Product Name','Batch Master',0),(39,'Mapping Name','Batch Master',0),(40,'Machine Name','Batch Master',0),(41,'Extra RSN','Batch Master',1),(42,'Batch Size','Batch Master',1),(43,'DM Expiry Format','Batch Master',0),(44,'GTIN','Batch Master',1),(45,'Mapping Name','Mapping Master',0),(46,'Product Name','Mapping Master',0),(47,'T & T Regulatory','Mapping Master',0),(48,'DM Expiry','Mapping Master',0),(49,'Status','Mapping Master',0),(50,'RSN Template','Mapping Master',0),(51,'SSCC Template','Mapping Master',0),(52,'Packing Level','Mapping Master',1),(53,'Packing Level Code','Mapping Master',1),(54,'GS1 Encoding Format','Mapping Master',1),(55,'Minimum Pool Count','Mapping Master',1),(56,'Maximum Pool Count','Mapping Master',1),(57,'GTIN','Mapping Master',1),(58,'Pack Size','Mapping Master',1),(59,'ChildPackQty','MappingMaster',1),(60,'ChildPackUnit','MappingMaster',1),(61,'PackStyle','MappingMaster',1),(62,'LabelName','MappingMaster',1),(63,'MfgDateFormat','MappingMaster',1),(64,'ExpDateFormat','MappingMaster',1),(65,'GTINURIFormat','MappingMaster',1),(66,'NetWeight','MappingMaster',1),(67,'GrossWeight','MappingMaster',1),(68,'WeightUnit','MappingMaster',1),(69,'Generation Type','MappingMaster',0),(70,'Maximum RSN Request Count','MappingMaster',1);
/*!40000 ALTER TABLE `fieldmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `globalcompanymaster`
--

DROP TABLE IF EXISTS `globalcompanymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `globalcompanymaster` (
  `GCM_ID` int NOT NULL AUTO_INCREMENT,
  `GCM_Name` varchar(45) DEFAULT NULL,
  `GCM_Code` varchar(45) DEFAULT NULL,
  `GCM_ExtensionDigit` varchar(50) DEFAULT NULL,
  `GCM_CompanyPrefix` varchar(50) DEFAULT NULL,
  `GCM_LastIncrementalSSCC` varchar(50) DEFAULT NULL,
  `GCM_MaximumSSCCNumber` varchar(50) DEFAULT NULL,
  `GCM_Status` int DEFAULT NULL,
  `GCM_CompanyID` int DEFAULT NULL,
  `GCM_CompanyGrpID` int DEFAULT NULL,
  `GCM_CreatedBy` int DEFAULT NULL,
  `GCM_CreatedTimestamp` datetime DEFAULT NULL,
  `GCM_ModifiedBy` int DEFAULT NULL,
  `GCM_ModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`GCM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `globalcompanymaster`
--

LOCK TABLES `globalcompanymaster` WRITE;
/*!40000 ALTER TABLE `globalcompanymaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `globalcompanymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groupmaster`
--

DROP TABLE IF EXISTS `groupmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groupmaster` (
  `GRPM_GroupId` int NOT NULL AUTO_INCREMENT,
  `GRPM_GroupName` varchar(45) DEFAULT NULL,
  `GRPM_GroupType` int DEFAULT NULL,
  `GRPM_ITPolicyId` int NOT NULL,
  `GRPM_GroupStatus` tinyint DEFAULT NULL,
  `GRPM_CompanyGrpId` int DEFAULT NULL,
  `GRPM_CompanyID` int DEFAULT NULL,
  `GRPM_CreatedBy` varchar(45) DEFAULT NULL,
  `GRPM_CreatedTimestamp` datetime DEFAULT NULL,
  `GRPM_ModifiedBy` varchar(45) DEFAULT NULL,
  `GRPM_ModifiedTimestamp` datetime DEFAULT NULL,
  `GRPM_MachineType` varchar(45) DEFAULT NULL,
  `GRPM_SCPID` int DEFAULT NULL,
  PRIMARY KEY (`GRPM_GroupId`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Group Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groupmaster`
--

LOCK TABLES `groupmaster` WRITE;
/*!40000 ALTER TABLE `groupmaster` DISABLE KEYS */;
INSERT INTO `groupmaster` VALUES (27,'Bhiwandi_WH',3,26,1,15,19,'31','2026-01-20 04:48:58',NULL,NULL,NULL,38);
/*!40000 ALTER TABLE `groupmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grouproleinfo`
--

DROP TABLE IF EXISTS `grouproleinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grouproleinfo` (
  `gri_ID` int NOT NULL AUTO_INCREMENT,
  `gri_GroupID` int DEFAULT NULL,
  `gri_AppID` int DEFAULT NULL,
  `gri_RoleData` int DEFAULT NULL,
  PRIMARY KEY (`gri_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grouproleinfo`
--

LOCK TABLES `grouproleinfo` WRITE;
/*!40000 ALTER TABLE `grouproleinfo` DISABLE KEYS */;
INSERT INTO `grouproleinfo` VALUES (2,1,3,1),(14,3,3,1),(16,4,3,1),(18,2,3,1),(20,6,3,1),(22,7,3,1),(24,8,3,1),(28,9,3,1),(30,11,3,1),(32,13,3,1),(35,15,3,1),(38,14,3,1),(40,16,3,1),(43,22,3,1),(59,23,3,1),(61,26,3,1),(63,27,3,1);
/*!40000 ALTER TABLE `grouproleinfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heterobatchmaster`
--

DROP TABLE IF EXISTS `heterobatchmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heterobatchmaster` (
  `HBM_ID` int NOT NULL AUTO_INCREMENT,
  `HBM_ChildBatchID` varchar(45) DEFAULT NULL,
  `HBM_ParentBatchID` varchar(45) DEFAULT NULL,
  `HBM_ParentBatchMastID` varchar(45) DEFAULT NULL,
  `HBM_BatchSize` varchar(45) DEFAULT NULL,
  `HBM_PackingLevelID` varchar(45) DEFAULT NULL,
  `HBM_CreatedBy` varchar(45) DEFAULT NULL,
  `HBM_CreatedTimestamp` datetime DEFAULT NULL,
  `HBM_LastModifiedBy` varchar(45) DEFAULT NULL,
  `HBM_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`HBM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hetero Batch Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heterobatchmaster`
--

LOCK TABLES `heterobatchmaster` WRITE;
/*!40000 ALTER TABLE `heterobatchmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `heterobatchmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heteroparentchild`
--

DROP TABLE IF EXISTS `heteroparentchild`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heteroparentchild` (
  `HPC_ID` int NOT NULL,
  `HPC_ParentProductID` varchar(45) DEFAULT NULL,
  `HPC_ChildProductID` varchar(45) DEFAULT NULL,
  `HPC_ChildProductMID` varchar(45) DEFAULT NULL,
  `HPC_QTY` varchar(45) DEFAULT NULL,
  `HPC_CreatedBy` varchar(45) DEFAULT NULL,
  `HPC_CreatedTimestamp` datetime DEFAULT NULL,
  `HPC_LastModifiedBy` varchar(45) DEFAULT NULL,
  `HPC_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`HPC_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='		';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heteroparentchild`
--

LOCK TABLES `heteroparentchild` WRITE;
/*!40000 ALTER TABLE `heteroparentchild` DISABLE KEYS */;
/*!40000 ALTER TABLE `heteroparentchild` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heteroproductlist`
--

DROP TABLE IF EXISTS `heteroproductlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heteroproductlist` (
  `HPL_ProductId` int NOT NULL,
  `HPL_ProductName` varchar(45) DEFAULT NULL,
  `HPL_GenericName` varchar(45) DEFAULT NULL,
  `HPL_ProductDescription` varchar(45) DEFAULT NULL,
  `HPL_ShelfLife` varchar(45) DEFAULT NULL,
  `HPL_ProductSatus` varchar(45) DEFAULT NULL,
  `HPL_ProductFGCode` varchar(45) DEFAULT NULL,
  `HPL_ProductStrength` varchar(45) DEFAULT NULL,
  `HPL_ProductStatus` varchar(45) DEFAULT NULL,
  `HPL_DmExpiry` varchar(45) DEFAULT NULL,
  `HPL_T&TRegulartory` varchar(45) DEFAULT NULL,
  `HPL_GenerationType` varchar(45) DEFAULT NULL,
  `HPL_ReportingPartyId` varchar(45) DEFAULT NULL,
  `HPL_CompanyID` varchar(45) DEFAULT NULL,
  `HPL_CompanyGrpID` varchar(45) DEFAULT NULL,
  `HPL_SuspendRemark` varchar(45) DEFAULT NULL,
  `HPL_ProductListDataTemplateID` varchar(45) DEFAULT NULL,
  `HPL_ProductListDataTemplateData` varchar(45) DEFAULT NULL,
  `HPL_CreatedBy` varchar(45) DEFAULT NULL,
  `HPL_CreatedTimestamp` datetime DEFAULT NULL,
  `HPL_LastModifiedBy` varchar(45) DEFAULT NULL,
  `HPL_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`HPL_ProductId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Heteri Product List';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heteroproductlist`
--

LOCK TABLES `heteroproductlist` WRITE;
/*!40000 ALTER TABLE `heteroproductlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `heteroproductlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heteroproductmaster`
--

DROP TABLE IF EXISTS `heteroproductmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heteroproductmaster` (
  `HPM_ProductMID` int NOT NULL AUTO_INCREMENT,
  `HPM_ProductId` int NOT NULL,
  `HPM_PackingLevel` varchar(45) DEFAULT NULL,
  `HPM_LabelId` varchar(45) DEFAULT NULL,
  `HPM_PackSize` varchar(45) DEFAULT NULL,
  `HPM_PackUnit` varchar(45) DEFAULT NULL,
  `HPM_ChildQty` varchar(45) DEFAULT NULL,
  `HPM_ChildUnit` varchar(45) DEFAULT NULL,
  `HPM_PackStyle` varchar(45) DEFAULT NULL,
  `HPM_NetWeight` varchar(45) DEFAULT NULL,
  `HPM_GrossWeight` varchar(45) DEFAULT NULL,
  `HPM_UnitWeight` varchar(45) DEFAULT NULL,
  `HPM_Price` varchar(45) DEFAULT NULL,
  `HPM_MinRSNPoolCount` varchar(45) DEFAULT NULL,
  `HPM_MaxRSNPoolCount` varchar(45) DEFAULT NULL,
  `HPM_MaxRSNRequestCount` varchar(45) DEFAULT NULL,
  `HPM_PoolStatus` varchar(45) DEFAULT NULL,
  `HPM_PoolRemarks` varchar(45) DEFAULT NULL,
  `HPM_IsPoolReqSent` varchar(45) DEFAULT NULL,
  `HPM_PoolReqSentStatus` varchar(45) DEFAULT NULL,
  `HPM_AvailableRsnCount` varchar(45) DEFAULT NULL,
  `HPM_SendRequestCount` varchar(45) DEFAULT NULL,
  `HPM_SerialNumberType` varchar(45) DEFAULT NULL,
  `HPM_PackingLevelName` varchar(45) DEFAULT NULL,
  `HPM_SerialNumberReuse` varchar(45) DEFAULT NULL,
  `HPM_ProductMastDataTemplateID` varchar(45) DEFAULT NULL,
  `HPM_ProductMastDataTemplateData` varchar(255) DEFAULT NULL,
  `HPM_CreatedBy` varchar(45) DEFAULT NULL,
  `HPM_CreatedTimestamp` datetime DEFAULT NULL,
  `HPM_LastModifiedBy` varchar(45) DEFAULT NULL,
  `HPM_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`HPM_ProductMID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Packing Level Hetero Product Information';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heteroproductmaster`
--

LOCK TABLES `heteroproductmaster` WRITE;
/*!40000 ALTER TABLE `heteroproductmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `heteroproductmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `importrsnshipment`
--

DROP TABLE IF EXISTS `importrsnshipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `importrsnshipment` (
  `IRS_ID` int NOT NULL AUTO_INCREMENT,
  `IRS_ProductID` int DEFAULT NULL,
  `IRS_ProductMID` int DEFAULT NULL,
  `IRS_ShipmentID` int DEFAULT NULL,
  `IRS_ShipmentType` int DEFAULT NULL,
  `IRS_BatchID` int DEFAULT NULL,
  `IRS_BatchMID` int DEFAULT NULL,
  `IRS_RandomNo` varchar(45) DEFAULT NULL,
  `IRS_ParentRandomNo` varchar(45) DEFAULT NULL,
  `IRS_PackSize` int DEFAULT NULL,
  `IRS_Status` int DEFAULT NULL,
  `IRS_CreatedBy` int DEFAULT NULL,
  `IRS_CreatedTimeStamp` datetime DEFAULT NULL,
  `IRS_LastModifedBy` int DEFAULT NULL,
  `IRS_LastModifiedTimeStamp` datetime DEFAULT NULL,
  `IRS_PhysicalLocation` varchar(45) DEFAULT NULL COMMENT 'SCP ID',
  `IRS_LogicalLocation` varchar(45) DEFAULT NULL COMMENT 'BIN Location - Used in Phase 2 Development',
  `IRS_CompanyGrpID` int DEFAULT NULL,
  `IRS_CompanyID` int DEFAULT NULL,
  `IRS_ToSCP` int DEFAULT NULL,
  `IRS_BatchWeight` float DEFAULT NULL,
  `IRS_ShipmentWeight` float DEFAULT NULL,
  `IRS_Remark` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`IRS_ID`),
  UNIQUE KEY `uniq_random_product` (`IRS_RandomNo`,`IRS_ProductID`),
  UNIQUE KEY `IRS_RandomNo_UNIQUE` (`IRS_RandomNo`)
) ENGINE=InnoDB AUTO_INCREMENT=1684 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Import RSN from L3 System';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `importrsnshipment`
--

LOCK TABLES `importrsnshipment` WRITE;
/*!40000 ALTER TABLE `importrsnshipment` DISABLE KEYS */;
INSERT INTO `importrsnshipment` VALUES (1672,18,NULL,NULL,NULL,48,48,'0101018R7PMDQP',NULL,NULL,6,NULL,'2018-06-21 01:32:21',NULL,'2018-06-21 01:32:21','38',NULL,15,19,NULL,5.63,NULL,NULL),(1673,18,NULL,NULL,NULL,48,48,'0101018WE6QLCD',NULL,NULL,6,NULL,'2018-06-21 01:32:21',NULL,'2018-06-21 01:32:21','38',NULL,15,19,NULL,5.605,NULL,NULL),(1674,18,NULL,19,1,48,48,'01010180J4VJ5A',NULL,NULL,22,NULL,'2018-06-21 01:32:21',33,'2019-04-24 22:03:13','38',NULL,15,19,36,5.615,NULL,'gtfytu'),(1675,18,NULL,18,1,50,50,'0101018HXYU488',NULL,NULL,22,NULL,'2018-06-21 01:48:21',33,'2019-02-03 05:47:15','38',NULL,15,19,36,5.61,NULL,NULL),(1676,18,NULL,18,1,50,50,'0101018TE3T6NX',NULL,NULL,22,NULL,'2018-06-21 01:48:21',33,'2019-02-03 05:47:15','38',NULL,15,19,36,5.62,NULL,'yy'),(1677,7,NULL,NULL,NULL,51,49,'0101007T2UCE1H',NULL,NULL,6,NULL,'2026-01-15 08:04:21',NULL,'2026-01-15 08:04:21','38',NULL,15,19,NULL,5.72,NULL,NULL),(1678,7,NULL,NULL,NULL,51,49,'0101007Q94V9AW',NULL,NULL,6,NULL,'2026-01-15 08:04:21',NULL,'2026-01-15 08:04:21','38',NULL,15,19,NULL,5.705,NULL,NULL),(1679,7,NULL,NULL,NULL,52,50,'0101007RHQEX5Y',NULL,NULL,6,NULL,'2026-01-15 08:15:21',NULL,'2026-01-15 08:15:21','38',NULL,15,19,NULL,5.72,NULL,NULL),(1680,7,NULL,NULL,NULL,52,50,'01010072RDPAS4',NULL,NULL,6,NULL,'2026-01-15 08:45:01',NULL,'2026-01-15 08:45:01','38',NULL,15,19,NULL,5.685,NULL,NULL),(1681,7,NULL,NULL,NULL,53,51,'010100777L0I58',NULL,NULL,6,NULL,'2026-01-16 18:49:41',NULL,'2026-01-16 18:49:41','38',NULL,15,19,NULL,5.71,NULL,NULL),(1682,7,NULL,NULL,NULL,54,52,'0101007V6BJ0IY',NULL,NULL,6,NULL,'2026-01-17 17:13:02',NULL,'2026-01-17 17:13:02','38',NULL,15,19,NULL,5.715,NULL,NULL),(1683,5,NULL,NULL,NULL,55,53,'0101005P58BFE0',NULL,NULL,6,NULL,'2026-01-20 11:39:41',NULL,'2026-01-20 11:39:41','38',NULL,15,19,NULL,5.71,NULL,NULL);
/*!40000 ALTER TABLE `importrsnshipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inv_id` int NOT NULL AUTO_INCREMENT,
  `inv_scpid` int DEFAULT NULL,
  `inv_productid` int DEFAULT NULL,
  `inv_Companyid` int DEFAULT NULL,
  `inv_CompanyGrpid` int DEFAULT NULL,
  `inv_blockqty` int DEFAULT '0',
  `inv_availableqty` int DEFAULT NULL,
  `inv_CreatedBy` int DEFAULT NULL,
  `inv_ModifiedBy` int DEFAULT NULL,
  `inv_CreatedTimestamp` datetime DEFAULT NULL,
  `inv_ModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`inv_id`),
  UNIQUE KEY `uq_inventory` (`inv_scpid`,`inv_productid`,`inv_Companyid`,`inv_CompanyGrpid`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (16,38,18,NULL,NULL,1,2,NULL,NULL,'2018-06-21 01:32:21','2018-06-21 01:48:21'),(17,38,7,NULL,NULL,0,4,NULL,NULL,'2026-01-15 08:04:21','2026-01-15 08:45:01'),(18,38,5,NULL,NULL,0,1,NULL,NULL,'2026-01-20 11:39:41',NULL);
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `labelconfigmaster`
--

DROP TABLE IF EXISTS `labelconfigmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `labelconfigmaster` (
  `LabelConfigId` int NOT NULL AUTO_INCREMENT,
  `IsDatabaseValue` tinyint(1) NOT NULL,
  `FindValue` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `LabelParameterName` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ModifiedBy` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `ModifiedDate` datetime DEFAULT NULL,
  PRIMARY KEY (`LabelConfigId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `labelconfigmaster`
--

LOCK TABLES `labelconfigmaster` WRITE;
/*!40000 ALTER TABLE `labelconfigmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `labelconfigmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `labelmaster`
--

DROP TABLE IF EXISTS `labelmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `labelmaster` (
  `LB_ID` int NOT NULL AUTO_INCREMENT,
  `LB_LabelName` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `LB_FullQtyLabelPRNData` longtext,
  `LB_FullQtyLabel` longtext,
  `LB_LooseLabelDataPRNData` longtext,
  `LB_LooseLabelData` longtext,
  `CreatedOn` datetime DEFAULT NULL,
  `CreatedBy` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `LB_Status` int DEFAULT NULL,
  `LB_SuspendRemark` text,
  `LB_DateFormatId` int DEFAULT NULL,
  `LB_DFCountryId` int DEFAULT NULL,
  `ModifiedBy` varchar(45) DEFAULT NULL,
  `ModifiedDate` datetime DEFAULT NULL,
  `LB_CompanyID` int DEFAULT '0',
  PRIMARY KEY (`LB_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `labelmaster`
--

LOCK TABLES `labelmaster` WRITE;
/*!40000 ALTER TABLE `labelmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `labelmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `linemaster`
--

DROP TABLE IF EXISTS `linemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `linemaster` (
  `LM_LineID` int NOT NULL AUTO_INCREMENT,
  `LM_PlantID` int NOT NULL,
  `LM_LineName` varchar(100) DEFAULT NULL,
  `LM_LineCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `LM_BlockID` int DEFAULT NULL,
  `LM_CreatedBy` varchar(50) DEFAULT NULL,
  `LM_CreatedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `LM_ModifiedBy` varchar(50) DEFAULT NULL,
  `LM_ModifiedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `LM_LineStatus` int DEFAULT NULL,
  PRIMARY KEY (`LM_LineID`),
  UNIQUE KEY `LM_LineCode` (`LM_PlantID`,`LM_LineCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `linemaster`
--

LOCK TABLES `linemaster` WRITE;
/*!40000 ALTER TABLE `linemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `linemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locationmaster`
--

DROP TABLE IF EXISTS `locationmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locationmaster` (
  `LCM_ID` int NOT NULL AUTO_INCREMENT,
  `LCM_LocationName` varchar(45) DEFAULT NULL,
  `LCM_LocationCode` varchar(45) DEFAULT NULL,
  `LCM_Type` varchar(45) DEFAULT NULL,
  `LCM_CompanyID` int DEFAULT NULL,
  `LCM_SCPID` int DEFAULT NULL,
  `LCM_LocationStreet1` varchar(100) DEFAULT NULL,
  `LCM_LocationStreet2` varchar(100) DEFAULT NULL,
  `LCM_PostalCode` varchar(45) DEFAULT NULL,
  `LCM_City` varchar(45) DEFAULT NULL,
  `LCM_State` varchar(45) DEFAULT NULL,
  `LCM_Country` varchar(45) DEFAULT NULL,
  `LCM_ShippingCountryCode` varchar(45) DEFAULT NULL,
  `LCM_District` varchar(45) DEFAULT NULL,
  `LCM_EmailID` varchar(100) DEFAULT NULL,
  `LCM_ContactNumber` varchar(45) DEFAULT NULL,
  `LCM_GLN` varchar(45) DEFAULT NULL,
  `LCM_SGLN` varchar(45) DEFAULT NULL,
  `LCM_Latitude` varchar(45) DEFAULT NULL,
  `LCM_Longitude` varchar(45) DEFAULT NULL,
  `LCM_CompanyEmailID` varchar(45) DEFAULT NULL,
  `LCM_URL` varchar(45) DEFAULT NULL,
  `LCM_LabelAddress1` varchar(100) DEFAULT NULL,
  `LCM_LabelAddress2` varchar(100) DEFAULT NULL,
  `LCM_LabelAddress3` varchar(100) DEFAULT NULL,
  `LCM_LabelAddress4` varchar(100) DEFAULT NULL,
  `LCM_LabelAddress5` varchar(100) DEFAULT NULL,
  `LCM_Status` tinyint DEFAULT NULL,
  `LCM_CompanyGrpId` int DEFAULT NULL,
  `LCM_CreatedBy` int DEFAULT NULL,
  `LCM_CreatedTimestamp` datetime DEFAULT NULL,
  `LCM_ModifiedBy` int DEFAULT NULL,
  `LCM_ModifiedTimestamp` datetime DEFAULT NULL,
  `LCM_Remarks` varchar(455) DEFAULT NULL,
  PRIMARY KEY (`LCM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master Details of Location Master	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locationmaster`
--

LOCK TABLES `locationmaster` WRITE;
/*!40000 ALTER TABLE `locationmaster` DISABLE KEYS */;
INSERT INTO `locationmaster` VALUES (12,'Location1','998744565','Warehouse',19,38,'Vatva','GIDC','987456','Ahmedabad','Gujarat','India','IND','Ahmedabad','sapl123@gmail.com','','4568963456385','456556663.755856','','','','','','','','','',1,15,33,'2026-01-20 08:02:25',NULL,'2026-01-20 08:02:25',NULL),(13,'Location2','76756','Warehouse',19,36,'thaltej','','654789','Ahmedabad','Gujrat','India','IND','','sapl123@gmail.com','','4546698689669','6987676.56568968','','','','','','','','','',1,15,31,'2026-01-20 08:03:51',NULL,'2026-01-20 08:03:51',NULL),(14,'Location 3','354654','Warehouse',19,37,'Near Baghban Party Plot','Thaltej','654789','Ahmedabad','Gujrat','India','IND','','techtrio123@gmail.com','','4278665689679','546586.565685536','','','','','','','','','',1,15,31,'2026-01-20 08:04:16',NULL,'2026-01-20 08:04:16',NULL);
/*!40000 ALTER TABLE `locationmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logisticcompanymaster`
--

DROP TABLE IF EXISTS `logisticcompanymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logisticcompanymaster` (
  `LGCM_ID` int NOT NULL AUTO_INCREMENT,
  `LGCM_Name` varchar(45) NOT NULL,
  `LGCM_Status` int NOT NULL,
  `LGCM_SuspendRemark` varchar(1000) DEFAULT NULL,
  `LGCM_SCPID` int DEFAULT NULL,
  `LGCM_CompanyID` int DEFAULT NULL,
  `LGCM_CompanyGrpID` int DEFAULT NULL,
  `LGCM_CreatedBy` int DEFAULT NULL,
  `LGCM_CreatedTimestamp` datetime DEFAULT NULL,
  `LGCM_ModifiedBy` int DEFAULT NULL,
  `LGCM_ModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`LGCM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master Details for Logistic Company Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logisticcompanymaster`
--

LOCK TABLES `logisticcompanymaster` WRITE;
/*!40000 ALTER TABLE `logisticcompanymaster` DISABLE KEYS */;
INSERT INTO `logisticcompanymaster` VALUES (10,'Logistic 1',1,NULL,38,19,15,33,'2026-01-20 06:00:04',NULL,NULL);
/*!40000 ALTER TABLE `logisticcompanymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logisticcompanyvehiclemaster`
--

DROP TABLE IF EXISTS `logisticcompanyvehiclemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logisticcompanyvehiclemaster` (
  `LGCVM_ID` int NOT NULL AUTO_INCREMENT,
  `LGCVM_LogisticCompanyID` int DEFAULT NULL,
  `LGCVM_VehicleNumber` varchar(45) NOT NULL,
  `LGCVM_Status` int DEFAULT NULL,
  `LGCVM_SCPID` int DEFAULT NULL,
  `LGCVM_CreatedBy` int DEFAULT NULL,
  `LGCVM_CreatedTimestamp` datetime DEFAULT NULL,
  `LGCVM_ModifiedBy` int DEFAULT NULL,
  `LGCVM_ModifiedTimestamp` datetime DEFAULT NULL,
  `LGCVM_Dimension` float DEFAULT NULL,
  `LGCVM_VehicleName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`LGCVM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logisticcompanyvehiclemaster`
--

LOCK TABLES `logisticcompanyvehiclemaster` WRITE;
/*!40000 ALTER TABLE `logisticcompanyvehiclemaster` DISABLE KEYS */;
INSERT INTO `logisticcompanyvehiclemaster` VALUES (13,10,'GJ11LP8745',1,38,33,'2026-01-20 06:00:04',NULL,NULL,1200,'TATA SUMO');
/*!40000 ALTER TABLE `logisticcompanyvehiclemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machinemaster`
--

DROP TABLE IF EXISTS `machinemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machinemaster` (
  `MM_ID` int NOT NULL AUTO_INCREMENT,
  `MM_Machine_Name` varchar(45) DEFAULT NULL,
  `MM_Machine_Code` varchar(45) DEFAULT NULL,
  `MM_CoincapMachinecode` varchar(45) DEFAULT NULL,
  `MM_DeviceId` int DEFAULT NULL,
  `MM_DeviceName` varchar(45) DEFAULT NULL,
  `MM_Cameraip` varchar(55) DEFAULT NULL,
  `MM_CreatedBy` varchar(45) DEFAULT NULL,
  `MM_CreatedTimeStamp` varchar(45) DEFAULT NULL,
  `MM_ModifiedBy` varchar(45) DEFAULT NULL,
  `MM_ModifiedTimeStamp` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`MM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machinemaster`
--

LOCK TABLES `machinemaster` WRITE;
/*!40000 ALTER TABLE `machinemaster` DISABLE KEYS */;
INSERT INTO `machinemaster` VALUES (1,'Machine 1','M001',NULL,NULL,NULL,'192.168.7.9','1',NULL,NULL,NULL);
/*!40000 ALTER TABLE `machinemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mappinglevelmaster`
--

DROP TABLE IF EXISTS `mappinglevelmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mappinglevelmaster` (
  `MLM_MappingLID` int NOT NULL AUTO_INCREMENT,
  `MLM_MappingID` int DEFAULT '0',
  `MLM_ProductMID` int DEFAULT '0',
  `MLM_GTIN` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_PackingLevelID` int DEFAULT '0',
  `MLM_LabelID` int DEFAULT '0',
  `MLM_PackSize` int DEFAULT '0',
  `MLM_Unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_ChildQty` int DEFAULT '0',
  `MLM_ChildPackUnit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_MfgDataFormatID` int DEFAULT '0',
  `MLM_ExpDateFormatID` int DEFAULT '0',
  `MLM_PackingLevelCode` int DEFAULT '0',
  `MLM_SKUId` int DEFAULT '0',
  `MLM_MinimumPoolCount` int DEFAULT '0',
  `MLM_MaximumPoolCount` int DEFAULT '0',
  `MLM_PackStyle` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_GTINURIFormat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_NetWeight` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_WeightUnit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MLM_RSNRequestLimitCount` int DEFAULT NULL,
  `MLM_AvailableRSNCount` int DEFAULT '0',
  `MLM_SendRequestCount` int DEFAULT '0',
  `MLM_PoolRequestSent` int DEFAULT '0',
  `MLM_PoolRequestStatus` int DEFAULT '0',
  `MLM_LockQty` int DEFAULT '0',
  `MLM_AvailableLockQty` int DEFAULT '0',
  `MLM_PM_TemplateID` int DEFAULT '0',
  `MLM_PM_TemplateDetails` json DEFAULT NULL,
  `MLM_TemplateDetails` json DEFAULT NULL,
  `MLM_CreatedBy` int DEFAULT NULL,
  `MLM_CreatedTimeStamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `MLM_ModifiedBy` int DEFAULT NULL,
  `MLM_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`MLM_MappingLID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='Mapping Level Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mappinglevelmaster`
--

LOCK TABLES `mappinglevelmaster` WRITE;
/*!40000 ALTER TABLE `mappinglevelmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `mappinglevelmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mappingmaster`
--

DROP TABLE IF EXISTS `mappingmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mappingmaster` (
  `MM_MappingID` int NOT NULL AUTO_INCREMENT,
  `MM_MappingName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MM_ProductID` int DEFAULT '0',
  `MM_SSCCSerializationTemplateID` int DEFAULT '0',
  `MM_RSNSerializationTemplateID` int DEFAULT NULL,
  `MM_RegulatoryCountryID` int DEFAULT '0',
  `MM_GenerationType` int DEFAULT '0',
  `MM_Status` int DEFAULT '0',
  `MM_SuspendRemark` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MM_IsPooling` int DEFAULT '0',
  `MM_PoolStatus` int DEFAULT '0',
  `MM_PoolRemark` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MM_PL_TemplateID` int DEFAULT '0',
  `MM_PL_TemplateDetails` json DEFAULT NULL,
  `MM_TemplateID` int DEFAULT NULL,
  `MM_TemplateDetails` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MM_CompanyID` int DEFAULT '0',
  `MM_CompanyGroupID` int DEFAULT '0',
  `MM_CreatedBy` int DEFAULT NULL,
  `MM_CreatedTimeStamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `MM_ModifiedBy` int DEFAULT NULL,
  `MM_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`MM_MappingID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='Mapping Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mappingmaster`
--

LOCK TABLES `mappingmaster` WRITE;
/*!40000 ALTER TABLE `mappingmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `mappingmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menumaster`
--

DROP TABLE IF EXISTS `menumaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menumaster` (
  `MNM_MenuID` int NOT NULL AUTO_INCREMENT,
  `MNM_MenuName` varchar(45) DEFAULT NULL,
  `MNM_MenuIndex` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`MNM_MenuID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Menu Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menumaster`
--

LOCK TABLES `menumaster` WRITE;
/*!40000 ALTER TABLE `menumaster` DISABLE KEYS */;
INSERT INTO `menumaster` VALUES (1,'Master','1'),(2,'Configuration','2'),(3,'Order','3'),(4,'Shipment','4'),(5,'Rights','5'),(6,'Reports','6'),(7,'Batch','7'),(8,'Warehouse','8'),(9,'Sales','9');
/*!40000 ALTER TABLE `menumaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificationdetails`
--

DROP TABLE IF EXISTS `notificationdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificationdetails` (
  `NFD_Id` int NOT NULL AUTO_INCREMENT,
  `NFD_MessageId` int DEFAULT NULL,
  `NFD_ACKW_By` int DEFAULT NULL,
  `NFD_ACKW_TimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`NFD_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificationdetails`
--

LOCK TABLES `notificationdetails` WRITE;
/*!40000 ALTER TABLE `notificationdetails` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificationdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificationmaster`
--

DROP TABLE IF EXISTS `notificationmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificationmaster` (
  `NFM_ID` int NOT NULL AUTO_INCREMENT,
  `NFM_EventType` varchar(45) DEFAULT NULL,
  `NFM_EventBy` int DEFAULT NULL,
  `NFM_Status` int DEFAULT NULL COMMENT 'Read / Unread',
  `NFM_EventMessage` text,
  `NFM_CompanyID` int NOT NULL,
  `NFM_CompanyGrpID` int NOT NULL,
  `NFM_SCPID` int NOT NULL,
  `NFM_CreatedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`NFM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificationmaster`
--

LOCK TABLES `notificationmaster` WRITE;
/*!40000 ALTER TABLE `notificationmaster` DISABLE KEYS */;
INSERT INTO `notificationmaster` VALUES (1,'Shipment Creation',2,0,'Shipment with Shipment code: \'WH_1\' is created successfully',1,1,3,'2026-01-07 17:26:37'),(2,'Shipment Creation',2,0,'Shipment with Shipment code: \'WH_1\' is created successfully',1,1,3,'2026-01-08 15:37:26'),(3,'Shipment Creation',2,0,'Shipment with Shipment code: \'WH_2\' is created successfully',1,1,3,'2026-01-08 15:37:59');
/*!40000 ALTER TABLE `notificationmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderlist`
--

DROP TABLE IF EXISTS `orderlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderlist` (
  `ORDM_OrderID` int NOT NULL AUTO_INCREMENT COMMENT 'AutoIncrement...',
  `ORDM_OrderNumber` varchar(45) DEFAULT '0' COMMENT 'SCP wise Order Number Generation...',
  `ORDM_OrderDate` datetime DEFAULT NULL,
  `ORDM_FromSCPID` int DEFAULT '0',
  `ORDM_ToSCPID` int DEFAULT '0',
  `ORDM_Type` int DEFAULT '0' COMMENT 'EnumMaster - OrderType',
  `ORDM_OrderStatus` int DEFAULT '0' COMMENT 'EnumMaster -> Order',
  `ORDM_CompanyGrpId` int DEFAULT '0',
  `ORDM_CompanyID` int DEFAULT '0',
  `ORDM_CreatedBy` int DEFAULT '0',
  `ORDM_CreatedTimestamp` datetime DEFAULT NULL,
  `ORDM_LastModifiedBy` int DEFAULT '0',
  `ORDM_LastModifiedTimestamp` datetime DEFAULT NULL,
  `ORDM_EmailSent` int DEFAULT '0',
  `ORDM_Comment` varchar(200) DEFAULT NULL,
  `ORDM_TelegramMsgSent` int DEFAULT '0',
  PRIMARY KEY (`ORDM_OrderID`),
  KEY `idx_orderlist_order_number` (`ORDM_OrderNumber`),
  KEY `fk_orderlist_scpmaster_idx1` (`ORDM_ToSCPID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Order Header Information	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderlist`
--

LOCK TABLES `orderlist` WRITE;
/*!40000 ALTER TABLE `orderlist` DISABLE KEYS */;
INSERT INTO `orderlist` VALUES (25,'ORD_SO_GP01_1','2026-01-20 05:53:47',36,38,1,2,15,19,31,NULL,0,NULL,0,NULL,0),(26,'ORD_SO_GP01_2','2026-01-20 07:20:54',36,38,1,2,15,19,31,NULL,0,NULL,0,NULL,0);
/*!40000 ALTER TABLE `orderlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordermaster`
--

DROP TABLE IF EXISTS `ordermaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordermaster` (
  `ORDIT_ORDERMID` int NOT NULL AUTO_INCREMENT,
  `ORDIT_OrderID` int NOT NULL,
  `ORDIT_ProductID` int DEFAULT NULL COMMENT 'To Whom Order is Raised',
  `ORDIT_OrderQTY` double DEFAULT '0',
  `ORDIT_FreeQty` double DEFAULT '0',
  `ORDIT_ReceivedQty` double DEFAULT NULL,
  `ORDIT_PendingQty` double DEFAULT NULL,
  `ORDIT_CreatedBy` int DEFAULT NULL,
  `ORDIT_CreatedTimestamp` datetime DEFAULT NULL,
  `ORDIT_ModifiedBy` int DEFAULT NULL,
  `ORDIT_ModifiedTimestamp` datetime DEFAULT NULL,
  `ORDIT_CompanyGrpId` int DEFAULT NULL,
  `ORDIT_CompanyID` int DEFAULT NULL,
  PRIMARY KEY (`ORDIT_ORDERMID`),
  KEY `fk_ordermaster_orderlist_idx` (`ORDIT_OrderID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='order detail information relevant to its orderlist ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordermaster`
--

LOCK TABLES `ordermaster` WRITE;
/*!40000 ALTER TABLE `ordermaster` DISABLE KEYS */;
INSERT INTO `ordermaster` VALUES (25,25,18,4,0,NULL,0,31,'2018-06-26 13:55:58',NULL,NULL,15,19),(26,26,18,2,0,NULL,1,31,'2019-03-30 00:21:10',NULL,NULL,15,19);
/*!40000 ALTER TABLE `ordermaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderschememaster`
--

DROP TABLE IF EXISTS `orderschememaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderschememaster` (
  `OSM_ID` int NOT NULL AUTO_INCREMENT,
  `OSM_ORDM_OrderID` int NOT NULL,
  `OSM_SM_ID` int NOT NULL,
  `OSM_SM_Type` int NOT NULL,
  `OSM_SM_Value` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`OSM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderschememaster`
--

LOCK TABLES `orderschememaster` WRITE;
/*!40000 ALTER TABLE `orderschememaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `orderschememaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordertemplatelist`
--

DROP TABLE IF EXISTS `ordertemplatelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordertemplatelist` (
  `ORTL_ID` int NOT NULL AUTO_INCREMENT,
  `ORTL_SCPIDFrom` int DEFAULT NULL,
  `ORTL_SCPIDTo` int DEFAULT NULL,
  `ORTL_TemplateName` varchar(45) NOT NULL,
  `ORTL_ProductID` int DEFAULT NULL,
  `ORTL_OrderQty` double DEFAULT NULL,
  `ORTL_CreatedBy` varchar(45) DEFAULT NULL,
  `ORTL_CreatedDateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`ORTL_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Order Template List';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordertemplatelist`
--

LOCK TABLES `ordertemplatelist` WRITE;
/*!40000 ALTER TABLE `ordertemplatelist` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordertemplatelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packinglevelmaster`
--

DROP TABLE IF EXISTS `packinglevelmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packinglevelmaster` (
  `PLM_ID` int NOT NULL AUTO_INCREMENT,
  `PLM_Name` varchar(255) DEFAULT NULL,
  `PLM_PackingLevelValue` int DEFAULT NULL,
  `PLM_Status` int DEFAULT NULL,
  PRIMARY KEY (`PLM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packinglevelmaster`
--

LOCK TABLES `packinglevelmaster` WRITE;
/*!40000 ALTER TABLE `packinglevelmaster` DISABLE KEYS */;
INSERT INTO `packinglevelmaster` VALUES (1,' Primary',1,1),(2,'Secondary',2,1),(3,'IntermediateLevel2',4,1),(4,'IntermediateLevel3',8,1),(5,'Tertiary',16,1);
/*!40000 ALTER TABLE `packinglevelmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parameterdetails`
--

DROP TABLE IF EXISTS `parameterdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parameterdetails` (
  `PD_ID` int NOT NULL AUTO_INCREMENT,
  `PD_PartyID` int DEFAULT NULL,
  `PD_ParameterName` varchar(255) DEFAULT NULL,
  `PD_ParameterDatatype` varchar(255) DEFAULT NULL,
  `PD_ParameterReference` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`PD_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parameterdetails`
--

LOCK TABLES `parameterdetails` WRITE;
/*!40000 ALTER TABLE `parameterdetails` DISABLE KEYS */;
INSERT INTO `parameterdetails` VALUES (1,1,'RSN Structure',NULL,'RSNStructure');
/*!40000 ALTER TABLE `parameterdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partymaster`
--

DROP TABLE IF EXISTS `partymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partymaster` (
  `PartyID` int NOT NULL AUTO_INCREMENT,
  `PartyName` varchar(255) DEFAULT NULL,
  `Version` varchar(255) DEFAULT NULL,
  `Status` int DEFAULT NULL,
  PRIMARY KEY (`PartyID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partymaster`
--

LOCK TABLES `partymaster` WRITE;
/*!40000 ALTER TABLE `partymaster` DISABLE KEYS */;
INSERT INTO `partymaster` VALUES (1,'SmartTrackerPlus','1.0',1);
/*!40000 ALTER TABLE `partymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partyplantcompanymaster`
--

DROP TABLE IF EXISTS `partyplantcompanymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partyplantcompanymaster` (
  `PPCM_ID` int NOT NULL AUTO_INCREMENT,
  `PPCM_PartyID` varchar(45) DEFAULT NULL,
  `PPCM_PlantID` varchar(45) DEFAULT NULL,
  `PPCM_CompanyID` varchar(45) DEFAULT NULL,
  `PPCM_PartyTemplate` varchar(45) DEFAULT NULL,
  `PPCM_ActiveServerAssignedBy` varchar(45) DEFAULT NULL,
  `PPCM_ParameterData` varchar(45) DEFAULT NULL,
  `PPCM_IsActive` varchar(45) DEFAULT NULL,
  `PPCM_PartyType` varchar(45) DEFAULT NULL,
  `PPCM_CompanyGrpId` varchar(45) DEFAULT NULL,
  `PPCM_CreatedBy` varchar(45) DEFAULT NULL,
  `PPCM_CreatedTimestamp` datetime DEFAULT NULL,
  `PPCM_LastModifiedBy` varchar(45) DEFAULT NULL,
  `PPCM_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`PPCM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Party Plant Company for SSCC Generation Process';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partyplantcompanymaster`
--

LOCK TABLES `partyplantcompanymaster` WRITE;
/*!40000 ALTER TABLE `partyplantcompanymaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `partyplantcompanymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantmaster`
--

DROP TABLE IF EXISTS `plantmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantmaster` (
  `PM_PlantID` int NOT NULL AUTO_INCREMENT,
  `PM_PlantName` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `PM_PlantCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `PM_CompanyID` int DEFAULT NULL,
  `PM_Status` int DEFAULT NULL,
  `PM_CreatedBy` int DEFAULT NULL,
  `PM_CreatedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `PM_ModifiedBy` int DEFAULT NULL,
  `PM_ModifiedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`PM_PlantID`),
  UNIQUE KEY `PM_PlantCode` (`PM_CompanyID`,`PM_PlantCode`),
  UNIQUE KEY `PM_PlantName` (`PM_CompanyID`,`PM_PlantName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantmaster`
--

LOCK TABLES `plantmaster` WRITE;
/*!40000 ALTER TABLE `plantmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poolrsngeneration`
--

DROP TABLE IF EXISTS `poolrsngeneration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poolrsngeneration` (
  `PRSNG_ID` int NOT NULL AUTO_INCREMENT,
  `PRSNG_ProductID` int DEFAULT NULL,
  `PRSNG_ProductMID` int DEFAULT NULL,
  `PRSNG_BatchID` int DEFAULT NULL,
  `PRSNG_BatchMID` int DEFAULT NULL,
  `PRSNG_RSN` varchar(45) DEFAULT NULL,
  `PRSNG_Timestamp` datetime DEFAULT NULL,
  `PRSNG_CryptoCode` longtext,
  `PRSNG_CryptoKey` longtext,
  `PRSNG_CompanyGrpId` int DEFAULT NULL,
  `PRSNG_CompanyID` int DEFAULT NULL,
  `PRSNG_Status` tinyint DEFAULT NULL,
  `PRSNG_SCPID` varchar(45) DEFAULT NULL,
  `PRSNG_CreatedBy` int DEFAULT NULL,
  `PRSNG_CreatedTimestamp` datetime DEFAULT NULL,
  `PRSNG_LastModifiedBy` int DEFAULT NULL,
  `PRSNG_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`PRSNG_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Product Serial Numbers Tracking.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poolrsngeneration`
--

LOCK TABLES `poolrsngeneration` WRITE;
/*!40000 ALTER TABLE `poolrsngeneration` DISABLE KEYS */;
/*!40000 ALTER TABLE `poolrsngeneration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poolssccgeneration`
--

DROP TABLE IF EXISTS `poolssccgeneration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poolssccgeneration` (
  `PSSCCG_ID` int NOT NULL AUTO_INCREMENT,
  `PSSCCG_CompanyID` int DEFAULT NULL,
  `PSSCCG_CompanyGrpId` int DEFAULT NULL,
  `PSSCCG_BatchID` int DEFAULT NULL,
  `PSSCCG_BatchMID` int DEFAULT NULL,
  `PSSCCG_TimeStamp` datetime DEFAULT NULL,
  `PSSCCG_SSCC` bigint DEFAULT NULL,
  `PSSCCG_Status` int DEFAULT NULL,
  `PSSCCG_SCPID` int DEFAULT NULL,
  `PSSCCG_CreatedBy` int DEFAULT NULL,
  `PSSCCG_CreatedTimestamp` datetime DEFAULT NULL,
  `PSSCCG_LastModifiedBy` int DEFAULT NULL,
  `PSSCCG_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`PSSCCG_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Logistic SSCC Serial number Tracking';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poolssccgeneration`
--

LOCK TABLES `poolssccgeneration` WRITE;
/*!40000 ALTER TABLE `poolssccgeneration` DISABLE KEYS */;
/*!40000 ALTER TABLE `poolssccgeneration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productlist`
--

DROP TABLE IF EXISTS `productlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productlist` (
  `PL_ProductId` int NOT NULL AUTO_INCREMENT,
  `PL_ProductName` varchar(45) DEFAULT NULL,
  `PL_GTIN` varchar(45) DEFAULT NULL,
  `PL_ProductCode` varchar(45) DEFAULT NULL,
  `PL_CompanyID` int DEFAULT NULL,
  `PL_CompanyGrpID` int DEFAULT NULL,
  `PL_SuspendRemark` varchar(45) DEFAULT NULL,
  `PL_GenericName` varchar(45) DEFAULT NULL,
  `PL_ProductDescription` varchar(45) DEFAULT NULL,
  `PL_ShelfLife` varchar(45) DEFAULT NULL,
  `PL_ProductStrength` varchar(45) DEFAULT NULL,
  `PL_ProductStatus` varchar(45) DEFAULT NULL,
  `PL_DmExpiry` varchar(45) DEFAULT NULL,
  `PL_TAndTRegulartory` varchar(45) DEFAULT NULL,
  `PL_GenerationType` varchar(45) DEFAULT NULL,
  `PL_ReportingPartyId` varchar(45) DEFAULT NULL,
  `PL_ProductListDataTemplateID` varchar(45) DEFAULT NULL,
  `PL_ProductListDataTemplateData` varchar(45) DEFAULT NULL,
  `PL_CreatedBy` varchar(45) DEFAULT NULL,
  `PL_CreatedTimestamp` datetime DEFAULT NULL,
  `PL_LastModifiedBy` varchar(45) DEFAULT NULL,
  `PL_LastModifiedTimestamp` datetime DEFAULT NULL,
  `PL_ProductVolume` float DEFAULT NULL,
  PRIMARY KEY (`PL_ProductId`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Product List';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productlist`
--

LOCK TABLES `productlist` WRITE;
/*!40000 ALTER TABLE `productlist` DISABLE KEYS */;
INSERT INTO `productlist` VALUES (18,'DOBULE MARI PAPAD 400 GM',NULL,'DM01',19,15,NULL,NULL,NULL,'90',NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,'33','2026-01-20 05:10:09',NULL,NULL,0.1),(19,'product1',NULL,'p1',19,15,NULL,NULL,NULL,'5',NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,'33','2026-01-20 08:55:04','33','2026-01-20 12:32:33',0.5);
/*!40000 ALTER TABLE `productlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productmappingmaster`
--

DROP TABLE IF EXISTS `productmappingmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productmappingmaster` (
  `PMM_ID` int NOT NULL AUTO_INCREMENT,
  `PMM_ProductID` varchar(45) DEFAULT NULL,
  `PMM_HeteroProductID` varchar(45) DEFAULT NULL,
  `PMM_RSNGenerationPartyID` varchar(45) DEFAULT NULL,
  `PMM_CaseCompanyPartyID` varchar(45) DEFAULT NULL,
  `PMM_PaletteCompanyPartyID` varchar(45) DEFAULT NULL,
  `PMM_SerializationID` varchar(45) DEFAULT NULL,
  `PMM_PlantID` varchar(45) DEFAULT NULL,
  `PMM_SNReUse` varchar(45) DEFAULT NULL,
  `PMM_CreatedBy` varchar(45) DEFAULT NULL,
  `PMM_CreatedTimestamp` datetime DEFAULT NULL,
  `PMM_LastModifiedBy` varchar(45) DEFAULT NULL,
  `PMM_LastModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`PMM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Product Mapping Master	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productmappingmaster`
--

LOCK TABLES `productmappingmaster` WRITE;
/*!40000 ALTER TABLE `productmappingmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `productmappingmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productmaster`
--

DROP TABLE IF EXISTS `productmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productmaster` (
  `PM_ProductMID` int NOT NULL AUTO_INCREMENT,
  `PM_ProductId` int NOT NULL,
  `PM_GTIN` varchar(45) DEFAULT NULL,
  `PM_ParentGTIN` varchar(45) DEFAULT NULL,
  `PM_PackingLevel` varchar(45) DEFAULT NULL,
  `PM_LabelId` varchar(45) DEFAULT NULL,
  `PM_PackSize` varchar(45) DEFAULT NULL,
  `PM_PackUnit` varchar(45) DEFAULT NULL,
  `PM_ChildQty` varchar(45) DEFAULT NULL,
  `PM_ChildUnit` varchar(45) DEFAULT NULL,
  `PM_PackStyle` varchar(45) DEFAULT NULL,
  `PM_MfgDateFormatId` varchar(45) DEFAULT NULL,
  `PM_ExpDateFormatId` varchar(45) DEFAULT NULL,
  `PM_NetWeight` varchar(45) DEFAULT NULL,
  `PM_GrossWeight` varchar(45) DEFAULT NULL,
  `PM_UnitWeight` varchar(45) DEFAULT NULL,
  `PM_GtinUriFormat` varchar(45) DEFAULT NULL,
  `PM_Price` varchar(45) DEFAULT NULL,
  `PM_MinRSNPoolCount` varchar(45) DEFAULT NULL,
  `PM_MaxRSNPoolCount` varchar(45) DEFAULT NULL,
  `PM_MaxRSNRequestCount` varchar(45) DEFAULT NULL,
  `PM_PoolStatus` varchar(45) DEFAULT NULL,
  `PM_PoolRemarks` varchar(45) DEFAULT NULL,
  `PM_IsPoolReqSent` varchar(45) DEFAULT NULL,
  `PM_PoolReqSentStatus` varchar(45) DEFAULT NULL,
  `PM_AvailableRsnCount` varchar(45) DEFAULT NULL,
  `PM_SendRequestCount` varchar(45) DEFAULT NULL,
  `PM_SerialNumberType` varchar(45) DEFAULT NULL,
  `PM_PackingLevelName` varchar(45) DEFAULT NULL,
  `PM_SerialNumberReuse` varchar(45) DEFAULT NULL,
  `PM_ProductMastDataTemplateID` varchar(45) DEFAULT NULL,
  `PM_ProductMastDataTemplateData` varchar(255) DEFAULT NULL,
  `PM_CreatedBy` varchar(45) DEFAULT NULL,
  `PM_CreatedTimestamp` datetime DEFAULT NULL,
  `PM_LastModifiedBy` varchar(45) DEFAULT NULL,
  `PM_LastModifiedTimestamp` datetime DEFAULT NULL,
  `PM_MinOffset` float DEFAULT NULL,
  `PM_MaxOffset` float DEFAULT NULL,
  PRIMARY KEY (`PM_ProductMID`,`PM_ProductId`),
  KEY `fk_productlist_idx` (`PM_ProductId`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Packing Level Product Information';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productmaster`
--

LOCK TABLES `productmaster` WRITE;
/*!40000 ALTER TABLE `productmaster` DISABLE KEYS */;
INSERT INTO `productmaster` VALUES (18,18,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'5.5',NULL,NULL,'50000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'33','2026-01-20 05:10:09',NULL,NULL,0.5,0.5),(19,19,NULL,NULL,'1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'5.5',NULL,NULL,'0.5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'33','2026-01-20 08:55:04','33','2026-01-20 12:32:33',0.5,0.5);
/*!40000 ALTER TABLE `productmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regulatorycompanymapping`
--

DROP TABLE IF EXISTS `regulatorycompanymapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regulatorycompanymapping` (
  `RCM_ID` int NOT NULL AUTO_INCREMENT,
  `RCM_CountryID` int DEFAULT NULL,
  `RCM_CompanyID` int DEFAULT NULL,
  `RCM_status` int DEFAULT '1',
  PRIMARY KEY (`RCM_ID`),
  UNIQUE KEY `uq_tt` (`RCM_CompanyID`,`RCM_CountryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regulatorycompanymapping`
--

LOCK TABLES `regulatorycompanymapping` WRITE;
/*!40000 ALTER TABLE `regulatorycompanymapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `regulatorycompanymapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regulatorymaster`
--

DROP TABLE IF EXISTS `regulatorymaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regulatorymaster` (
  `RM_CountryID` int NOT NULL,
  `RM_CountryName` varchar(255) DEFAULT NULL,
  `RM_Status` int DEFAULT '1',
  PRIMARY KEY (`RM_CountryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regulatorymaster`
--

LOCK TABLES `regulatorymaster` WRITE;
/*!40000 ALTER TABLE `regulatorymaster` DISABLE KEYS */;
INSERT INTO `regulatorymaster` VALUES (0,'None',1),(1,'India(DGFT)',1),(2,'US(DSCSA)',1),(3,'Saudi(SFDA)',1),(4,'EU(FMD)',1),(5,'Russia',1),(6,'Brazil(ANVISA)',1),(7,'Uzbekistan',1),(8,'UAE',1),(9,'Nigeria',1),(10,'Kazakhstan',1),(11,'India(Domestic)',1),(12,'Custom',1);
/*!40000 ALTER TABLE `regulatorymaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rolemaster`
--

DROP TABLE IF EXISTS `rolemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rolemaster` (
  `RLM_RoleID` int NOT NULL AUTO_INCREMENT,
  `RLM_GroupID` int DEFAULT NULL,
  `RLM_RoleName` varchar(45) DEFAULT NULL,
  `RLM_MenuOptions` varchar(45) DEFAULT NULL,
  `RLM_SubMenuOptions` varchar(45) DEFAULT NULL,
  `RLM_Status` tinyint DEFAULT NULL,
  `RLM_CompanyGrpId` int DEFAULT NULL,
  `RLM_CompanyID` int DEFAULT NULL,
  `RLM_CreatedBy` varchar(45) DEFAULT NULL,
  `RLM_CreatedTimestamp` datetime DEFAULT NULL,
  `RLM_MachineType` varchar(45) DEFAULT 'SmartTrackerPlus' COMMENT 'SmartTracker\nSmartTrackerPlus\nSTMaster\nWarehouse\n',
  PRIMARY KEY (`RLM_RoleID`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Role Master	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rolemaster`
--

LOCK TABLES `rolemaster` WRITE;
/*!40000 ALTER TABLE `rolemaster` DISABLE KEYS */;
INSERT INTO `rolemaster` VALUES (1,1,NULL,'1','4',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(2,1,NULL,'1','6',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(3,1,NULL,'1','8',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(4,1,NULL,'1','9',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(5,1,NULL,'1','45',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(6,1,NULL,'2','22',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(7,1,NULL,'3','24',1,1,1,'0','2026-01-07 16:20:15','SmartTrackerPlus'),(8,2,NULL,'1','4',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(9,2,NULL,'1','6',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(10,2,NULL,'1','8',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(11,2,NULL,'1','10',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(12,2,NULL,'1','11',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(13,2,NULL,'2','22',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(14,2,NULL,'4','25',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(15,2,NULL,'6','35',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(16,2,NULL,'6','36',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus'),(17,2,NULL,'6','37',1,1,1,'1','2026-01-07 16:28:22','SmartTrackerPlus');
/*!40000 ALTER TABLE `rolemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `routelist`
--

DROP TABLE IF EXISTS `routelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routelist` (
  `RUTL_ID` int NOT NULL AUTO_INCREMENT,
  `RUTL_Name` varchar(45) DEFAULT NULL,
  `RUTL_Status` tinyint DEFAULT NULL,
  `RUTL_CompanyID` int DEFAULT NULL,
  `RUTL_CompanyGrpID` int DEFAULT NULL,
  `RUTL_CreatedBy` int DEFAULT NULL,
  `RUTL_CreatedTimeStamp` datetime DEFAULT NULL,
  `RUTL_ModifiedBy` int DEFAULT NULL,
  `RUTL_ModifiedTimeStamp` datetime DEFAULT NULL,
  `RUTL_SCPID` int DEFAULT NULL,
  `RUTL_SuspendRemark` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`RUTL_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master details for Routing for Shipment';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routelist`
--

LOCK TABLES `routelist` WRITE;
/*!40000 ALTER TABLE `routelist` DISABLE KEYS */;
INSERT INTO `routelist` VALUES (12,'Route 1',1,19,15,33,'2026-01-20 06:00:17',NULL,'2026-01-20 06:00:17',38,NULL);
/*!40000 ALTER TABLE `routelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `routemaster`
--

DROP TABLE IF EXISTS `routemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routemaster` (
  `RUTM_ID` int NOT NULL AUTO_INCREMENT,
  `RUTL_ID` int DEFAULT NULL,
  `RUTM_SCPID` int DEFAULT NULL,
  PRIMARY KEY (`RUTM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master details for Routing for Shipment';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routemaster`
--

LOCK TABLES `routemaster` WRITE;
/*!40000 ALTER TABLE `routemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `routemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rsnhistoryinfo`
--

DROP TABLE IF EXISTS `rsnhistoryinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rsnhistoryinfo` (
  `RSNH_ID` int NOT NULL AUTO_INCREMENT,
  `RSNH_BatchMId` int DEFAULT NULL,
  `RSNH_RandomNo` varchar(500) DEFAULT NULL,
  `RSNH_Status` int DEFAULT NULL,
  `RSNH_ShipmentID` int DEFAULT NULL,
  `RSNH_EventId` int DEFAULT NULL,
  `RSNH_TimeStamp` datetime DEFAULT NULL,
  `RSNH_Physical_Location` int DEFAULT NULL,
  `RSNH_Logical_Location` int DEFAULT NULL,
  `RSNH_ParentRandomNo` varchar(500) DEFAULT NULL,
  `RSNH_PartyId` int DEFAULT NULL,
  `RSNH_FromSCP_Id` int DEFAULT NULL,
  `RSNH_ToSCP_Id` int DEFAULT NULL,
  `RSNH_ProductID` int DEFAULT NULL,
  `RSNH_CompanyID` int DEFAULT NULL,
  `RSNH_PackSize` int DEFAULT NULL,
  PRIMARY KEY (`RSNH_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rsnhistoryinfo`
--

LOCK TABLES `rsnhistoryinfo` WRITE;
/*!40000 ALTER TABLE `rsnhistoryinfo` DISABLE KEYS */;
/*!40000 ALTER TABLE `rsnhistoryinfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rsnserializationtemplatemaster`
--

DROP TABLE IF EXISTS `rsnserializationtemplatemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rsnserializationtemplatemaster` (
  `RSTM_ID` int NOT NULL AUTO_INCREMENT,
  `RSTM_STL_ID` int DEFAULT NULL,
  `RSTM_Code` int DEFAULT NULL,
  `RSTM_GenerationType` int DEFAULT NULL,
  `RSTM_RSNLength` int DEFAULT NULL,
  `RSTM_IsNumericAllowed` int DEFAULT '0',
  `RSTM_IsUppearcaseAllowed` int DEFAULT '0',
  `RSTM_IsLowercaseAllowed` int DEFAULT '0',
  `RSNT_ExcludedChars` varchar(45) DEFAULT NULL,
  `RSTM_IsPooling` int DEFAULT '0',
  `RSTM_MinPoolCount` int DEFAULT '0',
  `RSTM_MaxPoolCount` int DEFAULT '0',
  `RSTM_IsDefault` int DEFAULT '0',
  PRIMARY KEY (`RSTM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rsnserializationtemplatemaster`
--

LOCK TABLES `rsnserializationtemplatemaster` WRITE;
/*!40000 ALTER TABLE `rsnserializationtemplatemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `rsnserializationtemplatemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schemeemailtransaction`
--

DROP TABLE IF EXISTS `schemeemailtransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schemeemailtransaction` (
  `SEM_ID` int NOT NULL AUTO_INCREMENT,
  `SEM_SchemeID` int DEFAULT NULL,
  `SEM_TOSCPID` int DEFAULT NULL,
  `SEM_IsEmailSent` int DEFAULT '0',
  `SEM_IsTelegramMsgSent` int DEFAULT '0',
  `SEM_TimeStamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `SEM_EndDate` date DEFAULT NULL,
  `SEM_Status` int DEFAULT '0',
  PRIMARY KEY (`SEM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schemeemailtransaction`
--

LOCK TABLES `schemeemailtransaction` WRITE;
/*!40000 ALTER TABLE `schemeemailtransaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `schemeemailtransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schemefreeproductmaster`
--

DROP TABLE IF EXISTS `schemefreeproductmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schemefreeproductmaster` (
  `SFPM_ID` int NOT NULL AUTO_INCREMENT,
  `SFPM_SM_ID` int NOT NULL,
  `SFPM_ProductID` int NOT NULL,
  `SFPM_Quantity` int DEFAULT '1',
  PRIMARY KEY (`SFPM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schemefreeproductmaster`
--

LOCK TABLES `schemefreeproductmaster` WRITE;
/*!40000 ALTER TABLE `schemefreeproductmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `schemefreeproductmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schememaster`
--

DROP TABLE IF EXISTS `schememaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schememaster` (
  `SM_ID` int NOT NULL AUTO_INCREMENT,
  `SM_SchemeName` varchar(255) NOT NULL,
  `SM_Type` varchar(100) DEFAULT NULL,
  `SM_Discount` decimal(10,2) DEFAULT NULL,
  `SM_DiscountType` int DEFAULT NULL,
  `SM_GiftArticle` varchar(255) DEFAULT NULL,
  `SM_StartDate` date DEFAULT NULL,
  `SM_EndDate` date DEFAULT NULL,
  `SM_FromSCPID` int DEFAULT NULL,
  `SM_AllRegionSelected` tinyint(1) DEFAULT '0',
  `SM_AllSCPSelected` tinyint(1) DEFAULT '0',
  `SM_AllProductSelected` tinyint(1) DEFAULT '0',
  `SM_SchemeDescription` text,
  `SM_IsCombinationRequired` int DEFAULT '0',
  `SM_Status` int DEFAULT NULL,
  `SM_SuspendRemark` text,
  `SM_CompanyID` int DEFAULT NULL,
  `SM_CompanyGrpID` int DEFAULT NULL,
  `SM_CreatedBy` int DEFAULT NULL,
  `SM_CreatedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `SM_ModifiedBy` int DEFAULT NULL,
  `SM_ModifiedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`SM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schememaster`
--

LOCK TABLES `schememaster` WRITE;
/*!40000 ALTER TABLE `schememaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `schememaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schemeproductmaster`
--

DROP TABLE IF EXISTS `schemeproductmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schemeproductmaster` (
  `SPM_ID` int NOT NULL AUTO_INCREMENT,
  `SPM_SM_ID` int NOT NULL,
  `SPM_ProductID` int NOT NULL,
  `SPM_Quantity` int DEFAULT '1',
  PRIMARY KEY (`SPM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schemeproductmaster`
--

LOCK TABLES `schemeproductmaster` WRITE;
/*!40000 ALTER TABLE `schemeproductmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `schemeproductmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schemeregionmaster`
--

DROP TABLE IF EXISTS `schemeregionmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schemeregionmaster` (
  `SRM_ID` int NOT NULL AUTO_INCREMENT,
  `SRM_SM_ID` int NOT NULL,
  `SRM_RegionID` int NOT NULL,
  PRIMARY KEY (`SRM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schemeregionmaster`
--

LOCK TABLES `schemeregionmaster` WRITE;
/*!40000 ALTER TABLE `schemeregionmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `schemeregionmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schemescpmaster`
--

DROP TABLE IF EXISTS `schemescpmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schemescpmaster` (
  `SSM_ID` int NOT NULL AUTO_INCREMENT,
  `SSM_SM_ID` int NOT NULL,
  `SSM_SCPID` int NOT NULL,
  PRIMARY KEY (`SSM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schemescpmaster`
--

LOCK TABLES `schemescpmaster` WRITE;
/*!40000 ALTER TABLE `schemescpmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `schemescpmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scpconfiguration`
--

DROP TABLE IF EXISTS `scpconfiguration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scpconfiguration` (
  `SCP_ID` int NOT NULL AUTO_INCREMENT,
  `SCP_CompanyGrpID` int DEFAULT NULL,
  `SCP_CompanyID` int DEFAULT NULL,
  `SCP_LevelNo` int DEFAULT NULL,
  `SCP_LevelName` varchar(45) DEFAULT NULL,
  `SCP_AllowMutliplePartySameLevelOutward` tinyint DEFAULT NULL,
  `SCP_AllowMutliplePartyOutward` tinyint DEFAULT NULL,
  `SCP_Createdby` int DEFAULT NULL,
  `SCP_CreatedTimestamp` datetime DEFAULT NULL,
  `SCP_ModifiedBy` int DEFAULT NULL,
  `SCP_ModifiedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`SCP_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Supply Chain Partner Configuration';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scpconfiguration`
--

LOCK TABLES `scpconfiguration` WRITE;
/*!40000 ALTER TABLE `scpconfiguration` DISABLE KEYS */;
INSERT INTO `scpconfiguration` VALUES (1,1,NULL,1,'Warehouse',0,1,0,'2026-01-07 16:18:42',0,'2026-01-07 16:18:42'),(2,1,NULL,2,'Distributor',0,0,0,'2026-01-07 16:18:42',0,'2026-01-07 16:18:42');
/*!40000 ALTER TABLE `scpconfiguration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scpmaster`
--

DROP TABLE IF EXISTS `scpmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scpmaster` (
  `SCPM_ID` int NOT NULL AUTO_INCREMENT,
  `SCPM_Code` varchar(100) DEFAULT NULL,
  `SCPM_Name` varchar(45) DEFAULT NULL,
  `SCPM_LevelNo` int DEFAULT NULL,
  `SCPM_SCPConfig_ID` int DEFAULT NULL,
  `SCPM_Status` tinyint DEFAULT NULL,
  `SCP_SuspendRemark` varchar(1000) DEFAULT NULL,
  `SCPM_ScanningMode` varchar(25) DEFAULT NULL,
  `SCPM_CreatedBy` varchar(45) DEFAULT NULL,
  `SCPM_CreatedTimestamp` datetime DEFAULT NULL,
  `SCPM_ModifiedBy` varchar(45) DEFAULT NULL,
  `SCPM_ModifiedTimestamp` datetime DEFAULT NULL,
  `SCPM_CompanyGrpID` int DEFAULT NULL,
  `SCPM_CompanyID` int DEFAULT NULL,
  PRIMARY KEY (`SCPM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Master Details of Supply Chain Partner\n';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scpmaster`
--

LOCK TABLES `scpmaster` WRITE;
/*!40000 ALTER TABLE `scpmaster` DISABLE KEYS */;
INSERT INTO `scpmaster` VALUES (36,'N01','Nashik',NULL,24,1,NULL,'1',NULL,NULL,NULL,NULL,15,19),(37,'B01','Baddi',NULL,24,1,NULL,'1',NULL,NULL,NULL,NULL,15,19),(38,'BW','Bhiwandi',NULL,23,1,NULL,'1',NULL,NULL,NULL,NULL,15,19);
/*!40000 ALTER TABLE `scpmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scpmasteroutwardlist`
--

DROP TABLE IF EXISTS `scpmasteroutwardlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scpmasteroutwardlist` (
  `SCPMO_ID` int NOT NULL AUTO_INCREMENT,
  `SCPMO_SCPM_ID` int DEFAULT NULL,
  `SCPMO_OutwardParty` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`SCPMO_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scpmasteroutwardlist`
--

LOCK TABLES `scpmasteroutwardlist` WRITE;
/*!40000 ALTER TABLE `scpmasteroutwardlist` DISABLE KEYS */;
INSERT INTO `scpmasteroutwardlist` VALUES (1,3,'1'),(2,3,'2');
/*!40000 ALTER TABLE `scpmasteroutwardlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scpmastersameleveloutwardlist`
--

DROP TABLE IF EXISTS `scpmastersameleveloutwardlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scpmastersameleveloutwardlist` (
  `SCPMSL_ID` int NOT NULL AUTO_INCREMENT,
  `SCPMSL_SCPM_ID` int DEFAULT NULL,
  `SCPMSL_SameLevelParty` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`SCPMSL_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scpmastersameleveloutwardlist`
--

LOCK TABLES `scpmastersameleveloutwardlist` WRITE;
/*!40000 ALTER TABLE `scpmastersameleveloutwardlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `scpmastersameleveloutwardlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serailzationtemplatelist`
--

DROP TABLE IF EXISTS `serailzationtemplatelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serailzationtemplatelist` (
  `STL_ID` int NOT NULL AUTO_INCREMENT,
  `STL_ComId` int DEFAULT NULL,
  `STL_Name` varchar(255) DEFAULT NULL,
  `STL_Type` int DEFAULT NULL,
  `STL_PartyID` int DEFAULT NULL,
  `STL_CreatedBy` int DEFAULT NULL,
  `STL_CreatedTimestamp` datetime DEFAULT NULL,
  `STL_ModifiedBy` int DEFAULT NULL,
  `STL_ModifiedTimestamp` datetime DEFAULT NULL,
  `STL_IsDefault` int DEFAULT NULL,
  PRIMARY KEY (`STL_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serailzationtemplatelist`
--

LOCK TABLES `serailzationtemplatelist` WRITE;
/*!40000 ALTER TABLE `serailzationtemplatelist` DISABLE KEYS */;
/*!40000 ALTER TABLE `serailzationtemplatelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serializationtemplateparameterdetails`
--

DROP TABLE IF EXISTS `serializationtemplateparameterdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serializationtemplateparameterdetails` (
  `STPD_ID` int NOT NULL AUTO_INCREMENT,
  `STPD_STL_ID` int DEFAULT NULL,
  `STPD_PD_ID` int DEFAULT NULL,
  `STPD_Value` json DEFAULT NULL,
  PRIMARY KEY (`STPD_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serializationtemplateparameterdetails`
--

LOCK TABLES `serializationtemplateparameterdetails` WRITE;
/*!40000 ALTER TABLE `serializationtemplateparameterdetails` DISABLE KEYS */;
/*!40000 ALTER TABLE `serializationtemplateparameterdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `serializationtemplateplantmapping`
--

DROP TABLE IF EXISTS `serializationtemplateplantmapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serializationtemplateplantmapping` (
  `STPM_ID` int NOT NULL AUTO_INCREMENT,
  `STPM_STL_ID` int DEFAULT NULL,
  `STPM_PlantID` int DEFAULT NULL,
  `STPM_status` int DEFAULT '1',
  PRIMARY KEY (`STPM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serializationtemplateplantmapping`
--

LOCK TABLES `serializationtemplateplantmapping` WRITE;
/*!40000 ALTER TABLE `serializationtemplateplantmapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `serializationtemplateplantmapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipmentbatchallocation`
--

DROP TABLE IF EXISTS `shipmentbatchallocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipmentbatchallocation` (
  `SBA_ID` int NOT NULL AUTO_INCREMENT,
  `SBA_SHPH_ShipmentID` int DEFAULT NULL,
  `SBA_BatchID` int DEFAULT NULL,
  `SBA_Count` int DEFAULT NULL,
  `SBA_SCPID` int DEFAULT NULL,
  `SBA_ProductID` int DEFAULT NULL,
  PRIMARY KEY (`SBA_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipmentbatchallocation`
--

LOCK TABLES `shipmentbatchallocation` WRITE;
/*!40000 ALTER TABLE `shipmentbatchallocation` DISABLE KEYS */;
INSERT INTO `shipmentbatchallocation` VALUES (1,1,19,2,2,5),(2,2,21,4,2,5),(3,3,22,3,2,7),(4,3,23,2,2,7),(5,4,24,7,2,8),(6,5,25,4,2,9),(7,5,26,3,2,9),(8,6,23,1,2,7),(9,7,27,2,2,10),(10,8,28,3,2,11),(11,9,31,4,1,13),(12,10,12,1,2,2),(13,11,33,3,2,14),(14,11,34,2,2,14),(15,12,12,1,2,2),(16,13,12,1,2,2),(17,14,36,4,2,15),(18,15,41,4,2,16),(19,15,40,3,2,16),(20,16,46,6,2,17),(21,17,12,9,2,2),(22,17,16,1,2,2),(23,18,48,3,36,18),(24,18,50,1,36,18),(25,19,50,1,36,18);
/*!40000 ALTER TABLE `shipmentbatchallocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipmentlist`
--

DROP TABLE IF EXISTS `shipmentlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipmentlist` (
  `SHPH_ShipmentID` int NOT NULL AUTO_INCREMENT,
  `SHPH_ShipmentType` varchar(45) DEFAULT NULL,
  `SHPH_ShipmentCode` varchar(45) DEFAULT NULL,
  `SHPH_ShipmentDate` varchar(45) DEFAULT NULL,
  `SHPH_LogisticPartyID` int DEFAULT NULL,
  `SHPH_LogisticVehicleID` int DEFAULT NULL,
  `SHPH_SCPRouteID` int DEFAULT NULL,
  `SHPH_InvoiceNumber` varchar(45) DEFAULT NULL,
  `SHPH_ByProductVendorScanMode` tinyint DEFAULT NULL,
  `SHPH_CreatedBy` varchar(45) DEFAULT NULL,
  `SHPH_CreatedTimestamp` datetime DEFAULT NULL,
  `SHPH_ModifiedBy` varchar(45) DEFAULT NULL,
  `SHPH_ModifiedTimestamp` datetime DEFAULT NULL,
  `SHPH_CompanyGrpId` varchar(45) DEFAULT NULL,
  `SHPH_CompanyID` varchar(45) DEFAULT NULL,
  `SHPH_Status` tinyint DEFAULT NULL,
  `SHPH_FromSCPCode` int DEFAULT NULL,
  `SHPH_Comment` varchar(1000) DEFAULT NULL,
  `SHPH_IsSync` int DEFAULT '0',
  `SHPH_DriverName` varchar(45) DEFAULT NULL,
  `SHPH_DriverContactNo` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`SHPH_ShipmentID`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Shipment Header Information';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipmentlist`
--

LOCK TABLES `shipmentlist` WRITE;
/*!40000 ALTER TABLE `shipmentlist` DISABLE KEYS */;
INSERT INTO `shipmentlist` VALUES (21,'New Order','BW_4','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:47',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151'),(22,'New Order','BW_5','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:48',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151'),(23,'New Order','BW_6','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:49',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151'),(24,'New Order','BW_7','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:49',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151'),(25,'New Order','BW_8','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:53',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151'),(26,'New Order','BW_9','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:53',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151'),(27,'New Order','BW_10','20-01-2026',10,13,12,NULL,1,'33','2026-01-15 09:00:54',NULL,NULL,'15','19',2,38,'',0,'lkjj','3962584151');
/*!40000 ALTER TABLE `shipmentlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipmentmaster`
--

DROP TABLE IF EXISTS `shipmentmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipmentmaster` (
  `SHPD_ShipmentMID` int NOT NULL AUTO_INCREMENT,
  `SHPD_ShipmentID` int NOT NULL,
  `SHPD_SCPCode` int DEFAULT NULL,
  `SHPD_OrderID` int NOT NULL,
  `SHPD_ProductCode` varchar(45) DEFAULT NULL,
  `SHPD_ProductName` varchar(45) DEFAULT NULL,
  `SHPD_OrderQty` int DEFAULT NULL,
  `SHPD_ShipQty` double DEFAULT NULL,
  `SHPD_ScanQty` double DEFAULT NULL,
  `SHPD_ReceivedQty` double DEFAULT NULL,
  `SHPD_ReturnQty` double DEFAULT '0',
  `SHPD_DstroyQty` double DEFAULT NULL,
  `SHPD_PendingQty` double DEFAULT NULL,
  `SHPD_CompanyGrpId` varchar(45) DEFAULT NULL,
  `SHPD_CompanyID` varchar(45) DEFAULT NULL,
  `SHPD_CreatedBy` varchar(45) DEFAULT NULL,
  `SHPD_CreatedTimestamp` datetime DEFAULT NULL,
  `SHPD_ModifiedBy` varchar(45) DEFAULT NULL,
  `SHPD_ModifiedTimestamp` datetime DEFAULT NULL,
  `SHPD_IsOutwardEmailSent` int DEFAULT '0',
  `SHPD_IsOutwardTelegramMsgSent` int DEFAULT '0',
  PRIMARY KEY (`SHPD_ShipmentMID`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Shipment Detail Information	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipmentmaster`
--

LOCK TABLES `shipmentmaster` WRITE;
/*!40000 ALTER TABLE `shipmentmaster` DISABLE KEYS */;
INSERT INTO `shipmentmaster` VALUES (18,18,36,25,'DM01','DOBULE MARI PAPAD 400 GM',4,4,2,NULL,0,NULL,0,'15','19','33','2018-06-21 02:00:38','33','2019-02-03 05:47:15',0,0),(19,19,36,26,'DM01','DOBULE MARI PAPAD 400 GM',2,1,1,NULL,0,NULL,1,'15','19','33','2019-03-24 12:21:35','33','2019-04-24 22:03:13',2,2),(20,20,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:45',NULL,NULL,0,0),(21,21,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:48',NULL,NULL,0,0),(22,22,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:49',NULL,NULL,0,0),(23,23,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:49',NULL,NULL,0,0),(24,24,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:50',NULL,NULL,0,0),(25,25,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:53',NULL,NULL,0,0),(26,26,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:54',NULL,NULL,0,0),(27,27,36,26,'DM01','DOBULE MARI PAPAD 400 GM',1,1,NULL,NULL,0,NULL,0,'15','19','33','2026-01-15 09:00:54',NULL,NULL,0,0);
/*!40000 ALTER TABLE `shipmentmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipmentreturnlist`
--

DROP TABLE IF EXISTS `shipmentreturnlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipmentreturnlist` (
  `SHPR_ShipmentID` int NOT NULL AUTO_INCREMENT,
  `SHPR_ShipmentType` varchar(45) DEFAULT NULL,
  `SHPR_ShipmentReturnCode` varchar(45) DEFAULT NULL,
  `SHPR_ShipmentDate` varchar(45) DEFAULT NULL,
  `SHPR_LogisticPartyID` int DEFAULT NULL,
  `SHPR_LogisticVehicleID` int DEFAULT NULL,
  `SHPR_SCPRouteID` int DEFAULT NULL,
  `SHPR_InvoiceNumber` varchar(45) DEFAULT NULL,
  `SHPR_ByProductVendorScanMode` tinyint DEFAULT NULL,
  `SHPR_CreatedBy` varchar(45) DEFAULT NULL,
  `SHPR_CreatedTimestamp` datetime DEFAULT NULL,
  `SHPR_ModifiedBy` varchar(45) DEFAULT NULL,
  `SHPR_ModifiedTimestamp` datetime DEFAULT NULL,
  `SHPR_CompanyGrpId` varchar(45) DEFAULT NULL,
  `SHPR_CompanyID` varchar(45) DEFAULT NULL,
  `SHPR_Status` tinyint DEFAULT NULL,
  `SHPR_ReturnReason` int DEFAULT NULL,
  `SHPR_ReturnRemarks` varchar(255) DEFAULT NULL,
  `SHPR_FromSCPCode` int DEFAULT NULL,
  `SHPR_SCPCode` int DEFAULT NULL,
  `SHPR_IsOutwardEmailSent` int DEFAULT '0',
  `SHPR_Comment` varchar(45) DEFAULT NULL,
  `SHPR_IsOutwardTelegramMsgSent` int DEFAULT '0',
  PRIMARY KEY (`SHPR_ShipmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipmentreturnlist`
--

LOCK TABLES `shipmentreturnlist` WRITE;
/*!40000 ALTER TABLE `shipmentreturnlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipmentreturnlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipmentreturnmaster`
--

DROP TABLE IF EXISTS `shipmentreturnmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipmentreturnmaster` (
  `SHPDR_ShipmentMID` int NOT NULL AUTO_INCREMENT,
  `SHPDR_ShipmentID` int NOT NULL,
  `SHPDR_SCPCode` int DEFAULT NULL,
  `SHPDR_ShipmentCode` varchar(45) DEFAULT NULL,
  `SHPDR_ProductCode` varchar(45) DEFAULT NULL,
  `SHPDR_ProductName` varchar(45) DEFAULT NULL,
  `SHPDR_ShipQty` double DEFAULT NULL,
  `SHPDR_ScanQty` double DEFAULT NULL,
  `SHPDR_ReceivedQty` double DEFAULT NULL,
  `SHPDR_ReturnQty` double DEFAULT NULL,
  `SHPDR_DstroyQty` double DEFAULT NULL,
  `SHPDR_PendingQty` double DEFAULT NULL,
  `SHPDR_CompanyGrpId` varchar(45) DEFAULT NULL,
  `SHPDR_CompanyID` varchar(45) DEFAULT NULL,
  `SHPDR_CreatedBy` varchar(45) DEFAULT NULL,
  `SHPDR_CreatedTimestamp` datetime DEFAULT NULL,
  `SHPDR_ModifiedBy` varchar(45) DEFAULT NULL,
  `SHPDR_ModifiedTimestamp` datetime DEFAULT NULL,
  `SHPDR_OrderQty` int DEFAULT NULL,
  PRIMARY KEY (`SHPDR_ShipmentMID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipmentreturnmaster`
--

LOCK TABLES `shipmentreturnmaster` WRITE;
/*!40000 ALTER TABLE `shipmentreturnmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipmentreturnmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skuformatmaster`
--

DROP TABLE IF EXISTS `skuformatmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skuformatmaster` (
  `SFM_Id` int NOT NULL AUTO_INCREMENT,
  `SFM_Format` varchar(100) NOT NULL,
  `SFM_Status` int DEFAULT '1',
  PRIMARY KEY (`SFM_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skuformatmaster`
--

LOCK TABLES `skuformatmaster` WRITE;
/*!40000 ALTER TABLE `skuformatmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `skuformatmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sscctemplatemaster`
--

DROP TABLE IF EXISTS `sscctemplatemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sscctemplatemaster` (
  `STM_ID` int NOT NULL AUTO_INCREMENT,
  `STM_STL_ID` int DEFAULT NULL,
  `STM_PalletGCPID` int DEFAULT NULL,
  `STM_CaseGCPID` int DEFAULT NULL,
  `STM_InnerQtyGCPID` int DEFAULT NULL,
  `STM_SSCCReuse` int DEFAULT NULL,
  PRIMARY KEY (`STM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sscctemplatemaster`
--

LOCK TABLES `sscctemplatemaster` WRITE;
/*!40000 ALTER TABLE `sscctemplatemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `sscctemplatemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statustransaction`
--

DROP TABLE IF EXISTS `statustransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statustransaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `referenceType` varchar(50) DEFAULT NULL,
  `referenceId` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `statusTimestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `scpid` int DEFAULT NULL,
  `companyid` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statustransaction`
--

LOCK TABLES `statustransaction` WRITE;
/*!40000 ALTER TABLE `statustransaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `statustransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `strolemaster`
--

DROP TABLE IF EXISTS `strolemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `strolemaster` (
  `STM_ID` int NOT NULL AUTO_INCREMENT,
  `STM_RoleName` varchar(100) NOT NULL,
  `STM_IsEnabled` tinyint(1) NOT NULL,
  `STM_Mask` int NOT NULL,
  `STM_AppType` int NOT NULL,
  PRIMARY KEY (`STM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `strolemaster`
--

LOCK TABLES `strolemaster` WRITE;
/*!40000 ALTER TABLE `strolemaster` DISABLE KEYS */;
INSERT INTO `strolemaster` VALUES (117,'Import Master Data',0,1,2),(118,'Product Master',1,2,2),(119,'User Management',0,4,2),(120,'Batch Creation',1,8,2),(121,'Camera Setup',1,16,2),(122,'Total Production Report',1,32,2),(123,'Product Details',1,64,2),(124,'Reprint Label',0,128,2),(125,'Batch Cancel',1,256,2),(126,'Shipment Scanning',1,1,3);
/*!40000 ALTER TABLE `strolemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submenumaster`
--

DROP TABLE IF EXISTS `submenumaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submenumaster` (
  `SMNM_SubMenuID` int NOT NULL AUTO_INCREMENT,
  `SMNM_SubMenuName` varchar(45) DEFAULT NULL,
  `SMNM_SubMenuDisplay` varchar(45) DEFAULT NULL,
  `SMNM_MenuID` int DEFAULT NULL,
  `SMNM_AllowedRoles` json DEFAULT NULL,
  `SMNM_SubMenuIndex` int DEFAULT NULL,
  `SMNM_IsRequired` int DEFAULT '1',
  `SMNM_RightType` int DEFAULT NULL,
  `SMNM_ImgPath` varchar(45) DEFAULT NULL,
  `SMNM_SubMenuURL` varchar(45) DEFAULT NULL,
  `SMNM_CreatedBy` varchar(45) DEFAULT NULL,
  `SMNM_CreatedTimestamp` datetime DEFAULT NULL,
  `SMNM_MachineType` varchar(45) DEFAULT 'SmartTrackerPlus' COMMENT 'SmartTracker\nSmartTrackerPlus\nSTMaster\nWarehouse',
  PRIMARY KEY (`SMNM_SubMenuID`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Sub Menu Master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submenumaster`
--

LOCK TABLES `submenumaster` WRITE;
/*!40000 ALTER TABLE `submenumaster` DISABLE KEYS */;
INSERT INTO `submenumaster` VALUES (1,'smCompanyGroupMaster','Company Group Master',1,'[0]',1,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(2,'smCompanyMaster','Company Master',1,'[0]',2,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(4,'smCompanyITPolicy','Company IT Policy Master',1,'[1, 2, 3, 0]',3,1,1,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(6,'smGroupMaster','Group Master',1,'[1, 2, 3, 0]',4,1,1,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(8,'smUserMaster','User Master',1,'[1, 2, 3, 0]',5,1,1,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(9,'smSCPMaster','SCP Master',1,'[1]',6,1,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(10,'smLogisticPartyMaster','Logistic Party Master',1,'[3]',7,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(11,'smRoutingMaster','Routing Master',1,'[3]',8,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(12,'smLocationMaster','Location Master',1,'[1, 3]',9,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(13,'smDateMaster','Date Master',1,'[2]',10,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(14,'smLabelConfigMaster','Label Config Master',1,'[2]',11,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(15,'smLabelMaster','Label Master',1,'[2]',12,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(16,'smTemplateMaster','Template Master',1,'[2]',13,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(17,'smSerializationTemplateMaster','Serialization Template Master',1,'[2]',14,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(18,'smProductMaster','Product Master',1,'[2]',15,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(19,'smMappingMaster','Mapping Master',1,'[2]',16,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(21,'smSCPConfiguration','SCP Configuration',2,'[0]',2,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(22,'smMessageConfiguration','Message Configuration',2,'[1, 3]',3,0,1,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(23,'smOrderMaster','Order Master (by SCP)',3,'[3]',1,0,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(24,'smOrderMaster','Order Master (by Sales Officer)',3,'[1]',2,0,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(25,'smShipmentMaster','Shipment Master',4,'[3]',1,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(26,'smShipmentTransit','Shipment Scanning',4,'[3]',2,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(27,'smShipmentReturn','Shipment Return Master',4,'[3]',3,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(28,'smOrderApproval','Order Approval',5,'[3]',1,0,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(29,'smShipmentApproval','Shipment Approval',5,'[3]',2,0,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(30,'smBatchVerification','Batch Verification',5,'[2]',3,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(31,'smAuditTrailReport','AuditTrail Report',6,'[1, 2, 3]',1,0,1,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(32,'smBatchReport','Batch Report',6,'[2]',2,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(33,'smRsnDetailsReport','Supply Chain Transaction',6,'[1]',3,0,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(34,'smSSCCDetailReport','SSCC Detail Report',6,'[2]',4,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(35,'smInventoryReport','Inventory Report',6,'[3]',5,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(36,'smOrderReport','Order Report',6,'[3]',6,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(37,'smShipmentReport','Shipment Report',6,'[3]',7,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(38,'smRSN Report','RSN Report',6,'[2]',8,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(39,'smBatchMaster','Batch Master',7,'[2]',3,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(40,'smUploadDownloadBatch','Upload Download Batch',7,'[2]',3,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(41,'smReDownloadBatch','ReDownload Batch',7,'[2]',4,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(42,'smPalletBatch','Pallet Batch',8,'[2]',1,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(43,'smOnlyTertiarBatch','Only Tertiary Batch',8,'[2]',2,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(44,'smReconciliation','Reconciliation',8,'[2]',3,0,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(45,'smSchemeMaster','Scheme Master',1,'[1]',17,0,3,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(46,'smOrderList','View Rights',9,'[4]',1,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus'),(47,'smCompanyConfiguration','Company Configuration',2,'[0]',1,1,0,NULL,NULL,NULL,NULL,'SmartTrackerPlus');
/*!40000 ALTER TABLE `submenumaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemconfiguration`
--

DROP TABLE IF EXISTS `systemconfiguration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemconfiguration` (
  `SCF_ID` int NOT NULL AUTO_INCREMENT,
  `SCF_CompanyID` varchar(45) DEFAULT NULL,
  `SCF_CompanyGroupID` varchar(45) DEFAULT NULL,
  `SCF_ProductVerify` varchar(45) DEFAULT NULL,
  `SCF_LabelVerify` varchar(45) DEFAULT NULL,
  `SCF_BatchVerify` varchar(45) DEFAULT NULL,
  `SCF_SerializationTemplateVerify` varchar(45) DEFAULT NULL,
  `SCF_SCPVerify` varchar(45) DEFAULT NULL,
  `SCF_BatchRecallVerify` varchar(45) DEFAULT NULL,
  `SCF_ReconciliationBatchVerify` varchar(45) DEFAULT NULL,
  `SCF_EmailConfiguration` varchar(45) DEFAULT NULL,
  `SCF_CreatedBy` varchar(45) DEFAULT NULL,
  `SCF_CreatedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`SCF_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='System Configuration';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemconfiguration`
--

LOCK TABLES `systemconfiguration` WRITE;
/*!40000 ALTER TABLE `systemconfiguration` DISABLE KEYS */;
/*!40000 ALTER TABLE `systemconfiguration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templatelist`
--

DROP TABLE IF EXISTS `templatelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templatelist` (
  `TL_ID` int NOT NULL AUTO_INCREMENT,
  `TL_Name` varchar(45) DEFAULT NULL,
  `TL_MasterScreenName` varchar(45) DEFAULT NULL,
  `TL_CompanyID` int DEFAULT NULL,
  `TL_CompanyGrpID` int DEFAULT NULL,
  `TL_Status` int DEFAULT NULL,
  `TL_CreatedBy` int DEFAULT NULL,
  `TL_CreatedTimeStamp` datetime DEFAULT NULL,
  `TL_ModifiedBy` int DEFAULT NULL,
  `TL_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`TL_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templatelist`
--

LOCK TABLES `templatelist` WRITE;
/*!40000 ALTER TABLE `templatelist` DISABLE KEYS */;
/*!40000 ALTER TABLE `templatelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templatemaster`
--

DROP TABLE IF EXISTS `templatemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templatemaster` (
  `TM_ID` int NOT NULL AUTO_INCREMENT,
  `TM_TL_ID` int DEFAULT NULL,
  `TM_FieldType` int DEFAULT NULL,
  `TM_FieldName` varchar(45) DEFAULT NULL,
  `TM_FieldDatatype` int DEFAULT NULL,
  `TM_IsRequired` int DEFAULT NULL,
  `TM_CreatedBy` int DEFAULT NULL,
  `TM_CreatedTimeStamp` datetime DEFAULT NULL,
  `TM_ModifiedBy` int DEFAULT NULL,
  `TM_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`TM_ID`),
  KEY `TM_TL_ID` (`TM_TL_ID`),
  CONSTRAINT `templatemaster_ibfk_1` FOREIGN KEY (`TM_TL_ID`) REFERENCES `templatelist` (`TL_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templatemaster`
--

LOCK TABLES `templatemaster` WRITE;
/*!40000 ALTER TABLE `templatemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `templatemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploadtransaction`
--

DROP TABLE IF EXISTS `uploadtransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploadtransaction` (
  `UT_ID` int NOT NULL AUTO_INCREMENT,
  `UT_FileName` varchar(255) DEFAULT NULL,
  `UT_Status` int DEFAULT NULL,
  `UT_CreatedBy` int DEFAULT NULL,
  `UT_CreatedTimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`UT_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploadtransaction`
--

LOCK TABLES `uploadtransaction` WRITE;
/*!40000 ALTER TABLE `uploadtransaction` DISABLE KEYS */;
INSERT INTO `uploadtransaction` VALUES (26,'CY50ITMM-Corrected_21.xlsx',1,21,'2025-12-17 12:29:53');
/*!40000 ALTER TABLE `uploadtransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usermaster`
--

DROP TABLE IF EXISTS `usermaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usermaster` (
  `UM_UserId` int NOT NULL AUTO_INCREMENT,
  `UM_UserCode` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `UM_DisplayName` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UM_DomainUser` int DEFAULT '0',
  `UM_Password` varchar(455) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UM_LastPwdChangeDate` datetime DEFAULT NULL,
  `UM_PasswordChangeDate` datetime DEFAULT NULL,
  `UM_EmailAddress` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UM_PhoneNumber` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UM_Status` int DEFAULT NULL,
  `UM_PasswordAttemptsCount` int DEFAULT NULL,
  `UM_Isuserloggedin` tinyint DEFAULT NULL,
  `UM_GroupId` int DEFAULT NULL,
  `UM_CompanyGrpID` int DEFAULT NULL,
  `UM_CompanyID` int DEFAULT NULL,
  `UM_CreatedBy` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UM_CreatedTimestamp` datetime DEFAULT NULL,
  `UM_ModifiedBy` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UM_ModifiedTimeStamp` datetime DEFAULT NULL,
  `UM_FailedCount` int DEFAULT NULL,
  `UM_IsChangeNewPwd` int DEFAULT NULL,
  `UM_DefaultSCPId` int DEFAULT '0',
  `UM_UserType` int DEFAULT NULL,
  `UM_ImageName` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`UM_UserId`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='User Master Details';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usermaster`
--

LOCK TABLES `usermaster` WRITE;
/*!40000 ALTER TABLE `usermaster` DISABLE KEYS */;
INSERT INTO `usermaster` VALUES (32,'WH','Bhiwandi WH',0,'XuBTiprTaSfu7t0AVuabOg==',NULL,'2026-01-20 04:50:14','testerjenisha@gmail.com','',1,0,NULL,27,15,19,'31','2026-01-20 04:50:14',NULL,NULL,10,0,38,3,NULL),(33,'WH1','Bhiwandi1',0,'BniutHiqiKpYC77eLlq9ag==',NULL,'2026-01-20 05:06:16','b@gmail.com','',1,0,1,27,15,19,'31','2026-01-20 05:05:52',NULL,NULL,0,1,38,3,NULL);
/*!40000 ALTER TABLE `usermaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userplantlinemaster`
--

DROP TABLE IF EXISTS `userplantlinemaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userplantlinemaster` (
  `UPLM_ID` int NOT NULL AUTO_INCREMENT,
  `UPLM_UserID` int DEFAULT NULL,
  `UPLM_PlantID` int DEFAULT NULL,
  `UPLM_LineID` int DEFAULT NULL,
  PRIMARY KEY (`UPLM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userplantlinemaster`
--

LOCK TABLES `userplantlinemaster` WRITE;
/*!40000 ALTER TABLE `userplantlinemaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `userplantlinemaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userpwdtransaction`
--

DROP TABLE IF EXISTS `userpwdtransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userpwdtransaction` (
  `UPT_TranID` int NOT NULL AUTO_INCREMENT,
  `UPT_UserID` int DEFAULT NULL,
  `UPT_Password` varchar(255) DEFAULT NULL,
  `UPT_Timestamp` datetime DEFAULT NULL,
  `UPT_CompanyID` int DEFAULT NULL,
  `UPT_CompanyGrpID` int DEFAULT NULL,
  PRIMARY KEY (`UPT_TranID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='User Password History	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userpwdtransaction`
--

LOCK TABLES `userpwdtransaction` WRITE;
/*!40000 ALTER TABLE `userpwdtransaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `userpwdtransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userscpmaster`
--

DROP TABLE IF EXISTS `userscpmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userscpmaster` (
  `USM_ID` int NOT NULL AUTO_INCREMENT,
  `USM_UserID` int NOT NULL,
  `USM_SCPID` int NOT NULL,
  `USM_CreatedBy` int NOT NULL,
  `USM_CreatedDateTime` datetime NOT NULL,
  PRIMARY KEY (`USM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='usermaster -> scpmaster';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userscpmaster`
--

LOCK TABLES `userscpmaster` WRITE;
/*!40000 ALTER TABLE `userscpmaster` DISABLE KEYS */;
/*!40000 ALTER TABLE `userscpmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `widgets`
--

DROP TABLE IF EXISTS `widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `widgets` (
  `Widget_ID` int NOT NULL AUTO_INCREMENT,
  `Widget_UserId` int DEFAULT NULL,
  `Widget_Shipment` tinyint(1) DEFAULT NULL,
  `Widget_Order` tinyint(1) DEFAULT NULL,
  `Widget_Inventory` tinyint(1) DEFAULT NULL,
  `Widget_Logistic` tinyint(1) DEFAULT NULL,
  `Widget_Routing` tinyint(1) DEFAULT NULL,
  `Widget_Scp` tinyint(1) DEFAULT NULL,
  `Widget_User` tinyint(1) DEFAULT NULL,
  `Widget_CreatedTimestamp` datetime DEFAULT NULL,
  `Widget_ModifiedTimeStamp` datetime DEFAULT NULL,
  PRIMARY KEY (`Widget_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `widgets`
--

LOCK TABLES `widgets` WRITE;
/*!40000 ALTER TABLE `widgets` DISABLE KEYS */;
INSERT INTO `widgets` VALUES (1,1,1,1,0,0,0,1,1,'2026-01-07 10:54:19','2026-01-07 16:24:20');
/*!40000 ALTER TABLE `widgets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-21  9:58:04
