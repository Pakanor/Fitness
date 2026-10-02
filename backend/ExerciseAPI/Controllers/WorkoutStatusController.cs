using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/workout-status")]
    [Authorize]
    public class WorkoutStatusController : FitnessControllerBase
    {
        private readonly IWorkoutStatusService _workoutStatusService;

        public WorkoutStatusController(IWorkoutStatusService workoutStatusService, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _workoutStatusService = workoutStatusService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWorkoutStatus([FromQuery] DateTime? date = null)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var targetDate = date ?? DateTime.UtcNow.Date;

            var status = await _workoutStatusService.GetWorkoutStatus(CurrentUserId, targetDate);
            return Ok(new { status = status?.ToString() ?? "None" });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateWorkoutStatus([FromBody] UpdateWorkoutStatusDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            if (!Enum.TryParse<WorkoutStatus>(dto.Status, out var status))
                return BadRequest("Invalid status");

            await _workoutStatusService.UpdateWorkoutStatus(CurrentUserId, dto.Date, status);

            return Ok();
        }

        [HttpGet("active")]
        public async Task<IActionResult> IsWorkoutActive([FromQuery] DateTime? date = null)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var targetDate = date ?? DateTime.UtcNow.Date;

            var isActive = await _workoutStatusService.IsWorkoutActive(CurrentUserId, targetDate);
            return Ok(new { isActive });
        }
    }

    public class UpdateWorkoutStatusDto
    {
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}