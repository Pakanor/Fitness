using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/fatigue-analysis")]
    public class FatigueAnalysisController : FitnessControllerBase
    {
        private readonly IAcwrService _acwr;
        private readonly IMuscleRecoveryService _recovery;

        public FatigueAnalysisController(IAcwrService acwr, IMuscleRecoveryService recovery, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _acwr = acwr;
            _recovery = recovery;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Get()
        {
            if (!HasCurrentUser) return Unauthorized();

            var acwr = await _acwr.GetAcwrAsync(CurrentUserId, UserWeight, UserExperience);
            var recovery = await _recovery.ComputeAsync(CurrentUserId);

            return Ok(new FatigueAnalysisResponseDto
            {
                Acwr = acwr,
                MuscleRecovery = recovery,
            });
        }
    }
}
