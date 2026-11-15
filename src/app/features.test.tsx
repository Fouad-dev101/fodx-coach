import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { useStore } from '../store/useStore'

describe('first-run experience', () => {
  it('guides a new coach: starter templates, install help, one-tap language switch', async () => {
    const user = userEvent.setup()
    render(<HashRouter><App /></HashRouter>)

    // Onboarding checklist is shown on an empty account
    expect(await screen.findByText('Bien démarrer')).toBeTruthy()
    expect(screen.getByText('0/4')).toBeTruthy()

    // 4th step loads ready-made templates
    await user.click(screen.getAllByRole('button', { name: 'Y aller' })[3])
    await waitFor(() => expect(useStore.getState().programs.filter((p) => p.isTemplate)).toHaveLength(4))
    const ppl = useStore.getState().programs.find((p) => p.title.includes('Push'))!
    expect(ppl.weeks[0].days).toHaveLength(6)
    expect(screen.getByText('1/4')).toBeTruthy()

    // Install: no native prompt in tests, so the help dialog opens
    await user.click(screen.getAllByRole('button', { name: /Installer l’app/ })[0])
    expect(await screen.findByRole('dialog')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Terminé' }))

    // Language switch lives in the header, not only in Settings
    await user.click(screen.getAllByRole('button', { name: 'العربية' })[0])
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'))
    expect(document.documentElement.lang).toBe('ar')
  })
})
