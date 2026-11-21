using AuthAPI.DataAccess;
using AuthAPI.Interfaces;
using AuthAPI.Models;
using AuthAPI.Services;
using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly JwtService _jwtService;
        private readonly UserLogrepository _userRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _env;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public AuthController(IAuthService authService, JwtService jwtService, UserLogrepository userRepo, IHttpContextAccessor httpContextAccessor, IWebHostEnvironment env, ICurrentUserAccessor currentUserAccessor)
        {
            _authService = authService;
            _jwtService = jwtService;
            _userRepo = userRepo;
            _httpContextAccessor = httpContextAccessor;
            _env = env;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            await _authService.RegisterAsync(dto);
            return Ok(new { message = "Rejestracja zakończona pomyślnie." });
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            CurrentUser currentUser;
            try
            {
                currentUser = await _currentUserAccessor.GetFreshAsync();
            }
            catch (UnauthorizedAccessException)
            {
                return Ok(new { authenticated = false });
            }

            if (!currentUser.IsAuthenticated) return Ok(new { authenticated = false });

            return Ok(new
            {
                authenticated = true,
                id = currentUser.Id,
                username = currentUser.Name,
                email = currentUser.Email,
                weight = currentUser.Profile?.Weight ?? UserProfile.Default.Weight,
                trainingExperience = currentUser.Profile?.TrainingExperience ?? UserProfile.Default.TrainingExperience
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var token = Request.Cookies["FitnessApp-Auth"];
            if (!string.IsNullOrEmpty(token))
                await _userRepo.RevokeSessionByTokenAsync(token);

            Response.Cookies.Delete("FitnessApp-Auth");
            return Ok(new { message = "Wylogowano pomyślnie." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var (tokenString, user) = await _authService.LoginAsync(dto);
                if (string.IsNullOrEmpty(tokenString) || user == null)
                {
                    return Unauthorized("Nieprawidłowy login lub hasło.");
                }

                var (device, browser, os) = UserAgentParser.Parse(Request.Headers.UserAgent.ToString());
                var ip = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? string.Empty;

                var sessionId = Guid.NewGuid();
                var tokenWithSession = _jwtService.GenerateToken(user, sessionId);

                var session = new UserSession
                {
                    UserId = user.ID,
                    SessionToken = tokenWithSession,
                    SessionId = sessionId,
                    Device = device,
                    Browser = browser,
                    Os = os,
                    IpAddress = ip,
                    CreatedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow,
                    IsActive = true
                };
                await _userRepo.AddSessionAsync(session);

                Response.Cookies.Append("FitnessApp-Auth", tokenWithSession, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = !_env.IsDevelopment(),
                    SameSite = SameSiteMode.Lax,
                    Path = "/"
                });

                Response.Headers["Location"] = "/home";
                return Ok(new { message = "Zalogowano pomyślnie." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("verify")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            var principal = _jwtService.ValidateToken(token);
            if (principal == null || principal.FindFirst("verify")?.Value != "true")
                return BadRequest("Nieprawidłowy lub przeterminowany token");

            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
                return BadRequest("Brak adresu e-mail");
            var user = await _userRepo.GetByEmailAsync(email);
            if (user == null)
                return NotFound("Użytkownik nie istnieje.");

            user.IsEmailVerified = true;
            var result = _userRepo.UpdateUserAsync(user);


            return Ok(new { message = "Email został zweryfikowany." });



        }

        [HttpGet("sessions/validate/{sessionId:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateSession(Guid sessionId)
        {
            var session = await _userRepo.GetSessionBySessionIdAsync(sessionId);
            if (session == null || !session.IsActive)
                return NotFound();

            return Ok(new { valid = true, userId = session.UserId });
        }
    }
}