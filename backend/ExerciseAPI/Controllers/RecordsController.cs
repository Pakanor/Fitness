using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;
using FitnessApp.Core.Interfaces;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/records")]
    [Authorize]
    public class RecordsController : ControllerBase
    {
        private readonly IRecordsService _recordsService;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public RecordsController(IRecordsService recordsService, ICurrentUserAccessor currentUserAccessor)
        {
            _recordsService = recordsService;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var records = await _recordsService.GetHistory(currentUser.Id);
            return Ok(records);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var exercises = await _recordsService.SearchExercises(currentUser.Id, query);
            return Ok(exercises);
        }

        [HttpGet("exercise/{exerciseId}")]
        public async Task<IActionResult> GetExerciseHistory(int exerciseId)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var records = await _recordsService.GetExerciseHistory(currentUser.Id, exerciseId);
            return Ok(records);
        }

        [HttpGet("1rm-progression")]
        public async Task<IActionResult> Get1RMProgression()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var result = await _recordsService.Get1RMProgression(currentUser.Id);
            return Ok(result);
        }

        [HttpGet("exercise/{exerciseId}/progress")]
        public async Task<IActionResult> GetExerciseProgress(
            int exerciseId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var result = await _recordsService.GetExerciseProgress(currentUser.Id, exerciseId, startDate, endDate);
            return Ok(result);
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? timeZone = null)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var result = await _recordsService.GetOverview(currentUser.Id, startDate, endDate, timeZone);
            return Ok(result);
        }
    }
}