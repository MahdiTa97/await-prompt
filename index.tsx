'use client'

import {
  type FC,
  type JSX,
  type ReactNode,
  Fragment,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react'

interface Slot {
  id: string
  jsx: JSX.Element
}

interface PromptContext {
  allocSlot(getJsx: (id: string) => JSX.Element): string
  deleteSlot(id: string): void
}

const PromptContext = createContext<PromptContext | null>(null)

export interface PromptContextProviderProps {
  children: ReactNode
}

export const PromptProvider: FC<PromptContextProviderProps> = ({
  children,
}) => {
  const [slots, setSlots] = useState<Slot[]>([])
  const lastId = useRef(0)

  const allocSlot = useCallback((getJsx: (id: string) => JSX.Element) => {
    const id = 'p' + lastId.current++
    setSlots(prev => [...prev, { id, jsx: getJsx(id) }])
    return id
  }, [])

  const deleteSlot = useCallback((id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id))
  }, [])

  const contextValue = useMemo(
    () => ({ allocSlot, deleteSlot }),
    [allocSlot, deleteSlot]
  )

  return (
    <PromptContext.Provider value={contextValue}>
      {children}
      {slots.map(({ id, jsx }) => (
        <Fragment key={id}>{jsx}</Fragment>
      ))}
    </PromptContext.Provider>
  )
}

export interface PromptComponentProps<ResolvesWith, RejectsWith, Variables> {
  resolve(v: ResolvesWith): void
  reject(v: RejectsWith): void
  variables: Variables
}

export type PromptComponent<ResolvesWith, RejectsWith, Variables> = FC<
  PromptComponentProps<ResolvesWith, RejectsWith, Variables>
>

export default function usePrompt<ResolvesWith, RejectsWith, Variables>(
  PromptComponent: PromptComponent<ResolvesWith, RejectsWith, Variables>
) {
  const context = useContext(PromptContext)

  if (!context) {
    throw new Error('usePrompt must be used within a PromptProvider')
  }

  const { allocSlot, deleteSlot } = context

  return useMemo(
    () => ({
      prompt: async (variables: Variables): Promise<ResolvesWith> =>
        new Promise((resolve, reject) => {
          const id = allocSlot(id => {
            const close = () => deleteSlot(id)
            return (
              <PromptComponent
                variables={variables}
                resolve={value => {
                  close()
                  resolve(value)
                }}
                reject={error => {
                  close()
                  reject(error)
                }}
              />
            )
          })
        }),
    }),
    [PromptComponent, allocSlot, deleteSlot]
  )
}
