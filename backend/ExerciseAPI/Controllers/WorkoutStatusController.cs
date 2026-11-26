using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using FitnessApp.Core.Interfaces;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/workout-status")]
    [Authorize]
    public class WorkoutStatusController : ControllerBase
    {
        private readonly IWorkoutStatusService _workoutStatusService;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public WorkoutStatusController(IWorkoutStatusService workoutStatusService, ICurrentUserAccessor currentUserAccessor)
        {
            _workoutStatusService = workoutStatusService;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetWorkoutStatus([FromQuery] DateTime? date = null)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var targetDate = date ?? DateTime.UtcNow.Date;

            var status = await _workoutStatusService.GetWorkoutStatus(currentUser.Id, targetDate);
            return Ok(new { status = status.HasValue ? ToStatusString(status.Value) : "none" });
        }

        private static string ToStatusString(WorkoutStatus status) => status switch
        {
            WorkoutStatus.Planned => "planned",
            WorkoutStatus.InProgress => "in_progress",
            WorkoutStatus.Completed => "completed",
            _ => status.ToString().ToLowerInvariant()
        };

        [HttpPut]
        public async Task<IActionResult> UpdateWorkoutStatus([FromBody] UpdateWorkoutStatusDto dto)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            if (!Enum.TryParse<WorkoutStatus>(dto.Status, out var status))
                return BadRequest("Invalid status");

            await _workoutStatusService.UpdateWorkoutStatus(currentUser.Id, dto.Date, status);

            return Ok();
        }

        [HttpGet("active")]
        public async Task<IActionResult> IsWorkoutActive([FromQuery] DateTime? date = null)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var targetDate = date ?? DateTime.UtcNow.Date;

            var isActive = await _workoutStatusService.IsWorkoutActive(currentUser.Id, targetDate);
            return Ok(new { isActive });
        }
    }

    public class UpdateWorkoutStatusDto
    {
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}