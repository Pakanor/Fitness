using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;
using FitnessApp.Core.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ExerciseAPI.Services;

public sealed class FreshCurrentUserAccessor : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ISessionValidator _sessionValidator;
    private readonly ClaimsCurrentUserAccessor _claimsAccessor;

    public FreshCurrentUserAccessor(
        IHttpContextAccessor httpContextAccessor,
        ISessionValidator sessionValidator,
        ClaimsCurrentUserAccessor claimsAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
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

        // For ExerciseAPI, we return the claims-based user with validated session
        // The profile data comes from JWT claims (validated by Gateway)
        var claimsUser = _claimsAccessor.Get();
        return claimsUser with { IsAuthenticated = true };
    }
}