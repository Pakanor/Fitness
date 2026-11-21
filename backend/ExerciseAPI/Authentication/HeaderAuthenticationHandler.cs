using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace ExerciseAPI.Authentication;

public sealed class HeaderAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public HeaderAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ISystemClock clock)
        : base(options, logger, encoder, clock)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var userIdHeader = Request.Headers["X-User-Id"].FirstOrDefault();
        var sessionIdHeader = Request.Headers["X-Session-Id"].FirstOrDefault();
        var userNameHeader = Request.Headers["X-User-Name"].FirstOrDefault();
        var userEmailHeader = Request.Headers["X-User-Email"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(userIdHeader) || !int.TryParse(userIdHeader, out var userId))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
        };

        if (!string.IsNullOrWhiteSpace(userNameHeader))
            claims.Add(new Claim(ClaimTypes.Name, userNameHeader));

        if (!string.IsNullOrWhiteSpace(userEmailHeader))
            claims.Add(new Claim(ClaimTypes.Email, userEmailHeader));

        if (!string.IsNullOrWhiteSpace(sessionIdHeader))
            claims.Add(new Claim("session_id", sessionIdHeader));

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public static class HeaderAuthenticationExtensions
{
    public static AuthenticationBuilder AddHeaderAuthentication(this AuthenticationBuilder builder)
    {
        return builder.AddScheme<AuthenticationSchemeOptions, HeaderAuthenticationHandler>(
            "HeaderAuth", options => { });
    }
}