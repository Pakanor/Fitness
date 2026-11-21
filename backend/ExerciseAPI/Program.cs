using ExerciseAPI.Services;
using ExerciseAPI.Authentication;
using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Services;
using Microsoft.EntityFrameworkCore;
using ExerciseAPI.Data;

var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
        policy.WithOrigins("http://localhost:3000", "http://localhost:8000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
    });
});

var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD")
                 ?? throw new InvalidOperationException(
                     "DB_PASSWORD is not set. Provide it as an environment variable.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql($"Host=localhost;Port=5443;Database=exercise;Username=fitnessapp;Password={dbPassword}"));
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient<RemoteSessionValidator>(client =>
{
    client.BaseAddress = new Uri("http://localhost:5010");
});
builder.Services.AddScoped<ISessionValidator, RemoteSessionValidator>();
builder.Services.AddScoped<ClaimsCurrentUserAccessor>();
builder.Services.AddScoped<ICurrentUserAccessor, FreshCurrentUserAccessor>();
builder.Services.AddSingleton<ExerciseDbImportService>();
builder.Services.AddHostedService<ExerciseStartupSeeder>();
builder.Services.AddScoped<RecordsService>();
builder.Services.AddScoped<PersonalRecordsService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.ITemplateService, ExerciseAPI.Services.TemplateService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.IWorkoutStartModeService, ExerciseAPI.Services.WorkoutStartModeService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.IWorkoutStatusService, ExerciseAPI.Services.WorkoutStatusService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.IWorkoutSessionService, ExerciseAPI.Services.WorkoutSessionService>();
builder.Services.AddSingleton<ExerciseAPI.Services.AnalyticsQueue>();
builder.Services.AddSingleton<ExerciseAPI.Services.IAnalyticsQueue>(sp => sp.GetRequiredService<ExerciseAPI.Services.AnalyticsQueue>());
builder.Services.AddHostedService<ExerciseAPI.Services.AnalyticsBackgroundService>();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

builder.Services.AddAuthentication()
    .AddHeaderAuthentication();

var app = builder.Build();

app.UseCors(MyAllowSpecificOrigins);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Suppress pending model changes warning since DB already has the columns
    db.Database.SetCommandTimeout(TimeSpan.FromSeconds(30));
    try
    {
        db.Database.Migrate();
    }
    catch (Exception ex) when (ex.Message.Contains("PendingModelChangesWarning") || ex.Message.Contains("already exists"))
    {
        // Log and continue - database schema is already compatible
        Console.WriteLine($"Migration skipped: {ex.Message}");
    }
}

app.Run();