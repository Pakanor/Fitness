using ExerciseAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExerciseAPI.Controllers
{
    [Route("api/heatmap")]
    [ApiController]
    [Authorize]
    public class HeatmapController : FitnessControllerBase
    {
        private readonly HeatmapService _heatmapService;

        public HeatmapController(HeatmapService heatmapService, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _heatmapService = heatmapService;
        }

        [HttpGet]
        public async Task<IActionResult> GetHeatmap()
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var result = await _heatmapService.GetHeatmapData(CurrentUserId);
            return Ok(result);
        }
    }
}
