using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QtechOJT_Net9.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectStartDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Make TargetEndDate required (it was already not nullable in the model, but ensuring consistency)
            migrationBuilder.AlterColumn<DateTime>(
                name: "TargetEndDate",
                table: "Projects",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: false);

            // Add the new StartDate column (required)
            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "Projects",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2026, 1, 1)); // Default value for existing rows
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Projects");
        }
    }
}
