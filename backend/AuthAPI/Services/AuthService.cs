using AuthAPI.DataAccess;
using AuthAPI.Interfaces;
using AuthAPI.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserLogrepository _userRepo;
        private readonly IConfiguration _configuration;
        private readonly JwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;
        private readonly IWebHostEnvironment _env;

        public class ConflictException : Exception
        {
            public ConflictException(string message) : base(message) { }
        }


        public AuthService(UserLogrepository userRepo, IConfiguration configuration, JwtService jwtService, IEmailService emailService, ILogger<AuthService> logger, IWebHostEnvironment env)
        {
            _userRepo = userRepo;
            _configuration = configuration;
            _emailService = emailService;
            _jwtService = jwtService;
            _logger = logger;
            _env = env;

        }


        public async Task RegisterAsync(RegisterDto dto)
        {
            var userExist = await _userRepo.UserExistsAsync(dto.Email, dto.Username);
            if (userExist)
            {
                throw new ConflictException("Użytkownik już istnieje");
            }
            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : null,
                Height = dto.Height,
                CurrentWeight = dto.CurrentWeight,
                Gender = dto.Gender,
                JobType = dto.JobType,
                Goal = dto.Goal,
                IsEmailVerified = false
            };
            await _userRepo.AddUserAsync(user);
            var token = _jwtService.GenerateEmailVerificationToken(user);
            var gatewayBaseUrl = _configuration["App:GatewayBaseUrl"] ?? "http://localhost:8000";
            var verificationLink = $"{gatewayBaseUrl}/api/auth/verify?token={token}";
            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "Potwierdzenie rejestracji",
                    $"Kliknij <a href=\"{verificationLink}\">tutaj</a>, aby potwierdzić rejestrację."
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send verification email to {Email}. User registered but email not sent.", user.Email);
            }
        }


        public async Task<(string Token, User User)> LoginAsync(LoginDto dto)
        {
            var user = await _userRepo.GetByEmailOrLoginAsync(dto.EmailOrLogin);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                throw new Exception("Nieprawidłowy login lub hasło.");
            }
            if (!user.IsEmailVerified && !_env.IsDevelopment())
            {
                throw new Exception("Nieprawidłowy login lub hasło.");
            }

            return (_jwtService.GenerateToken(user), user);
        }

    }
}