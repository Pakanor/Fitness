using System.ComponentModel.DataAnnotations;

namespace BackendLogicApi.Models
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

        public List<ProductLogEntry> ProductLogs { get; set; }
        public bool IsEmailVerified { get; set; } = false;
    }
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
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
