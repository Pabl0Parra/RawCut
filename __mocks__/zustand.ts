// __mocks__/zustand.ts
import { act } from 'react';
import * as actualZustand from 'zustand';

const mockStoreResetFns = new Set<() => void>();

export const create = (createState: any) => {
    const store = actualZustand.create(createState);
    const initialState = store.getState();
    mockStoreResetFns.add(() => store.setState(initialState, true));
    return store;
};

export const resetAllStores = () => act(() => mockStoreResetFns.forEach((fn) => fn()));

afterEach(() => resetAllStores());

export const { createStore, useStore } = actualZustand;
export default { create };