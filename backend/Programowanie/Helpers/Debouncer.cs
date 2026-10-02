using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Threading;

namespace FitnessApp.Helpers
{
    internal class Debouncer
    {
        //for api 
        private DispatcherTimer _timer;
        private Action _action;

        public Debouncer(int milliseconds)
        {
            _timer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMilliseconds(milliseconds)
            };
            _timer.Tick += (s, e) =>
            {
                _timer.Stop();
                _action?.Invoke();
            };
        }

        public void Debounce(Action action)
        {
            _action = action;
            _timer.Stop();
            _timer.Start();
        }
    }
}
