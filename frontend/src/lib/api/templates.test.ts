import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './client'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import * as templatesApi from './templates'

describe('templates API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTemplates', () => {
    it('calls GET /api/templates', async () => {
      const mockTemplates = [
        { id: 1, name: 'Push Day', createdAt: '2024-01-01', updatedAt: '2024-01-01', exercises: [] },
        { id: 2, name: 'Pull Day', createdAt: '2024-01-02', updatedAt: '2024-01-02', exercises: [] },
      ]
      vi.mocked(api.get).mockResolvedValue(mockTemplates)

      const result = await templatesApi.getTemplates()

      expect(api.get).toHaveBeenCalledWith('/api/templates', { signal: undefined })
      expect(result).toEqual(mockTemplates)
    })

    it('passes signal to the request', async () => {
      const controller = new AbortController()
      vi.mocked(api.get).mockResolvedValue([])

      await templatesApi.getTemplates(controller.signal)

      expect(api.get).toHaveBeenCalledWith('/api/templates', { signal: controller.signal })
    })
  })

  describe('getTemplate', () => {
    it('calls GET /api/templates/:id', async () => {
      const mockTemplate = { id: 1, name: 'Push Day', createdAt: '2024-01-01', updatedAt: '2024-01-01', exercises: [] }
      vi.mocked(api.get).mockResolvedValue(mockTemplate)

      const result = await templatesApi.getTemplate(1)

      expect(api.get).toHaveBeenCalledWith('/api/templates/1', { signal: undefined })
      expect(result).toEqual(mockTemplate)
    })
  })

  describe('createTemplate', () => {
    it('calls POST /api/templates with name and exerciseIds', async () => {
      const mockTemplate = { id: 1, name: 'Push Day', createdAt: '2024-01-01', updatedAt: '2024-01-01', exercises: [] }
      vi.mocked(api.post).mockResolvedValue(mockTemplate)

      const result = await templatesApi.createTemplate({ name: 'Push Day', exerciseIds: [1, 2, 3] })

      expect(api.post).toHaveBeenCalledWith('/api/templates', { body: { name: 'Push Day', exerciseIds: [1, 2, 3] } })
      expect(result).toEqual(mockTemplate)
    })
  })

  describe('updateTemplate', () => {
    it('calls PUT /api/templates/:id with name and exerciseIds', async () => {
      const mockTemplate = { id: 1, name: 'Push Day Updated', createdAt: '2024-01-01', updatedAt: '2024-01-02', exercises: [] }
      vi.mocked(api.put).mockResolvedValue(mockTemplate)

      const result = await templatesApi.updateTemplate(1, { name: 'Push Day Updated', exerciseIds: [1, 2] })

      expect(api.put).toHaveBeenCalledWith('/api/templates/1', { body: { name: 'Push Day Updated', exerciseIds: [1, 2] } })
      expect(result).toEqual(mockTemplate)
    })
  })

  describe('deleteTemplate', () => {
    it('calls DELETE /api/templates/:id', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await templatesApi.deleteTemplate(1)

      expect(api.delete).toHaveBeenCalledWith('/api/templates/1', { signal: undefined })
    })
  })

  describe('searchExercises', () => {
    it('calls GET /api/exercisedb/exercise/search/:term', async () => {
      const mockResults = [{ id: 1, name: 'Bench Press', gifUrl: 'url' }]
      vi.mocked(api.get).mockResolvedValue(mockResults)

      const result = await templatesApi.searchExercises('bench')

      expect(api.get).toHaveBeenCalledWith('/api/exercisedb/exercise/search/bench', { query: { offset: 0, limit: 50 }, signal: undefined })
      expect(result).toEqual(mockResults)
    })

    it('passes offset and limit', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      await templatesApi.searchExercises('bench', 10, 20)

      expect(api.get).toHaveBeenCalledWith('/api/exercisedb/exercise/search/bench', { query: { offset: 10, limit: 20 }, signal: undefined })
    })
  })

  describe('getExerciseCategories', () => {
    it('calls GET /api/exercisedb/exercise/categories', async () => {
      const mockCategories = ['chest', 'back', 'legs']
      vi.mocked(api.get).mockResolvedValue(mockCategories)

      const result = await templatesApi.getExerciseCategories()

      expect(api.get).toHaveBeenCalledWith('/api/exercisedb/exercise/categories', { signal: undefined })
      expect(result).toEqual(mockCategories)
    })
  })

  describe('getExercisesByBodyPart', () => {
    it('calls GET /api/exercisedb/exercise/:bodyPart', async () => {
      const mockExercises = [{ id: 1, name: 'Bench Press', category: 'chest', imageUrl: '', gifUrl: '', muscleMappings: [] }]
      vi.mocked(api.get).mockResolvedValue(mockExercises)

      const result = await templatesApi.getExercisesByBodyPart('chest')

      expect(api.get).toHaveBeenCalledWith('/api/exercisedb/exercise/chest', { signal: undefined })
      expect(result).toEqual(mockExercises)
    })
  })

  describe('startWorkoutFromTemplate', () => {
    it('calls POST /api/workouts/from-template/:id', async () => {
      const mockResponse = { id: 1, date: '2024-01-01', status: 'planned', exercises: [] }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await templatesApi.startWorkoutFromTemplate(1, '2024-01-15')

      expect(api.post).toHaveBeenCalledWith('/api/workouts/from-template/1', { body: { Date: '2024-01-15' } })
      expect(result).toEqual(mockResponse)
    })
  })
})