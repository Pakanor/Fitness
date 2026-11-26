using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;
using FitnessApp.Core.Utils;
using Microsoft.AspNetCore.Http;
using System.Globalization;

namespace FitnessApp.Core.Services;

public sealed class ClaimsCurrentUserAccessor : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClaimsCurrentUserAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public CurrentUser Get()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var headers = httpContext?.Request.Headers;

        // Read X-User-Id header (set by Gateway)
        if (headers == null || !int.TryParse(headers["X-User-Id"], out var userId))
        {
            return CurrentUser.Anonymous;
        }

        var name = headers["X-User-Name"].ToString();
        if (string.IsNullOrWhiteSpace(name))
        {
            name = null;
        }

        var email = headers["X-User-Email"].ToString();
        if (string.IsNullOrWhiteSpace(email))
        {
            email = null;
        }

        // Read profile data from JWT claims via Authorization header
        var authHeader = httpContext?.Request.Headers["Authorization"].ToString();
        string? token = null;
        if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            token = authHeader["Bearer ".Length..];
        }

        var (weight, experience, caloricTarget) = token != null
            ? JwtClaimsParser.ParseProfileClaims(token)
            : (null, null, null);

        return new CurrentUser
        {
            Id = userId,
            IsAuthenticated = true,
            Profile = new UserProfile
            {
                Weight = weight ?? UserProfile.Default.Weight,
                TrainingExperience = experience ?? UserProfile.Default.TrainingExperience,
                CaloricTarget = caloricTarget
            },
            Name = name,
            Email = email
        };
    }

    public Task<CurrentUser> GetFreshAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(Get());
}