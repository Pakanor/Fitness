using System.Net;
using System.Text.Json;
using Xunit;

namespace FitnessApp.E2ETests;

[Collection("LiveStack")]
public class E2eApiTests : IAsyncLifetime
{
    private const string BaseUrl = "http://localhost:8000";
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private ApiClient _api = null!;
    private string _userPassword = "E2e-Test-123!";
    private int _sessionId;
    private int _exerciseId;
    private int _templateId;

    public async Task InitializeAsync()
    {
        _api = new ApiClient(BaseUrl);
        await RegisterAndLoginAsync();
        await FindExerciseIdAsync();
    }

    public async Task DisposeAsync()
    {
        if (_templateId != 0)
        {
            await _api.DeleteAsync($"/api/templates/{_templateId}");
        }
        _api.Dispose();
    }

    // ---------- auth ----------

    [Fact]
    public async Task Auth_Register_Login_Me_Logout_Flow()
    {
        await RegisterAndLoginAsync();

        var me = await _api.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var meJson = JsonDocument.Parse(me.Body);
        Assert.True(meJson.RootElement.GetProperty("authenticated").GetBoolean());

        var logout = await _api.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);
    }

    // ---------- admin-role ----------

    [Fact]
    public async Task Admin_Import_Requires_Admin_Role_403_For_NonAdmin()
    {
        var res = await _api.PostAsync("/api/exercisedb/import", null);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    // ---------- negative ----------

    [Fact]
    public async Task Protected_Endpoint_Without_Cookie_Returns_401()
    {
        using var anon = new ApiClient(BaseUrl);
        var res = await anon.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Invalid_Calorie_Payload_Returns_400()
    {
        var res = await _api.PostAsync("/api/caloriecalculator/calculate", new { grams = -1 });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ---------- products ----------

    [Fact]
    public async Task Products_Search_Returns_Results()
    {
        var res = await _api.GetAsync("/api/productsoperation/search?query=banana");
        Assert.True(res.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Calorie_Calculate_Returns_Nutriments()
    {
        var res = await _api.PostAsync("/api/caloriecalculator/calculate", new
        {
            product = new
            {
                product_name = "Banana",
                brands = "test",
                nutriments = new
                {
                    energy = 89.0,
                    energy_unit = "kcal",
                    fat = 0.3,
                    carbohydrates = 23.0,
                    proteins = 1.1,
                    salt = 0.04,
                }
            },
            grams = 100.0,
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var doc = JsonDocument.Parse(res.Body);
        Assert.True(doc.RootElement.TryGetProperty("energy", out var energy));
        Assert.True(energy.GetDouble() > 0);
    }

    // ---------- workouts ----------

    [Fact]
    public async Task Workout_Template_Session_Start_LogSet_Finish_Flow()
    {
        var tmpl = await _api.PostAsync("/api/templates", new
        {
            Name = "E2E Template",
            ExerciseIds = new[] { _exerciseId },
        });
        Assert.Equal(HttpStatusCode.Created, tmpl.StatusCode);
        var tmplDoc = JsonDocument.Parse(tmpl.Body);
        int templateId = tmplDoc.RootElement.GetProperty("id").GetInt32();
        _templateId = templateId;

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var sess = await _api.PostAsync($"/api/workouts/from-template/{templateId}", new { Date = today });
        Assert.Equal(HttpStatusCode.Created, sess.StatusCode);
        var sessDoc = JsonDocument.Parse(sess.Body);
        _sessionId = sessDoc.RootElement.GetProperty("id").GetInt32();

        var start = await _api.PatchAsync($"/api/workouts/{_sessionId}/start", null);
        Assert.Equal(HttpStatusCode.OK, start.StatusCode);

        var set = await _api.PostAsync("/api/workouts/sets", new
        {
            SessionId = _sessionId,
            ExerciseId = _exerciseId,
            Sets = new[]
            {
                new { SetNumber = 1, Reps = 10, Weight = 60m, RPE = 8m, SetType = "Normal" }
            },
        });
        Assert.Equal(HttpStatusCode.OK, set.StatusCode);

        var finish = await _api.PatchAsync($"/api/workouts/{_sessionId}/finish", null);
        Assert.Equal(HttpStatusCode.OK, finish.StatusCode);

        var progress = await _api.GetAsync($"/api/records/exercise/{_exerciseId}/progress");
        Assert.Equal(HttpStatusCode.OK, progress.StatusCode);
    }

    // ---------- workout-status ----------

    [Fact]
    public async Task WorkoutStatus_Get_Update_Active_Flow()
    {
        var today = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");

        var get = await _api.GetAsync($"/api/workout-status?date={today}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        var upd = await _api.PutAsync("/api/workout-status", new
        {
            Date = today,
            Status = "InProgress",
        });
        Assert.Equal(HttpStatusCode.OK, upd.StatusCode);

        var active = await _api.GetAsync($"/api/workout-status/active?date={today}");
        Assert.Equal(HttpStatusCode.OK, active.StatusCode);
    }

    // ---------- fatigue / workload / analytics (records) ----------

    [Fact]
    public async Task Records_OneRmProgression_Returns()
    {
        var res = await _api.GetAsync("/api/records/1rm-progression");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Records_ExerciseProgress_Returns()
    {
        var res = await _api.GetAsync($"/api/records/exercise/{_exerciseId}/progress");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    // ---------- helpers ----------

    private async Task RegisterAndLoginAsync()
    {
        string email = $"e2e-{Guid.NewGuid():N}@fitness.test";
        string name = $"e2e-{Guid.NewGuid():N}";

        var reg = await _api.PostAsync("/api/auth/register", new
        {
            Username = name,
            Email = email,
            Password = _userPassword,
        });
        Assert.True(reg.StatusCode is HttpStatusCode.OK or HttpStatusCode.BadRequest);

        var login = await _api.PostAsync("/api/auth/login", new
        {
            EmailOrLogin = email,
            Password = _userPassword,
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.NotNull(_api.AuthCookie);
    }

    private async Task FindExerciseIdAsync()
    {
        var res = await _api.GetAsync("/api/exercisedb/exercise/search/squat?limit=1");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var doc = JsonDocument.Parse(res.Body);
        var arr = doc.RootElement.EnumerateArray().ToArray();
        Assert.True(arr.Length > 0, "no squat exercises found");
        _exerciseId = arr[0].GetProperty("id").GetInt32();
    }
}
