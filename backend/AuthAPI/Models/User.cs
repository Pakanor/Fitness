using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class User
    {
        [Key]
        public int ID { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; }

        [Required]
        [MaxLength(255)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLogin { get; set; }

        public bool IsEmailVerified { get; set; } = false;

        public DateTime? BirthDate { get; set; }
        public decimal? CurrentWeight { get; set; }
        public decimal? Height { get; set; }
        public string? Gender { get; set; }
        public string? JobType { get; set; }
        public string? Goal { get; set; }

        public decimal GetPalMultiplier()
        {
            return JobType?.ToLower() switch
            {
                "sedentary" => 1.2m,
                "light_active" => 1.375m,
                "moderate_active" => 1.55m,
                "very_active" => 1.725m,
                "extra_active" => 1.9m,
                _ => 1.2m
            };
        }

        public decimal? GetBmr()
        {
            if (!CurrentWeight.HasValue || !Height.HasValue || !BirthDate.HasValue || string.IsNullOrEmpty(Gender))
                return null;

            var age = DateTime.UtcNow.Year - BirthDate.Value.Year;
            if (DateTime.UtcNow < BirthDate.Value.AddYears(age)) age--;

            decimal bmr;
            if (Gender.ToLower() == "male")
                bmr = 10 * CurrentWeight.Value + 6.25m * Height.Value - 5 * age + 5;
            else
                bmr = 10 * CurrentWeight.Value + 6.25m * Height.Value - 5 * age - 161;

            return Math.Round(bmr, 0);
        }

        public decimal? GetTdee()
        {
            var bmr = GetBmr();
            if (!bmr.HasValue) return null;
            return Math.Round(bmr.Value * GetPalMultiplier(), 0);
        }
    }
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public DateTime? BirthDate { get; set; }
        public decimal? Height { get; set; }
        public decimal? CurrentWeight { get; set; }
        public string? Gender { get; set; }
        public string? JobType { get; set; }
        public string? Goal { get; set; }
    }
    public class LoginDto
    {
        public string EmailOrLogin { get; set; }
        public string Password { get; set; }
    }
    public class UpdateProfileDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public DateTime? BirthDate { get; set; }
        public decimal? CurrentWeight { get; set; }
        public decimal? Height { get; set; }
        public string? Gender { get; set; }
        public string? JobType { get; set; }
        public string? Goal { get; set; }
    }

    public class ProfileResponseDto
    {
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public DateTime? BirthDate { get; set; }
        public decimal? CurrentWeight { get; set; }
        public decimal? Height { get; set; }
        public string? Gender { get; set; }
        public string? JobType { get; set; }
        public string? Goal { get; set; }
        public decimal? Bmr { get; set; }
        public decimal? Tdee { get; set; }
    }
    public class EmailDto
    {
        public string Email { get; set; } = string.Empty;
    }
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
