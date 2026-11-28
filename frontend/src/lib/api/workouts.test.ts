import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './client'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import * as workoutsApi from './workouts'

describe('workouts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWorkoutsByDate', () => {
    it('calls GET /api/workouts with date query', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'planned',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 0,
        exerciseCount: 5,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        exercises: [],
      }
      vi.mocked(api.get).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.getWorkoutsByDate('2024-01-15')

      expect(api.get).toHaveBeenCalledWith('/api/workouts', { query: { date: '2024-01-15' }, signal: undefined })
      expect(result).toEqual(mockWorkout)
    })

    it('passes signal to the request', async () => {
      const controller = new AbortController()
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'planned',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 0,
        exerciseCount: 5,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        exercises: [],
      }
      vi.mocked(api.get).mockResolvedValue({ data: mockWorkout, location: undefined })

      await workoutsApi.getWorkoutsByDate('2024-01-15', controller.signal)

      expect(api.get).toHaveBeenCalledWith('/api/workouts', { query: { date: '2024-01-15' }, signal: controller.signal })
    })
  })

  describe('getActiveWorkout', () => {
    it('calls GET /api/workouts/active', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'in_progress',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 1000,
        exerciseCount: 5,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: null,
        exercises: [],
      }
      vi.mocked(api.get).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.getActiveWorkout()

      expect(api.get).toHaveBeenCalledWith('/api/workouts/active', { signal: undefined })
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('getIncompleteWorkouts', () => {
    it('calls GET /api/workouts/incomplete', async () => {
      const mockWorkouts = [
        { id: 1, date: '2024-01-14', templateName: 'Push Day', exerciseCount: 5, status: 'planned' },
        { id: 2, date: '2024-01-13', templateName: 'Pull Day', exerciseCount: 4, status: 'in_progress' },
      ]
      vi.mocked(api.get).mockResolvedValue({ data: mockWorkouts, location: undefined })

      const result = await workoutsApi.getIncompleteWorkouts()

      expect(api.get).toHaveBeenCalledWith('/api/workouts/incomplete', { signal: undefined })
      expect(result).toEqual(mockWorkouts)
    })
  })

  describe('getWorkout', () => {
    it('calls GET /api/workouts/:id', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'completed',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 5000,
        exerciseCount: 5,
        canLogSets: false,
        canReopen: true,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T12:00:00.000Z',
        exercises: [],
      }
      vi.mocked(api.get).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.getWorkout(1)

      expect(api.get).toHaveBeenCalledWith('/api/workouts/1', { signal: undefined })
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('startWorkout', () => {
    it('calls PATCH /api/workouts/:id/start', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'in_progress',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 0,
        exerciseCount: 5,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: null,
        exercises: [],
      }
      vi.mocked(api.patch).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.startWorkout(1)

      expect(api.patch).toHaveBeenCalledWith('/api/workouts/1/start')
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('finishWorkout', () => {
    it('calls PATCH /api/workouts/:id/finish', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'completed',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 5000,
        exerciseCount: 5,
        canLogSets: false,
        canReopen: true,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T12:00:00.000Z',
        exercises: [],
      }
      vi.mocked(api.patch).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.finishWorkout(1)

      expect(api.patch).toHaveBeenCalledWith('/api/workouts/1/finish')
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('reopenWorkout', () => {
    it('calls PATCH /api/workouts/:id/reopen', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'in_progress',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 5000,
        exerciseCount: 5,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: null,
        exercises: [],
      }
      vi.mocked(api.patch).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.reopenWorkout(1)

      expect(api.patch).toHaveBeenCalledWith('/api/workouts/1/reopen')
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('logSet', () => {
    it('calls POST /api/workouts/sets with LogSetDto', async () => {
      const mockResponse = {
        entry: {
          userExerciseId: 1,
          exerciseId: 1,
          exerciseName: 'Bench Press',
          category: 'chest',
          gifUrl: '',
          supersetGroupId: null,
          notes: null,
          sets: [],
          setsCount: 1,
          reps: 10,
          weight: 100,
          rpe: 8,
          setType: 'Normal',
          volume: 1000,
        },
        session: {
          id: 1,
          userId: 1,
          date: '2024-01-15',
          status: 'in_progress',
          templateId: 1,
          templateName: 'Push Day',
          startMode: 'template',
          totalVolume: 1000,
          exerciseCount: 1,
          canLogSets: true,
          canReopen: false,
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
          startedAt: '2024-01-15T10:00:00.000Z',
          completedAt: null,
          exercises: [],
        },
        isPr: true,
      }
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse, location: undefined })

      const dto = {
        sessionId: 1,
        userExerciseId: null,
        exerciseId: 1,
        setType: 'Normal',
        sets: [{ setNumber: 1, weight: 100, reps: 10, rpe: 8, setType: 'Normal' }],
      }

      const result = await workoutsApi.logSet(dto)

      expect(api.post).toHaveBeenCalledWith('/api/workouts/sets', { body: dto })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateSet', () => {
    it('calls PUT /api/workouts/sets/:id with LogSingleSetDto', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'in_progress',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 2000,
        exerciseCount: 1,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T10:05:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: null,
        exercises: [],
      }
      vi.mocked(api.put).mockResolvedValue({ data: mockWorkout, location: undefined })

      const dto = { setNumber: 1, weight: 105, reps: 10, rpe: 8, setType: 'Normal' }

      const result = await workoutsApi.updateSet(1, dto)

      expect(api.put).toHaveBeenCalledWith('/api/workouts/sets/1', { body: dto })
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('deleteSet', () => {
    it('calls DELETE /api/workouts/sets/:id', async () => {
      const mockWorkout = {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        status: 'in_progress',
        templateId: 1,
        templateName: 'Push Day',
        startMode: 'template',
        totalVolume: 0,
        exerciseCount: 0,
        canLogSets: true,
        canReopen: false,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T10:10:00.000Z',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: null,
        exercises: [],
      }
      vi.mocked(api.delete).mockResolvedValue({ data: mockWorkout, location: undefined })

      const result = await workoutsApi.deleteSet(1)

      expect(api.delete).toHaveBeenCalledWith('/api/workouts/sets/1')
      expect(result).toEqual(mockWorkout)
    })
  })

  describe('getWorkoutStatus', () => {
    it('calls GET /api/workout-status with date query', async () => {
      const mockStatus = { status: 'planned' }
      vi.mocked(api.get).mockResolvedValue({ data: mockStatus, location: undefined })

      const result = await workoutsApi.getWorkoutStatus('2024-01-15')

      expect(api.get).toHaveBeenCalledWith('/api/workout-status', { query: { date: '2024-01-15' }, signal: undefined })
      expect(result).toEqual(mockStatus)
    })
  })
})