using AuthAPI.DataAccess;
using AuthAPI.Interfaces;
using AuthAPI.Models;
using Microsoft.EntityFrameworkCore;


namespace AuthAPI.Services
{
    public class UserService : IUserService
    {
        private readonly UserLogrepository _userRepo;
        private readonly JwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;

        public UserService(UserLogrepository userRepo, JwtService jwtService, IEmailService emailService, IConfiguration configuration, AppDbContext dbContext)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
            _emailService = emailService;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        public async Task<User?> GetCurrentUserAsync(int userId)
        {
            return await _userRepo.GetByIdAsync(userId);
        }

        public async Task UpdateProfileAsync(int userId, string newUsername, string newEmail, DateTime? birthDate = null, decimal? currentWeight = null, decimal? height = null, string? gender = null, string? jobType = null, string? goal = null, int? manualCaloricTarget = null, decimal? manualProteinG = null, decimal? manualCarbsG = null, decimal? manualFatG = null, string? weightUnit = null, decimal? defaultWeightIncrement = null, int? defaultRestTimerSeconds = null)
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

            user.ManualCaloricTarget = manualCaloricTarget;
            if (manualProteinG.HasValue)
                user.ManualProteinG = manualProteinG.Value;
            if (manualCarbsG.HasValue)
                user.ManualCarbsG = manualCarbsG.Value;
            if (manualFatG.HasValue)
                user.ManualFatG = manualFatG.Value;

            if (weightUnit != null)
                user.WeightUnit = weightUnit;
            if (defaultWeightIncrement.HasValue)
                user.DefaultWeightIncrement = defaultWeightIncrement.Value;
            if (defaultRestTimerSeconds.HasValue)
                user.DefaultRestTimerSeconds = defaultRestTimerSeconds.Value;

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

        public async Task<object> ExportUserDataAsync(int userId)
        {
            var user = await GetCurrentUserAsync(userId);
            if (user == null) throw new Exception("Użytkownik nie istnieje");

            var measurements = await _dbContext.BodyMeasurements
                .Where(measurement => measurement.UserId == userId)
                .OrderByDescending(measurement => measurement.MeasuredAt)
                .ToListAsync();

            return new
            {
                profile = new
                {
                    user.Username,
                    user.Email,
                    user.CreatedAt,
                    user.LastLogin,
                    user.IsEmailVerified,
                    user.BirthDate,
                    user.CurrentWeight,
                    user.Height,
                    user.Gender,
                    user.JobType,
                    user.Goal,
                    user.ManualCaloricTarget,
                    user.ManualProteinG,
                    user.ManualCarbsG,
                    user.ManualFatG,
                    user.WeightUnit,
                    user.DefaultWeightIncrement,
                    user.DefaultRestTimerSeconds
                },
                bodyMeasurements = measurements
            };
        }

        public Task<List<ActiveSessionInfo>> GetActiveSessionsAsync(int userId)
        {
            return Task.FromResult(new List<ActiveSessionInfo>());
        }


    }

}
