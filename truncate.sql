use dispatchdatabase;
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audittrail;
TRUNCATE TABLE audittransaction;
TRUNCATE TABLE batchlist;
TRUNCATE TABLE batchmaster;
TRUNCATE TABLE companyitpolicymaster;
TRUNCATE TABLE companymaster;
TRUNCATE TABLE dbversion;
TRUNCATE TABLE dbversionhistory;
TRUNCATE TABLE deliverychallanlist;
TRUNCATE TABLE deliverychallanmaster;
TRUNCATE TABLE groupmaster;
TRUNCATE TABLE grouproleinfo;
TRUNCATE TABLE importrsnshipment;
TRUNCATE TABLE inventory;
TRUNCATE TABLE locationmaster;
TRUNCATE TABLE logisticcompanymaster;
TRUNCATE TABLE logisticcompanyvehiclemaster;
TRUNCATE TABLE orderlist;
TRUNCATE TABLE ordermaster;
TRUNCATE TABLE orderschememaster;
TRUNCATE TABLE ordertemplatelist;
TRUNCATE TABLE productlist;
TRUNCATE TABLE productmaster;
TRUNCATE TABLE routelist;
TRUNCATE TABLE routemaster;
TRUNCATE TABLE rsnhistoryinfo;
TRUNCATE TABLE schemefreeproductmaster;
TRUNCATE TABLE schememaster;
TRUNCATE TABLE schemeproductmaster;
TRUNCATE TABLE schemeregionmaster;
TRUNCATE TABLE schemescpmaster;
TRUNCATE TABLE scpmaster;
TRUNCATE TABLE shipmentlist;
TRUNCATE TABLE shipmentmaster;
TRUNCATE TABLE shipmentreturnlist;
TRUNCATE TABLE shipmentreturnmaster;
TRUNCATE TABLE usermaster;
TRUNCATE TABLE userpwdtransaction;
TRUNCATE TABLE userscpmaster;
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

SELECT * FROM dispatchdatabase.locationmaster;


INSERT INTO locationmaster (
    LCM_ID, LCM_LocationName, LCM_LocationCode, LCM_Type, LCM_CompanyID, LCM_SCPID,
    LCM_LocationStreet1, LCM_LocationStreet2, LCM_PostalCode, LCM_City, LCM_State,
    LCM_Country, LCM_ShippingCountryCode, LCM_District, LCM_EmailID, LCM_ContactNumber,
    LCM_GLN, LCM_SGLN, LCM_Latitude, LCM_Longitude, LCM_CompanyEmailID, LCM_URL,
    LCM_LabelAddress1, LCM_LabelAddress2, LCM_LabelAddress3, LCM_LabelAddress4,
    LCM_LabelAddress5, LCM_Status, LCM_CompanyGrpId, LCM_CreatedBy,
    LCM_CreatedTimestamp, LCM_ModifiedBy, LCM_ModifiedTimestamp, LCM_Remarks
) VALUES
-- ROW 1
(
    1, 'Location 1', '125001', 'Warehouse', 1, 4,
    'DN College', 'Near Bus Stand', '125001', 'Hisar', 'Haryana',
    'India', 'IND', 'Hisar', 'del_warehouse@gmail.com', '9876543210',
    '8901234567890', '8901234567890.125001', 29.1486, 75.7366,
    'del_warehouse@gmail.com', 'www.dncollegehisar.edu.in',
    'DN College', 'Near Bus Stand', 'Hisar - 125001', 'Haryana', 'India',
    1, 1, NULL, '2025-10-07 09:59:32', NULL, '2025-10-07 09:59:32', NULL
),

-- ROW 2
(
    2, 'Location 2', '478596', 'Plant', 1, 3,
    'Dev Aditya Arcade', 'Opp. Silver Square Complex, Thaltej-Shilaj Road',
    '380059', 'Ahmedabad', 'Gujarat', 'India', 'IND', 'Ahmedabad',
    'guj_distributor@gmail.com', '9638527410',
    '8901234567840', '8901234567840.380059', 23.0225, 72.5714,
    'guj_distributor@gmail.com', 'www.devadityaarcade.com',
    'Dev Aditya Arcade', 'Thaltej-Shilaj Road', 'Ahmedabad - 380059',
    'Gujarat', 'India',
    1, 1, NULL, '2025-10-07 10:02:16', NULL, '2025-10-14 16:19:57', NULL
),

-- ROW 3
(
    3, 'Location 3', '52639', 'Plant', 1, 2,
    'Harihar Nagar, Besa Road', 'Near Manish Nagar', '440001',
    'Nagpur', 'Maharashtra', 'India', 'IND', 'Nagpur',
    'mp_subdistributor@gmail.com', '9456213789',
    '8901234567858', '8901234567858.440001',
    21.1458, 79.0882, 'mp_subdistributor@gmail.com', 'www.nagpurplant.in',
    'Harihar Nagar, Besa Road', 'Near Manish Nagar',
    'Nagpur - 440001', 'Maharashtra', 'India',
    1, 1, NULL, '2025-10-07 10:30:23', NULL, '2025-10-14 16:28:44', NULL
),

-- ROW 4
(
    4, 'Location 4', '23654', 'SCP', 1, 1,
    'Chennai', 'Anna Nagar', '600040', 'Chennai', 'Tamil Nadu',
    'India', 'IND', 'Chennai', 'chennai_scp@gmail.com', '7894561230',
    '0030001.12345.40', '0030001.12345.40',
    13.0827, 80.2707, 'chennai_scp@gmail.com', '',
    'Mahaveer Colony', 'Anna Nagar', 'Chennai - 600040', 'Tamil Nadu',
    'India', 1, 1, NULL, '2025-10-08 10:53:15', NULL, '2025-10-14 16:35:00', NULL
);
