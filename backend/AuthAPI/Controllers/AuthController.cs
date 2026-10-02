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


        public AuthController(IAuthService authService, JwtService jwtService, UserLogrepository userRepo, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _authService = authService;
           _jwtService = jwtService;
            _userRepo = userRepo;

        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody]RegisterDto dto)
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
        public IActionResult Logout()
        {
            Response.Cookies.Delete("FitnessApp-Auth");
            return Ok(new { message = "Wylogowano pomyślnie." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var tokenString = await _authService.LoginAsync(dto);
                if (string.IsNullOrEmpty(tokenString))
                {
                    return Unauthorized("Nieprawidłowy login lub hasło.");
                }

                Response.Cookies.Append("FitnessApp-Auth", tokenString, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false,
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

            

            return Ok("Email został zweryfikowany.");




        }


    }
}
