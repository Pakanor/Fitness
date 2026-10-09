using Microsoft.AspNetCore.Mvc;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using ExerciseAPI.Data;
using ExerciseAPI.Models;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using Microsoft.Extensions.Caching.Memory;
namespace ExerciseAPI.Controllers
{
    [ApiController]

    [Route("api/[controller]")]
    public class ExerciseDbController : FitnessControllerBase
    {
        private readonly ExerciseDbImportService _importService;
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;


        public ExerciseDbController(ExerciseDbImportService importService, AppDbContext context, IHttpContextAccessor httpContextAccessor, IMemoryCache cache)
            : base(httpContextAccessor)
        {
            _importService = importService;
            _context = context;
            _cache = cache;
        }
        [Authorize(Roles = "Admin")]

        [HttpPost("import")]
        public async Task<IActionResult> Import()
        {
            await _importService.ImportExercisesAsync();
            return Ok("Import ćwiczeń zakończony.");
        }

        [HttpPost("import-gifs")]
        public async Task<IActionResult> ImportGifs()
        {
            var count = await _importService.ImportGifsFromApiAsync();
            return Ok($"Zaktualizowano {count} ćwiczeń z GIF-ami.");
        }


        [HttpDelete("exercises/clear")]
        public async Task<IActionResult> ClearExercises()
        {
            _context.Exercises.RemoveRange(_context.Exercises);
            await _context.SaveChangesAsync();
            return Ok("Wyczyszczono wszystkie ćwiczenia.");
        }
        [HttpGet("exercise")]
        public async Task<IActionResult> GetAll()
        {
            var exercises = await _context.Exercises
                .Select(e => new
                {
                    e.Id,
                    e.ExternalId,
                    e.Name,
                    e.Description,
                    e.Category,
                    e.ImageUrl,
                    e.GifUrl,
                    MuscleMappings = _context.ExerciseMuscleGroups
                        .Where(emg => emg.ExerciseId == e.Id)
                        .Select(emg => new
                        {
                            MuscleGroupKey = emg.MuscleGroupKey,
                            WeightPercentage = emg.WeightPercentage
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(exercises);
        }
        [HttpGet("exercise/categories")]
        public async Task<IActionResult> GetExerciseCategories()
        {
            var categories = await _context.Exercises
            .Select(e => e.Category)
            .Distinct()
            .ToListAsync();
            return Ok(categories);
        }
        [HttpGet("exercise/{bodyPart}")]
        public async Task<IActionResult> GetExercisesByBodyParts(string bodyPart)
        {
            var exercises = await _context.Exercises
                .Where(e => e.Category.ToLower() == bodyPart.ToLower())
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Category,
                    e.ImageUrl,
                    e.GifUrl,
                    MuscleMappings = _context.ExerciseMuscleGroups
                        .Where(emg => emg.ExerciseId == e.Id)
                        .Select(emg => new
                        {
                            emg.MuscleGroupKey,
                            emg.WeightPercentage
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(exercises);
        }
        
        [HttpGet("exercise/id/{id}")]
        public async Task<IActionResult> GetExerciseById(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null)
                return NotFound();

            var mappings = await _context.ExerciseMuscleGroups
                .Where(emg => emg.ExerciseId == id)
                .Select(emg => new
                {
                    emg.MuscleGroupKey,
                    emg.WeightPercentage
                })
                .ToListAsync();

            return Ok(new
            {
                exercise.Id,
                exercise.ExternalId,
                exercise.Name,
                exercise.Description,
                exercise.Category,
                exercise.ImageUrl,
                exercise.GifUrl,
                MuscleMappings = mappings
            });
        }
        [HttpGet("exercise/search/{term}")]
        public async Task<IActionResult> SearchExercises(string term, [FromQuery] int offset = 0, [FromQuery] int limit = 50)
        {
            if (string.IsNullOrWhiteSpace(term))
                return Ok(Array.Empty<object>());

            offset = Math.Max(0, offset);
            limit = Math.Clamp(limit, 1, 50);
            var cacheKey = $"exercise-search:{term.Trim().ToLowerInvariant()}:{offset}:{limit}";

            var exercises = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                return await _context.Exercises
                .Where(e => EF.Functions.ILike(e.Name, $"%{term.Trim()}%"))
                .OrderBy(e => e.Name)
                .Skip(offset)
                .Take(limit)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.GifUrl
                })
                .ToListAsync();
            });
            return Ok(exercises);
        }
        [HttpPut("exercise/{id}/mappings")]
        public async Task<IActionResult> UpdateMappings(int id, [FromBody] List<ExerciseAPI.Models.ExerciseMuscleGroup> mappings)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null)
                return NotFound("Ćwiczenie nie istnieje");

            var existing = await _context.ExerciseMuscleGroups
                .Where(emg => emg.ExerciseId == id)
                .ToListAsync();
            _context.ExerciseMuscleGroups.RemoveRange(existing);

            foreach (var m in mappings)
            {
                m.ExerciseId = id;
                m.Id = 0;
                _context.ExerciseMuscleGroups.Add(m);
            }

            await _context.SaveChangesAsync();
            return Ok("Zapisano");
        }

        [HttpPost("userexercise/add")]
        [Authorize]
        public async Task<IActionResult> AddUserExercise([FromBody] AddUserExerciseDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var exerciseExists = await _context.Exercises.AnyAsync(e => e.Id == dto.ExerciseId);
            if (!exerciseExists)
                return BadRequest("Niepoprawne ćwiczenie");

            // Validate RPE in Sets array if provided
            if (dto.Sets != null && dto.Sets.Any())
            {
                foreach (var set in dto.Sets)
                {
                    if (set.RPE.HasValue && (set.RPE < 1 || set.RPE > 10))
                        return BadRequest("RPE musi być w zakresie 1-10");
                }
            }
            else if (dto.RPE.HasValue && (dto.RPE < 1 || dto.RPE > 10))
            {
                return BadRequest("RPE musi być w zakresie 1-10");
            }

            var date = dto.Date.HasValue
                ? DateTime.SpecifyKind(dto.Date.Value.Date, DateTimeKind.Utc)
                : DateTime.UtcNow;

            // A session owns its day: planned and finished workouts reject writes
            // made outside the /api/workouts lifecycle.
            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(s => s.UserId == CurrentUserId && s.Date == date);

            if (session != null)
                return Conflict(session.Status == WorkoutStatus.Planned
                    ? "Najpierw rozpocznij trening, aby zapisywać serie."
                    : "Zakończony trening jest zablokowany do edycji.");

            var entity = new UserExercise
            {
                UserId = CurrentUserId,
                ExerciseId = dto.ExerciseId,
                Date = date
            };

            _context.UserExercise.Add(entity);
            await _context.SaveChangesAsync(); // Save to get entity.Id

            // Create WorkoutSet records from the Sets array (new granular format)
            var setsToCreate = new List<LogSingleSetDto>();

            if (dto.Sets != null && dto.Sets.Any())
            {
                setsToCreate = dto.Sets;
            }
            else if (dto.SetsCount.HasValue || dto.Reps.HasValue || dto.Weight.HasValue)
            {
                // Legacy format: create sets from aggregate data
                var setCount = dto.SetsCount ?? 1;
                for (int i = 1; i <= setCount; i++)
                {
                    setsToCreate.Add(new LogSingleSetDto
                    {
                        SetNumber = i,
                        Reps = dto.Reps ?? 0,
                        Weight = dto.Weight ?? 0,
                        RPE = dto.RPE,
                        IsWarmup = dto.IsWarmup
                    });
                }
            }

            foreach (var setDto in setsToCreate.OrderBy(s => s.SetNumber))
            {
                var workoutSet = new WorkoutSet
                {
                    UserExerciseId = entity.Id,
                    SetNumber = setDto.SetNumber,
                    Weight = setDto.Weight,
                    Reps = setDto.Reps,
                    RPE = setDto.RPE,
                    IsWarmup = setDto.IsWarmup
                };
                _context.WorkoutSets.Add(workoutSet);
            }

            await _context.SaveChangesAsync();

            // Update personal record based on best set
            var bestSet = setsToCreate
                .Where(s => !s.IsWarmup && s.Weight > 0 && s.Reps > 0)
                .OrderByDescending(s => s.Weight * (1 + s.Reps / 30.0m))
                .FirstOrDefault();

            if (bestSet != null)
            {
                var previousRecord = await _context.PersonalRecords
                    .Where(pr => pr.UserId == entity.UserId && pr.ExerciseId == entity.ExerciseId && pr.Reps == bestSet.Reps)
                    .OrderByDescending(pr => pr.Weight)
                    .FirstOrDefaultAsync();

                if (previousRecord == null || bestSet.Weight > previousRecord.Weight)
                {
                    decimal userWeight = (decimal)UserWeight;
                    int? userAge = null;

                    var pr = new PersonalRecord
                    {
                        UserId = entity.UserId,
                        ExerciseId = entity.ExerciseId,
                        Weight = bestSet.Weight,
                        Reps = bestSet.Reps,
                        Date = entity.Date,
                        UserWeightAtTime = userWeight,
                        UserAgeAtTime = userAge,
                        StrengthToWeightRatio = userWeight > 0
                            ? Math.Round(bestSet.Weight / userWeight, 2)
                            : null
                    };

                    _context.PersonalRecords.Add(pr);
                    await _context.SaveChangesAsync();
                }
            }

            var firstSet = setsToCreate.OrderBy(s => s.SetNumber).FirstOrDefault();
            var response = new UserExerciseResponseDto
            {
                Id = entity.Id,
                ExerciseId = entity.ExerciseId,
                Sets = setsToCreate.OrderBy(s => s.SetNumber).Select(s => new SessionSetDto
                {
                    SetNumber = s.SetNumber,
                    Weight = s.Weight,
                    Reps = s.Reps,
                    RPE = s.RPE,
                    IsWarmup = s.IsWarmup
                }).ToList(),
                SetsCount = setsToCreate.Count,
                Reps = firstSet?.Reps,
                Weight = firstSet?.Weight,
                RPE = firstSet?.RPE,
                IsWarmup = firstSet?.IsWarmup ?? false,
                Date = entity.Date
            };

            return Ok(response);
        }


        [HttpGet("userexercise/bydate")]
        [Authorize]
        public async Task<IActionResult> GetExercisesByDate([FromQuery] string date)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest("Nieprawidłowy format daty");

            var startUtc = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
            var endUtc = startUtc.AddDays(1);

            var filtered = await _context.UserExercise
                .Where(ue => ue.UserId == CurrentUserId && ue.Date >= startUtc && ue.Date < endUtc)
                .Include(ue => ue.Sets)
                .ToListAsync();

            var exerciseIds = filtered.Select(ue => ue.ExerciseId).Distinct().ToList();

            var exercises = await _context.Exercises
                .Where(e => exerciseIds.Contains(e.Id))
                .ToListAsync();

            var daySession = await _context.WorkoutSessions
                .FirstOrDefaultAsync(s => s.UserId == CurrentUserId
                                          && s.Date == startUtc
                                          && s.Exercises.Any());

            var result = filtered.Select(ue => {
                var exercise = exercises.FirstOrDefault(e => e.Id == ue.ExerciseId);
                var sets = ue.Sets.OrderBy(s => s.SetNumber).ToList();
                var firstSet = sets.FirstOrDefault();

                // Build primaryMuscles from the exercise's 16 activation columns.
                string primaryMuscles = "";
                if (exercise != null)
                {
                    var engaged = new List<string>();
                    void AddIf(decimal v, string name) { if (v >= 0.4m) engaged.Add(name); }
                    AddIf(exercise.Quadriceps, "Czwórki");
                    AddIf(exercise.Hamstrings, "Dwugłowe uda");
                    AddIf(exercise.Glutes, "Pośladki");
                    AddIf(exercise.ChestMain, "Klatka");
                    AddIf(exercise.Lats, "Plecy szerokie");
                    AddIf(exercise.DeltoidAnterior, "Bark przedni");
                    AddIf(exercise.DeltoidLateral, "Bark boczny");
                    AddIf(exercise.DeltoidPosterior, "Bark tylny");
                    AddIf(exercise.Biceps, "Biceps");
                    AddIf(exercise.Triceps, "Triceps");
                    AddIf(exercise.Forearms, "Przedramiona");
                    AddIf(exercise.Abs, "Brzuch");
                    AddIf(exercise.CoreStabilizers, "Stabilizatory");
                    AddIf(exercise.LowerBack, "Dolny pleców");
                    AddIf(exercise.Rhomboids, "Romby");
                    AddIf(exercise.Calves, "Łydki");
                    if (engaged.Count > 0) primaryMuscles = string.Join(", ", engaged);
                }

                return new {
                    userExerciseId = ue.Id,
                    exerciseId = ue.ExerciseId,
                    name = exercise?.Name ?? "Nieznane",
                    category = exercise?.Category ?? "",
                    primaryMuscles,
                    gifUrl = exercise?.GifUrl ?? "",
                    sets = sets.Count, // Legacy: number of sets
                    reps = firstSet?.Reps,
                    weight = firstSet?.Weight,
                    rpe = firstSet?.RPE,
                    isWarmup = firstSet?.IsWarmup ?? false,
                    templateId = ue.TemplateId,
                    sessionId = ue.SessionId,
                    sessionStatus = daySession != null
                        ? WorkoutSessionsController.ToStatusString(daySession.Status)
                        : null,
                    canLogSets = daySession == null || daySession.Status == WorkoutStatus.InProgress,
                    date = ue.Date
                };
            }).ToList();

            return Ok(result);
        }


        [HttpGet("userexercise/byuser")]
        [Authorize]
        public async Task<IActionResult> GetUserExercises()
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var exercises = await _context.UserExercise
                .Where(ue => ue.UserId == CurrentUserId)
                .Where(ue => ue.SessionId == null
                    || _context.WorkoutSessions.Any(session =>
                        session.Id == ue.SessionId.Value
                        && session.Status != WorkoutStatus.Planned))
                .Select(ue => new { ue.ExerciseId })
                .ToListAsync();

            return Ok(exercises);
        }

       [HttpDelete("userexercise/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUserExercise(int id)
        {
                if (!HasCurrentUser)
                return Unauthorized();

                var entry = await _context.UserExercise.FindAsync(id);

                if (entry == null || entry.UserId != CurrentUserId)
                return NotFound();

            WorkoutSession? sessionToRemove = null;
            if (entry.SessionId.HasValue)
            {
                var hasOtherExercises = await _context.UserExercise
                    .AnyAsync(ue => ue.SessionId == entry.SessionId.Value && ue.Id != entry.Id);

                if (!hasOtherExercises)
                {
                    sessionToRemove = await _context.WorkoutSessions
                        .FirstOrDefaultAsync(s => s.Id == entry.SessionId.Value);
                }
            }

            _context.UserExercise.Remove(entry);
            if (sessionToRemove != null)
                _context.WorkoutSessions.Remove(sessionToRemove);

            await _context.SaveChangesAsync();

            return NoContent();
        }
}
}