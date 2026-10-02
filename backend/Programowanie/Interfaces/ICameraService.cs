using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FitnessApp.Interfaces
{
    public interface ICameraService
    {
        event EventHandler<Bitmap> FrameReceived;
        void StartCamera();
        void StopCamera();
        void ProcessFrame(Bitmap frame);
    }
    
}
