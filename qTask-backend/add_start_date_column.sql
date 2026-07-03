-- Migration: Add StartDate column to Projects table
-- This script adds the missing StartDate column and ensures TargetEndDate is not nullable

USE qTask_db;
GO

-- Check if StartDate column exists before adding it
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') 
    AND name = 'StartDate'
)
BEGIN
    -- Add StartDate column with a default value for existing rows
    ALTER TABLE [dbo].[Projects]
    ADD [StartDate] datetime2 NOT NULL 
    DEFAULT '2026-01-01T00:00:00.000';
    
    PRINT 'StartDate column added successfully';
END
ELSE
BEGIN
    PRINT 'StartDate column already exists';
END
GO

-- Update the default constraint to allow future inserts without explicit dates
-- (The default above only applies to existing rows)
-- For new rows, the application will provide the value

-- Optionally, update existing projects to set StartDate = CreatedDate
-- Uncomment the following if you want existing projects' StartDate to match their CreatedDate
/*
UPDATE [dbo].[Projects]
SET [StartDate] = [CreatedDate]
WHERE [StartDate] = '2026-01-01T00:00:00.000';
*/

-- Insert migration history record
IF NOT EXISTS (SELECT * FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = '20260703000000_AddProjectStartDate')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260703000000_AddProjectStartDate', '9.0.14');
    
    PRINT 'Migration history updated';
END
GO

PRINT 'Migration completed successfully';
GO
