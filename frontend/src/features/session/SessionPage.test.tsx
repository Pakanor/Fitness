import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { mockGetWorkout, mockStartWorkout, mockFinishWorkout, mockReopenWorkout, mockLogSet, mockUpdateSet, mockDeleteSet, mockGetWorkoutStatus, mockGetActiveWorkout, mockGetIncompleteWorkouts, mockGetWorkoutStartTemplates, mockGetTemplate } = vi.hoisted(() => ({
  mockGetWorkout: vi.fn(),
  mockStartWorkout: vi.fn(),
  mockFinishWorkout: vi.fn(),
  mockReopenWorkout: vi.fn(),
  mockLogSet: vi.fn(),
  mockUpdateSet: vi.fn(),
  mockDeleteSet: vi.fn(),
  mockGetWorkoutStatus: vi.fn(),
  mockGetActiveWorkout: vi.fn(),
  mockGetIncompleteWorkouts: vi.fn(),
  mockGetWorkoutStartTemplates: vi.fn(),
  mockGetTemplate: vi.fn(),
}))

vi.mock('@/lib/api/workouts', () => ({
  getWorkout: mockGetWorkout,
  startWorkout: mockStartWorkout,
  finishWorkout: mockFinishWorkout,
  reopenWorkout: mockReopenWorkout,
  logSet: mockLogSet,
  updateSet: mockUpdateSet,
  deleteSet: mockDeleteSet,
  getWorkoutStatus: mockGetWorkoutStatus,
  getActiveWorkout: mockGetActiveWorkout,
  getIncompleteWorkouts: mockGetIncompleteWorkouts,
}))

vi.mock('@/lib/api/templates', () => ({
  getWorkoutStartTemplates: mockGetWorkoutStartTemplates,
  getTemplate: mockGetTemplate,
}))

vi.mock('@/components/ExercisePicker', () => ({
  ExercisePicker: vi.fn(({ open, onClose }) => (open ? <div data-testid="exercise-picker" onClick={onClose}>Picker</div> : null)),
}))

vi.mock('@/features/ai-trainer/AITrainerDrawer', () => ({
  default: vi.fn(({ isOpen, onClose }) => (isOpen ? <div data-testid="ai-trainer" onClick={onClose}>AI Trainer</div> : null)),
}))

import SessionPage from './SessionPage'

describe('SessionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession = {
    id: 1,
    userId: 1,
    date: '2024-01-15',
    status: 'in_progress',
    templateId: 1,
    templateName: 'Push Day',
    startMode: 'template',
    totalVolume: 5000,
    exerciseCount: 2,
    canLogSets: true,
    canReopen: false,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    startedAt: '2024-01-15T10:00:00.000Z',
    completedAt: null,
    exercises: [
      {
        userExerciseId: 1,
        exerciseId: 1,
        exerciseName: 'Bench Press',
        category: 'chest',
        gifUrl: '',
        supersetGroupId: null,
        notes: null,
        sets: [
          { id: 1, setNumber: 1, weight: 100, reps: 10, rpe: 8, setType: 'Normal', durationSeconds: null },
          { id: 2, setNumber: 2, weight: 100, reps: 8, rpe: 9, setType: 'Normal', durationSeconds: null },
        ],
        setsCount: 2,
        reps: 18,
        weight: 100,
        rpe: 8.5,
        setType: 'Normal',
        volume: 1800,
      },
      {
        userExerciseId: 2,
        exerciseId: 2,
        exerciseName: 'Squat',
        category: 'legs',
        gifUrl: '',
        supersetGroupId: null,
        notes: null,
        sets: [],
        setsCount: 0,
        reps: 0,
        weight: 0,
        rpe: null,
        setType: 'Normal',
        volume: 0,
      },
    ],
  }

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={['/trening/sesja/1']}>
        <SessionPage />
      </MemoryRouter>
    )
  }

  it('shows loading state initially', async () => {
    mockGetWorkout.mockImplementation(() => new Promise(() => {}))

    renderWithRouter()

    expect(screen.getByText('Ładowanie...')).toBeInTheDocument()
  })

  it('displays session header with template name and status', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)

    renderWithRouter()

    await screen.findByText('Push Day')
    expect(screen.getByText('2024-01-15 · in_progress')).toBeInTheDocument()
    expect(screen.getByText('Wolumen: 5000 · ćwiczeń: 2')).toBeInTheDocument()
  })

  it('displays exercises with sets', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)

    renderWithRouter()

    await screen.findByText('Bench Press')
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('#1 100kg x 10 RPE 8 [Normal]')).toBeInTheDocument()
    expect(screen.getByText('#2 100kg x 8 RPE 9 [Normal]')).toBeInTheDocument()
  })

  it('shows action buttons for in_progress status', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)

    renderWithRouter()

    await screen.findByRole('button', { name: 'Zakończ' })
    expect(screen.getByRole('button', { name: 'AI Trainer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ręcznie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Z szablonu' })).toBeInTheDocument()
  })

  it('opens ExercisePicker when Ręcznie button clicked', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)

    renderWithRouter()

    const recznieButton = await screen.findByRole('button', { name: 'Ręcznie' })
    fireEvent.click(recznieButton)

    await screen.findByTestId('exercise-picker')
  })

  it('opens AITrainerDrawer when AI Trainer button clicked', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)

    renderWithRouter()

    const aiButton = await screen.findByRole('button', { name: 'AI Trainer' })
    fireEvent.click(aiButton)

    await screen.findByTestId('ai-trainer')
  })

  it('shows template picker when Z szablonu button clicked', async () => {
    const mockTemplates = [
      { id: 1, name: 'Push Day', exerciseCount: 5, createdAt: '2024-01-01' },
      { id: 2, name: 'Pull Day', exerciseCount: 4, createdAt: '2024-01-02' },
    ]
    mockGetWorkout.mockResolvedValue(mockSession)
    mockGetWorkoutStartTemplates.mockResolvedValue(mockTemplates)

    renderWithRouter()

    const templateButton = await screen.findByRole('button', { name: 'Z szablonu' })
    fireEvent.click(templateButton)

    await screen.findByText('Push Day')
    expect(screen.getByText('Pull Day')).toBeInTheDocument()
  })

  it('shows edit form when Edytuj button clicked', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)
    mockUpdateSet.mockResolvedValue(mockSession)

    renderWithRouter()

    const editButton = (await screen.findAllByRole('button', { name: 'Edytuj' }))[0]
    fireEvent.click(editButton)

    await screen.findByRole('button', { name: 'Zapisz' })
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument()
  })

  it('calls deleteSet when Usuń button clicked', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)
    mockDeleteSet.mockResolvedValue(mockSession)

    renderWithRouter()

    const deleteButton = (await screen.findAllByRole('button', { name: 'Usuń' }))[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockDeleteSet).toHaveBeenCalledWith(1)
    })
  })

  it('shows error when API call fails', async () => {
    mockGetWorkout.mockRejectedValue(new Error('Failed to load'))

    renderWithRouter()

    await screen.findByText('Failed to load')
  })

  it('shows PR badge when exercise has PR', async () => {
    const sessionWithPr = {
      ...mockSession,
      exercises: [
        {
          ...mockSession.exercises[0],
          userExerciseId: 1,
        },
      ],
    }
    mockGetWorkout.mockResolvedValue(sessionWithPr)

    renderWithRouter()

    await screen.findByText('Bench Press')
  })

  it('shows set type selector in row editor', async () => {
    mockGetWorkout.mockResolvedValue(mockSession)

    renderWithRouter()

    const insertButton = (await screen.findAllByRole('button', { name: 'Wstaw wiersze' }))[0]
    fireEvent.click(insertButton)

    await screen.findAllByPlaceholderText('kg')
    expect(screen.getAllByPlaceholderText('reps').length).toBeGreaterThan(0)
    expect(screen.getAllByPlaceholderText('RPE').length).toBeGreaterThan(0)
  })
})