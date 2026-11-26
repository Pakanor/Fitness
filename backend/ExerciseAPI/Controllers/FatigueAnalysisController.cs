using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;
using FitnessApp.Core.Interfaces;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/fatigue-analysis")]
    [Authorize]
    public class FatigueAnalysisController : ControllerBase
    {
        private readonly IFatigueAnalysisService _fatigueAnalysisService;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public FatigueAnalysisController(IFatigueAnalysisService fatigueAnalysisService, ICurrentUserAccessor currentUserAccessor)
        {
            _fatigueAnalysisService = fatigueAnalysisService;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpGet("muscle-damage")]
        public async Task<IActionResult> GetMuscleDamage([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var damage = await _fatigueAnalysisService.GetMuscleDamageAsync(currentUser.Id, startDate, endDate);
            return Ok(damage);
        }

        [HttpGet("muscle-groups")]
        public async Task<IActionResult> GetMuscleGroups()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var groups = await _fatigueAnalysisService.GetMuscleGroupsAsync();
            return Ok(groups);
        }
    }
}