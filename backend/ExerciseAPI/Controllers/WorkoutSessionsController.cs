using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Controllers
{
    /// <summary>
    /// Workout session lifecycle: PLANNED -> IN_PROGRESS -> COMPLETED.
    /// Planned sessions list their exercises but reject every set write.
    /// </summary>
    [ApiController]
    [Route("api/workouts")]
    [Authorize]
    public class WorkoutSessionsController : FitnessControllerBase
    {
        private readonly IWorkoutSessionService _sessionService;
        private readonly AppDbContext _context;

        public WorkoutSessionsController(
            IWorkoutSessionService sessionService,
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _sessionService = sessionService;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSessionForDate([FromQuery] string date)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest("Nieprawidłowy format daty");

            var session = await _sessionService.GetSessionByDate(CurrentUserId, parsedDate);
            if (session == null)
                return NotFound("Brak zaplanowanego treningu na ten dzień.");

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSession()
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var session = await _sessionService.GetActiveSession(CurrentUserId);
            if (session == null)
                return NotFound("Brak niedokończonego treningu.");

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpGet("incomplete")]
        public async Task<IActionResult> GetIncompleteSessions()
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var sessions = await _sessionService.GetIncompleteSessions(CurrentUserId);
            return Ok(sessions.Select(session => new
            {
                session.Id,
                session.Date,
                TemplateName = session.Template?.Name,
                ExerciseCount = session.Exercises.Count,
                Status = ToStatusString(session.Status)
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSession(int id)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var session = await _sessionService.GetSessionById(id, CurrentUserId);
            if (session == null)
                return NotFound();

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpPost("from-template/{templateId}")]
        public async Task<IActionResult> CreateFromTemplate(int templateId, [FromBody] CreateSessionFromTemplateDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            try
            {
                var session = await _sessionService.CreateFromTemplate(CurrentUserId, templateId, dto.Date);
                var response = await MapToResponseAsync(session);
                return CreatedAtAction(nameof(GetSession), new { id = session.Id }, response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{id}/start")]
        public async Task<IActionResult> Start(int id)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            try
            {
                var session = await _sessionService.Start(CurrentUserId, id);
                var response = await MapToResponseAsync(session);
                return Ok(response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{id}/finish")]
        public async Task<IActionResult> Finish(int id)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            try
            {
                var session = await _sessionService.Finish(CurrentUserId, id);
                var response = await MapToResponseAsync(session);
                return Ok(response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{id}/reopen")]
        public async Task<IActionResult> Reopen(int id)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            try
            {
                var session = await _sessionService.Reopen(CurrentUserId, id);
                var response = await MapToResponseAsync(session);
                return Ok(response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPost("sets")]
        public async Task<IActionResult> LogSet([FromBody] LogSetDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            if (dto == null)
                return BadRequest("Brak danych.");

            try
            {
                var (entry, session) = await _sessionService.LogSet(CurrentUserId, dto, (decimal)UserWeight);
                var response = await MapToResponseAsync(session);
                
                bool isPr = false;
                try
                {
                    var setsToCheck = entry.Sets
                        .Where(s => s.SetType != Models.SetType.Warmup && s.Weight > 0 && s.Reps > 0)
                        .ToList();
                    if (setsToCheck.Any())
                    {
                        var bestWeightReps = setsToCheck
                            .OrderByDescending(s => s.Weight * (1 + s.Reps / 30.0m))
                            .First();
                        
                        var existingPr = await _context.PersonalRecords
                            .Where(pr => pr.UserId == CurrentUserId && pr.ExerciseId == entry.ExerciseId)
                            .OrderByDescending(pr => pr.Weight * (1 + pr.Reps / 30.0m))
                            .FirstOrDefaultAsync();
                        
                        if (existingPr == null || 
                            bestWeightReps.Weight * (1 + bestWeightReps.Reps / 30.0m) > existingPr.Weight * (1 + existingPr.Reps / 30.0m) ||
                            (bestWeightReps.Weight * (1 + bestWeightReps.Reps / 30.0m) == existingPr.Weight * (1 + existingPr.Reps / 30.0m) && bestWeightReps.Weight > existingPr.Weight))
                        {
                            isPr = true;
                        }
                    }
                }
                catch { }
                
                return Ok(new
                {
                    entry = new
                    {
                        userExerciseId = entry.Id,
                        exerciseId = entry.ExerciseId,
                        sets = entry.Sets.Select(s => new { s.Id, s.SetNumber, s.Weight, s.Reps, s.RPE, SetType = s.SetType, Volume = s.Weight * s.Reps }),
                    },
                    session = response,
                    isPr = isPr
                });
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        private async Task<WorkoutSessionResponseDto> MapToResponseAsync(WorkoutSession session)
        {
            var exerciseIds = session.Exercises.Select(e => e.ExerciseId).Distinct().ToList();

            var exercises = await _context.Exercises
                .Where(e => exerciseIds.Contains(e.Id))
                .Select(e => new { e.Id, e.Name, e.Category, e.GifUrl })
                .ToListAsync();

            string? templateName = null;
            if (session.TemplateId.HasValue)
            {
                templateName = await _context.WorkoutTemplates
                    .Where(t => t.Id == session.TemplateId.Value)
                    .Select(t => t.Name)
                    .FirstOrDefaultAsync();
            }

            return new WorkoutSessionResponseDto
            {
                Id = session.Id,
                UserId = session.UserId,
                Date = session.Date,
                Status = ToStatusString(session.Status),
                TemplateId = session.TemplateId,
                TemplateName = templateName,
                StartMode = session.StartMode.ToString(),
                TotalVolume = session.TotalVolume,
                ExerciseCount = session.Exercises.Count,
                CanLogSets = session.Status == WorkoutStatus.InProgress,
                CanReopen = session.Status == WorkoutStatus.Completed,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt,
                StartedAt = session.StartedAt,
                CompletedAt = session.CompletedAt,
                Exercises = session.Exercises
                    .OrderBy(e => e.Id)
                    .Select(e =>
                    {
                        var exercise = exercises.FirstOrDefault(x => x.Id == e.ExerciseId);
                        var sets = e.Sets.OrderBy(s => s.SetNumber).ToList();
                        return new SessionExerciseDto
                        {
                            UserExerciseId = e.Id,
                            ExerciseId = e.ExerciseId,
                            ExerciseName = exercise?.Name ?? string.Empty,
                            Category = exercise?.Category ?? string.Empty,
                            GifUrl = exercise?.GifUrl ?? string.Empty,
                            Sets = sets.Select(s => new SessionSetDto
                            {
                                Id = s.Id,
                                SetNumber = s.SetNumber,
                                Weight = s.Weight,
                                Reps = s.Reps,
                                RPE = s.RPE,
                                SetType = s.SetType
                            }).ToList(),
                            SetsCount = sets.Count,
                            Reps = sets.FirstOrDefault()?.Reps,
                            Weight = sets.FirstOrDefault()?.Weight,
                            RPE = sets.FirstOrDefault()?.RPE,
                            SetType = sets.FirstOrDefault()?.SetType ?? Models.SetType.Normal,
                            SupersetGroupId = e.SupersetGroupId,
                            Notes = e.Notes,
                            Volume = sets.Sum(s => s.Weight * s.Reps)
                        };
                    })
                    .ToList()
            };
        }

        internal static string ToStatusString(WorkoutStatus status) => status switch
        {
            WorkoutStatus.Planned => "planned",
            WorkoutStatus.InProgress => "in_progress",
            WorkoutStatus.Completed => "completed",
            _ => status.ToString().ToLowerInvariant()
        };
    }
}
