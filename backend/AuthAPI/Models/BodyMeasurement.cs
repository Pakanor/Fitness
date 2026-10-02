using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class BodyMeasurement
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public decimal Height { get; set; }
        public decimal Neck { get; set; }
        public decimal Waist { get; set; }
        public decimal Hips { get; set; }
        public decimal Shoulders { get; set; }
        public decimal Weight { get; set; }
        public decimal? Chest { get; set; }
        public decimal? Biceps { get; set; }
        public decimal? Thigh { get; set; }
        public decimal? Calf { get; set; }
        public decimal? BicepsLeft { get; set; }
        public decimal? BicepsRight { get; set; }
        public decimal? ThighLeft { get; set; }
        public decimal? ThighRight { get; set; }
        public decimal? CalfLeft { get; set; }
        public decimal? CalfRight { get; set; }
        public decimal? Belly { get; set; }
        public decimal? ForearmLeft { get; set; }
        public decimal? ForearmRight { get; set; }

        public decimal? BfPercent { get; set; }
        public decimal? Whr { get; set; }
        public decimal? Vtaper { get; set; }

        public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
    }

    public class BodyMeasurementDto
    {
        public decimal Height { get; set; }
        public decimal Neck { get; set; }
        public decimal Waist { get; set; }
        public decimal Hips { get; set; }
        public decimal Shoulders { get; set; }
        public decimal Weight { get; set; }
        public decimal? Chest { get; set; }
        public decimal? Biceps { get; set; }
        public decimal? Thigh { get; set; }
        public decimal? Calf { get; set; }
        public decimal? BicepsLeft { get; set; }
        public decimal? BicepsRight { get; set; }
        public decimal? ThighLeft { get; set; }
        public decimal? ThighRight { get; set; }
        public decimal? CalfLeft { get; set; }
        public decimal? CalfRight { get; set; }
        public decimal? Belly { get; set; }
        public decimal? ForearmLeft { get; set; }
        public decimal? ForearmRight { get; set; }
        public string? Gender { get; set; }
    }

    public class BodyMeasurementResponseDto
    {
        public int Id { get; set; }
        public decimal Height { get; set; }
        public decimal Neck { get; set; }
        public decimal Waist { get; set; }
        public decimal Hips { get; set; }
        public decimal Shoulders { get; set; }
        public decimal Weight { get; set; }
        public decimal? Chest { get; set; }
        public decimal? Biceps { get; set; }
        public decimal? Thigh { get; set; }
        public decimal? Calf { get; set; }
        public decimal? BicepsLeft { get; set; }
        public decimal? BicepsRight { get; set; }
        public decimal? ThighLeft { get; set; }
        public decimal? ThighRight { get; set; }
        public decimal? CalfLeft { get; set; }
        public decimal? CalfRight { get; set; }
        public decimal? Belly { get; set; }
        public decimal? ForearmLeft { get; set; }
        public decimal? ForearmRight { get; set; }
        public decimal? BfPercent { get; set; }
        public decimal? Whr { get; set; }
        public decimal? Vtaper { get; set; }
        public DateTime MeasuredAt { get; set; }
    }
}
