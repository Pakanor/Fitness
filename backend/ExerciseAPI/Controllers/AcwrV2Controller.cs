using ExerciseAPI.Models;
using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/ExerciseDb")]
    public class AcwrV2Controller : FitnessControllerBase
    {
        private readonly AppDbContext _context;

        public AcwrV2Controller(AppDbContext context, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _context = context;
        }

        [HttpGet("acwr")]
        [Authorize]
        public async Task<IActionResult> GetAcwr()
        {
            if (!HasCurrentUser) return Unauthorized();

            var since = DateTime.UtcNow.AddDays(-28);
            var exercises = await _context.UserExercise
                .Where(e => e.UserId == CurrentUserId && e.Date >= since)
                .OrderBy(e => e.Date)
                .ToListAsync();

            if (exercises.Count == 0)
            {
                return Ok(new AcwrResponseDto
                {
                    Ratio = 0,
                    AcuteLoad = 0,
                    ChronicLoad = 0,
                    DailyWorkload = new List<DailyWorkloadDto>(),
                    InsufficientData = true,
                    Status = "Niewystarczające dane",
                    Alert = null
                });
            }

            var dailyWorkload = exercises
                .GroupBy(e => e.Date.Date)
                .Select(g => new DailyWorkloadDto
                {
                    Date = g.Key,
                    Workload = g.Sum(e =>
                        (double)((e.Sets ?? 0) * (e.Reps ?? 0) * (e.Weight ?? 0)) *
                        ((double)(e.RPE ?? 8) / 10.0))
                })
                .OrderBy(d => d.Date)
                .ToList();

            var last7 = dailyWorkload.Where(d => d.Date >= DateTime.UtcNow.Date.AddDays(-6)).ToList();
            var acuteLoad = last7.Count > 0 ? last7.Average(d => d.Workload) : 0;

            var chronicLoad = dailyWorkload.Count > 0 ? dailyWorkload.Average(d => d.Workload) : 0;

            var ratio = chronicLoad > 0 ? Math.Round(acuteLoad / chronicLoad, 2) : 0;

            string status;
            string? alert = null;

            if (ratio < 0.8)
            {
                status = "Niedotrenowanie";
                alert = "Za niskie obciążenie — rozważ zwiększenie objętości.";
            }
            else if (ratio <= 1.3)
            {
                status = "Optymalny";
            }
            else if (ratio <= 1.5)
            {
                status = "Podwyższone ryzyko";
                alert = "Obciążenie rośnie szybko. Rozważ deload.";
            }
            else
            {
                status = "Przetrenowanie";
                alert = "Wysokie ryzyko kontuzji! Zastosuj deload.";
            }

            bool insufficientData = dailyWorkload.Count < 7;

            return Ok(new AcwrResponseDto
            {
                Ratio = ratio,
                AcuteLoad = Math.Round(acuteLoad, 1),
                ChronicLoad = Math.Round(chronicLoad, 1),
                DailyWorkload = dailyWorkload,
                InsufficientData = insufficientData,
                Status = status,
                Alert = alert
            });
        }

        [HttpPost("deload/preview")]
        [Authorize]
        public async Task<IActionResult> DeloadPreview()
        {
            if (!HasCurrentUser) return Unauthorized();

            var since = DateTime.UtcNow.AddDays(-14);
            var recent = await _context.UserExercise
                .Where(e => e.UserId == CurrentUserId && e.Date >= since)
                .OrderBy(e => e.Date)
                .ToListAsync();

            if (recent.Count == 0)
                return Ok(new DeloadResponseDto { Entries = new List<DeloadEntryDto>(), Message = "Brak danych treningowych." });

            var grouped = recent.GroupBy(e => e.ExerciseId);
            var plan = new List<DeloadEntryDto>();

            foreach (var group in grouped)
            {
                var avg = group.Average(e => (e.Sets ?? 0) * (e.Reps ?? 0) * (double)(e.Weight ?? 0));
                var representative = group.OrderByDescending(e => e.Date).First();
                int deloadSets = Math.Max(1, (int)Math.Round((representative.Sets ?? 3) * 0.6));
                decimal deloadWeight = Math.Round((representative.Weight ?? 0) * 0.9m, 1);

                plan.Add(new DeloadEntryDto
                {
                    ExerciseId = group.Key,
                    Sets = deloadSets,
                    Reps = representative.Reps,
                    Weight = deloadWeight,
                    RPE = Math.Min(7, representative.RPE ?? 8),
                    Date = DateTime.UtcNow.Date.AddDays(1)
                });
            }

            return Ok(new DeloadResponseDto
            {
                Entries = plan,
                Message = $"Deload: zestawy ×0.6, ciężar ×0.9, RPE max 7. Plan obejmuje {plan.Count} ćwiczeń."
            });
        }

        [HttpPost("deload/apply")]
        [Authorize]
        public async Task<IActionResult> DeloadApply([FromBody] List<DeloadEntryDto> entries)
        {
            if (!HasCurrentUser) return Unauthorized();

            if (entries == null || entries.Count == 0)
                return BadRequest("Brak ćwiczeń do zastosowania.");

            int created = 0;
            foreach (var entry in entries)
            {
                var exercise = new UserExercise
                {
                    UserId = CurrentUserId,
                    ExerciseId = entry.ExerciseId,
                    Date = entry.Date,
                    Sets = entry.Sets,
                    Reps = entry.Reps,
                    Weight = entry.Weight,
                    RPE = entry.RPE,
                    RIR = null
                };
                _context.UserExercise.Add(exercise);
                created++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Zapisano {created} ćwiczeń deload.", count = created });
        }
    }

    public class AcwrResponseDto
    {
        public double Ratio { get; set; }
        public double AcuteLoad { get; set; }
        public double ChronicLoad { get; set; }
        public List<DailyWorkloadDto> DailyWorkload { get; set; } = new();
        public bool InsufficientData { get; set; }
        public string Status { get; set; } = "";
        public string? Alert { get; set; }
    }

    public class DailyWorkloadDto
    {
        public DateTime Date { get; set; }
        public double Workload { get; set; }
    }

    public class DeloadResponseDto
    {
        public List<DeloadEntryDto> Entries { get; set; } = new();
        public string Message { get; set; } = "";
    }

    public class DeloadEntryDto
    {
        public int ExerciseId { get; set; }
        public int? Sets { get; set; }
        public int? Reps { get; set; }
        public decimal? Weight { get; set; }
        public int? RPE { get; set; }
        public DateTime Date { get; set; }
    }
}
