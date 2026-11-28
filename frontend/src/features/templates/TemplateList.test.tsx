import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { TemplateList } from './TemplateList'
import * as templatesApi from '../../lib/api/templates'

vi.mock('../../lib/api/templates')

describe('TemplateList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  const renderWithRouter = () => {
    return render(
      <BrowserRouter>
        <TemplateList />
      </BrowserRouter>
    )
  }

  it('shows loading state initially', async () => {
    vi.mocked(templatesApi.getTemplates).mockImplementation(() => new Promise(() => {}))

    renderWithRouter()

    expect(screen.getByText('Ładowanie szablonów...')).toBeInTheDocument()
  })

  it('displays list of templates', async () => {
    const mockTemplates = [
      { id: 1, name: 'Push Day', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', exercises: [] },
      { id: 2, name: 'Pull Day', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z', exercises: [{ exerciseId: 1, exerciseName: 'Pull-ups', category: 'back', order: 1 }] },
    ]
    vi.mocked(templatesApi.getTemplates).mockResolvedValue(mockTemplates)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Push Day')).toBeInTheDocument()
      expect(screen.getByText('Pull Day')).toBeInTheDocument()
    })
  })

  it('shows exercise count for each template', async () => {
    const mockTemplates = [
      { id: 1, name: 'Push Day', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', exercises: [] },
      { id: 2, name: 'Pull Day', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z', exercises: [{ exerciseId: 1, exerciseName: 'Pull-ups', category: 'back', order: 1 }] },
    ]
    vi.mocked(templatesApi.getTemplates).mockResolvedValue(mockTemplates)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('0 ćwiczeń')).toBeInTheDocument()
      expect(screen.getByText('1 ćwiczenie')).toBeInTheDocument()
    })
  })

  it('shows empty state when no templates', async () => {
    vi.mocked(templatesApi.getTemplates).mockResolvedValue([])

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Brak szablonów')).toBeInTheDocument()
    })
  })

  it('calls deleteTemplate when delete button clicked', async () => {
    const mockTemplates = [
      { id: 1, name: 'Push Day', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', exercises: [] },
    ]
    vi.mocked(templatesApi.getTemplates).mockResolvedValue(mockTemplates)
    vi.mocked(templatesApi.deleteTemplate).mockResolvedValue(undefined)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Push Day')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /usuń szablon push day/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(templatesApi.deleteTemplate).toHaveBeenCalledWith(1)
    })
  })
})