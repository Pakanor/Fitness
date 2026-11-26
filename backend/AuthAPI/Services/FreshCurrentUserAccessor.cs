using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;
using FitnessApp.Core.Services;
using AuthAPI.DataAccess;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace AuthAPI.Services;

public sealed class FreshCurrentUserAccessor : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserLogrepository _userRepo;
    private readonly ISessionValidator _sessionValidator;
    private readonly ClaimsCurrentUserAccessor _claimsAccessor;

    public FreshCurrentUserAccessor(
        IHttpContextAccessor httpContextAccessor,
        UserLogrepository userRepo,
        ISessionValidator sessionValidator,
        ClaimsCurrentUserAccessor claimsAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        _userRepo = userRepo;
        _sessionValidator = sessionValidator;
        _claimsAccessor = claimsAccessor;
    }

    public CurrentUser Get()
        => _claimsAccessor.Get();

    public async Task<CurrentUser> GetFreshAsync(CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            throw new UnauthorizedAccessException("No HTTP context");
        }

        // Get session ID from header (set by Gateway)
        var sessionIdHeader = httpContext.Request.Headers["X-Session-Id"].ToString();
        if (string.IsNullOrWhiteSpace(sessionIdHeader) || !SessionId.TryParse(sessionIdHeader, out var sessionId))
        {
            throw new UnauthorizedAccessException("Missing or invalid session ID");
        }

        // Validate session via shared validator
        var isValid = await _sessionValidator.ValidateSessionAsync(sessionId, cancellationToken);
        if (!isValid)
        {
            throw new UnauthorizedAccessException("Session revoked or expired");
        }

        // Get user ID from header (set by Gateway)
        var userIdHeader = httpContext.Request.Headers["X-User-Id"].ToString();
        if (string.IsNullOrWhiteSpace(userIdHeader) || !int.TryParse(userIdHeader, out var userId))
        {
            throw new UnauthorizedAccessException("Missing or invalid user ID");
        }

        // Get fresh user profile from database
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var profile = new UserProfile
        {
            Weight = user.CurrentWeight ?? UserProfile.Default.Weight,
            TrainingExperience = GetTrainingExperience(user.JobType),
            CaloricTarget = user.ManualCaloricTarget ?? user.GetTdee() ?? (decimal?)null
        };

        return new CurrentUser
        {
            Id = user.ID,
            IsAuthenticated = true,
            Profile = profile,
            Name = user.Username,
            Email = user.Email
        };
    }

    private static string GetTrainingExperience(string? jobType)
    {
        return jobType?.ToLowerInvariant() switch
        {
            "sedentary" or "light_active" => "beginner",
            "moderate_active" => "intermediate",
            "very_active" or "extra_active" => "advanced",
            _ => "intermediate"
        };
    }
}