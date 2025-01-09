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
} from 'react'

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
  return (
    <PromptContext.Provider
      value={useMemo(
        () => ({
          allocSlot(getJsx) {
            const id = 'p' + lastId.current++
            setSlots([...slots, { id, jsx: getJsx(id) }])
            return id
          },
          deleteSlot(id) {
            setSlots(slots.filter(s => s.id !== id))
          },
        }),
        [slots, setSlots]
      )}
    >
      {children}
      {slots.map(({ id, jsx }) => (
        <Fragment key={id}>{jsx}</Fragment>
      ))}
    </PromptContext.Provider>
  )
}

interface Slot {
  id: string
  jsx: JSX.Element
}

export default function usePrompt<ResolvesWith, RejectsWith, Variables>(
  PromptComponent: PromptComponent<ResolvesWith, RejectsWith, Variables>
) {
  const { allocSlot, deleteSlot } = useContext(PromptContext) ?? {}
  return useMemo(
    () => ({
      prompt: async (variables: Variables): Promise<ResolvesWith> =>
        new Promise((resolve, reject) => {
          allocSlot?.(id => {
            const close = () => deleteSlot?.(id)
            return (
              <PromptComponent
                {...{ variables }}
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

export interface PromptComponentProps<ResolvesWith, RejectsWith, Variables> {
  resolve(v: ResolvesWith): void
  reject(v: RejectsWith): void
  variables: Variables
}

export type PromptComponent<ResolvesWith, RejectsWith, Variables> = FC<
  PromptComponentProps<ResolvesWith, RejectsWith, Variables>
>
