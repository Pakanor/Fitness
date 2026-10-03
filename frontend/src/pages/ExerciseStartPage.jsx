import React from 'react';
import Header from '../components/layout/Header';
import WorkoutDashboard from '../features/exercises/Workoutdashboard';

function ExercisePage() {

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <WorkoutDashboard />
        </div>
      </div>
    </div>
  );
}

export default ExercisePage;
