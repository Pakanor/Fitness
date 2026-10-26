using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not set.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AuthAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "FitnessAppUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("FitnessApp-Auth", out var token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

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

app.UseCors("AllowFrontend");
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
        var currentWeight = context.User.FindFirst("current_weight")?.Value;
        var trainingExperience = context.User.FindFirst("training_experience")?.Value;
        var caloricTarget = context.User.FindFirst("caloric_target")?.Value;

        context.Request.Headers.Remove("X-User-Id");
        context.Request.Headers.Remove("X-User-Name");
        context.Request.Headers.Remove("X-User-Email");
        context.Request.Headers.Remove("X-User-Weight");
        context.Request.Headers.Remove("X-User-TrainingExperience");
        context.Request.Headers.Remove("X-User-CaloricTarget");

        if (!string.IsNullOrWhiteSpace(userId))
        {
            context.Request.Headers["X-User-Id"] = userId;
            var token = context.Request.Cookies["FitnessApp-Auth"];
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

    await next();
});

app.UseCors("AllowFrontend");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapReverseProxy();

app.MapFallbackToFile("index.html");

app.Run();
