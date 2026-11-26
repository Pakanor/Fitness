using FitnessApp.Core.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddFitnessAuthAsGateway(builder.Configuration);

var app = builder.Build();

app.UseCors(FitnessAppAuthExtensions.CorsPolicyName);
app.UseAuthentication();
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst("sub")?.Value;
        var userName = context.User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? context.User.FindFirst("unique_name")?.Value;
        var userEmail = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? context.User.FindFirst("email")?.Value;
        var sessionId = context.User.FindFirst("session_id")?.Value;

        context.Request.Headers.Remove("X-User-Id");
        context.Request.Headers.Remove("X-Session-Id");
        context.Request.Headers.Remove("X-User-Name");
        context.Request.Headers.Remove("X-User-Email");

        if (!string.IsNullOrWhiteSpace(userId))
        {
            context.Request.Headers["X-User-Id"] = userId;
            var token = context.Request.Cookies["FitnessApp-Auth"];
            context.Request.Headers["Authorization"] = $"Bearer {token}";
        }
        if (!string.IsNullOrWhiteSpace(sessionId))
            context.Request.Headers["X-Session-Id"] = sessionId;
        if (!string.IsNullOrWhiteSpace(userName))
            context.Request.Headers["X-User-Name"] = userName;
        if (!string.IsNullOrWhiteSpace(userEmail))
            context.Request.Headers["X-User-Email"] = userEmail;
    }

    await next();
});

app.UseCors(FitnessAppAuthExtensions.CorsPolicyName);

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapReverseProxy();

app.MapFallbackToFile("index.html");

app.Run();
