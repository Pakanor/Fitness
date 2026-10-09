using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthAPI.Migrations
{
    /// <inheritdoc />
    public partial class AccountSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DefaultRestTimerSeconds",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultWeightIncrement",
                table: "Users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ManualCaloricTarget",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ManualCarbsG",
                table: "Users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ManualFatG",
                table: "Users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ManualProteinG",
                table: "Users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeightUnit",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultRestTimerSeconds",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DefaultWeightIncrement",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ManualCaloricTarget",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ManualCarbsG",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ManualFatG",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ManualProteinG",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "WeightUnit",
                table: "Users");
        }
    }
}
