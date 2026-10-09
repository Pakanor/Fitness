using System.ComponentModel.DataAnnotations;

namespace AuthAPI.Models
{
    public class UserSession
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string SessionToken { get; set; } = "";

        [Required]
        [MaxLength(200)]
        public string Device { get; set; } = "";

        [Required]
        [MaxLength(200)]
        public string Browser { get; set; } = "";

        [Required]
        [MaxLength(200)]
        public string Os { get; set; } = "";

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastActivity { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public User User { get; set; } = null!;
    }
}