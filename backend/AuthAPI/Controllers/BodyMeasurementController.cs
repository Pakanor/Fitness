using AuthAPI.DataAccess;
using AuthAPI.Models;
using AuthAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthAPI.Controllers
{
    [Route("api/body-measurements")]
    [ApiController]
    [Authorize]
    public class BodyMeasurementController : FitnessControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AnthropometryService _anthropometry;

        public BodyMeasurementController(AppDbContext context, AnthropometryService anthropometry, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _context = context;
            _anthropometry = anthropometry;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            if (!HasCurrentUser) return Unauthorized();

            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null) return Unauthorized();

            // Gate requires the four core anthropometric fields only.
            // Gender and activity level refine calculations but do not block the app.
            bool isComplete = user.CurrentWeight.HasValue
                && user.Height.HasValue
                && user.BirthDate.HasValue
                && !string.IsNullOrEmpty(user.Goal);

            return Ok(new
            {
                isComplete,
                measurements = isComplete ? new
                {
                    weight = user.CurrentWeight,
                    height = user.Height,
                    birthDate = user.BirthDate,
                    gender = user.Gender,
                    activityLevel = user.JobType,
                    goal = user.Goal
                } : null
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BodyMeasurementDto dto)
        {
            if (!HasCurrentUser) return Unauthorized();

            var (bfPercent, whr, vtaper) = _anthropometry.Calculate(
                dto.Height, dto.Neck, dto.Waist, dto.Hips, dto.Shoulders, dto.Weight, dto.Gender);

            var entity = new BodyMeasurement
            {
                UserId = CurrentUserId,
                Height = dto.Height,
                Neck = dto.Neck,
                Waist = dto.Waist,
                Hips = dto.Hips,
                Shoulders = dto.Shoulders,
                Weight = dto.Weight,
                Chest = dto.Chest,
                Biceps = dto.Biceps,
                Thigh = dto.Thigh,
                Calf = dto.Calf,
                BicepsLeft = dto.BicepsLeft,
                BicepsRight = dto.BicepsRight,
                ThighLeft = dto.ThighLeft,
                ThighRight = dto.ThighRight,
                CalfLeft = dto.CalfLeft,
                CalfRight = dto.CalfRight,
                Belly = dto.Belly,
                ForearmLeft = dto.ForearmLeft,
                ForearmRight = dto.ForearmRight,
                BfPercent = bfPercent,
                Whr = whr,
                Vtaper = vtaper,
                MeasuredAt = DateTime.UtcNow
            };

            _context.BodyMeasurements.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(MapToResponse(entity));
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!HasCurrentUser) return Unauthorized();

            var measurements = await _context.BodyMeasurements
                .Where(bm => bm.UserId == CurrentUserId)
                .OrderByDescending(bm => bm.MeasuredAt)
                .ToListAsync();

            return Ok(measurements.Select(MapToResponse));
        }

        [HttpGet("latest")]
        public async Task<IActionResult> GetLatest()
        {
            if (!HasCurrentUser) return Unauthorized();

            var measurement = await _context.BodyMeasurements
                .Where(bm => bm.UserId == CurrentUserId)
                .OrderByDescending(bm => bm.MeasuredAt)
                .FirstOrDefaultAsync();

            if (measurement == null)
                return NotFound();

            return Ok(MapToResponse(measurement));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!HasCurrentUser) return Unauthorized();

            var measurement = await _context.BodyMeasurements
                .FirstOrDefaultAsync(bm => bm.Id == id && bm.UserId == CurrentUserId);

            if (measurement == null)
                return NotFound();

            _context.BodyMeasurements.Remove(measurement);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static BodyMeasurementResponseDto MapToResponse(BodyMeasurement bm)
        {
            return new BodyMeasurementResponseDto
            {
                Id = bm.Id,
                Height = bm.Height,
                Neck = bm.Neck,
                Waist = bm.Waist,
                Hips = bm.Hips,
                Shoulders = bm.Shoulders,
                Weight = bm.Weight,
                Chest = bm.Chest,
                Biceps = bm.Biceps,
                Thigh = bm.Thigh,
                Calf = bm.Calf,
                BicepsLeft = bm.BicepsLeft,
                BicepsRight = bm.BicepsRight,
                ThighLeft = bm.ThighLeft,
                ThighRight = bm.ThighRight,
                CalfLeft = bm.CalfLeft,
                CalfRight = bm.CalfRight,
                Belly = bm.Belly,
                ForearmLeft = bm.ForearmLeft,
                ForearmRight = bm.ForearmRight,
                BfPercent = bm.BfPercent,
                Whr = bm.Whr,
                Vtaper = bm.Vtaper,
                MeasuredAt = bm.MeasuredAt
            };
        }
    }
}
