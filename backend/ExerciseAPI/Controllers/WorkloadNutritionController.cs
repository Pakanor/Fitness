using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/workload-nutrition")]
    [Authorize]
    public class WorkloadNutritionController : FitnessControllerBase
    {
        private readonly IWorkloadCalculationService _workloadCalculationService;
        private readonly ICarbohydrateScalingService _carbohydrateScalingService;

        public WorkloadNutritionController(
            IWorkloadCalculationService workloadCalculationService,
            ICarbohydrateScalingService carbohydrateScalingService,
            IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _workloadCalculationService = workloadCalculationService;
            _carbohydrateScalingService = carbohydrateScalingService;
        }

        [HttpGet("workload")]
        public async Task<IActionResult> GetWorkload([FromQuery] DateTime? date = null)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var targetDate = date ?? DateTime.UtcNow.Date;

            var tonnage = await _workloadCalculationService.CalculateTonnage(CurrentUserId, targetDate);
            var workload = await _workloadCalculationService.CalculateWorkload(CurrentUserId, targetDate);
            var averageWorkload = await _workloadCalculationService.GetUserAverageWorkload(CurrentUserId);
            var isAboveAverage = await _workloadCalculationService.IsWorkloadAboveAverage(CurrentUserId, workload);

            return Ok(new
            {
                tonnage,
                workload,
                averageWorkload,
                isAboveAverage,
                date = targetDate
            });
        }

        [HttpGet("carbs")]
        public async Task<IActionResult> GetRecommendedCarbs([FromQuery] decimal bodyWeight, [FromQuery] DateTime? date = null)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var targetDate = date ?? DateTime.UtcNow.Date;

            var recommendedCarbs = await _carbohydrateScalingService.CalculatePostWorkoutCarbs(CurrentUserId, bodyWeight, targetDate);
            var workload = await _workloadCalculationService.CalculateWorkload(CurrentUserId, targetDate);
            var isAboveAverage = await _workloadCalculationService.IsWorkloadAboveAverage(CurrentUserId, workload);
            var acwr = await _carbohydrateScalingService.GetAcwrValue(CurrentUserId);
            bool isHeavyWorkout = isAboveAverage || (acwr.HasValue && acwr.Value > _carbohydrateScalingService.AcwrThreshold);

            return Ok(new
            {
                recommendedCarbs,
                isHeavyWorkout,
                isAboveAverage,
                acwr,
                carbMultiplier = isHeavyWorkout ? 1.4m : 1.0m,
                bodyWeight,
                date = targetDate
            });
        }
    }
}