In the name of Allah

A React hook for creating Promise-based prompts that render as React components.

## Installation

```bash
npm install await-prompt
```

## Overview

`await-prompt` allows you to create modal-like prompts that return promises, making it easy to handle user interactions in an async/await pattern. Instead of managing modal state manually, you can simply await user input.

## Quick Start

### 1. Wrap your app with PromptProvider

```tsx
import { PromptProvider } from 'await-prompt'

function App() {
  return (
    <PromptProvider>
      <YourApp />
    </PromptProvider>
  )
}
```

### 2. Create a prompt component

```tsx
import { PromptComponent } from 'await-prompt'

const ConfirmPrompt: PromptComponent<boolean, never, { message: string }> = ({
  variables,
  resolve,
  reject,
}) => {
  return (
    <div className='modal-overlay'>
      <div className='modal'>
        <p>{variables.message}</p>
        <button onClick={() => resolve(true)}>Yes</button>
        <button onClick={() => resolve(false)}>No</button>
      </div>
    </div>
  )
}
```

### 3. Use the prompt with usePrompt hook

```tsx
import usePrompt from 'await-prompt'

function MyComponent() {
  const { prompt } = usePrompt(ConfirmPrompt)

  const handleDelete = async () => {
    const confirmed = await prompt({
      message: 'Are you sure you want to delete this item?',
    })

    if (confirmed) {
      // Delete the item
      console.log('Item deleted!')
    }
  }

  return <button onClick={handleDelete}>Delete Item</button>
}
```

## API Reference

### `PromptProvider`

Wrap your application with this provider to enable prompt functionality.

```tsx
interface PromptContextProviderProps {
  children: ReactNode
}
```

### `usePrompt<ResolvesWith, RejectsWith, Variables>(PromptComponent)`

Returns a prompt function that shows the given component and returns a promise.

**Parameters:**

- `PromptComponent`: A React component that implements the `PromptComponent` interface

**Returns:**

- `{ prompt: (variables: Variables) => Promise<ResolvesWith> }`

### `PromptComponent<ResolvesWith, RejectsWith, Variables>`

Interface for prompt components.

```tsx
interface PromptComponentProps<ResolvesWith, RejectsWith, Variables> {
  resolve(value: ResolvesWith): void
  reject(error: RejectsWith): void
  variables: Variables
}

type PromptComponent<ResolvesWith, RejectsWith, Variables> = FC<
  PromptComponentProps<ResolvesWith, RejectsWith, Variables>
>
```

**Type Parameters:**

- `ResolvesWith`: The type of value the prompt resolves with
- `RejectsWith`: The type of error the prompt rejects with
- `Variables`: The type of variables passed to the prompt

## Examples

### Text Input Prompt

```tsx
const TextInputPrompt: PromptComponent<
  string | null,
  never,
  {
    title: string
    placeholder?: string
  }
> = ({ variables, resolve }) => {
  const [value, setValue] = useState('')

  return (
    <div className='modal-overlay'>
      <div className='modal'>
        <h2>{variables.title}</h2>
        <input
          type='text'
          placeholder={variables.placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
        />
        <div>
          <button onClick={() => resolve(value)}>OK</button>
          <button onClick={() => resolve(null)}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// Usage
const { prompt } = usePrompt(TextInputPrompt)

const name = await prompt({
  title: 'Enter your name',
  placeholder: 'John Doe',
})

if (name) {
  console.log(`Hello, ${name}!`)
}
```

### Choice Selection Prompt

```tsx
interface Choice {
  id: string
  label: string
}

const ChoicePrompt: PromptComponent<
  Choice | null,
  never,
  {
    title: string
    choices: Choice[]
  }
> = ({ variables, resolve }) => {
  return (
    <div className='modal-overlay'>
      <div className='modal'>
        <h2>{variables.title}</h2>
        <div>
          {variables.choices.map(choice => (
            <button key={choice.id} onClick={() => resolve(choice)}>
              {choice.label}
            </button>
          ))}
        </div>
        <button onClick={() => resolve(null)}>Cancel</button>
      </div>
    </div>
  )
}

// Usage
const { prompt } = usePrompt(ChoicePrompt)

const selected = await prompt({
  title: 'Choose your favorite color',
  choices: [
    { id: 'red', label: 'Red' },
    { id: 'blue', label: 'Blue' },
    { id: 'green', label: 'Green' },
  ],
})

if (selected) {
  console.log(`You chose ${selected.label}`)
}
```

### Error Handling

```tsx
const RiskyPrompt: PromptComponent<string, Error, {}> = ({
  resolve,
  reject,
}) => {
  const handleRiskyAction = () => {
    if (Math.random() > 0.5) {
      resolve('Success!')
    } else {
      reject(new Error('Something went wrong'))
    }
  }

  return (
    <div className='modal-overlay'>
      <div className='modal'>
        <button onClick={handleRiskyAction}>Try risky action</button>
        <button onClick={() => reject(new Error('User cancelled'))}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// Usage
try {
  const result = await prompt({})
  console.log(result) // "Success!"
} catch (error) {
  console.error(error.message) // "Something went wrong" or "User cancelled"
}
```

## How It Works

1. **PromptProvider** manages a queue of active prompts using React context
2. **usePrompt** hook creates a prompt function that:
   - Allocates a slot in the prompt queue
   - Renders your prompt component
   - Returns a promise that resolves/rejects when the component calls `resolve`/`reject`
   - Automatically cleans up the prompt when done
3. **Multiple prompts** can be active simultaneously and are rendered in order

## TypeScript Support

This package is written in TypeScript and provides full type safety:

- Prompt components are fully typed based on their generic parameters
- The `prompt` function enforces correct variable types
- Return values and errors are properly typed

## License

MIT
