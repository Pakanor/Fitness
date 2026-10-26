using AuthAPI.DataAccess;
using AuthAPI.Interfaces;
using AuthAPI.Models;
using AuthAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : FitnessControllerBase
    {
        private readonly IAuthService _authService;
        private readonly JwtService _jwtService;
        private readonly UserLogrepository _userRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _env;


        public AuthController(IAuthService authService, JwtService jwtService, UserLogrepository userRepo, IHttpContextAccessor httpContextAccessor, IWebHostEnvironment env)
            : base(httpContextAccessor)
        {
            _authService = authService;
            _jwtService = jwtService;
            _userRepo = userRepo;
            _httpContextAccessor = httpContextAccessor;
            _env = env;

        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            await _authService.RegisterAsync(dto);
            return Ok(new { message = "Rejestracja zakończona pomyślnie." });
        }

        [HttpGet("me")]
        public IActionResult Me()
        {
            if (!HasCurrentUser) return Ok(new { authenticated = false });

            return Ok(new
            {
                authenticated = true,
                id = CurrentUserId,
                username = CurrentUserName,
                email = CurrentUserEmail,
                weight = UserWeight,
                trainingExperience = UserExperience
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

                var session = new UserSession
                {
                    UserId = user.ID,
                    SessionToken = tokenString,
                    Device = device,
                    Browser = browser,
                    Os = os,
                    IpAddress = ip,
                    CreatedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow,
                    IsActive = true
                };
                await _userRepo.AddSessionAsync(session);

                Response.Cookies.Append("FitnessApp-Auth", tokenString, new CookieOptions
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


    }
}
