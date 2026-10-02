using System.Text.Json;
using System.Text;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    if (context.Request.Cookies.TryGetValue("FitnessApp-Auth", out var token))
    {
        context.Request.Headers.Remove("X-User-Id");
        context.Request.Headers.Remove("X-User-Name");
        context.Request.Headers.Remove("X-User-Email");
        context.Request.Headers.Remove("X-User-Weight");
        context.Request.Headers.Remove("X-User-TrainingExperience");
        context.Request.Headers.Remove("X-User-CaloricTarget");

        if (TryReadJwtPayload(token, out var claims))
        {
            claims.TryGetValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", out var userId);
            if (string.IsNullOrWhiteSpace(userId))
                claims.TryGetValue("sub", out userId);

            claims.TryGetValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", out var userName);
            if (string.IsNullOrWhiteSpace(userName))
                claims.TryGetValue("unique_name", out userName);

            claims.TryGetValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", out var userEmail);
            if (string.IsNullOrWhiteSpace(userEmail))
                claims.TryGetValue("email", out userEmail);

            claims.TryGetValue("current_weight", out var currentWeight);
            claims.TryGetValue("training_experience", out var trainingExperience);
            claims.TryGetValue("caloric_target", out var caloricTarget);

            if (!string.IsNullOrWhiteSpace(userId))
            {
                context.Request.Headers["X-User-Id"] = userId;
                context.Request.Headers["Authorization"] = $"Bearer {token}";
            }
            if (!string.IsNullOrWhiteSpace(userName))
                context.Request.Headers["X-User-Name"] = userName;
            if (!string.IsNullOrWhiteSpace(userEmail))
                context.Request.Headers["X-User-Email"] = userEmail;
            if (!string.IsNullOrWhiteSpace(currentWeight))
                context.Request.Headers["X-User-Weight"] = currentWeight;
            if (!string.IsNullOrWhiteSpace(trainingExperience))
                context.Request.Headers["X-User-TrainingExperience"] = trainingExperience;
            if (!string.IsNullOrWhiteSpace(caloricTarget))
                context.Request.Headers["X-User-CaloricTarget"] = caloricTarget;
        }
    }

    await next();
});

app.UseCors("AllowFrontend");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapReverseProxy();

app.MapFallbackToFile("index.html");

app.Run();

bool TryReadJwtPayload(string token, out Dictionary<string, string> claims)
{
    claims = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    var parts = token.Split('.');
    if (parts.Length < 2)
        return false;

    try
    {
        var signingInput = $"{parts[0]}.{parts[1]}";
        var expectedSignature = Base64UrlDecode(parts[2]);
        var secret = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "SUPER_SECRET_KEY_123456789012345678901234567890");
        using var hmac = new HMACSHA256(secret);
        var actualSignature = hmac.ComputeHash(Encoding.UTF8.GetBytes(signingInput));

        if (!CryptographicOperations.FixedTimeEquals(expectedSignature, actualSignature))
            return false;

        var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
        using var document = JsonDocument.Parse(payloadJson);

        foreach (var property in document.RootElement.EnumerateObject())
        {
            if (property.Value.ValueKind == JsonValueKind.String)
                claims[property.Name] = property.Value.GetString() ?? string.Empty;
            else if (property.Value.ValueKind == JsonValueKind.Number)
                claims[property.Name] = property.Value.GetRawText();
        }

        if (claims.TryGetValue("exp", out var expValue) && long.TryParse(expValue, out var expSeconds))
        {
            var expiry = DateTimeOffset.FromUnixTimeSeconds(expSeconds);
            if (expiry <= DateTimeOffset.UtcNow)
                return false;
        }

        return true;
    }
    catch
    {
        claims = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        return false;
    }
}

static byte[] Base64UrlDecode(string input)
{
    var padded = input.Replace('-', '+').Replace('_', '/');
    switch (padded.Length % 4)
    {
        case 2:
            padded += "==";
            break;
        case 3:
            padded += "=";
            break;
    }

    return Convert.FromBase64String(padded);
}
