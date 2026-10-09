using AuthAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuthAPI.Models;
using AuthAPI.Services;

namespace AuthAPI.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : FitnessControllerBase
    {
        private readonly IUserService _userService;
        

        public UserController(IUserService userService, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _userService = userService;
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

            var sessions = await _userService.GetActiveSessionsAsync(CurrentUserId);
            if (sessions.Count == 0)
            {
                sessions.Add(new ActiveSessionInfo
                {
                    SessionId = "current",
                    Device = "To urządzenie",
                    Browser = Request.Headers.UserAgent.ToString().Split(' ').FirstOrDefault() ?? "Przeglądarka",
                    Os = "Nieznany system",
                    LastActivity = DateTime.UtcNow,
                    IsCurrent = true
                });
            }

            return Ok(sessions);
        }

        [HttpPost("send-reset-password-email")]
        public async Task<IActionResult> SendResetPasswordEmail([FromBody] EmailDto dto)
        {
            await _userService.SendPasswordResetLinkAsync(dto.Email);
            return Ok("Wysłano wiadomość z linkiem do resetu hasła.");
        }

    }

}
