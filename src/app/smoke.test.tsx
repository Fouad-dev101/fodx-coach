import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { useStore } from '../store/useStore'

describe('FODX Coach smoke flow', () => {
  it('adds a client, builds a program, switches to Arabic', async () => {
    const user = userEvent.setup()
    render(<HashRouter><App /></HashRouter>)

    // Empty state
    expect(await screen.findByText(/Aucun client pour le moment/)).toBeTruthy()

    // Add client
    await user.click(screen.getByRole('button', { name: /Nouveau client/ }))
    await user.type(screen.getByLabelText('Nom du client'), 'Amine')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Amine')).toBeTruthy()

    // Open client, create blank program
    await user.click(screen.getByText('Amine'))
    await user.click(await screen.findByRole('button', { name: /Nouveau programme/ }))
    await user.click(screen.getByRole('button', { name: 'Programme vide' }))
    expect(await screen.findByDisplayValue('Programme Amine')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Ajouter un exercice/ }).length).toBe(3)

    // Add an exercise to day 1
    await user.click(screen.getAllByRole('button', { name: /Ajouter un exercice/ })[0])
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByPlaceholderText('Rechercher'), 'squat')
    await user.click(within(dialog).getAllByRole('button', { name: /Squat/ })[0])
    await user.click(within(dialog).getByRole('button', { name: 'Terminé' }))
    await waitFor(() => expect(screen.getAllByText(/^Squat/).length).toBeGreaterThan(0))

    const prog = useStore.getState().programs[0]
    expect(prog.weeks[0].days[0].entries.length).toBe(1)

    // Timed toggle, then undo puts it back (wait so the two edits are separate undo steps)
    await new Promise((r) => setTimeout(r, 1000))
    await user.click(screen.getAllByRole('button', { name: /Temps/ })[0])
    expect(useStore.getState().programs[0].weeks[0].days[0].entries[0].measure).toBe('time')
    await user.click(screen.getByRole('button', { name: /Annuler/ }))
    expect(useStore.getState().programs[0].weeks[0].days[0].entries[0].measure).toBe('reps')

    // Duplicate week keeps content with new ids
    await user.click(screen.getByRole('button', { name: 'Dupliquer la semaine' }))
    const p2 = useStore.getState().programs[0]
    expect(p2.weeks.length).toBe(2)
    expect(p2.weeks[1].days[0].entries[0].id).not.toBe(p2.weeks[0].days[0].entries[0].id)

    // Arabic + RTL
    useStore.getState().setUiLang('ar')
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'))
  })

  it('round-trips a backup through the schema', async () => {
    const { parseBackup } = await import('../store/schema')
    const b = useStore.getState().exportBackup()
    expect(parseBackup(JSON.parse(JSON.stringify(b)))).not.toBeNull()
    expect(parseBackup({ schemaVersion: 2 })).toBeNull()
  })
})
