

using AuthAPI.Models;

namespace AuthAPI.Interfaces
{
    public interface IAuthService
    {
        Task RegisterAsync(RegisterDto dto);
        Task<(string Token, User User)> LoginAsync(LoginDto dto);
    }
}
