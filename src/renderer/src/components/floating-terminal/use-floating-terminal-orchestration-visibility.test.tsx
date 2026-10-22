// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CliInstallStatus } from '../../../../shared/cli-install-types'
import { markOrchestrationSetupComplete } from '@/lib/orchestration-setup-state'
import { useFloatingTerminalOrchestrationVisibility } from './use-floating-terminal-orchestration-visibility'

function makeCliStatus(overrides: Partial<CliInstallStatus> = {}): CliInstallStatus {
  return {
    platform: 'linux',
    commandName: 'orca',
    commandPath: '/usr/local/bin/orca',
    pathDirectory: '/usr/local/bin',
    pathConfigured: true,
    launcherPath: '/opt/Orca/orca',
    installMethod: 'symlink',
    supported: true,
    state: 'installed',
    currentTarget: null,
    unsupportedReason: null,
    detail: null,
    ...overrides
  }
}

describe('useFloatingTerminalOrchestrationVisibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(window, 'api')
  })

  it('keeps the setup prompt hidden when orchestration is marked installed in web mode', async () => {
    markOrchestrationSetupComplete()
    const getInstallStatus = vi.fn().mockResolvedValue(
      makeCliStatus({
        commandPath: null,
        pathDirectory: null,
        pathConfigured: false,
        launcherPath: null,
        installMethod: null,
        supported: false,
        state: 'unsupported',
        unsupportedReason: 'launch_mode_unavailable'
      })
    )
    Reflect.set(window, 'api', { cli: { getInstallStatus } })
    const setShowOrchestrationSetup = vi.fn()
    const mountedRef = { current: true }

    const { result } = renderHook(() =>
      useFloatingTerminalOrchestrationVisibility({
        mountedRef,
        setShowOrchestrationSetup,
        open: false
      })
    )

    await result.current.refreshOrchestrationSetupVisibility()

    expect(getInstallStatus).toHaveBeenCalledOnce()
    expect(setShowOrchestrationSetup).toHaveBeenCalledWith(false)
  })

  it('shows the setup prompt when orchestration is marked installed but local CLI is missing from PATH', async () => {
    markOrchestrationSetupComplete()
    const getInstallStatus = vi.fn().mockResolvedValue(
      makeCliStatus({
        pathConfigured: false
      })
    )
    Reflect.set(window, 'api', { cli: { getInstallStatus } })
    const setShowOrchestrationSetup = vi.fn()
    const mountedRef = { current: true }

    const { result } = renderHook(() =>
      useFloatingTerminalOrchestrationVisibility({
        mountedRef,
        setShowOrchestrationSetup,
        open: false
      })
    )

    await result.current.refreshOrchestrationSetupVisibility()

    expect(getInstallStatus).toHaveBeenCalledOnce()
    expect(setShowOrchestrationSetup).toHaveBeenCalledWith(true)
  })
})
