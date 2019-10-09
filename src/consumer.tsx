import * as React from 'react'
import {ReactNode, useContext, useDebugValue, useEffect, useRef, useState} from 'react'
import {ReactElement} from 'react'
import {Container} from './container'
import {getStoreContext, Store, StoreV} from './store'

type Deps<T> = (store: T) => unknown[]

interface Props<S extends Store> {
  of: S
  deps?: Deps<StoreV<S>>
  children: (store: StoreV<S>) => ReactNode
}

export function Consumer<S extends Store>(props: Props<S>) {
  const store = useStore(props.of)
  return props.children(store) as ReactElement
}

export function useStore<S extends Store>(S: S, deps?: Deps<StoreV<S>>) {
  const Context = S.optional ? getStoreContext(S) : S.Context
  const name = S.displayName || S.name
  if (!Context) {
    console.error(`No store context of "${name}" found. Did you provide it?`)
    return
  }
  useDebugValue(name)
  const container = useContext(Context) as Container<StoreV<S>>
  
  const [state, setState] = useState<StoreV<S>>(container.state)
  
  const depsRef = useRef<unknown[]>([])
  
  useEffect(() => {
    const subscriber = () => {
      if (!deps) {
        setState(container.state)
      } else {
        const oldDeps = depsRef.current
        const newDeps = deps(container.state)
        if (compare(oldDeps, newDeps)) {
          setState(container.state)
        }
        depsRef.current = newDeps
      }
    }
    container.subscribers.add(subscriber)
    return () => {
      container.subscribers.delete(subscriber)
    }
  }, [])
  
  return state
}

function compare(oldDeps: unknown[], newDeps: unknown[]) {
  if (oldDeps.length !== newDeps.length) {
    return true
  }
  for (const index in newDeps) {
    if (oldDeps[index] !== newDeps[index]) {
      return true
    }
  }
  return false
}
