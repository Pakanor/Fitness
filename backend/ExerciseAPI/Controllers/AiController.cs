using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiExerciseResolver _resolver;
        private readonly ILogger<AiController> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AiController(IAiExerciseResolver resolver, ILogger<AiController> logger, IHttpContextAccessor httpContextAccessor)
        {
            _resolver = resolver;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpPost("resolve-exercises")]
        public async Task<ActionResult<AiExerciseResponseDto>> ResolveExercises([FromBody] AiExerciseRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new { error = "Text is required" });
            }

            var userId = GetCurrentUserId();
            if (userId <= 0)
            {
                return Unauthorized();
            }

            var language = GetUserLanguage();

            try
            {
                var result = await _resolver.ResolveAsync(userId, request.Text, request.Domain, language);
                return Ok(result);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Rate limit"))
            {
                _logger.LogWarning("Rate limit exceeded for user {UserId}: {Message}", userId, ex.Message);
                return StatusCode(429, new { error = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "OpenRouter API error for user {UserId}", userId);
                return StatusCode(502, new { error = "AI service temporarily unavailable" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error resolving exercises for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to resolve exercises" });
            }
        }

        private int GetCurrentUserId()
        {
            var headers = _httpContextAccessor.HttpContext?.Request.Headers;
            if (headers == null || !int.TryParse(headers["X-User-Id"], out var userId))
            {
                var user = _httpContextAccessor.HttpContext?.User;
                var claim = user?.FindFirst("sub") ?? user?.FindFirst("userId") ?? user?.FindFirst("id");
                if (claim != null && int.TryParse(claim.Value, out var claimUserId))
                {
                    return claimUserId;
                }
                return -1;
            }
            return userId;
        }

        private string GetUserLanguage()
        {
            var headers = _httpContextAccessor.HttpContext?.Request.Headers;
            if (headers != null)
            {
                var langHeader = headers["Accept-Language"].ToString();
                if (!string.IsNullOrWhiteSpace(langHeader))
                {
                    var primaryLang = langHeader.Split(',')[0].Split('-')[0].Trim().ToLower();
                    if (primaryLang.Length == 2)
                        return primaryLang;
                }
            }

            var user = _httpContextAccessor.HttpContext?.User;
            var langClaim = user?.FindFirst("language") ?? user?.FindFirst("lang");
            if (langClaim != null && !string.IsNullOrWhiteSpace(langClaim.Value))
            {
                return langClaim.Value.ToLower();
            }

            return "en";
        }
    }
}