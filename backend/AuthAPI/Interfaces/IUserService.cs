using AuthAPI.Models;
using System.Threading.Tasks;

namespace AuthAPI.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetCurrentUserAsync(int userId);
        Task UpdateProfileAsync(int userId, string newUsername, string newEmail, DateTime? birthDate = null, decimal? currentWeight = null, decimal? height = null, string? gender = null, string? jobType = null, string? goal = null, int? manualCaloricTarget = null, decimal? manualProteinG = null, decimal? manualCarbsG = null, decimal? manualFatG = null, string? weightUnit = null, decimal? defaultWeightIncrement = null, int? defaultRestTimerSeconds = null);
        Task ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task DeleteAccountAsync(int userId);
        Task SendPasswordResetLinkAsync(string email);
        Task<object> ExportUserDataAsync(int userId);
        Task<List<ActiveSessionInfo>> GetActiveSessionsAsync(int userId);
    }

    public class ActiveSessionInfo
    {
        public string Device { get; set; } = "";
        public string Browser { get; set; } = "";
        public string Os { get; set; } = "";
        public DateTime LastActivity { get; set; }
        public bool IsCurrent { get; set; }
        public string SessionId { get; set; } = "";
    }
}
