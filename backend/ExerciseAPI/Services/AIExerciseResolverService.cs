using System.Text;
using System.Text.Json;
using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using ExerciseAPI.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ExerciseAPI.Services
{
    public class AIExerciseResolverService : IAiExerciseResolver
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<AIExerciseResolverService> _logger;
        private readonly OpenRouterOptions _openRouterOptions;
        private readonly string _effectiveModel;
        private readonly IMemoryCache _memoryCache;

        public AIExerciseResolverService(
            IHttpClientFactory httpClientFactory,
            IServiceScopeFactory scopeFactory,
            IWebHostEnvironment env,
            ILogger<AIExerciseResolverService> logger,
            IOptions<OpenRouterOptions> openRouterOptions,
            IMemoryCache memoryCache)
        {
            _httpClientFactory = httpClientFactory;
            _scopeFactory = scopeFactory;
            _env = env;
            _logger = logger;
            _openRouterOptions = openRouterOptions.Value;
            _effectiveModel = string.IsNullOrWhiteSpace(_openRouterOptions.Model)
                ? Environment.GetEnvironmentVariable("OPENROUTER_MODEL") ?? "openrouter/auto"
                : _openRouterOptions.Model;
            _memoryCache = memoryCache;
        }

        public async Task<AiExerciseResponseDto> ResolveAsync(int userId, string text, string domain, string language)
        {
            var rateLimitKey = $"ai:ratelimit:{userId}";
            var now = DateTime.UtcNow;
            var windowStart = now.AddMinutes(-1);

            var semaphore = new SemaphoreSlim(1, 1);
            await semaphore.WaitAsync();
            try
            {
                var timestamps = _memoryCache.GetOrCreate(rateLimitKey, entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
                    return new List<DateTime>();
                })!;

                timestamps.RemoveAll(t => t < windowStart);

                if (timestamps.Count >= 30)
                {
                    var oldest = timestamps.Min();
                    var retryAfter = (int)Math.Ceiling((oldest.AddMinutes(1) - now).TotalSeconds);
                    throw new InvalidOperationException($"Rate limit exceeded. Retry after {retryAfter} seconds.");
                }

                timestamps.Add(now);
                _memoryCache.Set(rateLimitKey, timestamps, TimeSpan.FromMinutes(2));
            }
            finally
            {
                semaphore.Release();
            }

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var knownExercises = await BuildKnownExercisesContextAsync(context, userId);

            var promptTemplate = await LoadPromptTemplateAsync(domain);
            var renderedPrompt = RenderPrompt(promptTemplate, knownExercises, text, language);

            var aiResponse = await CallOpenRouterAsync(renderedPrompt, text);

            var responseDto = ParseAndValidateResponse(aiResponse);

            responseDto = await EnrichMatchesAsync(context, responseDto);

            if (responseDto.Unmatched.Count > 0)
            {
                var fallbackMatches = await SearchFullDbAsync(context, responseDto.Unmatched, responseDto.Matches);
                responseDto.Matches.AddRange(fallbackMatches);
            }

            await LogInteractionAsync(userId, domain, text, aiResponse);

            return responseDto;
        }

        private async Task<string> BuildKnownExercisesContextAsync(AppDbContext context, int userId)
        {
            var allUserExercises = await context.UserExercise
                .Where(ue => ue.UserId == userId)
                .Include(ue => ue.Exercise)
                .Select(ue => new
                {
                    ue.ExerciseId,
                    Name = ue.Exercise!.Name,
                    Category = ue.Exercise!.Category,
                    ChestMain = ue.Exercise!.ChestMain,
                    DeltoidAnterior = ue.Exercise!.DeltoidAnterior,
                    DeltoidLateral = ue.Exercise!.DeltoidLateral,
                    DeltoidPosterior = ue.Exercise!.DeltoidPosterior,
                    Biceps = ue.Exercise!.Biceps,
                    Triceps = ue.Exercise!.Triceps,
                    Forearms = ue.Exercise!.Forearms,
                    Lats = ue.Exercise!.Lats,
                    Rhomboids = ue.Exercise!.Rhomboids,
                    LowerBack = ue.Exercise!.LowerBack,
                    Abs = ue.Exercise!.Abs,
                    CoreStabilizers = ue.Exercise!.CoreStabilizers,
                    Quadriceps = ue.Exercise!.Quadriceps,
                    Hamstrings = ue.Exercise!.Hamstrings,
                    Glutes = ue.Exercise!.Glutes,
                    Calves = ue.Exercise!.Calves
                })
                .ToListAsync();

            var userExercises = allUserExercises
                .DistinctBy(x => x.ExerciseId)
                .ToList();

            var knownExercisesList = userExercises.Select(e =>
            {
                var muscleCoeffs = new Dictionary<string, decimal>
                {
                    ["ChestMain"] = e.ChestMain,
                    ["DeltoidAnterior"] = e.DeltoidAnterior,
                    ["DeltoidLateral"] = e.DeltoidLateral,
                    ["DeltoidPosterior"] = e.DeltoidPosterior,
                    ["Biceps"] = e.Biceps,
                    ["Triceps"] = e.Triceps,
                    ["Forearms"] = e.Forearms,
                    ["Lats"] = e.Lats,
                    ["Rhomboids"] = e.Rhomboids,
                    ["LowerBack"] = e.LowerBack,
                    ["Abs"] = e.Abs,
                    ["CoreStabilizers"] = e.CoreStabilizers,
                    ["Quadriceps"] = e.Quadriceps,
                    ["Hamstrings"] = e.Hamstrings,
                    ["Glutes"] = e.Glutes,
                    ["Calves"] = e.Calves
                };

                var topMuscles = muscleCoeffs
                    .Where(kv => kv.Value > 0)
                    .OrderByDescending(kv => kv.Value)
                    .Take(3)
                    .Select(kv => new { muscle = kv.Key, coefficient = kv.Value })
                    .ToList();

                return new
                {
                    dbId = e.ExerciseId,
                    name = e.Name,
                    category = e.Category,
                    topMuscleCoefficients = topMuscles
                };
            }).ToList();

            return JsonSerializer.Serialize(knownExercisesList, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
        }

        private async Task<string> LoadPromptTemplateAsync(string domain)
        {
            var promptPath = Path.Combine(_env.ContentRootPath, "Prompts", $"{domain}.md");
            if (!File.Exists(promptPath))
            {
                promptPath = Path.Combine(_env.WebRootPath, "Prompts", $"{domain}.md");
            }
            if (!File.Exists(promptPath))
            {
                throw new FileNotFoundException($"Prompt template not found: {domain}.md");
            }
            return await File.ReadAllTextAsync(promptPath);
        }

        private string RenderPrompt(string template, string knownExercisesJson, string userText, string language)
        {
            return template
                .Replace("{{knownExercisesJson}}", knownExercisesJson)
                .Replace("{{userText}}", userText)
                .Replace("{{language}}", language);
        }

        private async Task<string> CallOpenRouterAsync(string systemPrompt, string userText)
        {
            var client = _httpClientFactory.CreateClient("OpenRouter");

            var requestBody = new
            {
                model = _effectiveModel,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userText }
                },
                temperature = _openRouterOptions.Temperature,
                max_tokens = _openRouterOptions.MaxTokens,
                response_format = new { type = "json_object" }
            };

            var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync("chat/completions", content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("OpenRouter API error: {StatusCode} - {Response}", response.StatusCode, responseString);
                throw new HttpRequestException($"OpenRouter API returned {response.StatusCode}: {responseString}");
            }

            using var doc = JsonDocument.Parse(responseString);
            var contentText = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? throw new InvalidOperationException("Empty response from OpenRouter");

            return contentText;
        }

        private AiExerciseResponseDto ParseAndValidateResponse(string aiResponseJson)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            AiExerciseResponseDto response;
            try
            {
                response = JsonSerializer.Deserialize<AiExerciseResponseDto>(aiResponseJson, options)
                    ?? throw new InvalidOperationException("Deserialized response is null");
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse AI response as JSON: {Response}", aiResponseJson);
                throw new InvalidOperationException($"Invalid JSON response from AI: {ex.Message}");
            }

            if (response.Matches == null)
            {
                response = response with { Matches = new List<ExerciseMatchDto>() };
            }

            if (response.Unmatched == null)
            {
                response = response with { Unmatched = new List<string>() };
            }

            var validMatches = response.Matches
                .Where(m => m.Confidence > 0.6)
                .Take(3)
                .ToList();

            if (validMatches.Count != response.Matches.Count)
            {
                _logger.LogWarning("Filtered out {Count} matches with confidence <= 0.6 or exceeding max 3",
                    response.Matches.Count - validMatches.Count);
            }

            return response with { Matches = validMatches };
        }

        private async Task<AiExerciseResponseDto> EnrichMatchesAsync(AppDbContext context, AiExerciseResponseDto response)
        {
            var enrichedMatches = new List<ExerciseMatchDto>();

            foreach (var match in response.Matches)
            {
                var exercise = await context.Exercises.FindAsync(match.DbId);
                if (exercise != null)
                {
                    var nameLocalized = await TranslateExerciseNameAsync(exercise.Name, "en");
                    enrichedMatches.Add(match with
                    {
                        GifUrl = exercise.GifUrl,
                        NameLocalized = nameLocalized
                    });
                }
                else
                {
                    _logger.LogWarning("Exercise with DbId {DbId} not found in database", match.DbId);
                    enrichedMatches.Add(match);
                }
            }

            return response with { Matches = enrichedMatches };
        }

        private async Task<string?> TranslateExerciseNameAsync(string name, string targetLanguage)
        {
            if (targetLanguage == "en")
                return name;

            try
            {
                var client = _httpClientFactory.CreateClient("OpenRouter");
                var requestBody = new
                {
                    model = _effectiveModel,
                    messages = new[]
                    {
                        new { role = "system", content = $"Translate the following exercise name to {targetLanguage}. Return only the translated name, no explanations." },
                        new { role = "user", content = name }
                    },
                    temperature = 0.1,
                    max_tokens = 50,
                    response_format = new { type = "json_object" }
                };

                var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync("chat/completions", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseString);
                    var translated = doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();
                    return translated;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to translate exercise name: {Name}", name);
            }

            return name;
        }

        private async Task<List<ExerciseMatchDto>> SearchFullDbAsync(
            AppDbContext context,
            List<string> unmatchedTerms,
            List<ExerciseMatchDto> existingMatches)
        {
            var existingIds = existingMatches.Select(m => m.DbId).ToHashSet();

            var query = context.Exercises
                .Where(e => !existingIds.Contains(e.Id))
                .Where(e => unmatchedTerms.Any(t =>
                    e.Name.Contains(t) ||
                    e.Category.Contains(t) ||
                    e.MuscleGroupMappings.Any(mg => mg.MuscleGroup.Key.Contains(t))
                ))
                .Take(5);

            var results = await query
                .Select(e => new ExerciseMatchDto(
                    e.Id,
                    e.Name,
                    e.Category,
                    0.5,
                    new List<SuggestedSetDto>(),
                    e.GifUrl,
                    null
                ))
                .ToListAsync();

            return results;
        }

        private async Task LogInteractionAsync(int userId, string domain, string userText, string aiResponseJson)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var logContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var log = new AiInteractionLog
                {
                    UserId = userId,
                    Domain = domain,
                    UserText = userText,
                    AiResponseJson = aiResponseJson,
                    ChosenExerciseId = null,
                    CreatedAt = DateTime.UtcNow
                };

                logContext.AiInteractionLogs.Add(log);
                await logContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log AI interaction for user {UserId}", userId);
            }
        }
    }
}