using System.Net;
using System.Collections.Concurrent;
using System.Threading;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using ExerciseAPI.Options;

namespace ExerciseAPI.Middleware;

public class AiRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly AiRateLimitOptions _options;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public AiRateLimitMiddleware(RequestDelegate next, IMemoryCache cache, IOptions<AiRateLimitOptions> options)
    {
        _next = next;
        _cache = cache;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api/ai"))
        {
            await _next(context);
            return;
        }

        if (context.User?.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        var userIdClaim = context.User.FindFirst("sub") ?? context.User.FindFirst("userId") ?? context.User.FindFirst("id");
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            await _next(context);
            return;
        }

        var cacheKey = $"ai:ratelimit:{userId}";
        var now = DateTime.UtcNow;
        var windowStart = now.AddMinutes(-1);

        var semaphore = _locks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();
        try
        {
            var timestamps = _cache.GetOrCreate(cacheKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
                return new List<DateTime>();
            })!;

            timestamps.RemoveAll(t => t < windowStart);

            if (timestamps.Count >= _options.RequestsPerMinute)
            {
                var oldest = timestamps.Min();
                var retryAfter = (int)Math.Ceiling((oldest.AddMinutes(1) - now).TotalSeconds);

                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers["X-RateLimit-Limit"] = _options.RequestsPerMinute.ToString();
                context.Response.Headers["X-RateLimit-Remaining"] = "0";
                context.Response.Headers["Retry-After"] = retryAfter.ToString();

                return;
            }

            timestamps.Add(now);
            _cache.Set(cacheKey, timestamps, TimeSpan.FromMinutes(2));

            context.Response.Headers["X-RateLimit-Limit"] = _options.RequestsPerMinute.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = (_options.RequestsPerMinute - timestamps.Count).ToString();
        }
        finally
        {
            semaphore.Release();
        }

        await _next(context);
    }
}