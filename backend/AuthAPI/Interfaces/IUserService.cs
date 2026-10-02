using AuthAPI.Models;
using System.Threading.Tasks;

namespace AuthAPI.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetCurrentUserAsync(int userId);
        Task UpdateProfileAsync(int userId, string newUsername, string newEmail, DateTime? birthDate = null, decimal? currentWeight = null, decimal? height = null, string? gender = null, string? jobType = null, string? goal = null);
        Task ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task DeleteAccountAsync(int userId);
        Task SendPasswordResetLinkAsync(string email);
    }
}
