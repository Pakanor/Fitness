using AuthAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuthAPI.Models;
using AuthAPI.Services;
using AuthAPI.DataAccess;

namespace AuthAPI.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : FitnessControllerBase
    {
        private readonly IUserService _userService;
        private readonly UserLogrepository _userRepo;

        public UserController(IUserService userService, UserLogrepository userRepo, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _userService = userService;
            _userRepo = userRepo;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            if (!HasCurrentUser) return Unauthorized();

            var user = await _userService.GetCurrentUserAsync(CurrentUserId);
            if (user == null) return NotFound();
            return Ok(new ProfileResponseDto
            {
                Username = user.Username,
                Email = user.Email,
                BirthDate = user.BirthDate,
                CurrentWeight = user.CurrentWeight,
                Height = user.Height,
                Gender = user.Gender,
                JobType = user.JobType,
                Goal = user.Goal,
                Bmr = user.GetBmr(),
                Tdee = user.GetTdee(),
                ManualCaloricTarget = user.ManualCaloricTarget,
                ManualProteinG = user.ManualProteinG,
                ManualCarbsG = user.ManualCarbsG,
                ManualFatG = user.ManualFatG,
                WeightUnit = user.WeightUnit,
                DefaultWeightIncrement = user.DefaultWeightIncrement,
                DefaultRestTimerSeconds = user.DefaultRestTimerSeconds
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!HasCurrentUser) return Unauthorized();

            await _userService.UpdateProfileAsync(CurrentUserId, dto.Username, dto.Email, dto.BirthDate, dto.CurrentWeight, dto.Height, dto.Gender, dto.JobType, dto.Goal, dto.ManualCaloricTarget, dto.ManualProteinG, dto.ManualCarbsG, dto.ManualFatG, dto.WeightUnit, dto.DefaultWeightIncrement, dto.DefaultRestTimerSeconds);
            return NoContent();
        }


        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!HasCurrentUser) return Unauthorized();

            await _userService.ChangePasswordAsync(CurrentUserId, dto.CurrentPassword, dto.NewPassword);
            return NoContent();
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteAccount()
        {
            if (!HasCurrentUser) return Unauthorized();

            await _userService.DeleteAccountAsync(CurrentUserId);
            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportData()
        {
            if (!HasCurrentUser) return Unauthorized();

            return Ok(await _userService.ExportUserDataAsync(CurrentUserId));
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions()
        {
            if (!HasCurrentUser) return Unauthorized();

            var currentToken = Request.Cookies["FitnessApp-Auth"];
            var sessions = await _userService.GetActiveSessionsAsync(CurrentUserId);
            foreach (var session in sessions)
                session.IsCurrent = !string.IsNullOrEmpty(session.SessionToken) && session.SessionToken == currentToken;

            return Ok(sessions);
        }

        [HttpDelete("sessions/{sessionId}")]
        public async Task<IActionResult> RevokeSession(int sessionId)
        {
            if (!HasCurrentUser) return Unauthorized();

            var revoked = await _userService.RevokeSessionAsync(sessionId, CurrentUserId);
            if (!revoked) return NotFound(new { message = "Sesja nie została znaleziona." });

            var currentToken = Request.Cookies["FitnessApp-Auth"];
            var session = await _userRepo.GetSessionByIdAsync(sessionId);
            if (session != null && session.SessionToken == currentToken)
                Response.Cookies.Delete("FitnessApp-Auth");

            return Ok(new { message = "Sesję unieważniono." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromQuery] string token, [FromBody] ResetPasswordDto dto)
        {
            await _userService.ResetPasswordAsync(token, dto.NewPassword);
            return Ok("Hasło zostało zresetowane.");
        }
        public async Task<IActionResult> SendResetPasswordEmail([FromBody] EmailDto dto)
        {
            await _userService.SendPasswordResetLinkAsync(dto.Email);
            return Ok("Wysłano wiadomość z linkiem do resetu hasła.");
        }

    }

}
