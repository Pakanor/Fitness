using AuthAPI.DataAccess;
using AuthAPI.Interfaces;
using AuthAPI.Models;


namespace AuthAPI.Services
{
    public class UserService : IUserService
    {
        private readonly UserLogrepository _userRepo;
        private readonly JwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public UserService(UserLogrepository userRepo, JwtService jwtService, IEmailService emailService, IConfiguration configuration)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<User?> GetCurrentUserAsync(int userId)
        {
            return await _userRepo.GetByIdAsync(userId);
        }

        public async Task UpdateProfileAsync(int userId, string newUsername, string newEmail, DateTime? birthDate = null, decimal? currentWeight = null, decimal? height = null, string? gender = null, string? jobType = null, string? goal = null)
        {
            var user = await GetCurrentUserAsync(userId);
            if (user == null) throw new Exception("Użytkownik nie istnieje");

            if (!string.IsNullOrEmpty(newUsername))
                user.Username = newUsername;
            if (!string.IsNullOrEmpty(newEmail))
                user.Email = newEmail;

            if (birthDate.HasValue)
                user.BirthDate = DateTime.SpecifyKind(birthDate.Value, DateTimeKind.Utc);
            if (currentWeight.HasValue)
                user.CurrentWeight = currentWeight.Value;
            if (height.HasValue)
                user.Height = height.Value;
            if (gender != null)
                user.Gender = gender;
            if (jobType != null)
                user.JobType = jobType;
            if (goal != null)
                user.Goal = goal;

            await _userRepo.UpdateUserAsync(user);
        }

        public async Task ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await GetCurrentUserAsync(userId);
            if (user == null) throw new Exception("Użytkownik nie istnieje");

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                throw new Exception("Nieprawidłowe aktualne hasło.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepo.UpdateUserAsync(user);
        }

        public async Task DeleteAccountAsync(int userId)
        {
            var user = await GetCurrentUserAsync(userId);
            if (user == null) throw new Exception("Użytkownik nie istnieje");

            await _userRepo.DeleteUserAsync(user);
        }      

        public async Task SendPasswordResetLinkAsync(string email)
        {
            var user = await _userRepo.GetByEmailAsync(email);
            if (user == null)
                throw new Exception("Użytkownik o podanym adresie e-mail nie istnieje.");

            var token = _jwtService.GeneratePasswordResetToken(user);
            var gatewayBaseUrl = _configuration["App:GatewayBaseUrl"] ?? "http://localhost:8000";
            var resetLink = $"{gatewayBaseUrl}/api/user/reset-password?token={token}";

            string subject = "Resetowanie hasła";
            string body = $"Kliknij <a href=\"{resetLink}\">tutaj</a>, aby zresetować swoje hasło. Link ważny przez 15 minut.";

            await _emailService.SendEmailAsync(user.Email, subject, body);
        }


    }

}
