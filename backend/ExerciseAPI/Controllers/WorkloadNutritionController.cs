using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FitnessApp.Core.Interfaces;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/workload-nutrition")]
    [Authorize]
    public class WorkloadNutritionController : ControllerBase
    {
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public WorkloadNutritionController(ICurrentUserAccessor currentUserAccessor)
        {
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpGet("summary")]
        public IActionResult GetWorkloadNutritionSummary([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            return Ok(new
            {
                message = "Workload nutrition analysis not yet implemented.",
                startDate,
                endDate
            });
        }
    }
}