using System.Threading.Channels;
using ExerciseAPI.Models;

namespace ExerciseAPI.Services
{
    public sealed class SetRecordedEvent
    {
        public int UserId { get; init; }
        public int SessionId { get; init; }
        public int UserExerciseId { get; init; }
        public int ExerciseId { get; init; }
        public DateTime SessionDate { get; init; }
        public List<SetData> Sets { get; init; } = new();
        public decimal? UserWeight { get; init; }
    }

    public sealed class SetData
    {
        public int SetNumber { get; init; }
        public decimal Weight { get; init; }
        public int Reps { get; init; }
        public decimal? RPE { get; init; }
        public bool IsWarmup { get; init; }
    }

    public interface IAnalyticsQueue
    {
        ValueTask EnqueueAsync(SetRecordedEvent evt, CancellationToken ct = default);
    }

    public sealed class AnalyticsQueue : IAnalyticsQueue
    {
        private readonly Channel<SetRecordedEvent> _channel;

        public AnalyticsQueue()
        {
            var options = new BoundedChannelOptions(1000)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true,
                SingleWriter = false
            };
            _channel = Channel.CreateBounded<SetRecordedEvent>(options);
        }

        public ValueTask EnqueueAsync(SetRecordedEvent evt, CancellationToken ct = default)
        {
            return _channel.Writer.WriteAsync(evt, ct);
        }

        public async IAsyncEnumerable<SetRecordedEvent> ReadAllAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
        {
            await foreach (var evt in _channel.Reader.ReadAllAsync(ct))
            {
                yield return evt;
            }
        }
    }
}